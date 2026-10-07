import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { slugify } from '../utils/slugify.js';
import { computeMaterials, materialsToText } from '../utils/materials.js';

const router = Router();

function loadTags(buildId) {
  return db
    .prepare(
      `SELECT t.* FROM tags t JOIN build_tags bt ON bt.tag_id = t.id WHERE bt.build_id = ? ORDER BY t.name`,
    )
    .all(buildId);
}

function loadRatingSummary(buildId) {
  const row = db
    .prepare('SELECT AVG(stars) AS avg, COUNT(*) AS count FROM ratings WHERE build_id = ?')
    .get(buildId);
  return { average: row.avg ? Math.round(row.avg * 10) / 10 : 0, count: row.count };
}

function serializeBuild(build, { withDetails = false, userId = null } = {}) {
  const category = build.category_id
    ? db.prepare('SELECT * FROM categories WHERE id = ?').get(build.category_id)
    : null;
  const base = {
    id: build.id,
    title: build.title,
    slug: build.slug,
    description: build.description,
    category,
    difficulty: build.difficulty,
    editions: JSON.parse(build.editions || '[]'),
    compatNotes: build.compat_notes,
    thumbnail: build.thumbnail,
    status: build.status,
    viewCount: build.view_count,
    createdAt: build.created_at,
    updatedAt: build.updated_at,
    tags: loadTags(build.id),
    rating: loadRatingSummary(build.id),
  };
  if (withDetails) {
    base.isFavorite = userId
      ? !!db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND build_id = ?').get(userId, build.id)
      : false;
    base.myRating = userId
      ? db.prepare('SELECT stars FROM ratings WHERE user_id = ? AND build_id = ?').get(userId, build.id)?.stars || 0
      : 0;
    base.progress = userId
      ? db.prepare('SELECT * FROM progress WHERE user_id = ? AND build_id = ?').get(userId, build.id) || null
      : null;
  }
  return base;
}

// GET /api/builds - Bibliothek mit Suche/Filter/Sortierung
router.get('/', optionalAuth, (req, res) => {
  const { q, category, difficulty, tag, edition, sort = 'newest', includeDrafts } = req.query;
  const isAdmin = req.user?.role === 'admin';

  let sql = `SELECT DISTINCT b.* FROM builds b
             LEFT JOIN build_tags bt ON bt.build_id = b.id
             LEFT JOIN tags t ON t.id = bt.tag_id
             LEFT JOIN categories c ON c.id = b.category_id
             WHERE 1=1`;
  const params = [];

  if (isAdmin && includeDrafts === 'true') {
    // Admin darf auch Entwürfe sehen
  } else {
    sql += ` AND b.status = 'published'`;
  }
  if (q) {
    sql += ` AND (b.title LIKE ? OR b.description LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) {
    sql += ` AND c.slug = ?`;
    params.push(category);
  }
  if (difficulty) {
    sql += ` AND b.difficulty = ?`;
    params.push(difficulty);
  }
  if (tag) {
    sql += ` AND t.slug = ?`;
    params.push(tag);
  }
  if (edition) {
    sql += ` AND b.editions LIKE ?`;
    params.push(`%${edition}%`);
  }

  const sortMap = {
    newest: 'b.created_at DESC',
    oldest: 'b.created_at ASC',
    popular: 'b.view_count DESC',
    hardest: `CASE b.difficulty WHEN 'hard' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END DESC`,
    easiest: `CASE b.difficulty WHEN 'easy' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END DESC`,
  };
  sql += ` ORDER BY ${sortMap[sort] || sortMap.newest}`;

  const builds = db.prepare(sql).all(...params);
  res.json({ builds: builds.map((b) => serializeBuild(b)) });
});

// Admin: Build direkt über die numerische ID laden (z.B. für den Editor).
// Muss vor der generischen "/:slug"-Route stehen, da diese sonst greifen würde.
router.get('/id/:id', requireAuth, requireAdmin, (req, res) => {
  const build = db.prepare('SELECT * FROM builds WHERE id = ?').get(req.params.id);
  if (!build) return res.status(404).json({ error: 'Build nicht gefunden.' });
  res.json({ build: serializeBuild(build, { withDetails: true, userId: req.user.id }) });
});

router.get('/:slug', optionalAuth, (req, res) => {
  const build = db.prepare('SELECT * FROM builds WHERE slug = ?').get(req.params.slug);
  if (!build) return res.status(404).json({ error: 'Build nicht gefunden.' });
  if (build.status !== 'published' && req.user?.role !== 'admin') {
    return res.status(404).json({ error: 'Build nicht gefunden.' });
  }
  db.prepare('UPDATE builds SET view_count = view_count + 1 WHERE id = ?').run(build.id);
  if (req.user) {
    db.prepare(
      `INSERT INTO recently_viewed (user_id, build_id, viewed_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id, build_id) DO UPDATE SET viewed_at = datetime('now')`,
    ).run(req.user.id, build.id);
  }
  res.json({ build: serializeBuild(build, { withDetails: true, userId: req.user?.id }) });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { title, description, categoryId, difficulty, editions, compatNotes, tagIds, thumbnail } =
    req.body || {};
  if (!title) return res.status(400).json({ error: 'Titel ist erforderlich.' });
  let slug = slugify(title);
  const clash = db.prepare('SELECT id FROM builds WHERE slug = ?').get(slug);
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;

  const info = db
    .prepare(
      `INSERT INTO builds (title, slug, description, category_id, difficulty, editions, compat_notes, thumbnail, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
    )
    .run(
      title,
      slug,
      description || '',
      categoryId || null,
      difficulty || 'easy',
      JSON.stringify(editions || ['java']),
      compatNotes || '',
      thumbnail || null,
      req.user.id,
    );
  const buildId = info.lastInsertRowid;
  if (Array.isArray(tagIds)) {
    const stmt = db.prepare('INSERT OR IGNORE INTO build_tags (build_id, tag_id) VALUES (?, ?)');
    for (const tagId of tagIds) stmt.run(buildId, tagId);
  }
  const build = db.prepare('SELECT * FROM builds WHERE id = ?').get(buildId);
  res.status(201).json({ build: serializeBuild(build) });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM builds WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Build nicht gefunden.' });
  const {
    title,
    description,
    categoryId,
    difficulty,
    editions,
    compatNotes,
    tagIds,
    thumbnail,
    status,
  } = req.body || {};

  let slug = existing.slug;
  if (title && title !== existing.title) {
    slug = slugify(title);
    const clash = db.prepare('SELECT id FROM builds WHERE slug = ? AND id != ?').get(slug, req.params.id);
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;
  }

  db.prepare(
    `UPDATE builds SET title = ?, slug = ?, description = ?, category_id = ?, difficulty = ?,
     editions = ?, compat_notes = ?, thumbnail = ?, status = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    title ?? existing.title,
    slug,
    description ?? existing.description,
    categoryId ?? existing.category_id,
    difficulty ?? existing.difficulty,
    JSON.stringify(editions ?? JSON.parse(existing.editions || '[]')),
    compatNotes ?? existing.compat_notes,
    thumbnail ?? existing.thumbnail,
    status ?? existing.status,
    req.params.id,
  );

  if (Array.isArray(tagIds)) {
    db.prepare('DELETE FROM build_tags WHERE build_id = ?').run(req.params.id);
    const stmt = db.prepare('INSERT OR IGNORE INTO build_tags (build_id, tag_id) VALUES (?, ?)');
    for (const tagId of tagIds) stmt.run(req.params.id, tagId);
  }

  const build = db.prepare('SELECT * FROM builds WHERE id = ?').get(req.params.id);
  res.json({ build: serializeBuild(build) });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM builds WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---- Blockdaten (Voxel-Editor) ----
router.get('/:id/blocks', optionalAuth, (req, res) => {
  const blocks = db.prepare('SELECT * FROM blocks WHERE build_id = ? ORDER BY step_order, y').all(req.params.id);
  res.json({ blocks });
});

router.put('/:id/blocks', requireAuth, requireAdmin, (req, res) => {
  const { blocks } = req.body || {};
  if (!Array.isArray(blocks)) return res.status(400).json({ error: 'blocks muss ein Array sein.' });
  const tx = db.transaction((rows) => {
    db.prepare('DELETE FROM blocks WHERE build_id = ?').run(req.params.id);
    const stmt = db.prepare(
      'INSERT INTO blocks (build_id, x, y, z, block_type, step_order) VALUES (?, ?, ?, ?, ?, ?)',
    );
    rows.forEach((b, i) => stmt.run(req.params.id, b.x, b.y, b.z, b.blockType, b.stepOrder ?? i));
  });
  tx(blocks);
  res.json({ ok: true, count: blocks.length });
});

router.get('/:id/materials', (req, res) => {
  const blocks = db.prepare('SELECT * FROM blocks WHERE build_id = ?').all(req.params.id);
  const build = db.prepare('SELECT * FROM builds WHERE id = ?').get(req.params.id);
  const materials = computeMaterials(blocks);
  if (req.query.format === 'text') {
    res.type('text/plain').send(materialsToText(materials, build?.title || 'Build'));
    return;
  }
  res.json({ materials, totalBlocks: blocks.length });
});

// ---- Bild-Anleitung ----
router.get('/:id/images', (req, res) => {
  const images = db
    .prepare('SELECT * FROM build_images WHERE build_id = ? ORDER BY step_number')
    .all(req.params.id);
  res.json({ images });
});

router.post('/:id/images', requireAuth, requireAdmin, (req, res) => {
  const { imagePath, description, stepNumber } = req.body || {};
  if (!imagePath) return res.status(400).json({ error: 'imagePath ist erforderlich.' });
  const maxStep = db
    .prepare('SELECT MAX(step_number) AS m FROM build_images WHERE build_id = ?')
    .get(req.params.id).m;
  const step = stepNumber ?? (maxStep == null ? 1 : maxStep + 1);
  const info = db
    .prepare('INSERT INTO build_images (build_id, step_number, image_path, description) VALUES (?, ?, ?, ?)')
    .run(req.params.id, step, imagePath, description || '');
  res.status(201).json({ image: db.prepare('SELECT * FROM build_images WHERE id = ?').get(info.lastInsertRowid) });
});

router.put('/:id/images/reorder', requireAuth, requireAdmin, (req, res) => {
  const { order } = req.body || {}; // [{id, stepNumber}]
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order muss ein Array sein.' });
  const tx = db.transaction((items) => {
    const stmt = db.prepare('UPDATE build_images SET step_number = ? WHERE id = ? AND build_id = ?');
    items.forEach((item) => stmt.run(item.stepNumber, item.id, req.params.id));
  });
  tx(order);
  res.json({ ok: true });
});

router.put('/:id/images/:imageId', requireAuth, requireAdmin, (req, res) => {
  const { description } = req.body || {};
  db.prepare('UPDATE build_images SET description = ? WHERE id = ? AND build_id = ?').run(
    description || '',
    req.params.imageId,
    req.params.id,
  );
  res.json({ ok: true });
});

router.delete('/:id/images/:imageId', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM build_images WHERE id = ? AND build_id = ?').run(req.params.imageId, req.params.id);
  res.json({ ok: true });
});

// ---- Fortschritt ----
router.post('/:id/progress', requireAuth, (req, res) => {
  const { lastImageStep, lastLayer } = req.body || {};
  const existing = db
    .prepare('SELECT * FROM progress WHERE user_id = ? AND build_id = ?')
    .get(req.user.id, req.params.id);
  if (existing) {
    db.prepare(
      `UPDATE progress SET last_image_step = ?, last_layer = ?, updated_at = datetime('now')
       WHERE user_id = ? AND build_id = ?`,
    ).run(
      lastImageStep ?? existing.last_image_step,
      lastLayer ?? existing.last_layer,
      req.user.id,
      req.params.id,
    );
  } else {
    db.prepare(
      `INSERT INTO progress (user_id, build_id, last_image_step, last_layer, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
    ).run(req.user.id, req.params.id, lastImageStep ?? 0, lastLayer ?? 0);
  }
  res.json({ ok: true });
});

// ---- Favoriten ----
router.post('/:id/favorite', requireAuth, (req, res) => {
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, build_id) VALUES (?, ?)').run(req.user.id, req.params.id);
  res.json({ ok: true });
});
router.delete('/:id/favorite', requireAuth, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND build_id = ?').run(req.user.id, req.params.id);
  res.json({ ok: true });
});

// ---- Bewertungen ----
router.post('/:id/rating', requireAuth, (req, res) => {
  const { stars } = req.body || {};
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'stars muss zwischen 1 und 5 liegen.' });
  }
  db.prepare(
    `INSERT INTO ratings (user_id, build_id, stars) VALUES (?, ?, ?)
     ON CONFLICT(user_id, build_id) DO UPDATE SET stars = excluded.stars`,
  ).run(req.user.id, req.params.id, stars);
  res.json({ rating: loadRatingSummary(req.params.id) });
});

// ---- Kommentare ----
router.get('/:id/comments', (req, res) => {
  const comments = db
    .prepare(
      `SELECT c.*, u.name AS user_name, u.avatar AS user_avatar FROM comments c
       JOIN users u ON u.id = c.user_id WHERE c.build_id = ? ORDER BY c.created_at DESC`,
    )
    .all(req.params.id);
  res.json({ comments });
});

router.post('/:id/comments', requireAuth, (req, res) => {
  const { text } = req.body || {};
  if (!text?.trim()) return res.status(400).json({ error: 'Kommentartext fehlt.' });
  const info = db
    .prepare('INSERT INTO comments (build_id, user_id, text) VALUES (?, ?, ?)')
    .run(req.params.id, req.user.id, text.trim());
  const comment = db
    .prepare(
      `SELECT c.*, u.name AS user_name, u.avatar AS user_avatar FROM comments c
       JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
    )
    .get(info.lastInsertRowid);
  res.status(201).json({ comment });
});

router.delete('/:id/comments/:commentId', requireAuth, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.commentId);
  if (!comment) return res.status(404).json({ error: 'Kommentar nicht gefunden.' });
  if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Keine Berechtigung.' });
  }
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.commentId);
  res.json({ ok: true });
});

export default router;

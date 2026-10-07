import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function serializeBuildRow(build) {
  const category = build.category_id
    ? db.prepare('SELECT * FROM categories WHERE id = ?').get(build.category_id)
    : null;
  return {
    id: build.id,
    title: build.title,
    slug: build.slug,
    difficulty: build.difficulty,
    thumbnail: build.thumbnail,
    category,
  };
}

router.get('/me/favorites', requireAuth, (req, res) => {
  const builds = db
    .prepare(
      `SELECT b.* FROM favorites f JOIN builds b ON b.id = f.build_id
       WHERE f.user_id = ? AND b.status = 'published' ORDER BY f.created_at DESC`,
    )
    .all(req.user.id);
  res.json({ builds: builds.map(serializeBuildRow) });
});

router.get('/me/recently-viewed', requireAuth, (req, res) => {
  const builds = db
    .prepare(
      `SELECT b.* FROM recently_viewed r JOIN builds b ON b.id = r.build_id
       WHERE r.user_id = ? AND b.status = 'published' ORDER BY r.viewed_at DESC LIMIT 20`,
    )
    .all(req.user.id);
  res.json({ builds: builds.map(serializeBuildRow) });
});

export default router;

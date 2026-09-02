import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { slugify } from '../utils/slugify.js';

const router = Router();

router.get('/', (_req, res) => {
  const categories = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM builds b WHERE b.category_id = c.id AND b.status = 'published') AS build_count
       FROM categories c ORDER BY c.name`,
    )
    .all();
  res.json({ categories });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { name, icon } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name ist erforderlich.' });
  const slug = slugify(name);
  try {
    const info = db
      .prepare('INSERT INTO categories (name, slug, icon) VALUES (?, ?, ?)')
      .run(name, slug, icon || null);
    res.status(201).json({ category: db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid) });
  } catch {
    res.status(409).json({ error: 'Kategorie existiert bereits.' });
  }
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const { name, icon } = req.body || {};
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Kategorie nicht gefunden.' });
  const slug = name ? slugify(name) : existing.slug;
  db.prepare('UPDATE categories SET name = ?, slug = ?, icon = ? WHERE id = ?').run(
    name || existing.name,
    slug,
    icon ?? existing.icon,
    req.params.id,
  );
  res.json({ category: db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id) });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;

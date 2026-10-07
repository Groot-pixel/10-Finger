import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { slugify } from '../utils/slugify.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ tags: db.prepare('SELECT * FROM tags ORDER BY name').all() });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name ist erforderlich.' });
  const slug = slugify(name);
  try {
    const info = db.prepare('INSERT INTO tags (name, slug) VALUES (?, ?)').run(name, slug);
    res.status(201).json({ tag: db.prepare('SELECT * FROM tags WHERE id = ?').get(info.lastInsertRowid) });
  } catch {
    res.status(409).json({ error: 'Tag existiert bereits.' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;

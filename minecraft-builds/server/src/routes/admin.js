import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', (_req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const buildCount = db.prepare("SELECT COUNT(*) AS c FROM builds WHERE status = 'published'").get().c;
  const draftCount = db.prepare("SELECT COUNT(*) AS c FROM builds WHERE status = 'draft'").get().c;
  const mostViewed = db
    .prepare("SELECT id, title, slug, view_count FROM builds WHERE status = 'published' ORDER BY view_count DESC LIMIT 5")
    .all();
  const mostPopular = db
    .prepare(
      `SELECT b.id, b.title, b.slug, AVG(r.stars) AS avg_stars, COUNT(r.stars) AS rating_count
       FROM builds b JOIN ratings r ON r.build_id = b.id
       WHERE b.status = 'published' GROUP BY b.id ORDER BY avg_stars DESC, rating_count DESC LIMIT 5`,
    )
    .all();
  const recentBuilds = db
    .prepare('SELECT id, title, slug, status, created_at FROM builds ORDER BY created_at DESC LIMIT 5')
    .all();
  res.json({
    userCount,
    buildCount,
    draftCount,
    mostViewed,
    mostPopular,
    recentBuilds,
  });
});

router.get('/users', (_req, res) => {
  const users = db
    .prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC')
    .all();
  res.json({ users });
});

export default router;

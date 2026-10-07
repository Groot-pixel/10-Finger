import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { uploadsDir } from '../db.js';

const router = Router();

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${nanoid(12)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new Error('Nur PNG, JPEG, WEBP oder GIF sind erlaubt.'));
    }
    cb(null, true);
  },
});

router.post('/', requireAuth, requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Keine Datei erhalten.' });
  res.status(201).json({ path: `/uploads/${req.file.filename}` });
});

router.post('/multiple', requireAuth, requireAdmin, upload.array('files', 30), (req, res) => {
  const files = (req.files || []).map((f) => `/uploads/${f.filename}`);
  res.status(201).json({ paths: files });
});

// Jeder angemeldete Nutzer darf sein eigenes Profilbild hochladen (kein Admin-Recht nötig).
router.post('/avatar', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Keine Datei erhalten.' });
  res.status(201).json({ path: `/uploads/${req.file.filename}` });
});

export default router;

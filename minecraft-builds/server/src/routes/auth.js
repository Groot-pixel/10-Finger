import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar,
    minecraftUsername: u.minecraft_username,
    editionPref: u.edition_pref,
    role: u.role,
  };
}

router.post('/register', (req, res) => {
  const { email, password, name, minecraftUsername, editionPref } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'E-Mail, Passwort und Name sind erforderlich.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen haben.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'E-Mail ist bereits registriert.' });

  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const role = userCount === 0 ? 'admin' : 'user'; // erster registrierter Nutzer wird Admin

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      `INSERT INTO users (email, password_hash, name, minecraft_username, edition_pref, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(email.toLowerCase(), hash, name, minecraftUsername || null, editionPref || 'java', role);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch.' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Nutzer nicht gefunden.' });
  res.json({ user: publicUser(user) });
});

router.put('/me', requireAuth, (req, res) => {
  const { name, avatar, minecraftUsername, editionPref } = req.body || {};
  db.prepare(
    `UPDATE users SET name = COALESCE(?, name), avatar = COALESCE(?, avatar),
     minecraft_username = COALESCE(?, minecraft_username), edition_pref = COALESCE(?, edition_pref)
     WHERE id = ?`,
  ).run(name ?? null, avatar ?? null, minecraftUsername ?? null, editionPref ?? null, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
});

// Vereinfachtes Passwort-Reset ohne E-Mail-Versand (kostenlose Self-Hosted-App für Freunde):
// Der Reset-Link wird direkt zurückgegeben. In einer echten Produktivumgebung würde
// hier stattdessen ein E-Mail-Versand erfolgen.
router.post('/forgot-password', (req, res) => {
  const { email } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase());
  if (!user) {
    return res.json({ message: 'Falls die E-Mail existiert, wurde ein Reset-Link erzeugt.' });
  }
  const token = nanoid(32);
  const expires = Date.now() + 1000 * 60 * 60; // 1 Stunde gültig
  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?').run(
    token,
    expires,
    user.id,
  );
  res.json({
    message: 'Reset-Link erzeugt (kein E-Mail-Versand konfiguriert).',
    resetToken: token,
    resetUrl: `/reset-password?token=${token}`,
  });
});

router.post('/reset-password', (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password || password.length < 6) {
    return res.status(400).json({ error: 'Ungültige Anfrage.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);
  if (!user || !user.reset_token_expires || user.reset_token_expires < Date.now()) {
    return res.status(400).json({ error: 'Reset-Link ist ungültig oder abgelaufen.' });
  }
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
  ).run(hash, user.id);
  res.json({ message: 'Passwort wurde zurückgesetzt.' });
});

export default router;

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { uploadsDir } from './db.js';

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import tagRoutes from './routes/tags.js';
import buildRoutes from './routes/builds.js';
import uploadRoutes from './routes/uploads.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/builds', buildRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Serverfehler.' });
});

app.listen(PORT, () => {
  console.log(`Minecraft-Build-Guide API läuft auf http://localhost:${PORT}`);
});

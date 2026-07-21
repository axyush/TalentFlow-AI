import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/authRoutes.js';
import clientRoutes from './server/routes/clientRoutes.js';
import jobRoutes from './server/routes/jobRoutes.js';
import candidateRoutes from './server/routes/candidateRoutes.js';
import applicationRoutes from './server/routes/applicationRoutes.js';
import auditRoutes from './server/routes/auditRoutes.js';
import activityRoutes from './server/routes/activityRoutes.js';
import analyticsRoutes from './server/routes/analyticsRoutes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static uploads serving
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'TalentFlow AI', timestamp: new Date().toISOString() });
  });

  // Mounted API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/candidates', candidateRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/activity', activityRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // Vite development vs production static handling
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TalentFlow AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

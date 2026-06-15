import cors from 'cors';
import express from 'express';
import { apiRouter } from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'hst-enterprises-api' });
  });

  app.use('/api', apiRouter);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    res.status(400).json({ error: message });
  });

  return app;
}

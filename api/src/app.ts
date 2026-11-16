import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Repo } from './data/types.js';
import { identify } from './auth/identify.js';
import { leaveRoutes } from './routes/leave.js';

export const BUILD_ID = process.env.BUILD_ID ?? 'local';

export function createApp(repo: Repo, opts: { webDist?: string } = {}) {
  const app = express();
  app.use(express.json());

  // The only anonymous API routes. /api/health proves the process is up, NOT that your
  // change is live. To prove a deploy, check /api/version or a route only the new build has.
  app.get('/api/health', (_req, res) => { res.json({ ok: true }); });
  app.get('/api/version', (_req, res) => { res.json({ build: BUILD_ID }); });

  // Everything else under /api needs an identity (secure by default).
  app.use('/api', identify(repo));

  // The UI uses `can` for ergonomics only. Every route re-checks on the server.
  app.get('/api/me', (_req, res) => {
    const { id, name, role } = res.locals.user;
    res.json({ id, name, role, can: { approve: role !== 'employee', viewAudit: role === 'admin' } });
  });

  app.use('/api/leave', leaveRoutes(repo));

  app.get('/api/audit', async (_req, res) => {
    if (res.locals.user.role !== 'admin') { res.status(403).json({ error: 'Forbidden' }); return; }
    res.json({ items: await repo.audit() });
  });

  app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not found' }); });

  // Same origin: in production the API also serves the built React app.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const dist = opts.webDist ?? path.resolve(here, '../../web/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => { res.sendFile(path.join(dist, 'index.html')); });
  }

  return app;
}

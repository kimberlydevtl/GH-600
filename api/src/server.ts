import { createApp } from './app.js';
import { MemoryRepo } from './data/memory.js';

// Decision 0002: demo identity (x-user header) must never run in production.
const authMode = process.env.AUTH_MODE ?? 'demo';
if (process.env.NODE_ENV === 'production' && authMode === 'demo') {
  console.error('Refusing to start: AUTH_MODE=demo is not allowed when NODE_ENV=production. See docs/decisions/0002.');
  process.exit(1);
}

const port = Number(process.env.PORT ?? 3001);
createApp(new MemoryRepo()).listen(port, () => {
  console.log(`leave-tracker on http://localhost:${port} (auth: ${authMode})`);
});

import { createApp } from './app.js';
import { MemoryRepo } from './data/memory.js';
import type { AuthConfig } from './auth/identify.js';

// Decision 0002: demo identity (x-user header) must never run in production.
const authMode = process.env.AUTH_MODE ?? 'demo';
if (authMode !== 'demo' && authMode !== 'entra') {
  console.error('Refusing to start: AUTH_MODE must be demo or entra.');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && authMode === 'demo') {
  console.error('Refusing to start: AUTH_MODE=demo is not allowed when NODE_ENV=production. See docs/decisions/0002.');
  process.exit(1);
}

function required(name: 'ENTRA_TENANT_ID' | 'ENTRA_CLIENT_ID') {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Refusing to start: ${name} is required when AUTH_MODE=entra.`);
    process.exit(1);
  }
  return value;
}

const auth: AuthConfig = authMode === 'entra'
  ? {
      mode: 'entra',
      tenantId: required('ENTRA_TENANT_ID'),
      clientId: required('ENTRA_CLIENT_ID')
    }
  : { mode: 'demo' };

const port = Number(process.env.PORT ?? 3001);
createApp(new MemoryRepo(), { auth }).listen(port, () => {
  console.log(`leave-tracker on http://localhost:${port} (auth: ${authMode})`);
});

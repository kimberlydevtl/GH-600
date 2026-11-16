import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import {
  SignJWT,
  createLocalJWKSet,
  exportJWK,
  generateKeyPair
} from 'jose';
import { createApp } from '../src/app.js';
import { MemoryRepo } from '../src/data/memory.js';

const tenantId = '11111111-2222-3333-4444-555555555555';
const clientId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
const repo = new MemoryRepo();

let privateKey: CryptoKey;
let server: ReturnType<ReturnType<typeof createApp>['listen']>;
let base: string;

before(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  const publicJwk = await exportJWK(pair.publicKey);
  const jwks = createLocalJWKSet({
    keys: [{ ...publicJwk, alg: 'RS256', kid: 'test-key', use: 'sig' }]
  });
  server = createApp(repo, {
    webDist: '/nonexistent',
    auth: { mode: 'entra', tenantId, clientId, jwks }
  }).listen(0);
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());
beforeEach(() => repo.reset());

async function token(options: {
  claims?: Record<string, unknown>;
  audience?: string;
  issuer?: string;
  expiration?: number;
} = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ oid: 'ben', preferred_username: 'ben', ...options.claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuedAt(now)
    .setIssuer(options.issuer ?? issuer)
    .setAudience(options.audience ?? clientId)
    .setExpirationTime(options.expiration ?? now + 300)
    .sign(privateKey);
}

async function call(path: string, bearer?: string) {
  const headers: Record<string, string> = {};
  if (bearer !== undefined) headers.authorization = `Bearer ${bearer}`;
  const res = await fetch(base + path, { headers });
  return { status: res.status, body: await res.json() };
}

test('health and version remain anonymous in entra mode', async () => {
  assert.equal((await call('/api/health')).status, 200);
  assert.equal((await call('/api/version')).status, 200);
});

test('a valid token resolves the provisioned user from the repo', async () => {
  const r = await call('/api/me', await token());
  assert.equal(r.status, 200);
  assert.equal(r.body.id, 'ben');
  assert.equal(r.body.role, 'manager');
});

test('the api audience is accepted', async () => {
  const r = await call('/api/me', await token({ audience: `api://${clientId}` }));
  assert.equal(r.status, 200);
});

test('preferred_username provisions the user when oid is absent', async () => {
  const r = await call('/api/me', await token({ claims: { oid: undefined, preferred_username: 'raj' } }));
  assert.equal(r.status, 200);
  assert.equal(r.body.id, 'raj');
});

test('a missing bearer token returns 401 json', async () => {
  const r = await call('/api/me');
  assert.equal(r.status, 401);
  assert.equal(typeof r.body.error, 'string');
});

test('a malformed bearer token returns 401 json', async () => {
  const r = await call('/api/me', 'not-a-jwt');
  assert.equal(r.status, 401);
  assert.equal(typeof r.body.error, 'string');
});

test('a token with the wrong audience returns 401', async () => {
  assert.equal((await call('/api/me', await token({ audience: 'wrong-audience' }))).status, 401);
});

test('a token with the wrong issuer returns 401', async () => {
  assert.equal((await call('/api/me', await token({ issuer: 'https://issuer.example.test' }))).status, 401);
});

test('an expired token returns 401', async () => {
  const now = Math.floor(Date.now() / 1000);
  assert.equal((await call('/api/me', await token({ expiration: now - 60 }))).status, 401);
});

test('a valid token for an unknown user returns not provisioned', async () => {
  const r = await call('/api/me', await token({ claims: { oid: 'unknown', preferred_username: 'unknown@example.test' } }));
  assert.equal(r.status, 403);
  assert.equal(r.body.error, 'not provisioned');
});

test('demo identity remains available when explicitly selected', async () => {
  const demoServer = createApp(repo, { webDist: '/nonexistent', auth: { mode: 'demo' } }).listen(0);
  try {
    const demoBase = `http://localhost:${(demoServer.address() as AddressInfo).port}`;
    const res = await fetch(`${demoBase}/api/me`, { headers: { 'x-user': 'ana' } });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).id, 'ana');
  } finally {
    demoServer.close();
  }
});

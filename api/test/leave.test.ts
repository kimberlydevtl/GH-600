import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { MemoryRepo } from '../src/data/memory.js';

const repo = new MemoryRepo();
const server = createApp(repo, { webDist: '/nonexistent' }).listen(0);
const base = `http://localhost:${(server.address() as AddressInfo).port}`;
after(() => server.close());
beforeEach(() => repo.reset());

async function call(path: string, user: string | null, init: RequestInit = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (user) headers['x-user'] = user;
  const res = await fetch(base + path, { ...init, headers });
  return { status: res.status, body: await res.json() };
}

test('health is anonymous', async () => {
  assert.equal((await call('/api/health', null)).status, 200);
});

test('everything else needs an identity', async () => {
  assert.equal((await call('/api/leave', null)).status, 401);
});

test('/api/me returns role and permissions', async () => {
  const r = await call('/api/me', 'ben');
  assert.equal(r.body.role, 'manager');
  assert.equal(r.body.can.approve, true);
});

test('employees only see their own requests', async () => {
  const r = await call('/api/leave', 'ana');
  assert.ok(r.body.items.length > 0);
  assert.ok(r.body.items.every((i: any) => i.userId === 'ana'));
});

test('managers see their team plus themselves', async () => {
  const r = await call('/api/leave', 'ben');
  const owners = [...new Set(r.body.items.map((i: any) => i.userId))].sort();
  assert.deepEqual(owners, ['ana', 'ben', 'raj']);
});

test('status values are lowercase (API contract)', async () => {
  const r = await call('/api/leave', 'cara');
  for (const i of r.body.items) assert.ok(['pending', 'approved', 'rejected'].includes(i.status));
});

test('the server sets userId and status, not the client', async () => {
  const r = await call('/api/leave', 'ana', {
    method: 'POST',
    body: JSON.stringify({ start: '2027-01-05', end: '2027-01-06', reason: 'Rest', userId: 'raj', status: 'approved' })
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.userId, 'ana');
  assert.equal(r.body.status, 'pending');
});

test('bad dates are rejected', async () => {
  const r = await call('/api/leave', 'ana', { method: 'POST', body: JSON.stringify({ start: '2027-02-10', end: '2027-02-01', reason: 'x' }) });
  assert.equal(r.status, 400);
});

test('employees cannot approve', async () => {
  assert.equal((await call('/api/leave/1/approve', 'raj', { method: 'POST' })).status, 403);
});

test('a manager cannot approve their own request', async () => {
  assert.equal((await call('/api/leave/3/approve', 'ben', { method: 'POST' })).status, 403);
});

test('a manager approves a team request and it is audited', async () => {
  const r = await call('/api/leave/1/approve', 'ben', { method: 'POST' });
  assert.equal(r.status, 200);
  assert.equal(r.body.status, 'approved');
  const log = await call('/api/audit', 'cara');
  assert.ok(log.body.items.some((e: any) => e.action === 'approve' && e.requestId === 1 && e.actor === 'ben'));
});

test('only admins can read the audit log', async () => {
  assert.equal((await call('/api/audit', 'ben')).status, 403);
});

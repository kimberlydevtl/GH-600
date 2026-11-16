import { Router } from 'express';
import type { Repo, User, LeaveRequest } from '../data/types.js';
import { requireRole } from '../auth/identify.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Who may this user see? Decided on the server, on every request. */
export async function visibleTo(repo: Repo, user: User): Promise<LeaveRequest[]> {
  const all = await repo.requests();
  if (user.role === 'admin') return all;
  if (user.role === 'manager') {
    const team = (await repo.users()).filter((u) => u.managerId === user.id).map((u) => u.id);
    return all.filter((r) => r.userId === user.id || team.includes(r.userId));
  }
  return all.filter((r) => r.userId === user.id);
}

export function leaveRoutes(repo: Repo) {
  const r = Router();

  r.get('/', async (_req, res) => {
    res.json({ items: await visibleTo(repo, res.locals.user) });
  });

  r.post('/', async (req, res) => {
    const { start, end, reason } = req.body ?? {};
    if (typeof start !== 'string' || typeof end !== 'string' || !DATE.test(start) || !DATE.test(end) || start > end) {
      res.status(400).json({ error: 'start and end must be YYYY-MM-DD and start <= end' });
      return;
    }
    if (typeof reason !== 'string' || !reason.trim() || reason.length > 200) {
      res.status(400).json({ error: 'reason is required (max 200 characters)' });
      return;
    }
    // userId and status come from the server, never from the request body.
    const item = await repo.createRequest(
      { userId: res.locals.user.id, start, end, reason: reason.trim(), status: 'pending' },
      res.locals.user.id
    );
    res.status(201).json(item);
  });

  r.post('/:id/approve', requireRole('manager', 'admin'), async (req, res) => {
    const user = res.locals.user;
    const item = await repo.getRequest(Number(req.params.id));
    if (!item) { res.status(404).json({ error: 'Not found' }); return; }
    const owner = (await repo.users()).find((u) => u.id === item.userId);
    if (item.userId === user.id) { res.status(403).json({ error: 'You cannot approve your own request' }); return; }
    if (user.role === 'manager' && owner?.managerId !== user.id) {
      res.status(403).json({ error: 'You can only approve your own team' }); return;
    }
    if (item.status !== 'pending') { res.status(409).json({ error: `Request is already ${item.status}` }); return; }
    res.json(await repo.setStatus(item.id, 'approved', user.id));
  });

  return r;
}

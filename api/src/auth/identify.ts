import type { RequestHandler } from 'express';
import type { Repo, Role, User } from '../data/types.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express { interface Locals { user: User } }
}

// DEMO IDENTITY ONLY. The x-user header stands in for a real identity provider
// (for example an Entra ID token validated on the server). The rule this file teaches
// holds in production too: the role is resolved on the SERVER from server-side data.
export function identify(repo: Repo): RequestHandler {
  return async (req, res, next) => {
    const id = req.header('x-user');
    const user = (await repo.users()).find((u) => u.id === id);
    if (!user) {
      res.status(401).json({ error: 'Unknown or missing user' });
      return;
    }
    res.locals.user = user;
    next();
  };
}

/** Allow only the listed roles. Others get 403, not an empty page. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (_req, res, next) => {
    if (!roles.includes(res.locals.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

import type { RequestHandler } from 'express';
import type { Repo, Role, User } from '../data/types.js';
import { identifyWithEntra, type EntraAuthConfig } from './entra.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express { interface Locals { user: User } }
}

export type AuthConfig = { mode: 'demo' } | EntraAuthConfig;

function identifyDemo(repo: Repo): RequestHandler {
  return async (req, res, next) => {
    try {
      const id = req.header('x-user');
      const user = (await repo.users()).find((candidate) => candidate.id === id);
      if (!user) {
        res.status(401).json({ error: 'Unknown or missing user' });
        return;
      }
      res.locals.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function identify(repo: Repo, config: AuthConfig = { mode: 'demo' }): RequestHandler {
  return config.mode === 'entra'
    ? identifyWithEntra(repo, config)
    : identifyDemo(repo);
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

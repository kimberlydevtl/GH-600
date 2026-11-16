import type { RequestHandler } from 'express';
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey
} from 'jose';
import type { Repo } from '../data/types.js';

export interface EntraAuthConfig {
  mode: 'entra';
  tenantId: string;
  clientId: string;
  jwks?: JWTVerifyGetKey;
}

export function identifyWithEntra(repo: Repo, config: EntraAuthConfig): RequestHandler {
  const issuers = [
    `https://login.microsoftonline.com/${config.tenantId}/v2.0`,
    `https://sts.windows.net/${config.tenantId}/`
  ];
  const audiences = [config.clientId, `api://${config.clientId}`];
  const jwks = config.jwks ?? createRemoteJWKSet(
    new URL(`https://login.microsoftonline.com/${config.tenantId}/discovery/v2.0/keys`)
  );

  return async (req, res, next) => {
    const authorization = req.header('authorization');
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      res.status(401).json({ error: 'Missing bearer token' });
      return;
    }

    let payload;
    try {
      ({ payload } = await jwtVerify(match[1], jwks, {
        audience: audiences,
        issuer: issuers
      }));
    } catch {
      res.status(401).json({ error: 'Invalid or expired bearer token' });
      return;
    }

    const oid = typeof payload.oid === 'string' ? payload.oid : undefined;
    const username = typeof payload.preferred_username === 'string'
      ? payload.preferred_username
      : undefined;
    if (!oid && !username) {
      res.status(401).json({ error: 'Token has no supported identity claim' });
      return;
    }

    try {
      const users = await repo.users();
      const user = users.find((candidate) => candidate.id === oid)
        ?? users.find((candidate) => candidate.id === username);
      if (!user) {
        res.status(403).json({ error: 'not provisioned' });
        return;
      }
      res.locals.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

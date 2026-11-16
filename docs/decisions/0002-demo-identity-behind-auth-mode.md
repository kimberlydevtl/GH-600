# 0002: Demo identity sits behind AUTH_MODE, never the production default

Status: Accepted
Date: 2026-11-16

## Context
Training and local development need to switch users instantly without a tenant. Production
needs real sign-in with Entra ID. The `x-user` header lets anyone claim any identity, which
is fine on a laptop and a serious hole in production.

## Decision
Identity is chosen by `AUTH_MODE`:
- `demo`: the `x-user` header and the user dropdown. Default for local and class.
- `entra`: MSAL sign-in in the web app, token validated by the API.

The API refuses to start with `AUTH_MODE=demo` when `NODE_ENV=production`. Both modes set
the same `res.locals.user`, so routes do not change between them.

## Alternatives rejected
- Entra only: students cannot sign in to the trainer's tenant, and the Trainer mode demo
  (UI hides, API refuses) stops working.
- Demo only: cannot ship.

## Consequences
- Good: one codebase serves class, local development and production.
- Cost: two identity paths to test. The startup guard is the control that keeps demo
  identity out of production; do not remove it.

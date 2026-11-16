# Finale 2: Entra ID sign-in behind AUTH_MODE

**Track:** Finale

## Goal
With `AUTH_MODE=entra`, users sign in with Entra ID and the API validates their token.
`AUTH_MODE=demo` keeps working exactly as today.

## Success criteria
- Follows the `entra-auth` skill and decisions 0002, 0006, 0007.
- Unknown signed-in users get 403 "not provisioned", shown clearly in the UI.
- Token tests: valid, wrong audience, wrong issuer, expired, unknown user.
- Routes unchanged (`res.locals.user` contract kept). Ladder passes in demo mode.

## Scope
In: `web/src/`, `api/src/auth/`, `api/src/app.ts`, `api/test/`. Out: routes, `mcp/`.

## Risk
High (auth). PR only, code owner review.

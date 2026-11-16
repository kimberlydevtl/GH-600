---
name: entra-auth
description: Use when adding or changing Entra ID sign-in (MSAL in the web app, token validation in the API), AUTH_MODE, app registration settings, or diagnosing 401s, AADSTS errors or "Loading forever".
---
# Entra ID sign-in

Read decisions 0002 (AUTH_MODE), 0006 (roles from the database) and 0007 (no secrets)
before changing anything here. Changes in `api/src/auth/` need code owner review.

Three pieces must all work. When something breaks, find which one before changing anything:
1. **The browser gets a token** (needs the right redirect URI).
2. **The API validates it** (audience and issuer).
3. **The API resolves a role from its own data** (user is provisioned).

## App registration

- One registration, **SPA platform**, public client with PKCE. **No client secret.**
- Redirect URIs: every origin the app runs on, exactly: `http://localhost:5173`,
  `http://localhost:3001`, and the App Service host. The SPA uses
  `redirectUri = window.location.origin`.
- Preferred: expose an API scope (`api://{clientId}/access_as_user`); the SPA requests it
  and sends the **access token**. Sending the ID token with audience = client id also works
  and is simpler; if you use it, the API must accept the client id as an audience.
- Do not enable App Service Authentication (Easy Auth) on top of this. See decision 0007.

## Web app (`AUTH_MODE=entra`)

- `@azure/msal-browser` + `@azure/msal-react`. Config from Vite env:
  `VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_TENANT_ID` (both non-secret).
- `web/src/api.ts` attaches `Authorization: Bearer <token>` instead of `x-user`.
- Wrap the app in an auth gate: signed out shows a sign-in screen; signed in but 403 from
  `/api/me` shows "not provisioned", never a blank app.
- **Stale-session hardening** (the "Loading forever" bug): silent renewal can hang with no
  result once the session cookie dies, so no request is ever sent.
  - On boot and on tab focus, call `acquireTokenSilent({ ...request, forceRefresh: true })`.
  - Wrap silent calls in a hard timeout (about 12 seconds); on timeout, use
    `acquireTokenRedirect`.
  - On a 401 from the API, refresh once and retry once, then redirect (with a loop guard).
  - Treat `monitor_window_timeout` as "needs interaction".

## API (`AUTH_MODE=entra`)

- Validate with `jose`: `createRemoteJWKSet` from
  `https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys`.
- Audiences: `{clientId}` and `api://{clientId}`. Issuers: both
  `https://login.microsoftonline.com/{tenant}/v2.0` and `https://sts.windows.net/{tenant}/`
  (Azure can issue either).
- Check expiry. Reject anything else with 401 `{ error }` JSON, never a redirect.
- After validation, look up the user by `oid` (fall back to `preferred_username`) through
  the `Repo`. Not found: 403 "not provisioned". Found: set `res.locals.user`, exactly as
  demo mode does, so no route changes.
- Keep `/api/health` and `/api/version` anonymous. Everything else requires a user.
- `AUTH_MODE=demo` must stay refused in production (startup guard in `server.ts`).

## Tests

- Keep the existing tests running in demo mode.
- Add tests for the entra path with a locally generated key pair: valid token passes,
  wrong audience 401, wrong issuer 401, expired 401, unknown user 403.

## Diagnose

| Symptom | Piece | Look at |
|---|---|---|
| `AADSTS50011` on the sign-in page | 1 | Redirect URIs |
| Signed in, every `/api` call 401 | 2 | Audience, issuer, expiry |
| Signed in, 403 everywhere | 3 | User not in `user_roles` |
| "Loading..." forever, no `/api` calls in network tab | 1 | Stale-session hardening |
| API returns 302 instead of 401 | | Easy Auth is on: turn it off |

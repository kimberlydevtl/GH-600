# Plan: Add Entra ID sign-in behind AUTH_MODE

Issue: #8   Risk: high

## Assumptions

- `AUTH_MODE=demo` remains the API default for local development and tests; the web build uses `VITE_AUTH_MODE=demo` by default and `VITE_AUTH_MODE=entra` for Entra sign-in.
- One Entra SPA registration supplies `VITE_ENTRA_CLIENT_ID` and `VITE_ENTRA_TENANT_ID`; no client secret or Easy Auth is introduced.
- Entra `oid` is matched to `User.id`, with `preferred_username` as the fallback, through `Repo.users()`. Roles continue to come only from repository data.
- App-registration creation and redirect-URI configuration are external Azure setup, not repository changes in this task.

## Objective

- **Goal:** Let users sign in with Entra ID when Entra mode is enabled while preserving the existing demo identity path and route behavior.
- **Inputs:** Issue #8, the `entra-auth` skill, accepted decisions 0002, 0006, and 0007, the existing `identify` middleware contract, and the current React API client.
- **Outputs:** Mode-aware API identity middleware, Entra JWT validation and provisioning checks, an MSAL-based web authentication gate and bearer-token API client, focused auth tests, and required package updates.
- **Success criteria:**
  - `AUTH_MODE=demo` continues to authenticate with `x-user`; all existing tests pass unchanged in demo mode.
  - `AUTH_MODE=entra` validates bearer tokens against tenant signing keys, accepts only the configured client/API audiences and tenant issuers, checks expiry, and returns JSON 401 responses.
  - A valid provisioned token sets the same `res.locals.user` shape routes already consume.
  - Wrong audience, wrong issuer, expired, malformed, or missing tokens receive 401.
  - A valid token for an unknown `oid`/`preferred_username` receives 403 with `not provisioned`.
  - `/api/health` and `/api/version` remain anonymous; route files are unchanged.
  - The web app uses MSAL public-client PKCE, sends bearer access tokens in Entra mode, retains `x-user` in demo mode, shows sign-in and not-provisioned states, and never renders a blank loading state indefinitely.
  - Silent token renewal is force-refreshed on boot/focus, times out after about 12 seconds into redirect interaction, and an API 401 triggers at most one refresh-and-retry before redirect.
  - `NODE_ENV=production` still refuses `AUTH_MODE=demo`; invalid or incomplete Entra configuration fails explicitly.
  - `npm test -w api` and `bash scripts/verify.sh` pass.
- **In scope:** `api/src/auth/identify.ts`, `api/src/auth/entra.ts`, `api/src/app.ts`, `api/src/server.ts`, `api/test/auth.test.ts`, `web/src/auth.tsx`, `web/src/api.ts`, `web/src/App.tsx`, `web/src/main.tsx`, `api/package.json`, `web/package.json`, `package-lock.json`, `plan.md`.
- **Out of scope:** `api/src/routes/`, `mcp/`, application roles or permissions, database schema, Azure resource provisioning, Easy Auth, client secrets, and deployment workflows.
- **Risk:** High. Authentication is code-owner protected. Implement on a dedicated branch, open a PR, and stop without merging.

## Steps

- [x] 1. Add local-key HTTP tests for valid Entra authentication, wrong audience, wrong issuer, expiry, missing/malformed bearer tokens, unknown-user provisioning, anonymous health/version, and unchanged demo identity. (files: `api/test/auth.test.ts`)
- [x] 2. Add mode-aware identity middleware and Entra JWT verification with strict configuration, accepted audiences/issuers, repository-backed user resolution, JSON 401/403 errors, and the unchanged `res.locals.user` contract. Wire it before existing routes without editing route modules. (files: `api/src/auth/identify.ts`, `api/src/auth/entra.ts`, `api/src/app.ts`, `api/src/server.ts`)
- [x] 3. Add the MSAL provider/auth gate, mode-aware API authorization, explicit sign-in and not-provisioned states, bounded silent renewal, focus refresh, and one-time 401 retry while preserving the demo user switcher. (files: `web/src/auth.tsx`, `web/src/api.ts`, `web/src/App.tsx`, `web/src/main.tsx`)
- [x] 4. Add only the required `jose`, `@azure/msal-browser`, and `@azure/msal-react` dependencies and update the lockfile with npm. (files: `api/package.json`, `web/package.json`, `package-lock.json`)
- [x] 5. Run `npm test -w api`, then `bash scripts/verify.sh`; paste `.verify/report.md` into the PR evidence and stop for code-owner review. (files: none)

## Decisions

- Keep demo and Entra middleware behind one mode selector so routes continue to depend only on `res.locals.user`.
- Validate Entra tokens with `jose`; inject a local JWK source in tests so authentication tests are deterministic and require no network or tenant.
- Use separate API and Vite mode variables because browser builds can read only exposed `VITE_*` configuration; both default to demo.
- Resolve identity from `oid`, falling back to `preferred_username`, but obtain role and permissions exclusively from `Repo`.
- Use MSAL public-client redirect flow and PKCE with no client secret; do not enable Easy Auth.
- No new decision record is needed because decisions 0002, 0006, and 0007 already specify these expensive-to-reverse choices.
- Respects: 0001 (user lookup through `Repo`), 0002 (`AUTH_MODE` and production demo guard), 0003 (single verification ladder), 0006 (roles from application data), 0007 (PKCE and no secrets).

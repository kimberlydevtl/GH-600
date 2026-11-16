---
applyTo: "api/src/routes/**"
---
# API routes

- The client is untrusted. Re-check permission on the server for every request, even when
  the web app already hides the button.
- Identity comes only from `res.locals.user` (set by `identify`). Never from body or query.
- Whitelist values (use `STATUSES` from `api/src/data/types.ts`) and return 400 otherwise.
- Status codes: 401 no identity, 403 not allowed, 404 missing, 409 wrong state.
- Read and write only through the `Repo`. Filter with `visibleTo()` first, then narrow.
- Add tests in `api/test/` for every route you change, including the forbidden case.
- Full procedure: the `api-hardening` skill.

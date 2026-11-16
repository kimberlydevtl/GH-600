---
name: api-hardening
description: Use when adding or changing an API route, request input, permission check or state change. Treats the client as untrusted.
---
# API hardening: the client is untrusted

Anything the UI enforces (a hidden button, a filtered list, a disabled field), the API
must enforce again from server-side data. UI hiding is convenience, not security.

## Checklist for every route

1. **Identity from the server.** Use `res.locals.user`. Ignore any `userId`, `role` or
   `status` in the body or query.
2. **Authorise on the server.** Decide visibility and permission from the `Repo` (never from the request), every request. Use `requireRole()` for role gates and
   explicit checks for ownership (for example "manager of this employee").
3. **Whitelist input.** Accept only known values and shapes. Return 400 with a clear
   `{ error }` message for anything else.
4. **Correct status codes.** 401 no identity, 403 not allowed, 404 missing, 409 wrong state.
5. **Audit the change.** Change state only through the `Repo` methods (`createRequest`, `setStatus`). They write
   the audit entry in the same operation, so state and audit cannot drift apart.
6. **Do not leak data.** Return only fields the caller is allowed to see.
7. **Test the negative path.** For every allowed case, add the forbidden case next to it.

## Example: adding a filter safely

```ts
import { STATUSES } from '../data/types.js';
const { status } = req.query;
if (status !== undefined && !STATUSES.includes(String(status) as Status)) {
  res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` }); return;
}
const items = (await visibleTo(repo, user)).filter((r) => !status || r.status === status);
```

Filter AFTER `visibleTo()`, never before, so a filter can never widen what a user sees.

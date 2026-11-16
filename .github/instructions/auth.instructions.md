---
applyTo: "api/src/auth/**"
---
# Authentication and authorisation (sensitive)

CODEOWNERS requires a human owner to review every change in this folder.

- Do not widen access (new roles, bypass flags, admin overrides) without a linked issue
  that states the risk and who approved it.
- Default to deny: missing or unknown identity is 401, known identity without permission is 403.
- Never trust client-supplied roles or claims.
- `x-user` is demo identity. A production version validates a real token on the server.
- Open a PR and stop. Do not attempt to merge.

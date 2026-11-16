---
applyTo: "web/src/**"
---
# Web app (React 19 + Vite + Tailwind v4 + react-query)

- Fetch only through `web/src/api.ts`. Use react-query for server state and invalidate
  the affected queries after a mutation.
- Use `me.can` from `/api/me` to decide what to SHOW. Never treat it as security: the API
  must refuse the action on its own.
- Show the API's error message when a call fails. Do not swallow 401/403.
- Style with theme tokens (`bg-primary`, `text-ok`, `text-critical`) from `web/src/index.css`,
  not hard-coded colours. Keep the canvas neutral, tint only the accent.
- After changing UI, run the ladder: rung 3 (build) and rung 4 (bundle loads) must pass.

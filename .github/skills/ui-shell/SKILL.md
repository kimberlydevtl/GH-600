---
name: ui-shell
description: Use when building or restyling the web app UI: the app shell, shadcn/ui components, theme tokens, tables, dashboards and forms. Holds the design rules this app follows.
---
# UI shell and design rules

Stack: React 19, Vite, TypeScript strict, Tailwind v4 (`@tailwindcss/vite`), shadcn/ui
(new-york style) on the unified `radix-ui` package, `cva` + `cn` (clsx + tailwind-merge),
react-query, react-router v7, a hairline icon set (lucide or Phosphor).

## Setup (once)

1. Add the `@/` alias to `web/src` in `vite.config.ts` and `tsconfig.json`.
2. `npx shadcn@latest init` in `web/`, new-york style, CSS variables on.
3. Add only the primitives you use (`button`, `dialog`, `select`, `dropdown-menu`,
   `table`, `input`, `label`, `sonner` for toasts). Do not bulk-add.
4. Run the ladder: rung 3 and rung 4 must pass before anything else.

## App shell

Build the shell once and adapt it; do not rebuild it per page.

```
web/src/components/shell/
  AppShell.tsx     sidebar + top bar + <Outlet/>
  Sidebar.tsx      nav items filtered by me.can (display only)
  TopNavbar.tsx    page title, user menu
  UserNav.tsx      name, role, sign out (entra mode) or user switcher (demo mode)
web/src/theme/     ThemeProvider (light/dark), ThemeSwitch
```

Routes are nested under the shell: `<Route element={<AppShell/>}>` with child routes.
Navigation and buttons use `/api/me` `can` to decide what to show. The API still
enforces every action (see `api-hardening`).

## Design rules

- **Look:** premium, enterprise, calm. Clean like Linear or Attio. Nothing that reads as
  generic AI or template UI.
- **Colour:** one corporate blue as the only accent (`--primary: #1e46c8`). Near-neutral
  backgrounds. Semantic colours (ok, warn, critical) are separate from the accent.
- **Tokens, not literals:** style through CSS variables (`bg-background`, `bg-card`,
  `text-foreground`, `border-border`, `bg-primary`). Tint only the accent tokens; never
  re-tint `--background`, `--card` or `--border`. Check that no colour is defined only
  inside one theme block, or the other theme becomes unreadable.
- **No:** gradients, black buttons or icons, outlined or ghost buttons, left accent bars or
  thin coloured accent lines, accordions, visible scrollbars, emoji, sparkles.
- **Borders and shadows:** light neutral borders, very light shadows only.
- **Status chips:** one shared component, fixed height, soft tint plus a small dot, short
  labels. Never outline-only.
- **Records:** tables, not cards. Everything aligned to the same grid.
- **Controls:** custom dropdowns and proper dialogs, not native `alert` or `confirm`.
- **Icons:** monochrome hairline, only where they carry meaning.
- **Copy:** plain, mature wording. No em dashes, no exclamation marks, no emoji.

## Dashboards

Order: four KPI cards, then a trend, then a breakdown table, then an attention list.
Summary before detail. Encode state in form (chips, stacked bars, ageing buckets) so what
needs attention reads at a glance. Every bar or segment clicks through to a filtered list
via URL parameters (`?status=pending`).

## Forms

Validate on the client for convenience and show the API's error message on failure. The
API remains the authority (it re-validates everything).

## Before you finish

- Rung 3 (build) and rung 4 (bundle loads) pass.
- Check light and dark themes.
- Check `lessons-learned` if you see a white screen or stale UI.

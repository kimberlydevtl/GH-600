# Agent rules for this repository

These rules are always on, for every agent and every task. Task procedures live in
`.github/skills/` (start with `loop-engineering`, it routes you). Path-specific rules live
in `.github/instructions/` and load automatically for the files you touch.

## What this repo is

A leave tracker with three parts, served from one origin:
- `web/`: React 19 + Vite + Tailwind v4 + react-query. Calls `/api` only.
- `api/`: Express + TypeScript. Identity, authorisation, validation and audit live here.
  All data access goes through the `Repo` interface in `api/src/data/types.ts`.
- `mcp/`: an MCP server that exposes the API as agent tools. It calls the API, never the data.


## Memory in this repo

- `docs/decisions/`: why things are built this way. **Read the relevant records before
  planning.** If a request or plan contradicts one, say so and quote it.
- `.github/skills/lessons-learned/LESSONS.md`: traps already hit. **Search it for the
  symptom before guessing at a fix**, and add a row when you fix a non-obvious failure.
- `plan.md`: the state of the current task.

## The loop

Every change follows **plan → act → verify → report**.

1. **Plan before you act.** For anything bigger than a one-line fix, write `plan.md` first
   (`plan-first` skill) and keep it updated. It is the state you resume from.
2. **Act in small, reversible steps.** Touch only the files the plan lists.
3. **Verify with signals that can fail.** Run `bash scripts/verify.sh`. A 200 from
   `/api/health` is not evidence that your change works.
4. **Report honestly.** Paste `.verify/report.md` into the PR. If you skipped a check, say so.

## Non-negotiables

- **Every endpoint has a test**, including one that fails if the change is wrong.
- **The client is untrusted.** The web app and MCP tools are clients. Authorisation,
  ownership and status are decided in `api/` from server-side data, never from the request.
  Hiding a button in `web/` is ergonomics, not security.
- **Validate and whitelist input.** Unexpected input gets a 400.
- **Change state only through `Repo` methods.** They write the audit entry in the same operation.
- **Keep data access behind `Repo`.** No route, component or tool reads storage directly.
  This is what makes the move to Azure a single swap.
- **No secrets in code.** Use environment variables, repository secrets or app settings.
  In Azure, use managed identity, never a database password.
- **Gate the irreversible.** Merging, deleting data, changing `api/src/auth/`, `.github/`,
  `mcp/` tool permissions or infrastructure: open a PR and stop. A human decides.

## Commands

- Install: `npm ci`
- Dev (web on 5173, api on 3001): `npm run dev`
- Production-style run: `npm run build && npm start` then open http://localhost:3001
- Demo users (header `x-user`, or the dropdown in the UI): `ana`, `raj` (employees),
  `ben` (manager), `cara` (admin)
- Full verification ladder: `bash scripts/verify.sh`

## Autonomy
Test environments you may change alone; production waits for a person. Details and limits: `docs/azure-target.md`.

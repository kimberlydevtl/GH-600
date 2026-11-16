---
name: loop-engineering
description: Start here for any change in this repo. Explains the plan, act, verify, report loop and routes you to the right skill for the task.
---
# Loop engineering

One loop for every change: **plan → act → verify → report**. Read the core below,
then open only the one skill that matches the task. Do not load every skill.

## Router: pick the procedure

| The task is... | Use |
|---|---|
| Anything bigger than a one-line fix, or a vague request | `plan-first` |
| Adding or changing an API route, input, permission or audit | `api-hardening` |
| Adding or changing an MCP tool, or what agents may do through MCP | `mcp-tools` |
| Work that splits across several files or agents | `fan-out` |
| Before you claim anything works, and before you open the PR | `verify-ladder` |
| Any plan (read first), or a choice that is expensive to reverse | `decision-log` |
| Something failed or behaves oddly, or you just fixed a non-obvious failure | `lessons-learned` |
| UI: app shell, components, theme, tables, dashboards | `ui-shell` |
| Sign-in, tokens, AUTH_MODE, 401 or AADSTS errors | `entra-auth` |
| Designing or reviewing an Azure SQL architecture | `azure-sql-architecture` |
| Azure SQL data layer, schema, managed identity, DATA_BACKEND | `azure-sql-mi` |
| Infrastructure, deploy workflow, confirming a deploy is live | `deploy-azure` |

## The core (always applies)

- **Decisions are memory.** `docs/decisions/` explains why the system is shaped as it is.
  Read the relevant records before planning; never quietly contradict one.
- **Lessons are memory too.** Before guessing at a fix, search
  `.github/skills/lessons-learned/LESSONS.md` for the symptom.
- **The plan is the state.** `plan.md` holds the objective, the steps, which files
  each step may touch, and progress. If the session stops, the next session resumes
  from `plan.md`, not from memory.
- **Act with momentum, gate the irreversible.** Small, reversible edits: just do them.
  Merging, deleting data, touching `api/src/auth/`, `.github/` or `mcp/`: open a PR and stop.
- **Verify at every layer with a signal that can fail.** Typecheck passing does not
  mean tests pass. Tests passing does not mean the running app works. Each claim
  needs its own check. `scripts/verify.sh` runs them in order.
- **Report honestly.** Lead with the verified outcome. If a rung was skipped or
  failed, say so in the PR. Never upgrade "should work" to "works".
- **Reference, don't invent.** Match the patterns already in `api/src/routes/leave.ts`,
  `api/test/leave.test.ts`, `web/src/App.tsx` and `mcp/src/server.ts` rather than inventing new styles.
- **Data access stays behind `Repo`.** That is what makes local to Azure a single swap later.

## Adapting this kit to another stack

Keep the loop, the router and the four skills. Replace only:
1. the commands in `scripts/verify.sh` (your build, your tests, your smoke requests),
2. the path globs in `.github/instructions/*.instructions.md`,
3. the stack-specific examples inside `api-hardening`.
The CI workflow and ruleset stay the same because they only call `scripts/verify.sh`.

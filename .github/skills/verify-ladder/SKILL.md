---
name: verify-ladder
description: Use before claiming any change works and before opening or updating a PR. Runs checks that can fail, in order, and reports the evidence.
---
# Verification ladder

Run `bash scripts/verify.sh`. It stops at the first red rung.

| Rung | Proves | Does NOT prove |
|---|---|---|
| 1 Typecheck | api, web and mcp are consistent | That anything builds or runs |
| 2 Tests | The API behaviour you thought to test | Behaviour you did not test |
| 3 Build | The production bundle and server compile | That the built app serves correctly |
| 4 Running app | THIS build is live (unique build id), real data paths work, the UI bundle loads | Every edge case |
| 5 MCP tools | Agents can discover and call tools; read mode exposes no write tools | That the tool descriptions are good |
| 6 No secrets | No credential patterns committed | That config is correct |

## Rules

- **Pick the check that would go red if you were wrong.** If your change could break
  and no test would notice, add that test first.
- **A health check is not evidence.** `/api/health` returns 200 on old and broken builds too.
  Rung 4 checks `/api/version` for a build id only this run knows.
- **If a rung fails, fix the cause, not the check.** Never delete or weaken a test to go green.
  If a test is genuinely wrong, say so in the PR and explain why.
- **CI runs the same script.** Your local green must match the `verify / ladder` check.
  If they disagree, CI is the source of truth.

## Report

Copy `.verify/report.md` into the PR's Evidence section. If you could not run a rung,
write `NOT RUN` and the reason. Never write PASS for a rung you did not run.

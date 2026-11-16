---
name: fan-out
description: Use when work splits across several files or agents. Assigns disjoint file sets, shares one written guide, and makes the orchestrator the integrator.
---
# Fan-out that does not collide

Parallel agents are fast until two of them edit the same file. Prevent that by design.

## Rules

1. **One shared guide.** Every agent gets the same `plan.md` and follows `AGENTS.md`.
   Conventions are written down once, not repeated in each prompt.
2. **Disjoint file sets.** Each task in `plan.md` lists the exact files it may touch.
   No file appears in two tasks. If two tasks need the same file, merge the tasks or
   sequence them.
3. **Each agent verifies its own slice** (for example its tests) and reports in a
   structured way: files changed, checks run, result, open questions.
4. **Keep interfaces stable.** Do not rename exports other tasks depend on.
5. **The orchestrator is the integrator.** After all tasks finish, the orchestrator runs
   the full `verify-ladder` on the whole project and fixes the seams.
   "Clean in isolation" is necessary, not sufficient.

## Handoff format

```markdown
### Handoff: task <n> (<agent>)
Files changed: <list>
Checks run: <command> -> PASS|FAIL
Open questions: <none | list>
```

Append each handoff to `plan.md` under `## Handoffs`. That is the audit trail of the
multi-agent run, visible in the PR.

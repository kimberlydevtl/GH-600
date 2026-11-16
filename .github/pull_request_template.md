## What changed and why
<!-- One or two sentences. Link the issue: Closes #n -->

## Plan
<!-- Link or paste plan.md. List the files this PR was allowed to touch. -->

## Evidence (verification ladder)
<!-- Paste .verify/report.md. Mark any rung you did not run as NOT RUN with the reason. -->

| Rung | Result | Evidence |
|---|---|---|
| 1 Typecheck | | |
| 2 Tests | | |
| 3 Build | | |
| 4 Running app | | |
| 5 MCP tools | | |
| 6 No secrets | | |

## Memory
- Decisions relied on: <!-- e.g. 0001, 0004 -->
- [ ] Adds or supersedes a decision record (linked above)
- [ ] Adds a lesson to LESSONS.md (non-obvious failure fixed in this PR)

## Risk and irreversible actions
- [ ] Touches `api/src/auth/` or `.github/` (needs code owner review)
- [ ] Changes the API contract (status values, field names, response shape)
- [ ] Deletes or migrates data

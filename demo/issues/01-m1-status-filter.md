# Add a status filter to the leave list

**Module:** M1 Foundations (assign to Copilot at 09:00, show the PR at 09:20)

## Goal
Managers can list only pending requests with `GET /api/leave?status=pending`.

## Success criteria
- `?status=pending|approved|rejected` filters the list.
- Any other value returns 400 with a clear error.
- The filter never widens what a user can see (an employee still sees only their own).
- New tests cover a valid filter, an invalid value, and an employee using the filter.
- `bash scripts/verify.sh` passes.

## Scope
In: `api/src/routes/leave.ts`, `api/test/leave.test.ts`. Out: everything else.

## Risk
Medium. Open a PR, do not merge.

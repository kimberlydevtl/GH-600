# Show each employee's remaining leave balance

**Module:** M4 Multi-agent (run with the orchestrator agent)

## Goal
`GET /api/leave/balance` returns the caller's allowance, days used and days remaining.

## Success criteria
- Allowance is 14 days per year. Used = sum of approved request days (inclusive dates).
- Employees see only their own balance. Managers can pass `?user=<id>` for their team only (403 otherwise).
- Calculation lives in its own module with unit tests. The route has HTTP tests.
- `bash scripts/verify.sh` passes.

## Suggested split (disjoint files)
1. Calculation: `api/src/balance.ts`, `api/test/balance.test.ts`
2. Route: `api/src/routes/leave.ts`, `api/test/leave.test.ts`
3. UI: show the balance in a stat tile, `web/src/App.tsx`
4. Tool: `get_balance` read tool, `mcp/src/server.ts`

## Risk
Medium. Open a PR, do not merge.

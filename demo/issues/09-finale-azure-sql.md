# Finale 3: Azure SQL data layer with managed identity

**Track:** Finale

## Goal
`DATA_BACKEND=azuresql` stores data in Azure SQL, connecting with Entra identity.
`DATA_BACKEND=memory` stays the default and is what tests use.

## Success criteria
- Follows the `azure-sql-mi` skill and decisions 0001, 0007. No password anywhere.
- Only `api/src/data/` and `db/` change.
- State change and audit row in one transaction.
- Ladder passes (memory). Documented manual check passes against Azure SQL.

## Scope
In: `api/src/data/`, `db/`, `api/src/server.ts` (to call `createRepo()`). Out: everything else.

## Risk
High (data). PR only, human approval.

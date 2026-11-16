---
name: azure-sql-mi
description: Use when adding or changing the Azure SQL data layer (AzureSqlRepo), its schema, its connection with Entra identity and managed identity, or DATA_BACKEND. Never uses a database password.
---
# Azure SQL with managed identity

Read decisions 0001 (data behind `Repo`) and 0007 (no secrets) first. The whole point of
this stage is that **only `api/src/data/` changes**. If your plan touches routes, the web
app or MCP tools, the plan is wrong.

## Shape of the change

```
api/src/data/
  types.ts         Repo interface (unchanged unless a decision says otherwise)
  memory.ts        MemoryRepo (unchanged, still used by tests)
  azuresql.ts      AzureSqlRepo implements Repo
  token.ts         Entra token for SQL, cached
  index.ts         createRepo(): DATA_BACKEND=memory|azuresql
db/
  schema.sql       idempotent CREATE TABLE IF NOT EXISTS-style DDL
  seed.sql         demo users and requests
```

## Connection: no password, ever

- Package: `mssql`. Authentication type `azure-active-directory-access-token`, with a
  token for the scope `https://database.windows.net/.default`.
- Token source: `ChainedTokenCredential(new AzureCliCredential(), new ManagedIdentityCredential())`
  from `@azure/identity`. Azure CLI first, so local development uses your `az login` and is
  fast; managed identity in App Service.
- **Cache the token** and refresh it 5 minutes before expiry. **Share one in-flight
  request**: concurrent callers await the same promise. Without this, a burst of requests
  each starts its own `az` process and everything hangs.
- Rebuild the connection pool with the new token shortly before the old one expires.
- Settings (non-secret): `SQL_SERVER`, `SQL_DATABASE`. Nothing else.

## Queries

- Parameterise every value (`request.input(...)`). Never build SQL from strings.
- If an identifier must be dynamic (sort column), choose it from a fixed whitelist.
- State change and audit row in **one transaction**, so they cannot diverge.
- Return the same shapes as `MemoryRepo`, so the existing API tests describe both.

## Schema

Tables: `users`, `user_roles` (or a role column on users), `leave_requests`,
`audit_events (at, actor, action, request_id, from_status, to_status)`.
Write DDL so it is safe to run twice (`IF OBJECT_ID(...) IS NULL CREATE TABLE ...`,
`IF COL_LENGTH(...) IS NULL ALTER TABLE ...`).

## One-time grant (needs a human with the SQL Entra admin role)

The App Service's system-assigned managed identity must be a database user, added by the
**App Service name**:

```sql
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = '<app-name>')
  CREATE USER [<app-name>] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [<app-name>];
ALTER ROLE db_datawriter ADD MEMBER [<app-name>];
```

Run with `sqlcmd -S <server>.database.windows.net -d <db> -G -Q "..."` signed in as the
admin. Redeploying to the same App Service keeps the grant; a new app needs it again.
Grant only reader and writer, never `db_owner`.

## Verify

- Ladder rungs 1 to 6 still pass with `DATA_BACKEND=memory` (tests do not need Azure).
- Add a manual or CI-optional check: with `DATA_BACKEND=azuresql`, `/api/me` and
  `/api/leave` return data. A route that runs a real query proves credential plus schema;
  a health check does not.
- Local connection refused or timing out: check the SQL firewall for your current IP
  (`lessons-learned`).

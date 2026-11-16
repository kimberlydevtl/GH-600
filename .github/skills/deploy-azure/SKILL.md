---
name: deploy-azure
description: Use when creating Azure infrastructure for the app, writing or changing the deploy workflow, deploying, or confirming that a deploy is live. Deploys are irreversible actions: PR and human approval only.
---
# Deploy to Azure App Service

Read decisions 0005 (build id, not health) and 0007 (OIDC, managed identity, no Easy Auth).
Deploying changes a live system: open a PR, and let the `production` environment approval
gate the actual deploy. Never deploy from an agent session directly.

## Target shape

One Linux App Service (Node 22) serves the API and the built web app from one origin.
Azure SQL is reached with the App Service's system-assigned managed identity.

```
infra/main.bicep   App Service plan, App Service (system identity), Azure SQL server + db,
                   SQL Entra admin, app settings
```

## App settings (all non-secret)

`NODE_ENV=production`, `AUTH_MODE=entra`, `DATA_BACKEND=azuresql`, `ENTRA_TENANT_ID`,
`ENTRA_CLIENT_ID`, `SQL_SERVER`, `SQL_DATABASE`, `BUILD_ID=<commit sha>`,
`SCM_DO_BUILD_DURING_DEPLOYMENT=false`. Startup command: `node api/dist/server.js`.

## Package

Build in CI, not on the server: `npm ci && npm run build`, then zip `api/dist`,
`api/package.json`, the API's production `node_modules`, and `web/dist`, keeping the same
relative layout (`api/dist` serves `../../web/dist`).

## Workflow (`.github/workflows/deploy.yml`)

- Trigger: push to `main` (after the `ladder` check has passed in the PR).
- Top-level `permissions: contents: read`. Only the deploy job adds `id-token: write`.
- `environment: production` with required reviewers. This is the human gate.
- Sign in with `azure/login` using OIDC: `client-id`, `tenant-id`, `subscription-id` from
  repository **variables** (they are identifiers, not secrets). The Entra app used for
  deploy has a federated credential for this repo's `production` environment and only
  the role it needs on the resource group.
- Deploy with `azure/webapps-deploy`, passing the zip.
- Then run the **deployed check** (below). The job fails if it fails.

## Deployed check (ladder rung 7)

A deploy is live only when all of these pass against the real host:

```bash
H=https://<default-host-name>
test "$(curl -s $H/api/version | jq -r .build)" = "$GITHUB_SHA"
curl -s -o /dev/null -w '%{http_code}' $H/api/leave        # expect 401 (identity required)
ASSET=$(curl -s $H/ | grep -oE '/assets/[^"]+\.js' | head -1)
curl -s -o /dev/null -w '%{http_code}' "$H$ASSET"           # expect 200
```

Retry for up to a few minutes: a cold start can take time. Never use `/api/health` to
confirm a deploy.

## After the first deploy

- Turn on **Always On** (avoids cold starts and false "failed to start" reports).
- Add the App Service host as a SPA redirect URI (`entra-auth`).
- Grant the managed identity database access (`azure-sql-mi`).

## Gotchas

Check `lessons-learned` for: "worker failed to start" (usually cold start), apps missing
from `az webapp list` (role elevation), regional host names.

---
name: azure-ops
description: Use when creating, checking, deploying to or tearing down the Azure test or production environments, setting GitHub environments, variables or the publish-profile secret, or running az or gh commands for the app.
---
# Azure operations

Facts (names, groups, identities, autonomy limits) are in `docs/azure-target.md`. This skill
is the procedure. The agent for this work is `azure-operator`.

## The scripts (run from the repository root)

| Command | Does | Who may run it |
|---|---|---|
| `bash scripts/azure/status.sh` | Read-only: web apps, `/api/version`, GitHub environments, variables | Anyone, any time |
| `bash scripts/azure/bootstrap.sh test` | Creates or repairs the test group, plan, web app, identity (Contributor on `Github-test`), GitHub env `test`, variables, publish-profile placeholder | Agent alone |
| `bash scripts/azure/bootstrap.sh prod` | Same for production (Website Contributor on the prod app only, env `production` with required reviewer) | Person approves first |
| `bash scripts/azure/bootstrap.sh copilot` | Gives the Copilot cloud agent its own Azure identity: Contributor on `Github-test`, Reader on `Github`, GitHub env `copilot` | Person, once |
| `bash scripts/azure/publish-profile.sh test\|prod` | Replaces the placeholder with a real publish profile (fallback only; it is a long-lived password) | Test: agent. Prod: person approves |
| `bash scripts/azure/teardown.sh test` | Deletes the whole `Github-test` group | Agent alone |
| `bash scripts/azure/teardown.sh prod` | Deletes only the prod web app and plan | Person approves first |

All scripts are idempotent: rerunning them skips what exists. Names live in
`scripts/azure/config.sh` only.

## What GitHub ends up with

- Repository variables: `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`.
- Environment `test`: variables `AZURE_CLIENT_ID`, `AZURE_WEBAPP_NAME`; secret
  `AZURE_WEBAPP_PUBLISH_PROFILE` (placeholder). No reviewers.
- Environment `production`: the same names with production values, plus a required reviewer.

The deploy workflow (`deploy-azure` skill, template in `demo/workflows/deploy-two-env.yml`)
reads only these names, so the same job definition works for both environments.

## Copilot cloud agent with Azure

1. `bash scripts/azure/bootstrap.sh copilot` (once).
2. `.github/workflows/copilot-setup-steps.yml` must be on `main`. It signs in with
   `azure/login` (OIDC) before the agent starts, so `az` works inside the agent's session.
   Run it once from the Actions tab (**Run workflow**) to check the login step is green.
3. Repository **Settings > Copilot > Cloud agent** (older UI: Coding agent), firewall custom
   allowlist: `management.azure.com`, `login.microsoftonline.com`, `azurewebsites.net`.
4. Assign an issue that needs Azure. In the session log, `az account show` should show
   `gh600-copilot`.

If the login step fails with "no matching federated identity record", the error message
shows the subject GitHub actually sent. Add a federated credential with exactly that subject
to `gh600-copilot` (Entra > App registrations > gh600-copilot > Certificates & secrets >
Federated credentials) and rerun.

The OIDC sign-in is short-lived. A very long agent session can lose Azure access part way
through; split big Azure jobs into smaller issues.

## Proving it worked

`status.sh` must show the web app running and `/api/version` returning the build you just
deployed. A web app that exists is not a web app that works.

## Gotchas

- Required reviewers on environments need a public repository or a paid GitHub plan. The
  script warns if it could not set them; then the production gate does not exist, so say so.
- Web app names are global. If `leave-gh600-kty` is taken, change it in `config.sh` and
  `docs/azure-target.md` together.
- A new federated credential or role assignment can take a minute or two to work. Retry the
  workflow once before debugging.
- Production runs as `NODE_ENV=staging` with demo auth until Entra sign-in (#8) is merged:
  the API refuses demo auth with `NODE_ENV=production` by design.

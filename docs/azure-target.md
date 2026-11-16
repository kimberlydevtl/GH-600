# Azure target (where things live)

Facts only. The procedures are in the `azure-ops`, `deploy-azure`, `azure-sql-mi` and `entra-auth`
skills. Use the `azure-operator` agent and the scripts in `scripts/azure/` for any Azure work.

| Item | Value |
|---|---|
| Subscription | **Azure Demo** (get the ID with `az account show --query id -o tsv`; workflows read it from the `AZURE_SUBSCRIPTION_ID` variable) |
| Resource group | **Github** |
| Region | **eastus2** (put every new resource here) |
| App Service plan | `plan-gh600` (Linux, B1) |
| App Service | `leave-gh600-kty` |
| Azure SQL server / database | `sql-gh600-kty` / `leavedb` (create only when issue #9 is approved) |
| Deploy identity | Entra app `gh600-deploy`, federated credential for `repo:kimberlydevtl/GH-600:environment:production`, role **Website Contributor** scoped to the App Service only |
| GitHub environment | `production`, required reviewer @kimberlydevtl |

Other resources already in the group (for example the storage account) are not part of this
app. Do not change or delete them.

## Autonomy levels: test runs itself, production waits for a person

| | **Test** | **Production** |
|---|---|---|
| Resource group | `Github-test` (eastus2) | `Github` (eastus2) |
| App Service | `leave-gh600-kty-test` (plan `plan-gh600-test`, B1) | `leave-gh600-kty` (plan `plan-gh600`) |
| Settings | `NODE_ENV=staging`, `AUTH_MODE=demo`, `DATA_BACKEND=memory` | `NODE_ENV=production`, `AUTH_MODE=entra` |
| GitHub environment | `test`, no reviewers | `production`, required reviewer @kimberlydevtl |
| Deploy identity | `gh600-deploy-test`: **Contributor on `Github-test` only** | `gh600-deploy`: **Website Contributor on `leave-gh600-kty` only** |
| Copilot cloud agent | Creates and changes anything (`gh600-copilot`, Contributor) | Reads only (`gh600-copilot`, Reader) |
| Deploy trigger | Automatic after the `ladder` check passes on a PR | Push to `main`, then a person approves |
| Agent may, without asking | Create, change, redeploy and delete resources in `Github-test`; read logs; rerun the deployed check | Read only (`show`, `list`, `log tail`) |
| Agent must stop and ask | Anything outside `Github-test`, anything that costs more than a B1 plan or a serverless SQL database | Every create, change, delete or deploy |

Rule of thumb: if it can be thrown away and rebuilt from the repository in ten minutes, the
agent may do it alone. If a real user, real data or money depends on it, a person decides.

The instructions above are the soft rule. The hard rule is the identity: the test identity
cannot reach `Github`, and production deploys cannot run without the environment approval.

## Using `az` from an agent session

- The local agent's `az` runs as the trainer's own login, which has broad rights. Treat it as
  borrowed admin access.
- Read-only commands (`az account show`, `az group show`, `az resource list`,
  `az webapp show`, `az webapp log tail`) are fine anywhere.
- Commands that create, change or delete: allowed only with `-g Github-test` (always pass
  `-g` explicitly). Anywhere else, stop, show the exact command and why, and wait for a
  person. Prefer putting lasting changes in `infra/main.bicep` and a pull request.
- Never add `az login` credentials, publish profiles or connection strings to the repository.
- The Copilot cloud agent (the one you assign issues to) signs in to Azure as `gh600-copilot`
  through `.github/workflows/copilot-setup-steps.yml`. That identity is **Contributor on
  `Github-test`** (create anything) and **Reader on `Github`** (look, never change). So in the
  cloud the production limit is not an instruction: Azure itself refuses the write.
- Production changes from GitHub happen only through the deploy workflow, after approval.

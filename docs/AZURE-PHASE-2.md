# Phase 2: from local to Azure (the finale)

The app is built so this move is a set of small, separately verifiable steps. Each stage
has a seeded issue and a skill that the agent follows:

| Stage | Issue | Skill | Decisions |
|---|---|---|---|
| UI shell | #7 | `ui-shell` | |
| Entra sign-in | #8 | `entra-auth` | 0002, 0006, 0007 |
| Azure SQL | #9 | `azure-sql-mi` | 0001, 0007 |
| Deploy | #10 | `deploy-azure` | 0005, 0007 |

The detailed steps:

| Step | Change | Why it is small |
|---|---|---|
| 1 | Add `AzureSqlRepo` implementing `Repo` (Azure SQL, schema + seed script) | Routes, web and MCP do not change: they only know `Repo` |
| 2 | Connect with **managed identity**, never a password (`DefaultAzureCredential` chain: Azure CLI locally, managed identity in Azure) | No secret ever exists to leak |
| 3 | Choose the repo by environment variable (`DATA_BACKEND=memory|azuresql`) | Tests keep using `MemoryRepo` |
| 4 | Replace demo `x-user` identity with Entra ID sign-in (MSAL in web, token validation in api) | Same `res.locals.user` contract, so routes do not change |
| 5 | Infrastructure as code: App Service (Linux, Node 22) + Azure SQL + managed identity grant | Reviewable in a PR, CODEOWNERS on `infra/` |
| 6 | Deploy workflow with **OIDC** (federated credential, no client secret), environment approval before production | Human gate on the irreversible step |
| 7 | Add ladder rung 7 "deployed": hit `/api/version` on the live URL and expect this commit's build id | Proves the swap, not just that something answers |

Rules that carry over from the loop:
- Never confirm a deploy with `/api/health`. It returns 200 on the old build too.
- Data access stays behind `Repo`. If a step needs to touch routes or components, the plan is wrong.
- Grant the app's managed identity only the database roles it needs (read/write on its own tables).

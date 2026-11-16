# Finale 4: deploy to Azure App Service with OIDC

**Track:** Finale

## Goal
Merging to `main` deploys to App Service after a human approves the `production`
environment, and the workflow proves the new build is live.

## Success criteria
- Follows the `deploy-azure` skill and decisions 0005, 0007.
- `infra/main.bicep` describes the resources. No secrets in the repo or in GitHub secrets.
- Deploy job alone has `id-token: write`. `environment: production` has required reviewers.
- Deployed check: live `/api/version` equals the commit SHA, `/api/leave` is 401
  anonymous, current bundle returns 200.

## Scope
In: `infra/`, `.github/workflows/deploy.yml`. Out: application code.

## Risk
High (irreversible, production). PR only, code owner review, environment approval.

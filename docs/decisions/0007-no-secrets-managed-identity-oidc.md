# 0007: No stored secrets: managed identity for data, OIDC for deploys

Status: Accepted
Date: 2026-11-16

## Context
Database passwords and deployment client secrets expire, get copied into config files,
and leak. Each one is a rotation task and an incident waiting to happen.

## Decision
- The API reaches Azure SQL with Entra identity: the developer's Azure CLI login locally,
  the App Service managed identity in Azure. No SQL password exists.
- The web app signs in as a public client (PKCE). No client secret.
- GitHub Actions signs in to Azure with OIDC federated credentials. No client secret is
  stored in GitHub.
- No App Service Authentication ("Easy Auth") layer on top of in-app MSAL.

## Alternatives rejected
- SQL username and password in app settings: works on day one, leaks eventually.
- Publish profile or service principal secret for deploys: expires and must be rotated.
- Easy Auth: returns 302 redirects where the SPA expects 401 JSON, and needs a client
  secret that expires.

## Consequences
- Good: nothing to rotate, nothing to leak. Ladder rung 6 can treat any credential pattern
  as a failure.
- Cost: first-time setup needs an Entra admin step (create the SQL user for the managed
  identity, add the federated credential).

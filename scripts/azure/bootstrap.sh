#!/usr/bin/env bash
# Creates everything both environments need. Safe to run again: it skips what exists.
#   bash scripts/azure/bootstrap.sh test     only the test environment (agent may run alone)
#   bash scripts/azure/bootstrap.sh prod     only production (a person approves the command)
#   bash scripts/azure/bootstrap.sh copilot  Azure access for the Copilot cloud agent (GitHub env "copilot")
#   bash scripts/azure/bootstrap.sh all      test + prod + copilot
set -euo pipefail
cd "$(dirname "$0")"; source ./config.sh
TARGET="${1:-test}"

az account set --subscription "$SUBSCRIPTION_NAME"
TENANT=$(az account show --query tenantId -o tsv)
SUB=$(az account show --query id -o tsv)

gh_env() { # name, reviewer(yes/no)
  local name=$1 rev=$2
  if [ "$rev" = yes ]; then
    local uid; uid=$(gh api "users/$REVIEWER" --jq .id)
    gh api -X PUT "repos/$REPO/environments/$name" --input - <<JSON >/dev/null || \
      echo "    ! could not set required reviewers (private repo on a free plan?). Environment created without them."
{"reviewers":[{"type":"User","id":$uid}],"deployment_branch_policy":null}
JSON
  else
    gh api -X PUT "repos/$REPO/environments/$name" >/dev/null
  fi
  log "GitHub environment '$name' ready (reviewers: $rev)"
}

identity() { # display name, env name -> echoes appId
  local name=$1 env=$2 app
  app=$(az ad app list --display-name "$name" --query "[0].appId" -o tsv)
  if [ -z "$app" ]; then app=$(az ad app create --display-name "$name" --query appId -o tsv); else skip "app $name" >&2; fi
  az ad sp show --id "$app" >/dev/null 2>&1 || az ad sp create --id "$app" >/dev/null
  if ! az ad app federated-credential list --id "$app" --query "[?name=='gh-$env']" -o tsv | grep -q .; then
    az ad app federated-credential create --id "$app" --parameters \
      "{\"name\":\"gh-$env\",\"issuer\":\"https://token.actions.githubusercontent.com\",\"subject\":\"repo:$REPO:environment:$env\",\"audiences\":[\"api://AzureADTokenExchange\"]}" >/dev/null
  fi
  echo "$app"
}

webapp() { # rg, plan, app, node_env, auth_mode
  local rg=$1 plan=$2 app=$3 nenv=$4 auth=$5
  az group show -n "$rg" >/dev/null 2>&1 && skip "group $rg" || az group create -n "$rg" -l "$LOCATION" -o none
  az appservice plan show -g "$rg" -n "$plan" >/dev/null 2>&1 && skip "plan $plan" || \
    az appservice plan create -g "$rg" -n "$plan" --sku B1 --is-linux -l "$LOCATION" -o none
  az webapp show -g "$rg" -n "$app" >/dev/null 2>&1 && skip "web app $app" || \
    az webapp create -g "$rg" -p "$plan" -n "$app" --runtime "NODE:22-lts" -o none
  az webapp identity assign -g "$rg" -n "$app" -o none
  az webapp config set -g "$rg" -n "$app" --always-on true --startup-file "node api/dist/server.js" -o none
  az webapp config appsettings set -g "$rg" -n "$app" -o none --settings \
    NODE_ENV="$nenv" AUTH_MODE="$auth" DATA_BACKEND=memory SCM_DO_BUILD_DURING_DEPLOYMENT=false
  log "Web app https://$app.azurewebsites.net ready"
}

wire_github() { # env, appId
  local env=$1 app=$2 webapp_name=$3
  gh variable set AZURE_CLIENT_ID   --env "$env" -R "$REPO" -b "$app"
  gh variable set AZURE_WEBAPP_NAME --env "$env" -R "$REPO" -b "$webapp_name"
  # Placeholder only. OIDC is the real sign-in. Fill with scripts/azure/publish-profile.sh if you must.
  gh secret set AZURE_WEBAPP_PUBLISH_PROFILE --env "$env" -R "$REPO" -b "PLACEHOLDER: not used, deploys sign in with OIDC"
  log "GitHub '$env': AZURE_CLIENT_ID, AZURE_WEBAPP_NAME, publish-profile placeholder set"
}

gh variable set AZURE_TENANT_ID       -R "$REPO" -b "$TENANT"
gh variable set AZURE_SUBSCRIPTION_ID -R "$REPO" -b "$SUB"

if [ "$TARGET" = test ] || [ "$TARGET" = all ]; then
  log "TEST environment"
  webapp "$TEST_RG" "$TEST_PLAN" "$TEST_APP" staging demo
  gh_env test no
  APP=$(identity "$TEST_ID" test)
  az role assignment create --assignee "$APP" --role Contributor \
    --scope "$(az group show -n "$TEST_RG" --query id -o tsv)" -o none 2>/dev/null || skip "role on $TEST_RG"
  wire_github test "$APP" "$TEST_APP"
fi

if [ "$TARGET" = prod ] || [ "$TARGET" = all ]; then
  log "PRODUCTION environment"
  webapp "$PROD_RG" "$PROD_PLAN" "$PROD_APP" "$PROD_NODE_ENV" "$PROD_AUTH_MODE"
  gh_env production yes
  APP=$(identity "$PROD_ID" production)
  az role assignment create --assignee "$APP" --role "Website Contributor" \
    --scope "$(az webapp show -g "$PROD_RG" -n "$PROD_APP" --query id -o tsv)" -o none 2>/dev/null || skip "role on $PROD_APP"
  wire_github production "$APP" "$PROD_APP"
fi

if [ "$TARGET" = copilot ] || [ "$TARGET" = all ]; then
  log "COPILOT cloud agent access"
  az group show -n "$TEST_RG" >/dev/null 2>&1 || az group create -n "$TEST_RG" -l "$LOCATION" -o none
  gh_env copilot no
  APP=$(identity "$COPILOT_ID" copilot)
  az role assignment create --assignee "$APP" --role Contributor \
    --scope "$(az group show -n "$TEST_RG" --query id -o tsv)" -o none 2>/dev/null || skip "Contributor on $TEST_RG"
  az role assignment create --assignee "$APP" --role Reader \
    --scope "$(az group show -n "$PROD_RG" --query id -o tsv)" -o none 2>/dev/null || skip "Reader on $PROD_RG"
  gh variable set AZURE_CLIENT_ID       --env copilot -R "$REPO" -b "$APP"
  gh variable set AZURE_TENANT_ID       --env copilot -R "$REPO" -b "$TENANT"
  gh variable set AZURE_SUBSCRIPTION_ID --env copilot -R "$REPO" -b "$SUB"
  log "Copilot can now create anything in $TEST_RG and read $PROD_RG."
  echo "    Next: allow Azure hosts in the Copilot firewall (see azure-ops skill)."
fi

log "Done. Check with: bash scripts/azure/status.sh"

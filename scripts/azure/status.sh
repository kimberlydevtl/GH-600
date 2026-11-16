#!/usr/bin/env bash
# Read-only. Shows what exists in both environments. Agents may run this any time.
set -uo pipefail
cd "$(dirname "$0")"; source ./config.sh
az account set --subscription "$SUBSCRIPTION_NAME"
for pair in "test:$TEST_RG:$TEST_APP" "production:$PROD_RG:$PROD_APP"; do
  IFS=: read -r env rg app <<<"$pair"
  log "$env  ($rg / $app)"
  az webapp show -g "$rg" -n "$app" --query "{state:state, host:defaultHostName, plan:appServicePlanId}" -o table 2>/dev/null || echo "    web app not created"
  printf '    /api/version: '; curl -s -m 10 "https://$app.azurewebsites.net/api/version" || echo "no response"; echo
  gh api "repos/$REPO/environments/$env" --jq '"    GitHub env: " + .name + "  rules: " + ([.protection_rules[].type]|join(","))' 2>/dev/null || echo "    GitHub env missing"
done
log "Repository variables"; gh variable list -R "$REPO"

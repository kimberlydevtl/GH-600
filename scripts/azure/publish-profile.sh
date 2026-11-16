#!/usr/bin/env bash
# Optional fallback if OIDC is not working: replaces the placeholder with a real publish profile.
# A publish profile is a long-lived password. Prefer OIDC. Delete it after the demo.
#   bash scripts/azure/publish-profile.sh test|prod
set -euo pipefail
cd "$(dirname "$0")"; source ./config.sh
case "${1:-test}" in
  test) RG=$TEST_RG; APP=$TEST_APP; ENV=test ;;
  prod) RG=$PROD_RG; APP=$PROD_APP; ENV=production ;;
  *) echo "usage: $0 test|prod"; exit 1 ;;
esac
az resource update -g "$RG" --namespace Microsoft.Web --resource-type basicPublishingCredentialsPolicies \
  --parent "sites/$APP" -n scm --set properties.allow=true -o none
az webapp deployment list-publishing-profiles -g "$RG" -n "$APP" --xml \
  | gh secret set AZURE_WEBAPP_PUBLISH_PROFILE --env "$ENV" -R "$REPO"
log "Real publish profile stored in GitHub environment '$ENV'. Remove it after the demo."

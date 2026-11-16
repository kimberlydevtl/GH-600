#!/usr/bin/env bash
# test: deletes the whole Github-test group (disposable).
# prod: deletes only the web app and plan. The Github group also holds other resources.
set -euo pipefail
cd "$(dirname "$0")"; source ./config.sh
az account set --subscription "$SUBSCRIPTION_NAME"
case "${1:-}" in
  test) az group delete -n "$TEST_RG" --yes --no-wait; log "Deleting $TEST_RG" ;;
  prod) az webapp delete -g "$PROD_RG" -n "$PROD_APP"; az appservice plan delete -g "$PROD_RG" -n "$PROD_PLAN" --yes
        log "Deleted $PROD_APP and $PROD_PLAN (group $PROD_RG kept)" ;;
  *) echo "usage: $0 test|prod"; exit 1 ;;
esac

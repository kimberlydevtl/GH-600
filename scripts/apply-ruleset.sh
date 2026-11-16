#!/usr/bin/env bash
# M6: protect main. PR required, 1 approval, code owner review, "ladder" check must pass.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
gh api "repos/$REPO/rulesets" --method POST --input .github/rulesets/main-protection.json -q '"Ruleset created: " + .name'

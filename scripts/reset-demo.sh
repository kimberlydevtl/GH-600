#!/usr/bin/env bash
# Put the demo repo back to its starting state between rehearsals or classes.
# Removes the ruleset, closes open PRs, deletes their branches, resets main to demo-start.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

for id in $(gh api "repos/$REPO/rulesets" -q '.[] | select(.name=="main-protection") | .id'); do
  gh api "repos/$REPO/rulesets/$id" --method DELETE && echo "ruleset removed"
done

for n in $(gh pr list -R "$REPO" --state open --json number -q '.[].number'); do
  gh pr close "$n" -R "$REPO" --delete-branch && echo "closed PR #$n"
done

git fetch -q origin --tags
git checkout -q main
git reset -q --hard demo-start
git push -f origin main
echo "main reset to demo-start. Re-open any closed demo issues in the GitHub UI if needed."

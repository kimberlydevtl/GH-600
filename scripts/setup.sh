#!/usr/bin/env bash
# One-time setup of the demo repo on your GitHub account.
# Needs: gh (logged in with `gh auth login`), git, node 20+.
# Usage: bash scripts/setup.sh [repo-name]
set -euo pipefail
cd "$(dirname "$0")/.."
NAME="${1:-loop-engineering-demo}"
OWNER=$(gh api user -q .login)

echo "Setting up $OWNER/$NAME"
sed -i.bak "s/@OWNER/@$OWNER/g" .github/CODEOWNERS && rm -f .github/CODEOWNERS.bak

npm install --no-audit --no-fund
bash scripts/verify.sh

git init -q -b main 2>/dev/null || true
git add -A
git commit -qm "Loop engineering demo: initial state" || true
git tag -f demo-start
gh repo create "$OWNER/$NAME" --public --source . --push
git push -f origin demo-start
gh repo edit "$OWNER/$NAME" --template

echo "Seeding demo issues"
for f in demo/issues/*.md; do
  title=$(head -1 "$f" | sed 's/^# //')
  tail -n +2 "$f" > /tmp/issue-body.md
  gh issue create -R "$OWNER/$NAME" --title "$title" --body-file /tmp/issue-body.md >/dev/null
  echo "  created: $title"
done

echo
echo "Done: https://github.com/$OWNER/$NAME"
echo "The ruleset is NOT applied yet. Apply it live in M6 with: bash scripts/apply-ruleset.sh"

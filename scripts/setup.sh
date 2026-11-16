#!/usr/bin/env bash
# One-time setup of the demo repo on your GitHub account. Safe to run again.
# Needs: gh (logged in, with the "workflow" scope), git, node 20+.
# Usage: bash scripts/setup.sh [repo-name]
set -euo pipefail
cd "$(dirname "$0")/.."
NAME="${1:-loop-engineering-demo}"
OWNER=$(gh api user -q .login)
REPO="$OWNER/$NAME"
URL="https://github.com/$REPO.git"
echo "Setting up $REPO"

# Pushing .github/workflows needs the "workflow" scope on your gh login.
if ! gh auth status 2>&1 | grep -q "workflow"; then
  echo "Your gh login is missing the 'workflow' scope. Run:"
  echo "  gh auth refresh -h github.com -s workflow"
  echo "then run this script again."
  exit 1
fi

sed -i.bak "s/@OWNER/@$OWNER/g" .github/CODEOWNERS && rm -f .github/CODEOWNERS.bak

npm install --no-audit --no-fund
bash scripts/verify.sh

# Local git: reuse if it exists.
[ -d .git ] || git init -q -b main
git add -A
git commit -qm "Loop engineering demo: initial state" || true
git branch -M main

# Remote repo: create only if missing.
gh repo view "$REPO" >/dev/null 2>&1 || gh repo create "$REPO" --public

# Point "origin" at the demo repo. An existing different origin is kept as "previous".
CURRENT=$(git remote get-url origin 2>/dev/null || true)
if [ -z "$CURRENT" ]; then
  git remote add origin "$URL"
elif [ "$CURRENT" != "$URL" ]; then
  git remote remove previous 2>/dev/null || true
  git remote rename origin previous
  git remote add origin "$URL"
  echo "Your old remote is kept as 'previous': $CURRENT"
fi

git push -u origin main || { echo "Push rejected: the GitHub repo has commits you do not have locally. Run: git pull --rebase origin main, then run this script again."; exit 1; }
git tag -f demo-start
git push -f origin demo-start
gh repo edit "$REPO" --template

# Label used for backup PRs.
gh label create backup -R "$REPO" --color BFD4F2 --description "Backup demo PR" 2>/dev/null || true

# Seed issues once.
if [ "$(gh issue list -R "$REPO" --state all --limit 1 --json number -q 'length')" = "0" ]; then
  echo "Seeding demo issues"
  for f in demo/issues/*.md; do
    title=$(head -1 "$f" | sed 's/^# //')
    tail -n +2 "$f" > /tmp/issue-body.md
    gh issue create -R "$REPO" --title "$title" --body-file /tmp/issue-body.md >/dev/null
    echo "  created: $title"
  done
else
  echo "Issues already exist, not seeding again."
fi

echo
echo "Done: https://github.com/$REPO"
echo "Next (the night before class): bash scripts/make-backups.sh"

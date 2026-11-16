#!/usr/bin/env bash
# Create the backup PRs the trainer script relies on.
# Run AFTER your rehearsals and AFTER scripts/reset-demo.sh (reset closes open PRs).
#
#   bash scripts/make-backups.sh          start everything
#   bash scripts/make-backups.sh fix      after the broken pr-report run has failed (about 3 min)
#   bash scripts/make-backups.sh label    after Copilot has opened its PRs (15 to 40 min)
#   bash scripts/make-backups.sh status   show what exists
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
MODE="${1:-start}"

assign_copilot() {
  local n="$1"
  if gh issue edit "$n" -R "$REPO" --add-assignee "@copilot" >/dev/null 2>&1; then
    echo "  #$n assigned to Copilot"
  else
    echo "  #$n: could not assign from the terminal. In the browser: issue #$n > Assignees > Copilot"
  fi
}

case "$MODE" in
start)
  echo "1. Assigning issues #1, #4, #5, #6 to the Copilot coding agent"
  for n in 1 4 5 6; do assign_copilot "$n"; done

  echo "2. Creating the M3 token-permissions PR (broken version first)"
  git fetch -q origin
  git checkout -q -B demo/pr-report origin/main
  mkdir -p .github/workflows
  cp demo/workflows/pr-report-broken.yml .github/workflows/pr-report.yml
  git add .github/workflows/pr-report.yml
  git commit -qm "pr-report: read-only token (expected to fail)"
  git push -q -f -u origin demo/pr-report
  gh pr create -R "$REPO" --head demo/pr-report --base main --draft --label backup \
    --title "Backup (M3): post the ladder as a PR comment" \
    --body "Demo 3C. First run uses a read-only token and fails with 403. Second commit elevates one job by one scope." >/dev/null || true
  git checkout -q main
  echo
  echo "Next:"
  echo "  - Wait about 3 minutes until the pr-report check FAILS on that PR, then: bash scripts/make-backups.sh fix"
  echo "  - Do the M2 plan backup by hand (see docs/TRAINER-GUIDE.md, 'Backups')"
  echo "  - When Copilot has opened its PRs: bash scripts/make-backups.sh label"
  ;;
fix)
  git fetch -q origin
  git checkout -q demo/pr-report
  git pull -q --ff-only origin demo/pr-report || true
  cp demo/workflows/pr-report-fixed.yml .github/workflows/pr-report.yml
  git add .github/workflows/pr-report.yml
  git commit -qm "pr-report: elevate only the report job (pull-requests: write)"
  git push -q origin demo/pr-report
  git checkout -q main
  echo "Pushed the fixed workflow. In about 3 minutes the PR shows a green run and a ladder comment."
  ;;
label)
  for n in $(gh pr list -R "$REPO" --state open --json number,author -q '.[] | select(.author.login | test("copilot"; "i")) | .number'); do
    gh pr edit "$n" -R "$REPO" --add-label backup >/dev/null && echo "  PR #$n labelled backup"
    gh pr ready "$n" -R "$REPO" --undo >/dev/null 2>&1 || true
  done
  echo "Approving workflow runs waiting for approval (Copilot PRs wait for a human)"
  for id in $(gh api "repos/$REPO/actions/runs?status=action_required" -q '.workflow_runs[].id'); do
    if gh api -X POST "repos/$REPO/actions/runs/$id/approve" >/dev/null 2>&1; then
      echo "  run $id approved"
    else
      echo "  run $id: approve it in the browser (open the PR > Approve and run workflows)"
    fi
  done
  echo "Note: you cannot approve the PRs themselves for issues you assigned. That is expected."
  ;;
status)
  gh pr list -R "$REPO" --state open --json number,title,author,labels,isDraft \
    -q '.[] | "#\(.number)  \(.title)  [\(.author.login)]  draft=\(.isDraft)  labels=\([.labels[].name]|join(","))"'
  ;;
*) echo "Unknown mode: $MODE"; exit 1 ;;
esac

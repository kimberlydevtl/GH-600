# Post the verification ladder as a PR comment

**Module:** M3 Tools, MCP, execution environments

## Goal
Every PR gets a comment with the ladder results so reviewers see evidence without
opening the Actions log.

## Success criteria
- A workflow posts `.verify/report.md` as a PR comment.
- Top-level `permissions` stays `contents: read`.
- Only the commenting job gets `pull-requests: write`.

## Scope
In: `.github/workflows/pr-report.yml`. Out: everything else.

## Risk
High (workflow change). PR only, code owner review.

<!-- Trainer note: demo this by hand with demo/workflows/pr-report-broken.yml then
pr-report-fixed.yml. Also use this issue for the GitHub MCP demo: with its write tools
switched off, ask the agent to close it and show that it cannot. -->

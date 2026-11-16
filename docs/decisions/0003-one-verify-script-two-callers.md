# 0003: One verification script, run by agents and by CI

Status: Accepted
Date: 2026-11-16

## Context
Agents report "verified" based on their own checks. If CI runs different checks, an agent
can be green locally and red in CI, or worse, claim checks it never ran.

## Decision
`scripts/verify.sh` is the single definition of "works". Agents run it before claiming
success. The `verify` workflow runs the same script as the required `ladder` check. A new
check is added to the script, never to only one caller.

## Alternatives rejected
- Separate agent instructions and CI steps: they drift, and the agent's claim cannot be
  checked against anything.
- CI only: agents would open PRs without knowing they are broken, wasting review time.

## Consequences
- Good: an agent's claim is checked by the same rules at the merge box.
- Cost: the script must stay fast and runnable both in Codespaces and on CI runners.

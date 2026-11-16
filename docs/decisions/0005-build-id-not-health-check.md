# 0005: Prove a deploy with a build id, not /api/health

Status: Accepted
Date: 2026-11-16

## Context
`/api/health` returns the same 200 on the old build, the new build, and a half-broken
build. Using it to confirm a deploy has produced false "it is live" claims before.

## Decision
The API exposes `/api/version` returning `BUILD_ID`. Locally the ladder sets a unique id
per run; in Azure it is the commit SHA. A deploy is confirmed only when the live
`/api/version` returns this build's id AND the page's current JS bundle returns 200.

## Alternatives rejected
- Health check only: cannot fail when the wrong build is serving.
- Manual check in the browser: not repeatable, and stale browser caches mislead.

## Consequences
- Good: "deployed" becomes a check that can fail.
- Cost: every deploy must pass `BUILD_ID` through app settings.

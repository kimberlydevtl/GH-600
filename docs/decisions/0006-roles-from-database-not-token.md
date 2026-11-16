# 0006: Roles come from the database, not from the identity token

Status: Accepted
Date: 2026-11-16

## Context
With Entra sign-in, the token proves who the user is. Roles could come from token claims
(app roles, groups) or from the app's own data. Token roles depend on which app
registration the user signed in through, and moving login to a different registration
silently drops them.

## Decision
The token answers "who are you". The app's `user_roles` data answers "what may you do".
After validating the token, the API looks the user up by object id or email. Not found
means 403 "not provisioned", not an empty app. `/api/me` returns the role and a `can`
matrix; the UI uses it for display only and every route re-checks.

## Alternatives rejected
- Entra app roles in the token: tied to one registration, invisible to reviewers of this
  repo, and easy to lose in a registration change.
- Trusting a role sent by the client: never.

## Consequences
- Good: role changes are data changes, audited and reviewable. Registration changes do not
  change permissions.
- Cost: a provisioning step for new users.

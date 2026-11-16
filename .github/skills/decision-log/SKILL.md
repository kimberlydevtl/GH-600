---
name: decision-log
description: Use when planning any change, and whenever a plan makes a choice that is expensive to reverse (storage, identity, architecture, security, deployment). Read existing decisions first; write a new record when needed.
---
# Decision log

`docs/decisions/` records why the system is built the way it is. It is long-term memory
for the team's reasoning, not just its rules.

## Before you plan

1. Read `docs/decisions/README.md` and every decision that touches the area you are changing.
2. If your plan would contradict an accepted decision, **stop and say so** in the plan.
   Quote the decision number. Do not work around it quietly.
3. If the request itself contradicts a decision (for example "store leave in localStorage"
   against 0001), push back with the decision and its reasoning, and propose an option
   that fits it.

## When to write a new record

Write one when your plan makes a choice that would take more than a day to undo, such as:
- a new dependency that other code will build on
- how identity, permissions or secrets work
- where data lives, or its schema
- how the app is built, deployed or verified

Small, local, easily reversed choices do not need a record. Put them in `plan.md` under
`## Decisions` instead.

## How

1. Copy the template in `docs/decisions/README.md` to the next number.
2. Status `Proposed`. Fill Context, Decision, Alternatives rejected, Consequences.
   Keep it under a page.
3. Add it to the index table.
4. Link it from the PR. A human changes it to `Accepted` by approving the PR
   (CODEOWNERS covers `docs/decisions/`).

## Never

- Edit an accepted decision to mean something different. Write a new one and mark the old
  one `Superseded by NNNN`.
- Write a decision to justify code that already merged without one. Say so honestly instead.

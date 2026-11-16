---
name: plan-first
description: Use before acting on any request bigger than a one-line fix, and always when the request is vague. Turns a request into an objective and a reviewable plan.md.
---
# Plan first

A vague request produces a vague plan, and a vague plan produces a large, risky diff.
Fix the objective before you plan.

## Step 0: read the decisions

Read `docs/decisions/README.md` and the records that touch this area (`decision-log`).
If the request conflicts with an accepted decision, raise it before planning.

## Step 1: write the objective

If any field below is unknown, ask one question or make a stated assumption.
Do not start editing code.

- **Goal:** one sentence, the outcome a user would notice.
- **Inputs:** what you are given (issue, files, data).
- **Outputs:** the exact artefacts you will produce (files changed, endpoints, tests).
- **Success criteria:** checks that can fail. Name the test that would go red if you were wrong.
- **In scope / out of scope:** list the files you may touch. Everything else is off limits.
- **Risk:** low (docs, tests), medium (route logic), high (`api/src/auth/`, workflows, data deletion).
  High risk means: PR only, human approval, no merge.

## Step 2: write plan.md

```markdown
# Plan: <goal>
Issue: #<n>   Risk: low|medium|high

## Objective
<the fields from step 1>

## Steps
- [ ] 1. <step>  (files: api/src/routes/leave.ts)
- [ ] 2. <step>  (files: api/test/leave.test.ts)
- [ ] 3. Run scripts/verify.sh and paste results into the PR

## Decisions
- <small decision and why>  (expensive to reverse? write a record in docs/decisions/)
- Respects: 0001, 0004  (decision records this plan relies on)
```

## Step 3: stop for review when risk is medium or high

Show the plan and wait for approval before editing. While working, tick the steps
in `plan.md` as you finish them. That file is how work survives an interruption.

# Decision log

Short records of decisions that are expensive to reverse. Each one says what we decided,
why, what we rejected, and what it costs us. Agents read these before planning and
must not quietly contradict them.

| # | Decision | Status |
|---|---|---|
| [0001](0001-data-access-behind-repo.md) | All data access goes through the `Repo` interface | Accepted |
| [0002](0002-demo-identity-behind-auth-mode.md) | Demo identity sits behind `AUTH_MODE`, never the production default | Accepted |
| [0003](0003-one-verify-script-two-callers.md) | One verification script, run by agents and by CI | Accepted |
| [0004](0004-mcp-tools-call-the-api.md) | MCP tools call the API, never the data | Accepted |
| [0005](0005-build-id-not-health-check.md) | Prove a deploy with a build id, not `/api/health` | Accepted |
| [0006](0006-roles-from-database-not-token.md) | Roles come from the database, not from the identity token | Accepted |
| [0007](0007-no-secrets-managed-identity-oidc.md) | No stored secrets: managed identity for data, OIDC for deploys | Accepted |

## Template

Copy to `NNNN-short-title.md` (next number, lowercase, hyphens):

```markdown
# NNNN: <decision in one line>

Status: Proposed | Accepted | Superseded by NNNN
Date: YYYY-MM-DD

## Context
What forced a choice. One paragraph.

## Decision
What we will do. Specific enough that a reviewer can tell if a PR breaks it.

## Alternatives rejected
- <option>: <why not>

## Consequences
- Good: <what this buys us>
- Cost: <what this makes harder, and when we would revisit>
```

## Rules

- A decision is never edited to mean something else. To change it, write a new record
  and mark the old one `Superseded by NNNN`.
- `docs/decisions/` is covered by CODEOWNERS: a human approves every new or changed record.

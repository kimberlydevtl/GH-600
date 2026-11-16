# Loop engineering kit: a React + API + MCP app that agents work on safely

A small, real full-stack app (an internal leave tracker) wired with a complete agent
operating system: **plan → act → verify → report**, packaged as native GitHub files.

Built as the demo repo for **GH-600: Developing in Agentic AI Systems**. Use it as a
template for any team that wants agents to work with the discipline of a senior engineer.

```
web/   React 19 + Vite + Tailwind v4 + react-query   (the UI, a client)
api/   Express + TypeScript                          (identity, rules, audit; serves web/ in prod)
mcp/   MCP server                                     (the API as agent tools, another client)
```

## The idea: instructions guide, GitHub enforces

Diagram and file-by-file explanation: [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md).

| Loop step | Guide (what the agent reads) | Enforce (what GitHub checks) |
|---|---|---|
| Rules that always apply | `AGENTS.md` | `CODEOWNERS` on `AGENTS.md` itself |
| Context for the files being edited | `.github/instructions/*.instructions.md` (`applyTo` globs) | |
| Plan before acting | `plan-first` skill, `planner` agent, Agent task issue form | Ruleset: PR required, no direct push |
| Act on disjoint files | `fan-out` skill, `orchestrator` + `builder` agents | |
| The client is untrusted | `api-hardening` skill | API tests in `api/test/` |
| Agents get tools, not access | `mcp-tools` skill, read/write tool modes | Ladder rung 5 |
| Verify with signals that can fail | `verify-ladder` skill, `verifier` agent | **The same** `scripts/verify.sh` as the required `ladder` check |
| Review separate from authorship | read-only `reviewer` agent | 1 approval + code owner review |
| Gate the irreversible | `AGENTS.md`, path instructions | `CODEOWNERS` on `api/src/auth/`, `mcp/`, `.github/` |
| Report honestly | PR template Evidence section | Check results on every PR |
| Remember why | `docs/decisions/` + `decision-log` skill | CODEOWNERS on `docs/decisions/` |
| Remember what went wrong | `lessons-learned` skill + `LESSONS.md` | CODEOWNERS on `.github/` (human approves each lesson) |

**One script, two callers.** Agents run `scripts/verify.sh` in their loop. CI runs the same
script as a required check. An agent that claims "verified" without running it is caught
at the merge box.

## The verification ladder

| Rung | Proves |
|---|---|
| 1 Typecheck | api, web and mcp are consistent |
| 2 Tests | the API rules you wrote tests for |
| 3 Build | the production bundle and server compile |
| 4 Running app | **this** build is live (unique build id, not `/api/health`), real data paths work, the UI bundle loads |
| 5 MCP tools | agents can discover and call tools, and read mode exposes no write tools |
| 6 No secrets | no credential patterns committed |

## Quick start

```bash
npm install
bash scripts/verify.sh            # all six rungs should PASS
npm run dev                       # web http://localhost:5173, api http://localhost:3001
```

Pick a demo user in the top-right dropdown: Ana and Raj (employees), Ben (manager), Cara
(admin). Tick **Trainer mode** to show every button to every user, then try approving as
Ana: the UI lets you click, the API refuses with 403. That is the whole security model in
one click.

To create the demo repo on GitHub with issues seeded: `bash scripts/setup.sh`
(needs `gh auth login`). The full day is in `docs/TRAINER-GUIDE.md`.

## What's inside

```
AGENTS.md                         always-on rules for every agent
.github/
  agents/                         orchestrator, planner, builder, reviewer (read-only), verifier
  skills/
    loop-engineering/             start here: the loop, plus a router to every other skill
    plan-first/ verify-ladder/ fan-out/          how agents work
    api-hardening/ mcp-tools/                    the client is untrusted; tools, not access
    decision-log/ lessons-learned/               team memory: why, and what went wrong
    ui-shell/ entra-auth/ azure-sql-mi/ deploy-azure/   the upgrade stages
  instructions/                   path rules for api routes, auth, web, mcp, workflows, tests
  workflows/verify.yml            required "ladder" check, read-only token
  rulesets/main-protection.json   applied with scripts/apply-ruleset.sh
  CODEOWNERS, pull_request_template.md, ISSUE_TEMPLATE/agent-task.yml
.vscode/mcp.json                  GitHub MCP server + this app's MCP server
scripts/                          verify.sh, setup.sh, apply-ruleset.sh, reset-demo.sh
demo/issues/                      issues 1 to 6 for the class modules, 7 to 10 for the finale upgrades
demo/workflows/                   broken and fixed token-permission examples
docs/decisions/                   decision records 0001 to 0007
docs/                             TRAINER-GUIDE.md, AZURE-PHASE-2.md
```

## Team memory

Agents forget between sessions. The repo does not.

- **Decisions** (`docs/decisions/`): seven records explain the shape of the system (data
  behind one interface, demo identity never in production, one verify script, MCP calls
  the API, build id not health check, roles from the database, no stored secrets). Agents
  read them before planning and must quote one if a request contradicts it.
- **Lessons** (`.github/skills/lessons-learned/LESSONS.md`): symptom, cause, fix, prevent.
  Agents search it before guessing, and add a row when they fix something non-obvious.
  A human approves every new lesson.

## The upgrade path (finale)

The class runs on the local version. The same repo upgrades in four stages, each a
seeded issue with its own skill, done by an agent under the same loop and gates:

| Issue | Stage | Skill |
|---|---|---|
| #7 | App shell and design rules | `ui-shell` |
| #8 | Entra ID sign-in behind `AUTH_MODE` | `entra-auth` |
| #9 | Azure SQL with managed identity behind `DATA_BACKEND` | `azure-sql-mi` |
| #10 | App Service deploy with OIDC and a deployed check | `deploy-azure` |

See `docs/AZURE-PHASE-2.md`.

## Adapt it to your stack

Keep the loop, the skills, the agents, the workflow and the ruleset. Change only the
commands in `scripts/verify.sh`, the globs in `.github/instructions/`, and the examples in
the skills. Everything else calls `scripts/verify.sh`, so it carries over unchanged.

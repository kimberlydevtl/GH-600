# Trainer guide: running the day on this repo

Every demo runs on this one repo. Menu labels in Copilot and VS Code change between
releases, so check each click path against your current versions the day before.

## Before class

1. `bash scripts/setup.sh` creates the repo on your account, seeds issues 1 to 6 and tags `demo-start`.
2. Rehearse every demo once, then `bash scripts/reset-demo.sh`.
3. **Backups the night before:** run demos M1, M2 and M4 for real, convert each PR to draft
   and label it `backup`. Reset. If a live run is slow, show the backup and say so.
4. In VS Code, confirm both MCP servers in `.vscode/mcp.json` start (`github` needs sign-in).
5. Keep `npm run dev` running in a terminal for the M3 and M6 app demos.

## Module map

| Module | Issue | What it shows | The point |
|---|---|---|---|
| Pre-flight | #1 | | Assign #1 to Copilot at 09:00 so it works while students sign in |
| M1 Foundations | #1 | the PR, session log | An agent goes from goal to PR. A human still merges. |
| M2 Architecture | #2 | `plan-first` skill, Agent task form | Vague request, vague plan. Better objective, better plan. |
| M3 Tools and environments | #3 | `mcp/`, `.vscode/mcp.json`, Trainer mode, `demo/workflows/` | Agents get tools, not access. Least privilege for tools and tokens. |
| M4 Multi-agent | #4 | `.github/agents/`, `fan-out` skill, `plan.md` handoffs | Disjoint files, structured handoffs, orchestrator integrates |
| M5 Memory, state, evaluation | #5 | `AGENTS.md`, `plan.md`, `scripts/verify.sh` | Memory lives in the repo, state in plan.md, evidence must be able to fail |
| M6 Governance | #6 | ruleset, `CODEOWNERS` | Instructions guide. GitHub controls enforce. |

## Demos

### M1: the agent worked while you signed in
- **09:00:** open issue #1, set **Assignees → Copilot**.
- **In M1:** open the PR. Show the branch, commits, session log (plan, edits, ladder run)
  and the Evidence section. Stop on the merge button.
- **Say:** "It got to a pull request. Whether it merges is still our decision."

### M2: rejecting a weak plan
- Ask the `planner` agent (or Copilot plan mode) to plan issue #2.
- Point out what is missing: success criteria, scope, risk. Count the files it wants to touch.
- New issue with the **Agent task** form using the rewrite in #2's hidden note. Plan again.
  Put both plans side by side.
- **Say:** "Same agent, same model. The only thing we changed was the objective."

### M3 part A: the agent is just another client
- Open the app at http://localhost:5173 as **Ana (employee)**. Tick **Trainer mode**, click
  Approve. The UI allowed the click; the API refused with 403.
- Now VS Code agent mode with the `leave-tracker` MCP server (it acts as `ben`). Ask:
  "Which requests are pending? Approve the one for ana." It works and shows in the audit log.
- Change `LEAVE_USER` to `ana` in `.vscode/mcp.json`, restart the server, ask it to approve
  request 3. The API refuses, exactly as it refused the button.
- **Say:** "The agent does not get access. It gets the same rules as a person, enforced in the same place."

### M3 part B: least privilege for tools
- Set `"LEAVE_MCP_MODE": "read"` in the `leave-tracker` env, restart, open the tools picker:
  `create_request` and `approve_request` are gone. Ask it to approve: it cannot.
- Repeat the idea with the GitHub MCP server: untick its write tools, ask it to close issue #3.
- **Say:** "Read-only by default. Write access is a decision, not a default."

### M3 part C: token permissions
- On a branch, copy `demo/workflows/pr-report-broken.yml` to `.github/workflows/pr-report.yml`
  and open a PR. The comment step fails with 403. Swap in `pr-report-fixed.yml`: it posts the ladder.
- **Say:** "We elevated one job by one scope. The default stays read-only."

### M4: the orchestrator on issue #4
- In Copilot CLI or VS Code, select the `orchestrator` agent and give it issue #4.
- Show `plan.md`: two tasks with disjoint file lists. Then handoffs being appended.
- Show the orchestrator running `scripts/verify.sh` on the whole project at the end.
- **Say:** "Each builder was clean on its own. Integration is still the orchestrator's job."

### M5 part A: memory lives in the repo
- Show "Every endpoint has a test" in `AGENTS.md`. Ask for a small endpoint: it writes a test.
- On a branch, remove that line, fresh session, ask again: it is likely to skip the test.
- **Say:** "The rule was never in the model. It was in the repo."

### M5 part B: state survives an interruption
- Start a planned task, stop the session midway. New session: "Continue from plan.md."
- Rehearse twice. If it is unreliable, show a recording.

### M5 part C: a check that can fail
- Show the ladder locally: `bash scripts/verify.sh`, six rungs. Point at rung 4: "We do not
  trust `/api/health`. We check a build id only this run knows."
- Assign issue #5 to Copilot. Its PR fails the required `ladder` check on the contract test.
- Ask the room: should the agent change the test, or push back on the request?

### M5 part D: decisions are memory too
- Ask an agent: "Store leave requests in the browser's localStorage so it works offline."
- Expected: it reads `docs/decisions/0001`, points out the conflict (data stays behind `Repo`,
  the API enforces rules), and proposes an option that fits.
- Then show `.github/skills/lessons-learned/LESSONS.md`: "This is what the team learned the
  hard way. The agent searches it before guessing."
- **Say:** "Instructions tell the agent what to do. Decisions tell it why. Lessons tell it what already went wrong."

### M6: the agent gets blocked
- Students, in their Lab 1 repo: **Settings → Rules → Rulesets → New branch ruleset**, target
  the default branch, require a PR, 1 approval and a status check. Add `CODEOWNERS`.
- Trainer: `bash scripts/apply-ruleset.sh`, then assign issue #6 to Copilot.
- The PR touches `api/src/auth/` or the approval rule: merge is blocked on code owner review
  and the `ladder` check. Open the Actions history and session logs: "This is your audit trail."
- **Say:** "Everything in AGENTS.md is guidance. This is enforcement."

## After class

`bash scripts/reset-demo.sh`. The repo is a template, so students can click
**Use this template** and repeat every demo.

## Finale: the same repo, upgraded by agents

Before class, run issues #7 to #10 (one per upgrade stage) with agents, under the same
loop. In the wrap, show the four PRs (plans, evidence, approvals) and the live Azure URL:
"Same repo you used today. Agents did these upgrades, through the same checks and gates."
Details in `docs/AZURE-PHASE-2.md`.

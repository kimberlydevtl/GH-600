---
applyTo: "mcp/src/**"
---
# MCP server (agent tools)

- Tools call the API over HTTP. Never import from `api/` or touch data directly, so the
  API's authorisation applies to agents exactly as it does to people.
- Every new write tool must be registered only when `LEAVE_MCP_MODE` is not `read`.
- Describe each tool so an agent knows when NOT to use it (who may call it, what it changes).
- Validate tool inputs with zod. Return API errors as errors, do not hide them.
- Rung 5 of the ladder checks tool discovery and that read mode exposes no write tools.
  If you add a write tool, update `mcp/src/smoke.ts` expectations if needed.
- Full procedure: the `mcp-tools` skill.

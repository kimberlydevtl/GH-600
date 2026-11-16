---
name: mcp-tools
description: Use when adding or changing a tool in the MCP server, or deciding what an agent should be allowed to do through MCP.
---
# MCP tools: give agents tools, not access

The MCP server is just another client of the API. That one design choice gives you
least privilege for free: an agent acting as `ana` cannot approve leave, because the API
refuses `ana`, whoever is asking.

## Rules

1. **Tools call the API, never the data.** No imports from `api/`, no direct storage access.
2. **Separate read from write.** Read tools are always registered. Write tools are
   registered only when `LEAVE_MCP_MODE` is not `read`. Start agents in read mode and grant
   write mode deliberately.
3. **Run as a scoped identity.** `LEAVE_USER` sets who the agent acts as. Use the lowest
   role that can do the job.
4. **Describe limits in the tool description.** Say who may call it and what it changes,
   so the agent can decide not to call it.
5. **Validate inputs** with zod and surface API errors unchanged.

## Adding a tool

```ts
server.tool(
  'reject_request',
  'Reject a pending leave request. Managers (own team) and admins only. The API enforces this.',
  { id: z.number().int().positive() },
  async ({ id }) => text(await call(`/api/leave/${id}/reject`, { method: 'POST' }))
);
```

Put it inside the `if (!READ_ONLY)` block. Then add the matching API route with tests
(`api-hardening`), and run the ladder: rung 5 must still show no write tools in read mode.

## Try it

`.vscode/mcp.json` registers this server for VS Code agent mode. Start the API
(`npm run dev -w api`), start the `leave-tracker` server in VS Code, then ask:
"Which leave requests are pending?"

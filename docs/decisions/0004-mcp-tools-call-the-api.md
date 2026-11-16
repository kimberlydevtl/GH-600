# 0004: MCP tools call the API, never the data

Status: Accepted
Date: 2026-11-16

## Context
Agents use the app through MCP tools. If tools read or write data directly, every
authorisation rule in the API would need to be re-implemented, and kept in sync, in the
tool layer.

## Decision
The MCP server is a client of the API, like the web app. Tools call HTTP endpoints as a
scoped identity (`LEAVE_USER`). Write tools are registered only outside read mode
(`LEAVE_MCP_MODE=read` exposes read tools only).

## Alternatives rejected
- Tools with direct data access: faster, but bypasses every server-side rule.
- One all-powerful tool identity: convenient, but any agent becomes an admin.

## Consequences
- Good: an agent acting as an employee is refused exactly as a human employee is. Rules
  live in one place.
- Cost: every new tool needs an API endpoint first.

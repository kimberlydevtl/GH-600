import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// An MCP server for the leave tracker. Agents get tools, not database access.
// Every tool calls the API, so the API's server-side rules apply to agents too:
// an agent acting as an employee cannot approve, exactly like a human employee.
//
// Least privilege: set LEAVE_MCP_MODE=read to expose only the read tools.

const API = process.env.LEAVE_API_URL ?? 'http://localhost:3001';
const USER = process.env.LEAVE_USER ?? 'ben';
const READ_ONLY = (process.env.LEAVE_MCP_MODE ?? 'write') === 'read';

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(API + path, { ...init, headers: { 'content-type': 'application/json', 'x-user': USER } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`API ${res.status}: ${body.error ?? res.statusText}`);
  return body;
}

const text = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });

const server = new McpServer({ name: 'leave-tracker', version: '1.0.0' });

server.tool('whoami', 'Show which user and role this MCP server acts as.', {}, async () => text(await call('/api/me')));

server.tool(
  'list_requests',
  'List leave requests visible to the current user. Optionally filter by status.',
  { status: z.enum(['pending', 'approved', 'rejected']).optional() },
  async ({ status }) => {
    const { items } = await call('/api/leave');
    return text(status ? items.filter((i: { status: string }) => i.status === status) : items);
  }
);

if (!READ_ONLY) {
  server.tool(
    'create_request',
    'Create a leave request for the current user. Dates are YYYY-MM-DD.',
    { start: z.string(), end: z.string(), reason: z.string().max(200) },
    async (input) => text(await call('/api/leave', { method: 'POST', body: JSON.stringify(input) }))
  );

  server.tool(
    'approve_request',
    'Approve a pending leave request. Only managers (for their team) and admins may approve. The API enforces this.',
    { id: z.number().int().positive() },
    async ({ id }) => text(await call(`/api/leave/${id}/approve`, { method: 'POST' }))
  );
}

await server.connect(new StdioServerTransport());

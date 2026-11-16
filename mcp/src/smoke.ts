// Verification rung: start the MCP server like an agent would, discover its tools,
// and call one. Proves tool discovery AND the API path, not just that the file compiles.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const mode = process.argv[2] ?? 'write';

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['--import', 'tsx', path.join(here, 'server.ts')],
  env: { ...process.env, LEAVE_MCP_MODE: mode } as Record<string, string>
});
const client = new Client({ name: 'smoke', version: '1.0.0' });
await client.connect(transport);

const tools = (await client.listTools()).tools.map((t) => t.name).sort();
const result = await client.callTool({ name: 'list_requests', arguments: { status: 'pending' } });
const content = result.content as Array<{ type: string; text: string }>;
const items = JSON.parse(content[0].text);
console.log(JSON.stringify({ mode, tools, pendingVisible: items.length }));
await client.close();

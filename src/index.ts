#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadConfig } from "./config.js";
import { handleTool } from "./handlers.js";
import { tools } from "./tools.js";

const config = loadConfig();
const server = new Server(
  { name: "rozetka-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...tools] }));
server.setRequestHandler(CallToolRequestSchema, async (request) => handleTool(config, request.params.name, request.params.arguments));

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
  console.error("rozetka-mcp running on stdio");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

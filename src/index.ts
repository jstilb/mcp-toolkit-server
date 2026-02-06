/**
 * MCP Toolkit Server - entry point.
 *
 * Starts the MCP server using stdio transport.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const server = createServer(config);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`MCP Toolkit Server v${config.version} running in ${config.mode} mode`);
}

main().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});

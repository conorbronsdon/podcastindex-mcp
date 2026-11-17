import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ToolHandlers, TOOLS } from "./tool-handlers.js";

export function createServer(toolHandlers: ToolHandlers): Server {
  const server = new Server(
    {
      name: "podcastindex-mcp",
      version: "0.3.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return toolHandlers.handleToolCall(
      request.params.name,
      request.params.arguments ?? {}
    );
  });

  return server;
}

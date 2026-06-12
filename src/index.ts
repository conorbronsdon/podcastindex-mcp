#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PodcastIndexApiClient } from "./api-client.js";
import { ToolHandlers, TOOLS } from "./tool-handlers.js";

const API_KEY = process.env.PODCASTINDEX_API_KEY ?? "";
const API_SECRET = process.env.PODCASTINDEX_API_SECRET ?? "";

if (!API_KEY || !API_SECRET) {
  console.error(
    "Warning: PODCASTINDEX_API_KEY and/or PODCASTINDEX_API_SECRET are not set. " +
      "The server will start, but tool calls will fail until both are configured."
  );
  console.error(
    "Get free API credentials at https://api.podcastindex.org/. See README.md."
  );
}

class PodcastIndexServer {
  private server: Server;
  private toolHandlers: ToolHandlers;

  constructor() {
    this.server = new Server(
      {
        name: "podcastindex-mcp",
        version: "0.2.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    const apiClient = new PodcastIndexApiClient(API_KEY, API_SECRET);
    this.toolHandlers = new ToolHandlers(
      apiClient,
      Boolean(API_KEY && API_SECRET)
    );
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return this.toolHandlers.handleToolCall(
        request.params.name,
        request.params.arguments ?? {}
      );
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new PodcastIndexServer();
server.run().catch(console.error);

process.on("SIGINT", () => {
  process.exit(0);
});

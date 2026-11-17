#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PodcastIndexApiClient } from "./api-client.js";
import { createServer } from "./server.js";
import { ToolHandlers } from "./tool-handlers.js";

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

const toolHandlers = new ToolHandlers(
  new PodcastIndexApiClient(API_KEY, API_SECRET),
  Boolean(API_KEY && API_SECRET)
);
createServer(toolHandlers)
  .connect(new StdioServerTransport())
  .catch(console.error);

process.on("SIGINT", () => {
  process.exit(0);
});

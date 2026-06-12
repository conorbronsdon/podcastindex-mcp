import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { PodcastIndexApiClient } from "./api-client.js";
import {
  isSearchByPersonArgs,
  isSearchByTermArgs,
  isPodcastByFeedUrlArgs,
  isPodcastByFeedIdArgs,
  isTrendingPodcastsArgs,
  isEpisodesByFeedIdArgs,
  isRecentEpisodesArgs,
  isCategoriesListArgs,
} from "./types.js";

/**
 * Every tool in this server is a read-only lookup against the Podcast Index
 * API — nothing mutates external state. Each TOOLS entry declares
 * `annotations: READ_ONLY` so MCP clients can reason about side effects
 * (and skip write-consent prompts); the completeness test in
 * __tests__/tool-handlers.test.ts enforces that every tool carries it.
 * If a write tool is ever added, switch to per-tool classification (see
 * gws-mcp-server's buildAnnotations pattern) instead of weakening this.
 */
const READ_ONLY = { readOnlyHint: true } as const;

export const TOOLS = [
  {
    name: "search_by_person",
    description:
      "Search for podcast episodes where a specific person appeared as host or guest. Returns episodes across all indexed podcasts — useful for tracking appearances beyond your own show.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        q: {
          type: "string",
          description: 'Person name to search for (e.g. "Conor Bronsdon")',
        },
        max: {
          type: "number",
          description: "Maximum results to return (default 10)",
          minimum: 1,
          maximum: 100,
        },
        fulltext: {
          type: "boolean",
          description: "Return full text descriptions (default false)",
        },
      },
      required: ["q"],
    },
  },
  {
    name: "search_by_term",
    description:
      "Full-text search across all podcasts in the index. Search by topic, show name, or keyword to find relevant podcasts.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        q: {
          type: "string",
          description: "Search term",
        },
        max: {
          type: "number",
          description: "Maximum results to return (default 10)",
          minimum: 1,
          maximum: 100,
        },
        clean: {
          type: "boolean",
          description: "Exclude explicit content (default false)",
        },
        fulltext: {
          type: "boolean",
          description: "Return full text descriptions (default false)",
        },
      },
      required: ["q"],
    },
  },
  {
    name: "podcast_by_feed_url",
    description:
      "Look up a podcast by its RSS feed URL. Returns feed ID, iTunes ID, categories, last update time, and feed health. Useful for checking if your podcast is properly indexed.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "RSS feed URL",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "podcast_by_feed_id",
    description:
      "Look up a podcast by its Podcast Index feed ID. Returns full metadata including categories, language, and feed health.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "number",
          description: "Podcast Index feed ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "trending_podcasts",
    description:
      "Get trending podcasts with optional filters for language and category. Useful for competitive intelligence and content planning.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        max: {
          type: "number",
          description: "Maximum results (default 10)",
          minimum: 1,
          maximum: 100,
        },
        lang: {
          type: "string",
          description: 'Language code filter (e.g. "en")',
        },
        cat: {
          type: "string",
          description:
            'Category filter — name or ID (e.g. "Technology", "102")',
        },
        since: {
          type: "number",
          description:
            "Only return podcasts trending since this Unix timestamp",
        },
      },
    },
  },
  {
    name: "episodes_by_feed_id",
    description:
      "Get episodes for a specific podcast by its Podcast Index feed ID. Use podcast_by_feed_url first to get the feed ID.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "number",
          description: "Podcast Index feed ID",
        },
        max: {
          type: "number",
          description: "Maximum episodes to return (default 10)",
          minimum: 1,
          maximum: 100,
        },
        since: {
          type: "number",
          description: "Only return episodes published since this Unix timestamp",
        },
        fulltext: {
          type: "boolean",
          description: "Return full text descriptions (default false)",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "recent_episodes",
    description:
      "Get the most recent episodes across the entire Podcast Index. Useful for seeing what is being published right now in the ecosystem.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        max: {
          type: "number",
          description: "Maximum results (default 10)",
          minimum: 1,
          maximum: 100,
        },
        excludeString: {
          type: "string",
          description: "Exclude episodes containing this string in title",
        },
        before: {
          type: "number",
          description: "Only return episodes before this episode ID",
        },
        fulltext: {
          type: "boolean",
          description: "Return full text descriptions (default false)",
        },
      },
    },
  },
  {
    name: "categories_list",
    description: "Get the full list of Podcast Index categories and their IDs.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

export class ToolHandlers {
  private apiClient: PodcastIndexApiClient;

  constructor(apiClient: PodcastIndexApiClient) {
    this.apiClient = apiClient;
  }

  async handleToolCall(name: string, args: unknown) {
    try {
      switch (name) {
        case "search_by_person": {
          if (!isSearchByPersonArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments: requires 'q' (string)");
          }
          const data = await this.apiClient.searchByPerson(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "search_by_term": {
          if (!isSearchByTermArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments: requires 'q' (string)");
          }
          const data = await this.apiClient.searchByTerm(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "podcast_by_feed_url": {
          if (!isPodcastByFeedUrlArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments: requires 'url' (string)");
          }
          const data = await this.apiClient.podcastByFeedUrl(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "podcast_by_feed_id": {
          if (!isPodcastByFeedIdArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments: requires 'id' (number)");
          }
          const data = await this.apiClient.podcastByFeedId(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "trending_podcasts": {
          if (!isTrendingPodcastsArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments");
          }
          const data = await this.apiClient.trendingPodcasts(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "episodes_by_feed_id": {
          if (!isEpisodesByFeedIdArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments: requires 'id' (number)");
          }
          const data = await this.apiClient.episodesByFeedId(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "recent_episodes": {
          if (!isRecentEpisodesArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments");
          }
          const data = await this.apiClient.recentEpisodes(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "categories_list": {
          if (!isCategoriesListArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments");
          }
          const data = await this.apiClient.categoriesList();
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error) {
      if (error instanceof McpError) throw error;
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.description || error.message;
        return {
          content: [{ type: "text" as const, text: `API error (${status}): ${message}` }],
          isError: true,
        };
      }
      throw error;
    }
  }
}

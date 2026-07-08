import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { PodcastIndexApiClient } from "./api-client.js";
import { PodcastIndexError } from "./errors.js";
import {
  isSearchByPersonArgs,
  isSearchByTermArgs,
  isPodcastByFeedUrlArgs,
  isPodcastByFeedIdArgs,
  isTrendingPodcastsArgs,
  isEpisodesByFeedIdArgs,
  isRecentEpisodesArgs,
  isCategoriesListArgs,
  isSearchByTitleArgs,
  isEpisodeByIdArgs,
  isEpisodesLiveArgs,
  isPodcastByItunesIdArgs,
  isPodcastByGuidArgs,
  isValueByFeedIdArgs,
  isValueByFeedUrlArgs,
  isRecentFeedsArgs,
  isRecentNewFeedsArgs,
  isStatsCurrentArgs,
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
  {
    name: "search_by_title",
    description:
      "Search for podcasts by title. Narrower than search_by_term, which also matches descriptions and other feed metadata — use this when you already know (or are guessing at) the show name.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        q: {
          type: "string",
          description: 'Podcast title to search for (e.g. "Chain of Thought")',
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
    name: "episode_by_id",
    description:
      "Look up a single episode by its Podcast Index episode ID. Returns full episode metadata including enclosure URL, duration, and transcript links where available.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "number",
          description: "Podcast Index episode ID",
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
    name: "episodes_live",
    description:
      "Get episodes that are currently live (actively streaming right now) across the Podcast Index. Useful for finding live shows in progress.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        max: {
          type: "number",
          description: "Maximum results to return (default 10)",
          minimum: 1,
          maximum: 100,
        },
      },
    },
  },
  {
    name: "podcast_by_itunes_id",
    description:
      "Look up a podcast by its Apple Podcasts (iTunes) ID. Returns full Podcast Index feed metadata.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "number",
          description: "Apple Podcasts (iTunes) feed ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "podcast_by_guid",
    description:
      "Look up a podcast by its podcast:guid tag value — the globally unique identifier defined in the Podcast Namespace spec. Use this when you have the GUID rather than a feed URL or ID.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        guid: {
          type: "string",
          description: "The podcast:guid value from the feed",
        },
      },
      required: ["guid"],
    },
  },
  {
    name: "value_by_feed_id",
    description:
      "Get the value4value (lightning payment / streaming sats) information for a podcast by its Podcast Index feed ID, if the feed publishes a podcast:value block.",
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
    name: "value_by_feed_url",
    description:
      "Get the value4value (lightning payment / streaming sats) information for a podcast by its RSS feed URL, if the feed publishes a podcast:value block.",
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
    name: "recent_feeds",
    description:
      "Get the most recently updated podcast feeds across the entire Podcast Index, with optional language and category filters. Useful for spotting fresh activity in the ecosystem.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        max: {
          type: "number",
          description: "Maximum results to return (default 40)",
          minimum: 1,
          maximum: 100,
        },
        since: {
          type: "number",
          description: "Only return feeds updated since this Unix timestamp",
        },
        lang: {
          type: "string",
          description: 'Language code filter (e.g. "en")',
        },
        cat: {
          type: "string",
          description: "Only include feeds with these categories (comma-separated names or IDs)",
        },
        notcat: {
          type: "string",
          description: "Exclude feeds with these categories (comma-separated names or IDs)",
        },
      },
    },
  },
  {
    name: "recent_new_feeds",
    description:
      "Get podcast feeds newly added to the Podcast Index, in the order they were added. Useful for discovering brand-new shows before they show up in other searches.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {
        max: {
          type: "number",
          description: "Maximum results to return (default 40)",
          minimum: 1,
          maximum: 100,
        },
        since: {
          type: "number",
          description: "Only return feeds added since this Unix timestamp",
        },
        feedid: {
          type: "string",
          description: "Podcast Index feed ID to start from (ignored if since is also set)",
        },
        desc: {
          type: "boolean",
          description: "Return feeds in descending order (default false, only applies with feedid)",
        },
      },
    },
  },
  {
    name: "stats_current",
    description:
      "Get current aggregate statistics for the entire Podcast Index (total feeds, episodes, and related counts).",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

export const MISSING_CREDENTIALS_MESSAGE =
  "PODCASTINDEX_API_KEY and PODCASTINDEX_API_SECRET environment variables are required. " +
  "Get free API credentials at https://api.podcastindex.org/, set both variables, and restart the server.";

export class ToolHandlers {
  private apiClient: PodcastIndexApiClient;
  private hasCredentials: boolean;

  constructor(apiClient: PodcastIndexApiClient, hasCredentials = true) {
    this.apiClient = apiClient;
    this.hasCredentials = hasCredentials;
  }

  async handleToolCall(name: string, args: unknown) {
    if (!this.hasCredentials) {
      throw new McpError(ErrorCode.InvalidRequest, MISSING_CREDENTIALS_MESSAGE);
    }
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

        case "search_by_title": {
          if (!isSearchByTitleArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments: requires 'q' (string)");
          }
          const data = await this.apiClient.searchByTitle(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "episode_by_id": {
          if (!isEpisodeByIdArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments: requires 'id' (number)");
          }
          const data = await this.apiClient.episodeById(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "episodes_live": {
          if (!isEpisodesLiveArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments");
          }
          const data = await this.apiClient.episodesLive(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "podcast_by_itunes_id": {
          if (!isPodcastByItunesIdArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments: requires 'id' (number)");
          }
          const data = await this.apiClient.podcastByItunesId(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "podcast_by_guid": {
          if (!isPodcastByGuidArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments: requires 'guid' (string)");
          }
          const data = await this.apiClient.podcastByGuid(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "value_by_feed_id": {
          if (!isValueByFeedIdArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments: requires 'id' (number)");
          }
          const data = await this.apiClient.valueByFeedId(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "value_by_feed_url": {
          if (!isValueByFeedUrlArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments: requires 'url' (string)");
          }
          const data = await this.apiClient.valueByFeedUrl(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "recent_feeds": {
          if (!isRecentFeedsArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments");
          }
          const data = await this.apiClient.recentFeeds(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "recent_new_feeds": {
          if (!isRecentNewFeedsArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments");
          }
          const data = await this.apiClient.recentNewFeeds(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        case "stats_current": {
          if (!isStatsCurrentArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments");
          }
          const data = await this.apiClient.statsCurrent();
          return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error) {
      if (error instanceof McpError) throw error;
      // Typed errors (see ./errors.ts) are thrown by PodcastIndexApiClient
      // with a fully-formatted, status-specific message already baked in.
      if (error instanceof PodcastIndexError) {
        return {
          content: [{ type: "text" as const, text: error.message }],
          isError: true,
        };
      }
      // Fallback for a raw axios error that reaches this layer without
      // going through PodcastIndexApiClient's mapping (kept for backward
      // compatibility with the original isError response shape).
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

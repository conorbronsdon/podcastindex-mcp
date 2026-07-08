import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import {
  ToolHandlers,
  TOOLS,
  MISSING_CREDENTIALS_MESSAGE,
} from "../tool-handlers.js";
import { PodcastIndexApiClient } from "../api-client.js";
import { AuthenticationError, RateLimitError, ServerError } from "../errors.js";

// Create a mock API client
const mockApiClient = {
  searchByPerson: vi.fn().mockResolvedValue({ items: [] }),
  searchByTerm: vi.fn().mockResolvedValue({ feeds: [] }),
  podcastByFeedUrl: vi.fn().mockResolvedValue({ feed: {} }),
  podcastByFeedId: vi.fn().mockResolvedValue({ feed: {} }),
  trendingPodcasts: vi.fn().mockResolvedValue({ feeds: [] }),
  episodesByFeedId: vi.fn().mockResolvedValue({ items: [] }),
  recentEpisodes: vi.fn().mockResolvedValue({ items: [] }),
  categoriesList: vi.fn().mockResolvedValue({ feeds: [] }),
  searchByTitle: vi.fn().mockResolvedValue({ feeds: [] }),
  episodeById: vi.fn().mockResolvedValue({ episode: {} }),
  episodesLive: vi.fn().mockResolvedValue({ items: [] }),
  podcastByItunesId: vi.fn().mockResolvedValue({ feed: {} }),
  podcastByGuid: vi.fn().mockResolvedValue({ feed: {} }),
  valueByFeedId: vi.fn().mockResolvedValue({ value: {} }),
  valueByFeedUrl: vi.fn().mockResolvedValue({ value: {} }),
  recentFeeds: vi.fn().mockResolvedValue({ feeds: [] }),
  recentNewFeeds: vi.fn().mockResolvedValue({ feeds: [] }),
  statsCurrent: vi.fn().mockResolvedValue({ stats: {} }),
};

let handlers: ToolHandlers;

beforeEach(() => {
  vi.clearAllMocks();
  handlers = new ToolHandlers(mockApiClient as unknown as PodcastIndexApiClient);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("missing credentials (lazy auth)", () => {
  it("fails per-tool-call with a clear McpError when credentials are absent", async () => {
    const keyless = new ToolHandlers(
      mockApiClient as unknown as PodcastIndexApiClient,
      false
    );
    await expect(
      keyless.handleToolCall("search_by_term", { q: "ai" })
    ).rejects.toMatchObject({
      code: ErrorCode.InvalidRequest,
      message: expect.stringContaining(MISSING_CREDENTIALS_MESSAGE),
    });
    expect(mockApiClient.searchByTerm).not.toHaveBeenCalled();
  });

  it("defaults to credentialed behavior when flag is omitted", async () => {
    const result = await handlers.handleToolCall("search_by_term", { q: "ai" });
    expect(result.isError).toBeUndefined();
    expect(mockApiClient.searchByTerm).toHaveBeenCalled();
  });
});

describe("TOOLS", () => {
  it("exports 18 tools", () => {
    expect(TOOLS).toHaveLength(18);
  });

  it("each tool has name, description, and inputSchema", () => {
    for (const tool of TOOLS) {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("has unique tool names", () => {
    const names = TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  // ── Tool annotations (issue #2) ──────────────────────────────────────
  // This server is 100% read-only: every tool is a lookup against the
  // Podcast Index API. The completeness check below means a new tool
  // cannot ship without an explicit readOnlyHint — if a write tool is
  // ever added, this test must be replaced with per-tool classification.
  it("completeness: every tool declares annotations with readOnlyHint:true", () => {
    expect(TOOLS.length).toBeGreaterThan(0);
    for (const tool of TOOLS) {
      expect(tool.annotations, `${tool.name} must declare annotations`).toBeDefined();
      expect(
        tool.annotations.readOnlyHint,
        `${tool.name} should be readOnlyHint:true (read-only server)`,
      ).toBe(true);
    }
  });

  it("no tool carries a destructive or non-read-only hint", () => {
    for (const tool of TOOLS) {
      expect(tool.annotations).toEqual({ readOnlyHint: true });
    }
  });
});

describe("ToolHandlers.handleToolCall", () => {
  describe("search_by_person", () => {
    it("returns JSON content on success", async () => {
      const result = await handlers.handleToolCall("search_by_person", { q: "test" });
      expect(result.content[0].type).toBe("text");
      expect(mockApiClient.searchByPerson).toHaveBeenCalledWith({ q: "test" });
    });

    it("throws McpError on invalid args", async () => {
      await expect(handlers.handleToolCall("search_by_person", {})).rejects.toThrow(McpError);
    });
  });

  describe("search_by_term", () => {
    it("calls apiClient.searchByTerm", async () => {
      await handlers.handleToolCall("search_by_term", { q: "AI" });
      expect(mockApiClient.searchByTerm).toHaveBeenCalledWith({ q: "AI" });
    });

    it("throws on missing q", async () => {
      await expect(handlers.handleToolCall("search_by_term", {})).rejects.toThrow(McpError);
    });
  });

  describe("podcast_by_feed_url", () => {
    it("calls apiClient.podcastByFeedUrl", async () => {
      await handlers.handleToolCall("podcast_by_feed_url", { url: "https://example.com/feed" });
      expect(mockApiClient.podcastByFeedUrl).toHaveBeenCalledWith({ url: "https://example.com/feed" });
    });

    it("throws on missing url", async () => {
      await expect(handlers.handleToolCall("podcast_by_feed_url", {})).rejects.toThrow(McpError);
    });
  });

  describe("podcast_by_feed_id", () => {
    it("calls apiClient.podcastByFeedId", async () => {
      await handlers.handleToolCall("podcast_by_feed_id", { id: 123 });
      expect(mockApiClient.podcastByFeedId).toHaveBeenCalledWith({ id: 123 });
    });

    it("throws on string id", async () => {
      await expect(handlers.handleToolCall("podcast_by_feed_id", { id: "123" })).rejects.toThrow(McpError);
    });
  });

  describe("trending_podcasts", () => {
    it("calls apiClient.trendingPodcasts", async () => {
      await handlers.handleToolCall("trending_podcasts", {});
      expect(mockApiClient.trendingPodcasts).toHaveBeenCalledWith({});
    });
  });

  describe("episodes_by_feed_id", () => {
    it("calls apiClient.episodesByFeedId", async () => {
      await handlers.handleToolCall("episodes_by_feed_id", { id: 100 });
      expect(mockApiClient.episodesByFeedId).toHaveBeenCalledWith({ id: 100 });
    });

    it("throws on missing id", async () => {
      await expect(handlers.handleToolCall("episodes_by_feed_id", {})).rejects.toThrow(McpError);
    });
  });

  describe("recent_episodes", () => {
    it("calls apiClient.recentEpisodes", async () => {
      await handlers.handleToolCall("recent_episodes", {});
      expect(mockApiClient.recentEpisodes).toHaveBeenCalledWith({});
    });
  });

  describe("categories_list", () => {
    it("calls apiClient.categoriesList", async () => {
      await handlers.handleToolCall("categories_list", {});
      expect(mockApiClient.categoriesList).toHaveBeenCalled();
    });
  });

  describe("search_by_title", () => {
    it("calls apiClient.searchByTitle", async () => {
      await handlers.handleToolCall("search_by_title", { q: "Chain of Thought" });
      expect(mockApiClient.searchByTitle).toHaveBeenCalledWith({ q: "Chain of Thought" });
    });

    it("throws on missing q", async () => {
      await expect(handlers.handleToolCall("search_by_title", {})).rejects.toThrow(McpError);
    });
  });

  describe("episode_by_id", () => {
    it("calls apiClient.episodeById", async () => {
      await handlers.handleToolCall("episode_by_id", { id: 999 });
      expect(mockApiClient.episodeById).toHaveBeenCalledWith({ id: 999 });
    });

    it("throws on missing id", async () => {
      await expect(handlers.handleToolCall("episode_by_id", {})).rejects.toThrow(McpError);
    });

    it("throws on string id", async () => {
      await expect(handlers.handleToolCall("episode_by_id", { id: "999" })).rejects.toThrow(McpError);
    });
  });

  describe("episodes_live", () => {
    it("calls apiClient.episodesLive", async () => {
      await handlers.handleToolCall("episodes_live", {});
      expect(mockApiClient.episodesLive).toHaveBeenCalledWith({});
    });
  });

  describe("podcast_by_itunes_id", () => {
    it("calls apiClient.podcastByItunesId", async () => {
      await handlers.handleToolCall("podcast_by_itunes_id", { id: 123456 });
      expect(mockApiClient.podcastByItunesId).toHaveBeenCalledWith({ id: 123456 });
    });

    it("throws on missing id", async () => {
      await expect(handlers.handleToolCall("podcast_by_itunes_id", {})).rejects.toThrow(McpError);
    });
  });

  describe("podcast_by_guid", () => {
    it("calls apiClient.podcastByGuid", async () => {
      await handlers.handleToolCall("podcast_by_guid", { guid: "abc-123" });
      expect(mockApiClient.podcastByGuid).toHaveBeenCalledWith({ guid: "abc-123" });
    });

    it("throws on missing guid", async () => {
      await expect(handlers.handleToolCall("podcast_by_guid", {})).rejects.toThrow(McpError);
    });
  });

  describe("value_by_feed_id", () => {
    it("calls apiClient.valueByFeedId", async () => {
      await handlers.handleToolCall("value_by_feed_id", { id: 100 });
      expect(mockApiClient.valueByFeedId).toHaveBeenCalledWith({ id: 100 });
    });

    it("throws on missing id", async () => {
      await expect(handlers.handleToolCall("value_by_feed_id", {})).rejects.toThrow(McpError);
    });
  });

  describe("value_by_feed_url", () => {
    it("calls apiClient.valueByFeedUrl", async () => {
      await handlers.handleToolCall("value_by_feed_url", { url: "https://example.com/feed.xml" });
      expect(mockApiClient.valueByFeedUrl).toHaveBeenCalledWith({ url: "https://example.com/feed.xml" });
    });

    it("throws on missing url", async () => {
      await expect(handlers.handleToolCall("value_by_feed_url", {})).rejects.toThrow(McpError);
    });
  });

  describe("recent_feeds", () => {
    it("calls apiClient.recentFeeds", async () => {
      await handlers.handleToolCall("recent_feeds", {});
      expect(mockApiClient.recentFeeds).toHaveBeenCalledWith({});
    });
  });

  describe("recent_new_feeds", () => {
    it("calls apiClient.recentNewFeeds", async () => {
      await handlers.handleToolCall("recent_new_feeds", {});
      expect(mockApiClient.recentNewFeeds).toHaveBeenCalledWith({});
    });
  });

  describe("stats_current", () => {
    it("calls apiClient.statsCurrent", async () => {
      await handlers.handleToolCall("stats_current", {});
      expect(mockApiClient.statsCurrent).toHaveBeenCalled();
    });
  });

  describe("unknown tool", () => {
    it("throws McpError with MethodNotFound", async () => {
      let thrown: unknown;
      try {
        await handlers.handleToolCall("nonexistent_tool", {});
        throw new Error("Expected handleToolCall to throw");
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(McpError);
      expect((thrown as McpError).code).toBe(ErrorCode.MethodNotFound);
    });
  });

  describe("axios error handling (fallback for a raw axios error, backward-compat)", () => {
    it("returns isError response on API failure", async () => {
      const axiosError = new Error("Network error") as any;
      axiosError.isAxiosError = true;
      axiosError.response = { status: 500, data: { description: "Internal error" } };

      // Mock axios.isAxiosError to return true for this error
      const axios = await import("axios");
      vi.spyOn(axios.default, "isAxiosError").mockReturnValueOnce(true);

      mockApiClient.searchByPerson.mockRejectedValueOnce(axiosError);
      const result = await handlers.handleToolCall("search_by_person", { q: "test" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("API error");
    });

    // Regression test: the live Podcast Index API returns a bare string body
    // for 401s, not `{ description: "..." }` (see api-client.test.ts for the
    // live-request confirmation). This path must preserve that string too.
    it("preserves a raw string response body instead of falling back to a generic message", async () => {
      const detail = "Authorization header value either not set or blank.";
      const axiosError = new Error("Request failed with status code 401") as any;
      axiosError.isAxiosError = true;
      axiosError.response = { status: 401, data: detail };

      const axios = await import("axios");
      vi.spyOn(axios.default, "isAxiosError").mockReturnValueOnce(true);

      mockApiClient.searchByPerson.mockRejectedValueOnce(axiosError);
      const result = await handlers.handleToolCall("search_by_person", { q: "test" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain(detail);
      expect(result.content[0].text).not.toContain("Request failed with status code");
    });
  });

  describe("typed error handling (PodcastIndexError hierarchy)", () => {
    it("returns isError response with the AuthenticationError message on 401/403", async () => {
      mockApiClient.searchByPerson.mockRejectedValueOnce(
        new AuthenticationError("Invalid API key", 401)
      );
      const result = await handlers.handleToolCall("search_by_person", { q: "test" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Authentication error (401)");
      expect(result.content[0].text).toContain("PODCASTINDEX_API_KEY");
    });

    it("returns isError response with the RateLimitError message on 429", async () => {
      mockApiClient.searchByTerm.mockRejectedValueOnce(new RateLimitError("Too many requests", 429));
      const result = await handlers.handleToolCall("search_by_term", { q: "AI" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Rate limit error (429)");
    });

    it("returns isError response with the ServerError message on 5xx", async () => {
      mockApiClient.categoriesList.mockRejectedValueOnce(new ServerError("Internal error", 503));
      const result = await handlers.handleToolCall("categories_list", {});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Server error (503)");
    });

    it("keeps the isError response shape identical to the legacy axios-error path", async () => {
      mockApiClient.searchByPerson.mockRejectedValueOnce(new AuthenticationError("bad key", 401));
      const result = await handlers.handleToolCall("search_by_person", { q: "test" });
      expect(Object.keys(result).sort()).toEqual(["content", "isError"]);
      expect(result.content[0]).toHaveProperty("type", "text");
      expect(typeof result.content[0].text).toBe("string");
    });
  });
});

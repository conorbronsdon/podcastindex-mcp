import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandlers, TOOLS } from "../tool-handlers.js";
import { PodcastIndexApiClient } from "../api-client.js";

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
};

let handlers: ToolHandlers;

beforeEach(() => {
  vi.clearAllMocks();
  handlers = new ToolHandlers(mockApiClient as unknown as PodcastIndexApiClient);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TOOLS", () => {
  it("exports 8 tools", () => {
    expect(TOOLS).toHaveLength(8);
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

  describe("axios error handling", () => {
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
  });
});

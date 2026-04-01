import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { PodcastIndexApiClient } from "../api-client.js";

// Mock axios
vi.mock("axios", () => {
  const mockGet = vi.fn().mockResolvedValue({ data: { status: true } });
  return {
    default: {
      create: vi.fn(() => ({ get: mockGet })),
      isAxiosError: vi.fn(() => false),
    },
  };
});

let client: PodcastIndexApiClient;
let mockGet: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.clearAllMocks();
  const axios = await import("axios");
  client = new PodcastIndexApiClient("test-key", "test-secret");
  // Get the mock get function from the created instance
  mockGet = (axios.default.create as ReturnType<typeof vi.fn>).mock.results[0].value.get;
});

describe("PodcastIndexApiClient", () => {
  describe("auth headers", () => {
    it("sends correct auth headers with every request", async () => {
      await client.searchByPerson({ q: "test" });
      expect(mockGet).toHaveBeenCalledOnce();
      const callArgs = mockGet.mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers["User-Agent"]).toBe("PodcastIndexMCP/1.0");
      expect(headers["X-Auth-Key"]).toBe("test-key");
      expect(headers["X-Auth-Date"]).toBeDefined();
      expect(headers["Authorization"]).toBeDefined();
    });

    it("generates SHA1 hash from key + secret + timestamp", async () => {
      const now = Math.floor(Date.now() / 1000);
      const expectedHash = crypto
        .createHash("sha1")
        .update("test-key" + "test-secret" + now)
        .digest("hex");

      await client.categoriesList();
      const headers = mockGet.mock.calls[0][1].headers;
      // The hash should match (within 1 second tolerance)
      expect(headers["Authorization"]).toMatch(/^[a-f0-9]{40}$/);
    });
  });

  describe("searchByPerson", () => {
    it("calls correct endpoint with required params", async () => {
      await client.searchByPerson({ q: "Conor Bronsdon" });
      expect(mockGet).toHaveBeenCalledWith(
        "/search/byperson",
        expect.objectContaining({ params: { q: "Conor Bronsdon" } })
      );
    });

    it("includes optional params when provided", async () => {
      await client.searchByPerson({ q: "test", max: 5, fulltext: true });
      const params = mockGet.mock.calls[0][1].params;
      expect(params).toEqual({ q: "test", max: 5, fulltext: true });
    });
  });

  describe("searchByTerm", () => {
    it("calls correct endpoint", async () => {
      await client.searchByTerm({ q: "AI" });
      expect(mockGet).toHaveBeenCalledWith(
        "/search/byterm",
        expect.objectContaining({ params: { q: "AI" } })
      );
    });

    it("includes clean and fulltext params", async () => {
      await client.searchByTerm({ q: "AI", clean: true, fulltext: true, max: 10 });
      const params = mockGet.mock.calls[0][1].params;
      expect(params).toEqual({ q: "AI", clean: true, fulltext: true, max: 10 });
    });
  });

  describe("podcastByFeedUrl", () => {
    it("calls correct endpoint with url", async () => {
      await client.podcastByFeedUrl({ url: "https://example.com/feed.xml" });
      expect(mockGet).toHaveBeenCalledWith(
        "/podcasts/byfeedurl",
        expect.objectContaining({ params: { url: "https://example.com/feed.xml" } })
      );
    });
  });

  describe("podcastByFeedId", () => {
    it("calls correct endpoint with id", async () => {
      await client.podcastByFeedId({ id: 12345 });
      expect(mockGet).toHaveBeenCalledWith(
        "/podcasts/byfeedid",
        expect.objectContaining({ params: { id: 12345 } })
      );
    });
  });

  describe("trendingPodcasts", () => {
    it("calls correct endpoint with no params", async () => {
      await client.trendingPodcasts({});
      expect(mockGet).toHaveBeenCalledWith(
        "/podcasts/trending",
        expect.objectContaining({ params: {} })
      );
    });

    it("includes all optional params", async () => {
      await client.trendingPodcasts({ max: 10, lang: "en", cat: "Technology", since: 1000 });
      const params = mockGet.mock.calls[0][1].params;
      expect(params).toEqual({ max: 10, lang: "en", cat: "Technology", since: 1000 });
    });
  });

  describe("episodesByFeedId", () => {
    it("calls correct endpoint", async () => {
      await client.episodesByFeedId({ id: 100 });
      expect(mockGet).toHaveBeenCalledWith(
        "/episodes/byfeedid",
        expect.objectContaining({ params: { id: 100 } })
      );
    });

    it("includes optional params", async () => {
      await client.episodesByFeedId({ id: 100, max: 5, since: 500, fulltext: true });
      const params = mockGet.mock.calls[0][1].params;
      expect(params).toEqual({ id: 100, max: 5, since: 500, fulltext: true });
    });
  });

  describe("recentEpisodes", () => {
    it("calls correct endpoint", async () => {
      await client.recentEpisodes({});
      expect(mockGet).toHaveBeenCalledWith(
        "/recent/episodes",
        expect.objectContaining({ params: {} })
      );
    });

    it("includes all optional params", async () => {
      await client.recentEpisodes({ max: 10, excludeString: "test", before: 500, fulltext: true });
      const params = mockGet.mock.calls[0][1].params;
      expect(params).toEqual({ max: 10, excludeString: "test", before: 500, fulltext: true });
    });
  });

  describe("categoriesList", () => {
    it("calls correct endpoint with no params", async () => {
      await client.categoriesList();
      expect(mockGet).toHaveBeenCalledWith(
        "/categories/list",
        expect.objectContaining({})
      );
    });
  });
});

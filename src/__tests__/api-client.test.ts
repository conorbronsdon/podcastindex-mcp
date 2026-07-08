import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { PodcastIndexApiClient } from "../api-client.js";
import {
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ServerError,
  PodcastIndexError,
} from "../errors.js";

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
      const fixedNowMs = 1_700_000_000_000;
      const nowSpy = vi.spyOn(Date, "now").mockReturnValue(fixedNowMs);
      const now = Math.floor(fixedNowMs / 1000);
      const expectedHash = crypto
        .createHash("sha1")
        .update("test-key" + "test-secret" + now)
        .digest("hex");

      try {
        await client.categoriesList();
        const headers = mockGet.mock.calls[0][1].headers;
        expect(headers["X-Auth-Date"]).toBe(String(now));
        expect(headers["Authorization"]).toBe(expectedHash);
      } finally {
        nowSpy.mockRestore();
      }
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

  describe("searchByTitle", () => {
    it("calls correct endpoint with required params", async () => {
      await client.searchByTitle({ q: "Chain of Thought" });
      expect(mockGet).toHaveBeenCalledWith(
        "/search/bytitle",
        expect.objectContaining({ params: { q: "Chain of Thought" } })
      );
    });

    it("includes optional params when provided", async () => {
      await client.searchByTitle({ q: "AI", max: 5, clean: true, fulltext: true });
      const params = mockGet.mock.calls[0][1].params;
      expect(params).toEqual({ q: "AI", max: 5, clean: true, fulltext: true });
    });
  });

  describe("episodeById", () => {
    it("calls correct endpoint with id", async () => {
      await client.episodeById({ id: 999 });
      expect(mockGet).toHaveBeenCalledWith(
        "/episodes/byid",
        expect.objectContaining({ params: { id: 999 } })
      );
    });

    it("includes fulltext when provided", async () => {
      await client.episodeById({ id: 999, fulltext: true });
      const params = mockGet.mock.calls[0][1].params;
      expect(params).toEqual({ id: 999, fulltext: true });
    });
  });

  describe("episodesLive", () => {
    it("calls correct endpoint with no params", async () => {
      await client.episodesLive({});
      expect(mockGet).toHaveBeenCalledWith(
        "/episodes/live",
        expect.objectContaining({ params: {} })
      );
    });

    it("includes max when provided", async () => {
      await client.episodesLive({ max: 5 });
      const params = mockGet.mock.calls[0][1].params;
      expect(params).toEqual({ max: 5 });
    });
  });

  describe("podcastByItunesId", () => {
    it("calls correct endpoint with id", async () => {
      await client.podcastByItunesId({ id: 123456 });
      expect(mockGet).toHaveBeenCalledWith(
        "/podcasts/byitunesid",
        expect.objectContaining({ params: { id: 123456 } })
      );
    });
  });

  describe("podcastByGuid", () => {
    it("calls correct endpoint with guid", async () => {
      await client.podcastByGuid({ guid: "917393e3-1b1e-5cef-ace4-edaa54e1e195" });
      expect(mockGet).toHaveBeenCalledWith(
        "/podcasts/byguid",
        expect.objectContaining({ params: { guid: "917393e3-1b1e-5cef-ace4-edaa54e1e195" } })
      );
    });
  });

  describe("valueByFeedId", () => {
    it("calls correct endpoint with id", async () => {
      await client.valueByFeedId({ id: 100 });
      expect(mockGet).toHaveBeenCalledWith(
        "/value/byfeedid",
        expect.objectContaining({ params: { id: 100 } })
      );
    });
  });

  describe("valueByFeedUrl", () => {
    it("calls correct endpoint with url", async () => {
      await client.valueByFeedUrl({ url: "https://example.com/feed.xml" });
      expect(mockGet).toHaveBeenCalledWith(
        "/value/byfeedurl",
        expect.objectContaining({ params: { url: "https://example.com/feed.xml" } })
      );
    });
  });

  describe("recentFeeds", () => {
    it("calls correct endpoint with no params", async () => {
      await client.recentFeeds({});
      expect(mockGet).toHaveBeenCalledWith(
        "/recent/feeds",
        expect.objectContaining({ params: {} })
      );
    });

    it("includes all optional params", async () => {
      await client.recentFeeds({ max: 10, since: 1000, lang: "en", cat: "Technology", notcat: "Comedy" });
      const params = mockGet.mock.calls[0][1].params;
      expect(params).toEqual({ max: 10, since: 1000, lang: "en", cat: "Technology", notcat: "Comedy" });
    });
  });

  describe("recentNewFeeds", () => {
    it("calls correct endpoint with no params", async () => {
      await client.recentNewFeeds({});
      expect(mockGet).toHaveBeenCalledWith(
        "/recent/newfeeds",
        expect.objectContaining({ params: {} })
      );
    });

    it("includes all optional params", async () => {
      await client.recentNewFeeds({ max: 10, since: 1000, feedid: "500", desc: true });
      const params = mockGet.mock.calls[0][1].params;
      expect(params).toEqual({ max: 10, since: 1000, feedid: "500", desc: true });
    });
  });

  describe("statsCurrent", () => {
    it("calls correct endpoint with no params", async () => {
      await client.statsCurrent();
      expect(mockGet).toHaveBeenCalledWith(
        "/stats/current",
        expect.objectContaining({ params: {} })
      );
    });
  });

  describe("error mapping (typed error hierarchy)", () => {
    async function rejectWith(status: number, description: string) {
      const axios = await import("axios");
      vi.spyOn(axios.default, "isAxiosError").mockReturnValueOnce(true);
      const axiosError = new Error(description) as any;
      axiosError.isAxiosError = true;
      axiosError.response = { status, data: { description } };
      mockGet.mockRejectedValueOnce(axiosError);
    }

    it("maps 401 to AuthenticationError", async () => {
      await rejectWith(401, "Invalid API key");
      await expect(client.categoriesList()).rejects.toBeInstanceOf(AuthenticationError);
    });

    it("maps 403 to AuthenticationError", async () => {
      await rejectWith(403, "Forbidden");
      await expect(client.categoriesList()).rejects.toBeInstanceOf(AuthenticationError);
    });

    it("maps 429 to RateLimitError", async () => {
      await rejectWith(429, "Too many requests");
      await expect(client.categoriesList()).rejects.toBeInstanceOf(RateLimitError);
    });

    it("maps 400 to ValidationError", async () => {
      await rejectWith(400, "Missing required parameter");
      await expect(client.categoriesList()).rejects.toBeInstanceOf(ValidationError);
    });

    it("maps 404 to NotFoundError", async () => {
      await rejectWith(404, "Feed not found");
      await expect(client.categoriesList()).rejects.toBeInstanceOf(NotFoundError);
    });

    it("maps 500 to ServerError", async () => {
      await rejectWith(500, "Internal server error");
      await expect(client.categoriesList()).rejects.toBeInstanceOf(ServerError);
    });

    it("maps 503 to ServerError", async () => {
      await rejectWith(503, "Service unavailable");
      await expect(client.categoriesList()).rejects.toBeInstanceOf(ServerError);
    });

    it("falls back to base PodcastIndexError for an unmapped status", async () => {
      await rejectWith(418, "I'm a teapot");
      await expect(client.categoriesList()).rejects.toBeInstanceOf(PodcastIndexError);
    });

    it("re-throws non-axios errors unchanged", async () => {
      const plainError = new Error("boom");
      mockGet.mockRejectedValueOnce(plainError);
      await expect(client.categoriesList()).rejects.toBe(plainError);
    });
  });
});

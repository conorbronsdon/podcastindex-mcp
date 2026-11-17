import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  McpError,
  ErrorCode,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
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

  // Pin the exact annotation object. The spec defaults for omitted hints
  // are the unsafe values (destructiveHint: true, idempotentHint: false,
  // openWorldHint: true), so every hint is declared explicitly.
  const EXPECTED_ANNOTATIONS = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  };
  const assertFullAnnotations = (tools: ReadonlyArray<{ name: string; annotations?: unknown }>) => {
    for (const tool of tools) {
      expect(tool.annotations, tool.name).toStrictEqual(EXPECTED_ANNOTATIONS);
    }
  };

  it("every tool declares the full read-only, open-world annotation set", () => {
    assertFullAnnotations(TOOLS);
  });

  it("annotation check goes red for a tool that relies on a spec default", () => {
    // Negative control: a tool declaring only readOnlyHint (the previous
    // shape) must fail the check, or the check above proves nothing.
    expect(() =>
      assertFullAnnotations([{ name: "fake_tool", annotations: { readOnlyHint: true } }]),
    ).toThrow();
  });
});

// #35: argument-validation failures are tool execution errors (MCP 2025-11-25),
// so the model sees the message and can correct its call. Missing credentials
// and unknown tools stay JSON-RPC errors.
async function expectInvalidArguments(name: string, args: unknown) {
  const result = await handlers.handleToolCall(name, args);
  expect(result.isError).toBe(true);
  expect(result.content).toHaveLength(1);
  expect(result.content[0].type).toBe("text");
  expect(result.content[0].text).toMatch(/^Invalid arguments/);
  for (const fn of Object.values(mockApiClient)) {
    expect(fn).not.toHaveBeenCalled();
  }
}

describe("ToolHandlers.handleToolCall", () => {
  describe("search_by_person", () => {
    it("returns JSON content on success", async () => {
      const result = await handlers.handleToolCall("search_by_person", { q: "test" });
      expect(result.content[0].type).toBe("text");
      expect(mockApiClient.searchByPerson).toHaveBeenCalledWith({ q: "test" });
    });

    it("returns an isError result on invalid args", async () => {
      await expectInvalidArguments("search_by_person", {});
    });
  });

  describe("search_by_term", () => {
    it("calls apiClient.searchByTerm", async () => {
      await handlers.handleToolCall("search_by_term", { q: "AI" });
      expect(mockApiClient.searchByTerm).toHaveBeenCalledWith({ q: "AI" });
    });

    it("returns an isError result on missing q", async () => {
      await expectInvalidArguments("search_by_term", {});
    });
  });

  describe("podcast_by_feed_url", () => {
    it("calls apiClient.podcastByFeedUrl", async () => {
      await handlers.handleToolCall("podcast_by_feed_url", { url: "https://example.com/feed" });
      expect(mockApiClient.podcastByFeedUrl).toHaveBeenCalledWith({ url: "https://example.com/feed" });
    });

    it("returns an isError result on missing url", async () => {
      await expectInvalidArguments("podcast_by_feed_url", {});
    });
  });

  describe("podcast_by_feed_id", () => {
    it("calls apiClient.podcastByFeedId", async () => {
      await handlers.handleToolCall("podcast_by_feed_id", { id: 123 });
      expect(mockApiClient.podcastByFeedId).toHaveBeenCalledWith({ id: 123 });
    });

    it("returns an isError result on string id", async () => {
      await expectInvalidArguments("podcast_by_feed_id", { id: "123" });
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

    it("returns an isError result on missing id", async () => {
      await expectInvalidArguments("episodes_by_feed_id", {});
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

    it("returns an isError result on missing q", async () => {
      await expectInvalidArguments("search_by_title", {});
    });
  });

  describe("episode_by_id", () => {
    it("calls apiClient.episodeById", async () => {
      await handlers.handleToolCall("episode_by_id", { id: 999 });
      expect(mockApiClient.episodeById).toHaveBeenCalledWith({ id: 999 });
    });

    it("returns an isError result on missing id", async () => {
      await expectInvalidArguments("episode_by_id", {});
    });

    it("returns an isError result on string id", async () => {
      await expectInvalidArguments("episode_by_id", { id: "999" });
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

    it("returns an isError result on missing id", async () => {
      await expectInvalidArguments("podcast_by_itunes_id", {});
    });
  });

  describe("podcast_by_guid", () => {
    it("calls apiClient.podcastByGuid", async () => {
      await handlers.handleToolCall("podcast_by_guid", { guid: "abc-123" });
      expect(mockApiClient.podcastByGuid).toHaveBeenCalledWith({ guid: "abc-123" });
    });

    it("returns an isError result on missing guid", async () => {
      await expectInvalidArguments("podcast_by_guid", {});
    });
  });

  describe("value_by_feed_id", () => {
    it("calls apiClient.valueByFeedId", async () => {
      await handlers.handleToolCall("value_by_feed_id", { id: 100 });
      expect(mockApiClient.valueByFeedId).toHaveBeenCalledWith({ id: 100 });
    });

    it("returns an isError result on missing id", async () => {
      await expectInvalidArguments("value_by_feed_id", {});
    });
  });

  describe("value_by_feed_url", () => {
    it("calls apiClient.valueByFeedUrl", async () => {
      await handlers.handleToolCall("value_by_feed_url", { url: "https://example.com/feed.xml" });
      expect(mockApiClient.valueByFeedUrl).toHaveBeenCalledWith({ url: "https://example.com/feed.xml" });
    });

    it("returns an isError result on missing url", async () => {
      await expectInvalidArguments("value_by_feed_url", {});
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

// Real PodcastIndexApiClient + real axios against a loopback server (never the
// live API): a stalled upstream must come back as an isError tool result
// instead of leaving the tool call pending.
describe("request timeout through the real client", () => {
  let server: import("node:http").Server;
  let baseURL: string;
  let stall: boolean;

  beforeEach(async () => {
    const http = await import("node:http");
    stall = true;
    server = http.createServer((_req, res) => {
      if (stall) return; // accept the request, never answer
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "true", count: 0 }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as import("node:net").AddressInfo;
    baseURL = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  function loopbackHandlers(timeoutMs: number): ToolHandlers {
    const client = new PodcastIndexApiClient("example-key", "example-secret", { timeoutMs });
    (client as unknown as { api: { defaults: { baseURL: string } } }).api.defaults.baseURL = baseURL;
    return new ToolHandlers(client);
  }

  it("returns isError when the API does not answer within the timeout", async () => {
    const result = await loopbackHandlers(100).handleToolCall("stats_current", {});
    expect(result).toEqual({
      content: [{ type: "text", text: "API error (unknown): timeout of 100ms exceeded" }],
      isError: true,
    });
  }, 2_000);

  it("returns the data when the API answers within the timeout", async () => {
    stall = false;
    const result = await loopbackHandlers(1_000).handleToolCall("stats_current", {});
    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify({ status: "true", count: 0 }, null, 2) }],
    });
  }, 2_000);
});

describe("advertised bounds (#35)", () => {
  const toolsWithMax = TOOLS.filter((t) => "max" in t.inputSchema.properties);
  const integerFields = ["id", "since", "before"] as const;

  it("every max is advertised as an integer from 1 to 100", () => {
    expect(toolsWithMax).toHaveLength(9);
    for (const tool of toolsWithMax) {
      const max = (tool.inputSchema.properties as Record<string, Record<string, unknown>>).max;
      expect(max, tool.name).toMatchObject({ type: "integer", minimum: 1, maximum: 100 });
    }
  });

  it("every id, since and before is advertised as an integer", () => {
    let seen = 0;
    for (const tool of TOOLS) {
      const props = tool.inputSchema.properties as Record<string, Record<string, unknown>>;
      for (const field of integerFields) {
        if (props[field]) {
          seen++;
          expect(props[field].type, `${tool.name}.${field}`).toBe("integer");
        }
      }
    }
    expect(seen).toBe(10);
  });

  const requiredArgs: Record<string, Record<string, unknown>> = {
    search_by_person: { q: "x" },
    search_by_term: { q: "x" },
    search_by_title: { q: "x" },
    episodes_by_feed_id: { id: 1 },
  };

  it.each(toolsWithMax.map((t) => t.name))(
    "%s returns an isError result naming the bound for max outside 1..100",
    async (name) => {
      for (const max of [0, 101, 5000, 2.5]) {
        vi.clearAllMocks();
        await expectInvalidArguments(name, { ...requiredArgs[name], max });
        const result = await handlers.handleToolCall(name, { ...requiredArgs[name], max });
        expect(result.content[0].text).toContain("max: integer 1-100");
      }
    }
  );

  it.each(toolsWithMax.map((t) => t.name))("%s still calls the API at max 1 and 100", async (name) => {
    for (const max of [1, 100]) {
      const result = await handlers.handleToolCall(name, { ...requiredArgs[name], max });
      expect(result.isError, `max=${max}`).toBeUndefined();
    }
    const calls = Object.values(mockApiClient).reduce((n, fn) => n + fn.mock.calls.length, 0);
    expect(calls).toBe(2);
  });

  it("returns an isError result for a fractional id and does not call the API", async () => {
    await expectInvalidArguments("podcast_by_feed_id", { id: 1.5 });
    const result = await handlers.handleToolCall("podcast_by_feed_id", { id: 1.5 });
    expect(result.content[0].text).toBe(
      "Invalid arguments for podcast_by_feed_id: expected { id: integer (required) }"
    );
  });

  it("returns an isError result for a fractional since or before", async () => {
    await expectInvalidArguments("recent_feeds", { since: 1700000000.5 });
    await expectInvalidArguments("recent_episodes", { before: Number.NaN });
  });
});

// The same calls over a real MCP client: a validation failure must arrive as a
// CallToolResult with isError, not as a JSON-RPC error the client may hide
// from the model.
describe("validation errors over MCP (#35)", () => {
  async function connect(toolHandlers: ToolHandlers) {
    const server = new Server(
      { name: "podcastindex-mcp-test", version: "0.0.0" },
      { capabilities: { tools: {} } }
    );
    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
    server.setRequestHandler(CallToolRequestSchema, async (request) =>
      toolHandlers.handleToolCall(request.params.name, request.params.arguments ?? {})
    );
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    return client;
  }

  it("returns isError for out-of-range max instead of a -32602 error", async () => {
    const client = await connect(handlers);
    const result = await client.callTool({ name: "search_by_person", arguments: { q: "x", max: 5000 } });
    expect(result.isError).toBe(true);
    expect((result.content as Array<{ text: string }>)[0].text).toMatch(/^Invalid arguments for search_by_person/);
    expect(mockApiClient.searchByPerson).not.toHaveBeenCalled();
    await client.close();
  });

  it("keeps missing credentials as a -32600 protocol error", async () => {
    const client = await connect(
      new ToolHandlers(mockApiClient as unknown as PodcastIndexApiClient, false)
    );
    await expect(
      client.callTool({ name: "search_by_person", arguments: { q: "x" } })
    ).rejects.toMatchObject({ code: ErrorCode.InvalidRequest });
    await client.close();
  });

  it("keeps an unknown tool as a -32601 protocol error", async () => {
    const client = await connect(handlers);
    await expect(client.callTool({ name: "nonexistent_tool", arguments: {} })).rejects.toMatchObject({
      code: ErrorCode.MethodNotFound,
    });
    await client.close();
  });
});

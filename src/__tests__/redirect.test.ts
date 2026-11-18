import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import type { AddressInfo } from "net";
import { PodcastIndexApiClient, stripAuthOnCrossOriginRedirect } from "../api-client.js";

// Real axios against two local servers (no mock, no network beyond loopback).
// "origin" plays api.podcastindex.org; "other" is a different origin a
// redirect could point at.

type Seen = { path: string; headers: http.IncomingHttpHeaders };

let origin: http.Server;
let other: http.Server;
let originUrl = "";
let otherUrl = "";
const seenByOrigin: Seen[] = [];
const seenByOther: Seen[] = [];

function listen(server: http.Server): Promise<string> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

beforeAll(async () => {
  other = http.createServer((req, res) => {
    seenByOther.push({ path: req.url ?? "", headers: req.headers });
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ host: "other" }));
  });
  origin = http.createServer((req, res) => {
    seenByOrigin.push({ path: req.url ?? "", headers: req.headers });
    if (req.url?.startsWith("/stats/current")) {
      res.statusCode = 302;
      res.setHeader("Location", `${otherUrl}/landed`);
      res.end();
      return;
    }
    if (req.url?.startsWith("/categories/list")) {
      res.statusCode = 301;
      res.setHeader("Location", "/same-origin-target");
      res.end();
      return;
    }
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ host: "origin" }));
  });
  originUrl = await listen(origin);
  otherUrl = await listen(other);
});

afterAll(async () => {
  await new Promise((r) => origin.close(r));
  await new Promise((r) => other.close(r));
});

function clientAgainstLocalOrigin(): PodcastIndexApiClient {
  const client = new PodcastIndexApiClient("test-key-not-real", "example-secret-not-real");
  // Test-only: point the real axios instance at the loopback "origin" and
  // bypass any ambient HTTP(S)_PROXY so the request stays on loopback.
  const api = (client as unknown as { api: { defaults: { baseURL?: string; proxy?: false } } }).api;
  api.defaults.baseURL = originUrl;
  api.defaults.proxy = false;
  return client;
}

describe("redirects and auth headers", () => {
  it("drops X-Auth-Key, X-Auth-Date and Authorization on a cross-origin redirect", async () => {
    seenByOrigin.length = 0;
    seenByOther.length = 0;
    const client = clientAgainstLocalOrigin();

    await expect(client.statsCurrent()).resolves.toEqual({ host: "other" });

    // The configured origin still received the credentials...
    expect(seenByOrigin).toHaveLength(1);
    expect(seenByOrigin[0].headers["x-auth-key"]).toBe("test-key-not-real");
    // ...but the redirect target received none of them.
    expect(seenByOther).toHaveLength(1);
    expect(seenByOther[0].path).toBe("/landed");
    expect(seenByOther[0].headers["x-auth-key"]).toBeUndefined();
    expect(seenByOther[0].headers["x-auth-date"]).toBeUndefined();
    expect(seenByOther[0].headers["authorization"]).toBeUndefined();
    expect(seenByOther[0].headers["user-agent"]).toBe("PodcastIndexMCP/1.0");
  });

  it("keeps every auth header on a same-origin redirect", async () => {
    seenByOrigin.length = 0;
    seenByOther.length = 0;
    const client = clientAgainstLocalOrigin();

    await expect(client.categoriesList()).resolves.toEqual({ host: "origin" });

    expect(seenByOther).toHaveLength(0);
    expect(seenByOrigin.map((s) => s.path)).toEqual(["/categories/list", "/same-origin-target"]);
    const first = seenByOrigin[0].headers;
    const second = seenByOrigin[1].headers;
    expect(second["x-auth-key"]).toBe("test-key-not-real");
    expect(second["x-auth-date"]).toBe(first["x-auth-date"]);
    expect(second["authorization"]).toBe(first["authorization"]);
    expect(String(second["authorization"])).toMatch(/^[0-9a-f]{40}$/);
  });
});

describe("stripAuthOnCrossOriginRedirect fail-safe branches", () => {
  const authHeaders = () => ({
    "X-Auth-Key": "test-key-not-real",
    "X-Auth-Date": "1700000000",
    Authorization: "test-hash-not-real",
    "User-Agent": "PodcastIndexMCP/1.0",
  });
  const API = "https://api.podcastindex.org/api/1.0/search/byterm";

  it("must-fire: an unparseable redirect href strips the auth headers", () => {
    const opts = { href: "not a url", headers: authHeaders() };
    stripAuthOnCrossOriginRedirect(opts, undefined, { url: API });
    expect(opts.headers).toEqual({ "User-Agent": "PodcastIndexMCP/1.0" });
  });

  it("must-fire: missing request details strip the auth headers", () => {
    const opts = { href: "https://api.podcastindex.org/api/1.0/other", headers: authHeaders() };
    stripAuthOnCrossOriginRedirect(opts, undefined, undefined);
    expect(opts.headers).toEqual({ "User-Agent": "PodcastIndexMCP/1.0" });
  });

  it("must-fire: a different port on the same host is another origin", () => {
    const opts = { href: "https://api.podcastindex.org:8443/x", headers: authHeaders() };
    stripAuthOnCrossOriginRedirect(opts, undefined, { url: API });
    expect(opts.headers).toEqual({ "User-Agent": "PodcastIndexMCP/1.0" });
  });

  it("must-not-fire: a same-origin absolute href keeps every header", () => {
    const opts = { href: "https://api.podcastindex.org/api/1.0/other", headers: authHeaders() };
    stripAuthOnCrossOriginRedirect(opts, undefined, { url: API });
    expect(opts.headers).toEqual(authHeaders());
  });

  it("must-not-fire: no headers object is a no-op, not a throw", () => {
    const opts: { href: string; headers?: Record<string, unknown> } = { href: "https://elsewhere.example/" };
    expect(() => stripAuthOnCrossOriginRedirect(opts, undefined, { url: API })).not.toThrow();
    expect(opts.headers).toBeUndefined();
  });
});

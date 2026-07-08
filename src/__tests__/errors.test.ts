import { describe, it, expect } from "vitest";
import {
  PodcastIndexError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ServerError,
  mapHttpStatusToError,
} from "../errors.js";

describe("typed error hierarchy", () => {
  it("every subclass extends PodcastIndexError, which extends Error", () => {
    expect(new AuthenticationError("bad key", 401)).toBeInstanceOf(PodcastIndexError);
    expect(new RateLimitError("slow down", 429)).toBeInstanceOf(PodcastIndexError);
    expect(new ValidationError("bad param", 400)).toBeInstanceOf(PodcastIndexError);
    expect(new NotFoundError("no such feed", 404)).toBeInstanceOf(PodcastIndexError);
    expect(new ServerError("oops", 500)).toBeInstanceOf(PodcastIndexError);
    expect(new PodcastIndexError("generic")).toBeInstanceOf(Error);
  });

  it("each subclass sets a distinct .name", () => {
    expect(new AuthenticationError("x", 401).name).toBe("AuthenticationError");
    expect(new RateLimitError("x", 429).name).toBe("RateLimitError");
    expect(new ValidationError("x", 400).name).toBe("ValidationError");
    expect(new NotFoundError("x", 404).name).toBe("NotFoundError");
    expect(new ServerError("x", 500).name).toBe("ServerError");
    expect(new PodcastIndexError("x").name).toBe("PodcastIndexError");
  });

  it("carries the status code on .status", () => {
    expect(new AuthenticationError("x", 403).status).toBe(403);
    expect(new RateLimitError("x", 429).status).toBe(429);
  });
});

describe("mapHttpStatusToError", () => {
  it("maps 401 and 403 to AuthenticationError", () => {
    expect(mapHttpStatusToError(401, "bad key")).toBeInstanceOf(AuthenticationError);
    expect(mapHttpStatusToError(403, "forbidden")).toBeInstanceOf(AuthenticationError);
  });

  it("includes credential guidance in the AuthenticationError message", () => {
    const err = mapHttpStatusToError(401, "Invalid auth");
    expect(err.message).toContain("Authentication error (401)");
    expect(err.message).toContain("Invalid auth");
    expect(err.message).toContain("PODCASTINDEX_API_KEY");
  });

  it("maps 429 to RateLimitError", () => {
    const err = mapHttpStatusToError(429, "too many requests");
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.message).toContain("Rate limit error (429)");
    expect(err.message).toContain("too many requests");
  });

  it("maps 400 to ValidationError", () => {
    const err = mapHttpStatusToError(400, "missing q");
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.message).toContain("Validation error (400)");
    expect(err.message).toContain("missing q");
  });

  it("maps 404 to NotFoundError", () => {
    const err = mapHttpStatusToError(404, "no such feed");
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.message).toContain("Not found (404)");
    expect(err.message).toContain("no such feed");
  });

  it("maps 500-599 to ServerError", () => {
    expect(mapHttpStatusToError(500, "boom")).toBeInstanceOf(ServerError);
    expect(mapHttpStatusToError(502, "bad gateway")).toBeInstanceOf(ServerError);
    expect(mapHttpStatusToError(503, "unavailable")).toBeInstanceOf(ServerError);
    const err = mapHttpStatusToError(500, "boom");
    expect(err.message).toContain("Server error (500)");
    expect(err.message).toContain("boom");
  });

  it("falls back to base PodcastIndexError for unmapped status codes", () => {
    const err = mapHttpStatusToError(418, "teapot");
    expect(err).toBeInstanceOf(PodcastIndexError);
    expect(err).not.toBeInstanceOf(AuthenticationError);
    expect(err).not.toBeInstanceOf(RateLimitError);
    expect(err).not.toBeInstanceOf(ValidationError);
    expect(err).not.toBeInstanceOf(NotFoundError);
    expect(err).not.toBeInstanceOf(ServerError);
    expect(err.message).toContain("API error (418)");
    expect(err.message).toContain("teapot");
  });

  it("falls back to base PodcastIndexError when status is undefined (network failure)", () => {
    const err = mapHttpStatusToError(undefined, "ECONNREFUSED");
    expect(err).toBeInstanceOf(PodcastIndexError);
    expect(err.status).toBeUndefined();
    expect(err.message).toContain("API error (unknown)");
    expect(err.message).toContain("ECONNREFUSED");
  });
});

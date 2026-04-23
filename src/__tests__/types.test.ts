import { describe, it, expect } from "vitest";
import {
  isSearchByPersonArgs,
  isSearchByTermArgs,
  isPodcastByFeedUrlArgs,
  isPodcastByFeedIdArgs,
  isTrendingPodcastsArgs,
  isEpisodesByFeedIdArgs,
  isRecentEpisodesArgs,
  isCategoriesListArgs,
} from "../types.js";

describe("isSearchByPersonArgs", () => {
  it("accepts valid args with required fields", () => {
    expect(isSearchByPersonArgs({ q: "Conor Bronsdon" })).toBe(true);
  });
  it("accepts valid args with optional fields", () => {
    expect(isSearchByPersonArgs({ q: "test", max: 10, fulltext: true })).toBe(true);
  });
  it("rejects null", () => {
    expect(isSearchByPersonArgs(null)).toBe(false);
  });
  it("rejects missing q", () => {
    expect(isSearchByPersonArgs({ max: 10 })).toBe(false);
  });
  it("rejects wrong type for q", () => {
    expect(isSearchByPersonArgs({ q: 123 })).toBe(false);
  });
  it("rejects wrong type for max", () => {
    expect(isSearchByPersonArgs({ q: "test", max: "ten" })).toBe(false);
  });
});

describe("isSearchByTermArgs", () => {
  it("accepts valid args", () => {
    expect(isSearchByTermArgs({ q: "AI" })).toBe(true);
  });
  it("accepts all optional fields", () => {
    expect(isSearchByTermArgs({ q: "AI", max: 5, clean: true, fulltext: false })).toBe(true);
  });
  it("rejects missing q", () => {
    expect(isSearchByTermArgs({})).toBe(false);
  });
  it("rejects wrong type for clean", () => {
    expect(isSearchByTermArgs({ q: "AI", clean: "yes" })).toBe(false);
  });
});

describe("isPodcastByFeedUrlArgs", () => {
  it("accepts valid url", () => {
    expect(isPodcastByFeedUrlArgs({ url: "https://example.com/feed.xml" })).toBe(true);
  });
  it("rejects missing url", () => {
    expect(isPodcastByFeedUrlArgs({})).toBe(false);
  });
  it("rejects non-string url", () => {
    expect(isPodcastByFeedUrlArgs({ url: 123 })).toBe(false);
  });
});

describe("isPodcastByFeedIdArgs", () => {
  it("accepts valid id", () => {
    expect(isPodcastByFeedIdArgs({ id: 12345 })).toBe(true);
  });
  it("rejects string id", () => {
    expect(isPodcastByFeedIdArgs({ id: "12345" })).toBe(false);
  });
  it("rejects missing id", () => {
    expect(isPodcastByFeedIdArgs({})).toBe(false);
  });
});

describe("isTrendingPodcastsArgs", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(isTrendingPodcastsArgs({})).toBe(true);
  });
  it("accepts all optional fields", () => {
    expect(isTrendingPodcastsArgs({ max: 10, lang: "en", cat: "Technology", since: 1000 })).toBe(true);
  });
  it("rejects wrong type for lang", () => {
    expect(isTrendingPodcastsArgs({ lang: 123 })).toBe(false);
  });
  it("rejects null", () => {
    expect(isTrendingPodcastsArgs(null)).toBe(false);
  });
  it("rejects arrays", () => {
    expect(isTrendingPodcastsArgs([])).toBe(false);
  });
});

describe("isEpisodesByFeedIdArgs", () => {
  it("accepts valid args", () => {
    expect(isEpisodesByFeedIdArgs({ id: 100 })).toBe(true);
  });
  it("accepts optional fields", () => {
    expect(isEpisodesByFeedIdArgs({ id: 100, max: 5, since: 1000, fulltext: true })).toBe(true);
  });
  it("rejects missing id", () => {
    expect(isEpisodesByFeedIdArgs({})).toBe(false);
  });
});

describe("isRecentEpisodesArgs", () => {
  it("accepts empty object", () => {
    expect(isRecentEpisodesArgs({})).toBe(true);
  });
  it("accepts all optional fields", () => {
    expect(isRecentEpisodesArgs({ max: 10, excludeString: "test", before: 500, fulltext: false })).toBe(true);
  });
  it("rejects wrong type for excludeString", () => {
    expect(isRecentEpisodesArgs({ excludeString: 123 })).toBe(false);
  });
  it("rejects arrays", () => {
    expect(isRecentEpisodesArgs([])).toBe(false);
  });
});

describe("isCategoriesListArgs", () => {
  it("accepts empty object", () => {
    expect(isCategoriesListArgs({})).toBe(true);
  });
  it("rejects null", () => {
    expect(isCategoriesListArgs(null)).toBe(false);
  });
  it("rejects non-object", () => {
    expect(isCategoriesListArgs("string")).toBe(false);
  });
  it("rejects arrays", () => {
    expect(isCategoriesListArgs([])).toBe(false);
  });
});

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
  it("rejects non-plain objects (Date, Map)", () => {
    expect(isCategoriesListArgs(new Date())).toBe(false);
    expect(isCategoriesListArgs(new Map())).toBe(false);
  });
});

describe("isSearchByTitleArgs", () => {
  it("accepts valid args with required field only", () => {
    expect(isSearchByTitleArgs({ q: "Chain of Thought" })).toBe(true);
  });
  it("accepts all optional fields", () => {
    expect(isSearchByTitleArgs({ q: "AI", max: 5, clean: true, fulltext: false })).toBe(true);
  });
  it("rejects missing q", () => {
    expect(isSearchByTitleArgs({})).toBe(false);
  });
  it("rejects wrong type for q", () => {
    expect(isSearchByTitleArgs({ q: 123 })).toBe(false);
  });
  it("rejects wrong type for clean", () => {
    expect(isSearchByTitleArgs({ q: "AI", clean: "yes" })).toBe(false);
  });
});

describe("isEpisodeByIdArgs", () => {
  it("accepts valid id", () => {
    expect(isEpisodeByIdArgs({ id: 999 })).toBe(true);
  });
  it("accepts fulltext", () => {
    expect(isEpisodeByIdArgs({ id: 999, fulltext: true })).toBe(true);
  });
  it("rejects missing id", () => {
    expect(isEpisodeByIdArgs({})).toBe(false);
  });
  it("rejects string id", () => {
    expect(isEpisodeByIdArgs({ id: "999" })).toBe(false);
  });
});

describe("isEpisodesLiveArgs", () => {
  it("accepts empty object (max is optional)", () => {
    expect(isEpisodesLiveArgs({})).toBe(true);
  });
  it("accepts valid max", () => {
    expect(isEpisodesLiveArgs({ max: 5 })).toBe(true);
  });
  it("rejects wrong type for max", () => {
    expect(isEpisodesLiveArgs({ max: "5" })).toBe(false);
  });
  it("rejects null", () => {
    expect(isEpisodesLiveArgs(null)).toBe(false);
  });
});

describe("isPodcastByItunesIdArgs", () => {
  it("accepts valid id", () => {
    expect(isPodcastByItunesIdArgs({ id: 123456 })).toBe(true);
  });
  it("rejects missing id", () => {
    expect(isPodcastByItunesIdArgs({})).toBe(false);
  });
  it("rejects string id", () => {
    expect(isPodcastByItunesIdArgs({ id: "123456" })).toBe(false);
  });
});

describe("isPodcastByGuidArgs", () => {
  it("accepts valid guid", () => {
    expect(isPodcastByGuidArgs({ guid: "917393e3-1b1e-5cef-ace4-edaa54e1e195" })).toBe(true);
  });
  it("rejects missing guid", () => {
    expect(isPodcastByGuidArgs({})).toBe(false);
  });
  it("rejects non-string guid", () => {
    expect(isPodcastByGuidArgs({ guid: 123 })).toBe(false);
  });
});

describe("isValueByFeedIdArgs", () => {
  it("accepts valid id", () => {
    expect(isValueByFeedIdArgs({ id: 100 })).toBe(true);
  });
  it("rejects missing id", () => {
    expect(isValueByFeedIdArgs({})).toBe(false);
  });
  it("rejects string id", () => {
    expect(isValueByFeedIdArgs({ id: "100" })).toBe(false);
  });
});

describe("isValueByFeedUrlArgs", () => {
  it("accepts valid url", () => {
    expect(isValueByFeedUrlArgs({ url: "https://example.com/feed.xml" })).toBe(true);
  });
  it("rejects missing url", () => {
    expect(isValueByFeedUrlArgs({})).toBe(false);
  });
  it("rejects non-string url", () => {
    expect(isValueByFeedUrlArgs({ url: 123 })).toBe(false);
  });
});

describe("isRecentFeedsArgs", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(isRecentFeedsArgs({})).toBe(true);
  });
  it("accepts all optional fields", () => {
    expect(
      isRecentFeedsArgs({ max: 10, since: 1000, lang: "en", cat: "Technology", notcat: "Comedy" })
    ).toBe(true);
  });
  it("rejects wrong type for lang", () => {
    expect(isRecentFeedsArgs({ lang: 123 })).toBe(false);
  });
  it("rejects arrays", () => {
    expect(isRecentFeedsArgs([])).toBe(false);
  });
});

describe("isRecentNewFeedsArgs", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(isRecentNewFeedsArgs({})).toBe(true);
  });
  it("accepts all optional fields", () => {
    expect(isRecentNewFeedsArgs({ max: 10, since: 1000, feedid: "500", desc: true })).toBe(true);
  });
  it("rejects wrong type for feedid", () => {
    expect(isRecentNewFeedsArgs({ feedid: 500 })).toBe(false);
  });
  it("rejects wrong type for desc", () => {
    expect(isRecentNewFeedsArgs({ desc: "yes" })).toBe(false);
  });
});

describe("isStatsCurrentArgs", () => {
  it("accepts empty object", () => {
    expect(isStatsCurrentArgs({})).toBe(true);
  });
  it("rejects null", () => {
    expect(isStatsCurrentArgs(null)).toBe(false);
  });
  it("rejects arrays", () => {
    expect(isStatsCurrentArgs([])).toBe(false);
  });
});

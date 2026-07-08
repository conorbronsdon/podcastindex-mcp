import crypto from "crypto";
import axios, { AxiosInstance } from "axios";
import { mapHttpStatusToError } from "./errors.js";
import type {
  SearchByPersonArgs,
  SearchByTermArgs,
  PodcastByFeedUrlArgs,
  PodcastByFeedIdArgs,
  TrendingPodcastsArgs,
  EpisodesByFeedIdArgs,
  RecentEpisodesArgs,
  SearchByTitleArgs,
  EpisodeByIdArgs,
  EpisodesLiveArgs,
  PodcastByItunesIdArgs,
  PodcastByGuidArgs,
  ValueByFeedIdArgs,
  ValueByFeedUrlArgs,
  RecentFeedsArgs,
  RecentNewFeedsArgs,
} from "./types.js";

export class PodcastIndexApiClient {
  private apiKey: string;
  private apiSecret: string;
  private api: AxiosInstance;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.api = axios.create({
      baseURL: "https://api.podcastindex.org/api/1.0",
    });
  }

  private getAuthHeaders(): Record<string, string> {
    const now = Math.floor(Date.now() / 1000);
    const authHash = crypto
      .createHash("sha1")
      .update(this.apiKey + this.apiSecret + now)
      .digest("hex");

    return {
      "User-Agent": "PodcastIndexMCP/1.0",
      "X-Auth-Key": this.apiKey,
      "X-Auth-Date": now.toString(),
      Authorization: authHash,
    };
  }

  /**
   * Shared GET helper: every endpoint method funnels through here so HTTP
   * failures are mapped to the typed error hierarchy (see ./errors.ts) in
   * exactly one place, instead of duplicating try/catch in each method.
   */
  private async get<T = unknown>(
    path: string,
    params: Record<string, string | number | boolean> = {}
  ): Promise<T> {
    try {
      const response = await this.api.get(path, {
        params,
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const detail =
          (error.response?.data as { description?: string } | undefined)?.description ||
          error.message;
        throw mapHttpStatusToError(status, detail);
      }
      throw error;
    }
  }

  async searchByPerson(args: SearchByPersonArgs) {
    const params: Record<string, string | number | boolean> = { q: args.q };
    if (args.max !== undefined) params.max = args.max;
    if (args.fulltext) params.fulltext = true;
    return this.get("/search/byperson", params);
  }

  async searchByTerm(args: SearchByTermArgs) {
    const params: Record<string, string | number | boolean> = { q: args.q };
    if (args.max !== undefined) params.max = args.max;
    if (args.clean) params.clean = true;
    if (args.fulltext) params.fulltext = true;
    return this.get("/search/byterm", params);
  }

  async podcastByFeedUrl(args: PodcastByFeedUrlArgs) {
    return this.get("/podcasts/byfeedurl", { url: args.url });
  }

  async podcastByFeedId(args: PodcastByFeedIdArgs) {
    return this.get("/podcasts/byfeedid", { id: args.id });
  }

  async trendingPodcasts(args: TrendingPodcastsArgs) {
    const params: Record<string, string | number> = {};
    if (args.max !== undefined) params.max = args.max;
    if (args.lang) params.lang = args.lang;
    if (args.cat) params.cat = args.cat;
    if (args.since !== undefined) params.since = args.since;
    return this.get("/podcasts/trending", params);
  }

  async episodesByFeedId(args: EpisodesByFeedIdArgs) {
    const params: Record<string, string | number | boolean> = { id: args.id };
    if (args.max !== undefined) params.max = args.max;
    if (args.since !== undefined) params.since = args.since;
    if (args.fulltext) params.fulltext = true;
    return this.get("/episodes/byfeedid", params);
  }

  async recentEpisodes(args: RecentEpisodesArgs) {
    const params: Record<string, string | number | boolean> = {};
    if (args.max !== undefined) params.max = args.max;
    if (args.excludeString) params.excludeString = args.excludeString;
    if (args.before !== undefined) params.before = args.before;
    if (args.fulltext) params.fulltext = true;
    return this.get("/recent/episodes", params);
  }

  async categoriesList() {
    return this.get("/categories/list");
  }

  async searchByTitle(args: SearchByTitleArgs) {
    const params: Record<string, string | number | boolean> = { q: args.q };
    if (args.max !== undefined) params.max = args.max;
    if (args.clean) params.clean = true;
    if (args.fulltext) params.fulltext = true;
    return this.get("/search/bytitle", params);
  }

  async episodeById(args: EpisodeByIdArgs) {
    const params: Record<string, string | number | boolean> = { id: args.id };
    if (args.fulltext) params.fulltext = true;
    return this.get("/episodes/byid", params);
  }

  async episodesLive(args: EpisodesLiveArgs) {
    const params: Record<string, string | number | boolean> = {};
    if (args.max !== undefined) params.max = args.max;
    return this.get("/episodes/live", params);
  }

  async podcastByItunesId(args: PodcastByItunesIdArgs) {
    return this.get("/podcasts/byitunesid", { id: args.id });
  }

  async podcastByGuid(args: PodcastByGuidArgs) {
    return this.get("/podcasts/byguid", { guid: args.guid });
  }

  async valueByFeedId(args: ValueByFeedIdArgs) {
    return this.get("/value/byfeedid", { id: args.id });
  }

  async valueByFeedUrl(args: ValueByFeedUrlArgs) {
    return this.get("/value/byfeedurl", { url: args.url });
  }

  async recentFeeds(args: RecentFeedsArgs) {
    const params: Record<string, string | number | boolean> = {};
    if (args.max !== undefined) params.max = args.max;
    if (args.since !== undefined) params.since = args.since;
    if (args.lang) params.lang = args.lang;
    if (args.cat) params.cat = args.cat;
    if (args.notcat) params.notcat = args.notcat;
    return this.get("/recent/feeds", params);
  }

  async recentNewFeeds(args: RecentNewFeedsArgs) {
    const params: Record<string, string | number | boolean> = {};
    if (args.max !== undefined) params.max = args.max;
    if (args.since !== undefined) params.since = args.since;
    if (args.feedid) params.feedid = args.feedid;
    if (args.desc) params.desc = true;
    return this.get("/recent/newfeeds", params);
  }

  async statsCurrent() {
    return this.get("/stats/current");
  }
}

import crypto from "crypto";
import axios, { AxiosInstance } from "axios";
import type {
  SearchByPersonArgs,
  SearchByTermArgs,
  PodcastByFeedUrlArgs,
  PodcastByFeedIdArgs,
  TrendingPodcastsArgs,
  EpisodesByFeedIdArgs,
  RecentEpisodesArgs,
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

  async searchByPerson(args: SearchByPersonArgs) {
    const params: Record<string, string | number | boolean> = { q: args.q };
    if (args.max !== undefined) params.max = args.max;
    if (args.fulltext) params.fulltext = true;
    const response = await this.api.get("/search/byperson", {
      params,
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async searchByTerm(args: SearchByTermArgs) {
    const params: Record<string, string | number | boolean> = { q: args.q };
    if (args.max !== undefined) params.max = args.max;
    if (args.clean) params.clean = true;
    if (args.fulltext) params.fulltext = true;
    const response = await this.api.get("/search/byterm", {
      params,
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async podcastByFeedUrl(args: PodcastByFeedUrlArgs) {
    const response = await this.api.get("/podcasts/byfeedurl", {
      params: { url: args.url },
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async podcastByFeedId(args: PodcastByFeedIdArgs) {
    const response = await this.api.get("/podcasts/byfeedid", {
      params: { id: args.id },
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async trendingPodcasts(args: TrendingPodcastsArgs) {
    const params: Record<string, string | number> = {};
    if (args.max !== undefined) params.max = args.max;
    if (args.lang) params.lang = args.lang;
    if (args.cat) params.cat = args.cat;
    if (args.since !== undefined) params.since = args.since;
    const response = await this.api.get("/podcasts/trending", {
      params,
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async episodesByFeedId(args: EpisodesByFeedIdArgs) {
    const params: Record<string, string | number | boolean> = { id: args.id };
    if (args.max !== undefined) params.max = args.max;
    if (args.since !== undefined) params.since = args.since;
    if (args.fulltext) params.fulltext = true;
    const response = await this.api.get("/episodes/byfeedid", {
      params,
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async recentEpisodes(args: RecentEpisodesArgs) {
    const params: Record<string, string | number | boolean> = {};
    if (args.max !== undefined) params.max = args.max;
    if (args.excludeString) params.excludeString = args.excludeString;
    if (args.before !== undefined) params.before = args.before;
    if (args.fulltext) params.fulltext = true;
    const response = await this.api.get("/recent/episodes", {
      params,
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async categoriesList() {
    const response = await this.api.get("/categories/list", {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }
}

/** Upper bound every `max` argument advertises in its inputSchema. */
export const MAX_RESULTS_LIMIT = 100;

function isOptionalMax(max: unknown): boolean {
  return max === undefined || (Number.isInteger(max) && (max as number) >= 1 && (max as number) <= MAX_RESULTS_LIMIT);
}

function isOptionalInteger(value: unknown): boolean {
  return value === undefined || Number.isInteger(value);
}

function isPlainObject(args: unknown): args is object {
  if (args === null || typeof args !== "object") return false;
  if (Object.prototype.toString.call(args) !== "[object Object]") return false;
  const prototype = Object.getPrototypeOf(args);
  return prototype === Object.prototype || prototype === null;
}

export interface SearchByPersonArgs {
  q: string;
  max?: number;
  fulltext?: boolean;
}

export function isSearchByPersonArgs(args: unknown): args is SearchByPersonArgs {
  if (!isPlainObject(args)) return false;
  const { q, max, fulltext } = args as SearchByPersonArgs;
  return (
    typeof q === "string" &&
    isOptionalMax(max) &&
    (fulltext === undefined || typeof fulltext === "boolean")
  );
}

export interface SearchByTermArgs {
  q: string;
  max?: number;
  clean?: boolean;
  fulltext?: boolean;
}

export function isSearchByTermArgs(args: unknown): args is SearchByTermArgs {
  if (!isPlainObject(args)) return false;
  const { q, max, clean, fulltext } = args as SearchByTermArgs;
  return (
    typeof q === "string" &&
    isOptionalMax(max) &&
    (clean === undefined || typeof clean === "boolean") &&
    (fulltext === undefined || typeof fulltext === "boolean")
  );
}

export interface PodcastByFeedUrlArgs {
  url: string;
}

export function isPodcastByFeedUrlArgs(args: unknown): args is PodcastByFeedUrlArgs {
  if (!isPlainObject(args)) return false;
  const { url } = args as PodcastByFeedUrlArgs;
  return typeof url === "string";
}

export interface PodcastByFeedIdArgs {
  id: number;
}

export function isPodcastByFeedIdArgs(args: unknown): args is PodcastByFeedIdArgs {
  if (!isPlainObject(args)) return false;
  const { id } = args as PodcastByFeedIdArgs;
  return Number.isInteger(id);
}

export interface TrendingPodcastsArgs {
  max?: number;
  lang?: string;
  cat?: string;
  since?: number;
}

export function isTrendingPodcastsArgs(args: unknown): args is TrendingPodcastsArgs {
  if (!isPlainObject(args)) return false;
  const { max, lang, cat, since } = args as TrendingPodcastsArgs;
  return (
    isOptionalMax(max) &&
    (lang === undefined || typeof lang === "string") &&
    (cat === undefined || typeof cat === "string") &&
    isOptionalInteger(since)
  );
}

export interface EpisodesByFeedIdArgs {
  id: number;
  max?: number;
  since?: number;
  fulltext?: boolean;
}

export function isEpisodesByFeedIdArgs(args: unknown): args is EpisodesByFeedIdArgs {
  if (!isPlainObject(args)) return false;
  const { id, max, since, fulltext } = args as EpisodesByFeedIdArgs;
  return (
    Number.isInteger(id) &&
    isOptionalMax(max) &&
    isOptionalInteger(since) &&
    (fulltext === undefined || typeof fulltext === "boolean")
  );
}

export interface RecentEpisodesArgs {
  max?: number;
  excludeString?: string;
  before?: number;
  fulltext?: boolean;
}

export function isRecentEpisodesArgs(args: unknown): args is RecentEpisodesArgs {
  if (!isPlainObject(args)) return false;
  const { max, excludeString, before, fulltext } = args as RecentEpisodesArgs;
  return (
    isOptionalMax(max) &&
    (excludeString === undefined || typeof excludeString === "string") &&
    isOptionalInteger(before) &&
    (fulltext === undefined || typeof fulltext === "boolean")
  );
}

export interface CategoriesListArgs {}

export function isCategoriesListArgs(args: unknown): args is CategoriesListArgs {
  return isPlainObject(args);
}

export interface SearchByTitleArgs {
  q: string;
  max?: number;
  clean?: boolean;
  fulltext?: boolean;
}

export function isSearchByTitleArgs(args: unknown): args is SearchByTitleArgs {
  if (!isPlainObject(args)) return false;
  const { q, max, clean, fulltext } = args as SearchByTitleArgs;
  return (
    typeof q === "string" &&
    isOptionalMax(max) &&
    (clean === undefined || typeof clean === "boolean") &&
    (fulltext === undefined || typeof fulltext === "boolean")
  );
}

export interface EpisodeByIdArgs {
  id: number;
  fulltext?: boolean;
}

export function isEpisodeByIdArgs(args: unknown): args is EpisodeByIdArgs {
  if (!isPlainObject(args)) return false;
  const { id, fulltext } = args as EpisodeByIdArgs;
  return Number.isInteger(id) && (fulltext === undefined || typeof fulltext === "boolean");
}

export interface EpisodesLiveArgs {
  max?: number;
}

export function isEpisodesLiveArgs(args: unknown): args is EpisodesLiveArgs {
  if (!isPlainObject(args)) return false;
  const { max } = args as EpisodesLiveArgs;
  return isOptionalMax(max);
}

export interface PodcastByItunesIdArgs {
  id: number;
}

export function isPodcastByItunesIdArgs(args: unknown): args is PodcastByItunesIdArgs {
  if (!isPlainObject(args)) return false;
  const { id } = args as PodcastByItunesIdArgs;
  return Number.isInteger(id);
}

export interface PodcastByGuidArgs {
  guid: string;
}

export function isPodcastByGuidArgs(args: unknown): args is PodcastByGuidArgs {
  if (!isPlainObject(args)) return false;
  const { guid } = args as PodcastByGuidArgs;
  return typeof guid === "string";
}

export interface ValueByFeedIdArgs {
  id: number;
}

export function isValueByFeedIdArgs(args: unknown): args is ValueByFeedIdArgs {
  if (!isPlainObject(args)) return false;
  const { id } = args as ValueByFeedIdArgs;
  return Number.isInteger(id);
}

export interface ValueByFeedUrlArgs {
  url: string;
}

export function isValueByFeedUrlArgs(args: unknown): args is ValueByFeedUrlArgs {
  if (!isPlainObject(args)) return false;
  const { url } = args as ValueByFeedUrlArgs;
  return typeof url === "string";
}

export interface RecentFeedsArgs {
  max?: number;
  since?: number;
  lang?: string;
  cat?: string;
  notcat?: string;
}

export function isRecentFeedsArgs(args: unknown): args is RecentFeedsArgs {
  if (!isPlainObject(args)) return false;
  const { max, since, lang, cat, notcat } = args as RecentFeedsArgs;
  return (
    isOptionalMax(max) &&
    isOptionalInteger(since) &&
    (lang === undefined || typeof lang === "string") &&
    (cat === undefined || typeof cat === "string") &&
    (notcat === undefined || typeof notcat === "string")
  );
}

export interface RecentNewFeedsArgs {
  max?: number;
  since?: number;
  feedid?: string;
  desc?: boolean;
}

export function isRecentNewFeedsArgs(args: unknown): args is RecentNewFeedsArgs {
  if (!isPlainObject(args)) return false;
  const { max, since, feedid, desc } = args as RecentNewFeedsArgs;
  return (
    isOptionalMax(max) &&
    isOptionalInteger(since) &&
    (feedid === undefined || typeof feedid === "string") &&
    (desc === undefined || typeof desc === "boolean")
  );
}

export interface StatsCurrentArgs {}

export function isStatsCurrentArgs(args: unknown): args is StatsCurrentArgs {
  return isPlainObject(args);
}

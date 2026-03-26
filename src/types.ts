export interface SearchByPersonArgs {
  q: string;
  max?: number;
  fulltext?: boolean;
}

export function isSearchByPersonArgs(args: unknown): args is SearchByPersonArgs {
  if (!args || typeof args !== "object") return false;
  const { q, max, fulltext } = args as SearchByPersonArgs;
  return (
    typeof q === "string" &&
    (max === undefined || typeof max === "number") &&
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
  if (!args || typeof args !== "object") return false;
  const { q, max, clean, fulltext } = args as SearchByTermArgs;
  return (
    typeof q === "string" &&
    (max === undefined || typeof max === "number") &&
    (clean === undefined || typeof clean === "boolean") &&
    (fulltext === undefined || typeof fulltext === "boolean")
  );
}

export interface PodcastByFeedUrlArgs {
  url: string;
}

export function isPodcastByFeedUrlArgs(args: unknown): args is PodcastByFeedUrlArgs {
  if (!args || typeof args !== "object") return false;
  const { url } = args as PodcastByFeedUrlArgs;
  return typeof url === "string";
}

export interface PodcastByFeedIdArgs {
  id: number;
}

export function isPodcastByFeedIdArgs(args: unknown): args is PodcastByFeedIdArgs {
  if (!args || typeof args !== "object") return false;
  const { id } = args as PodcastByFeedIdArgs;
  return typeof id === "number";
}

export interface TrendingPodcastsArgs {
  max?: number;
  lang?: string;
  cat?: string;
  since?: number;
}

export function isTrendingPodcastsArgs(args: unknown): args is TrendingPodcastsArgs {
  if (!args || typeof args !== "object") return false;
  const { max, lang, cat, since } = args as TrendingPodcastsArgs;
  return (
    (max === undefined || typeof max === "number") &&
    (lang === undefined || typeof lang === "string") &&
    (cat === undefined || typeof cat === "string") &&
    (since === undefined || typeof since === "number")
  );
}

export interface EpisodesByFeedIdArgs {
  id: number;
  max?: number;
  since?: number;
  fulltext?: boolean;
}

export function isEpisodesByFeedIdArgs(args: unknown): args is EpisodesByFeedIdArgs {
  if (!args || typeof args !== "object") return false;
  const { id, max, since, fulltext } = args as EpisodesByFeedIdArgs;
  return (
    typeof id === "number" &&
    (max === undefined || typeof max === "number") &&
    (since === undefined || typeof since === "number") &&
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
  if (!args || typeof args !== "object") return false;
  const { max, excludeString, before, fulltext } = args as RecentEpisodesArgs;
  return (
    (max === undefined || typeof max === "number") &&
    (excludeString === undefined || typeof excludeString === "string") &&
    (before === undefined || typeof before === "number") &&
    (fulltext === undefined || typeof fulltext === "boolean")
  );
}

export interface CategoriesListArgs {}

export function isCategoriesListArgs(args: unknown): args is CategoriesListArgs {
  return args !== null && typeof args === "object";
}

/**
 * Typed error hierarchy for the Podcast Index API client.
 *
 * `PodcastIndexApiClient` maps every HTTP failure to one of these classes
 * based on status code (see `mapHttpStatusToError`), so callers can branch
 * on error type with `instanceof` instead of parsing status codes out of a
 * generic message. `ToolHandlers` catches `PodcastIndexError` and surfaces
 * `error.message` directly in the MCP `isError` response — each subclass
 * builds its own fully-formatted, human-readable message so that formatting
 * logic lives in one place.
 */

export class PodcastIndexError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PodcastIndexError";
    this.status = status;
    Object.setPrototypeOf(this, PodcastIndexError.prototype);
  }
}

/** HTTP 401/403 — bad, missing, or expired API credentials. */
export class AuthenticationError extends PodcastIndexError {
  constructor(detail: string, status: number) {
    super(
      `Authentication error (${status}): ${detail}. Check that PODCASTINDEX_API_KEY and PODCASTINDEX_API_SECRET are correct.`,
      status
    );
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/** HTTP 429 — too many requests against the Podcast Index API. */
export class RateLimitError extends PodcastIndexError {
  constructor(detail: string, status: number) {
    super(
      `Rate limit error (${status}): ${detail}. Slow down requests to the Podcast Index API and try again shortly.`,
      status
    );
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/** HTTP 400 — malformed or invalid request parameters. */
export class ValidationError extends PodcastIndexError {
  constructor(detail: string, status: number) {
    super(
      `Validation error (${status}): ${detail}. Check the arguments passed to this tool.`,
      status
    );
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/** HTTP 404 — the requested resource does not exist in the index. */
export class NotFoundError extends PodcastIndexError {
  constructor(detail: string, status: number) {
    super(`Not found (${status}): ${detail}.`, status);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/** HTTP 5xx — failure on the Podcast Index API's side. */
export class ServerError extends PodcastIndexError {
  constructor(detail: string, status: number) {
    super(
      `Server error (${status}): ${detail}. The Podcast Index API may be experiencing issues — try again later.`,
      status
    );
    this.name = "ServerError";
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Maps an HTTP status code + error detail string to the appropriate typed
 * error. Falls back to the base `PodcastIndexError` (preserving the original
 * "API error (<status>): <detail>" wording) for status codes outside the
 * mapped classes, or when no status is available (e.g. network failures).
 */
export function mapHttpStatusToError(status: number | undefined, detail: string): PodcastIndexError {
  if (status === 401 || status === 403) return new AuthenticationError(detail, status);
  if (status === 429) return new RateLimitError(detail, status);
  if (status === 400) return new ValidationError(detail, status);
  if (status === 404) return new NotFoundError(detail, status);
  if (status !== undefined && status >= 500) return new ServerError(detail, status);
  return new PodcastIndexError(`API error (${status ?? "unknown"}): ${detail}`, status);
}

/**
 * Pulls a human-readable detail string out of an Axios error response body.
 *
 * The Podcast Index API is inconsistent about response shape: most error
 * bodies are JSON objects (`{ status, description }`), but some — notably
 * 401s — are sent as a bare string despite the `Content-Type` header
 * claiming `application/json` (confirmed against the live API: a request
 * with no auth headers returns the plain-text body "Authorization header
 * value either not set or blank...", not `{ description: "..." }`).
 * Assuming the object shape unconditionally silently discards that message
 * and falls back to Axios's generic "Request failed with status code NNN".
 */
export function extractErrorDetail(responseData: unknown, fallback: string): string {
  if (typeof responseData === "string" && responseData.length > 0) return responseData;
  if (responseData && typeof responseData === "object" && "description" in responseData) {
    const description = (responseData as { description?: unknown }).description;
    if (typeof description === "string" && description.length > 0) return description;
  }
  return fallback;
}

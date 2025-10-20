/**
 * Core types for overlay system (GitHub/GitLab PR, CI, tags)
 * Read-only, privacy-first integration with rate-limit safety
 */

/**
 * Rate limit information from API headers
 */
export interface RateLimitInfo {
  /** Remaining requests in current window */
  remaining: number;
  /** Total requests allowed in window */
  limit: number;
  /** Unix timestamp when limit resets */
  reset: number;
  /** Optional: requests used in current window */
  used?: number;
}

/**
 * HTTP response with caching metadata
 */
export interface CachedResponse<T> {
  /** Response data */
  data: T;
  /** ETag for conditional requests */
  etag?: string;
  /** Rate limit information */
  rateLimit?: RateLimitInfo;
  /** Response timestamp */
  timestamp: number;
}

/**
 * Cache entry with TTL
 */
export interface CacheEntry<T> {
  /** Cached response data */
  response: CachedResponse<T>;
  /** Time to live in milliseconds */
  ttl: number;
  /** Entry creation timestamp */
  createdAt: number;
}

/**
 * Pull request metadata
 */
export interface PullRequestMetadata {
  /** PR number */
  number: number;
  /** PR title */
  title: string;
  /** PR state */
  state: "open" | "closed" | "merged";
  /** PR URL */
  url: string;
  /** Commit SHA associated with PR */
  sha?: string;
}

/**
 * CI/Check status
 */
export interface CheckStatus {
  /** Check status */
  status: "success" | "failure" | "pending" | "error" | "neutral";
  /** Check context/name */
  context: string;
  /** Optional target URL */
  targetUrl?: string;
}

/**
 * Overlay provider configuration
 */
export interface OverlayConfig {
  /** Provider type */
  provider: "github" | "gitlab";
  /** API base URL */
  baseUrl: string;
  /** OAuth token (in-memory only) */
  token?: string;
  /** Repository owner/org */
  owner: string;
  /** Repository name */
  repo: string;
  /** Enable overlay globally */
  enabled: boolean;
}

/**
 * Backoff configuration
 */
export interface BackoffConfig {
  /** Initial delay in ms */
  initialDelay: number;
  /** Maximum delay in ms */
  maxDelay: number;
  /** Multiplier for exponential backoff */
  multiplier: number;
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Add random jitter */
  jitter: boolean;
}

/**
 * Request options with caching
 */
export interface RequestOptions {
  /** Force refresh (ignore cache) */
  forceRefresh?: boolean;
  /** Custom cache TTL in ms */
  cacheTtl?: number;
  /** Abort signal */
  signal?: AbortSignal;
}

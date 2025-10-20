/**
 * HTTP client with ETag support, rate limit handling, and caching
 * Supports conditional requests (If-None-Match) to minimize quota usage
 */

import type { CachedResponse, RateLimitInfo, RequestOptions } from "./types";
import { overlayCache } from "./cache/overlay-cache";
import {
  retryWithBackoff,
  isRetryableHttpError,
  parseRetryAfter,
  DEFAULT_BACKOFF_CONFIG,
} from "./backoff";

/**
 * HTTP error with status code and response
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public response?: Response
  ) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = "HttpError";
  }
}

/**
 * Rate limit exceeded error with retry information
 */
export class RateLimitError extends HttpError {
  constructor(
    public retryAfter: number | null,
    public rateLimit: RateLimitInfo | null,
    response?: Response
  ) {
    super(
      429,
      retryAfter
        ? `Rate limit exceeded. Retry after ${retryAfter}ms`
        : "Rate limit exceeded",
      response
    );
    this.name = "RateLimitError";
  }
}

/**
 * Parse rate limit headers from response
 * Supports both GitHub (X-RateLimit-*) and GitLab (RateLimit-*) formats
 */
export function parseRateLimitHeaders(
  headers: Headers
): RateLimitInfo | null {
  // Try GitHub headers first (X-RateLimit-*)
  const ghRemaining = headers.get("x-ratelimit-remaining");
  const ghLimit = headers.get("x-ratelimit-limit");
  const ghReset = headers.get("x-ratelimit-reset");

  if (ghRemaining && ghLimit && ghReset) {
    return {
      remaining: parseInt(ghRemaining, 10),
      limit: parseInt(ghLimit, 10),
      reset: parseInt(ghReset, 10),
      used: parseInt(headers.get("x-ratelimit-used") || "0", 10),
    };
  }

  // Try GitLab headers (RateLimit-*)
  const glRemaining = headers.get("ratelimit-remaining");
  const glLimit = headers.get("ratelimit-limit");
  const glReset = headers.get("ratelimit-reset");

  if (glRemaining && glLimit && glReset) {
    return {
      remaining: parseInt(glRemaining, 10),
      limit: parseInt(glLimit, 10),
      reset: parseInt(glReset, 10),
    };
  }

  return null;
}

/**
 * HTTP client for overlay API requests
 */
export class HttpClient {
  constructor(
    private baseUrl: string,
    private token?: string
  ) {}

  /**
   * Make GET request with caching and conditional request support
   */
  async get<T>(
    endpoint: string,
    cacheKey: string,
    options: RequestOptions = {}
  ): Promise<CachedResponse<T>> {
    const { forceRefresh = false, cacheTtl, signal } = options;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = overlayCache.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Use inflight collapse to avoid duplicate requests
    return overlayCache.withInflightCollapse(cacheKey + "-fetch", async () => {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: HeadersInit = {
        Accept: "application/json",
      };

      // Add authorization if token available
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      // Add conditional request header if we have ETag
      const etag = overlayCache.getETag(cacheKey);
      if (etag && !forceRefresh) {
        headers["If-None-Match"] = etag;
      }

      // Make request with retry logic
      const result = await retryWithBackoff(
        async () => {
          const res = await fetch(url, { headers, signal });

          // Handle 304 Not Modified - return cached response
          if (res.status === 304) {
            const cached = overlayCache.get<T>(cacheKey);
            if (cached) {
              // Update rate limit info from headers
              const rateLimit = parseRateLimitHeaders(res.headers);
              if (rateLimit) {
                return {
                  ...cached,
                  rateLimit,
                };
              }
              return cached;
            }
            // Shouldn't happen, but treat as error if no cache
            throw new HttpError(
              304,
              "Not Modified but no cached response",
              res
            );
          }

          // Handle rate limit (429)
          if (res.status === 429) {
            const retryAfter = parseRetryAfter(
              res.headers.get("retry-after")
            );
            const rateLimit = parseRateLimitHeaders(res.headers);
            throw new RateLimitError(retryAfter, rateLimit, res);
          }

          // Handle other errors
          if (!res.ok) {
            throw new HttpError(res.status, res.statusText, res);
          }

          return res;
        },
        DEFAULT_BACKOFF_CONFIG,
        (error) => isRetryableHttpError(error)
      );

      // If result is already a CachedResponse (from 304), return it
      if (result && typeof result === "object" && "data" in result) {
        return result as CachedResponse<T>;
      }

      // Parse response (result is a Response object here)
      const response = result as Response;
      const data = await response.json();
      const newEtag = response.headers.get("etag") || undefined;
      const rateLimit = parseRateLimitHeaders(response.headers);

      const cachedResponse: CachedResponse<T> = {
        data,
        etag: newEtag,
        rateLimit: rateLimit || undefined,
        timestamp: Date.now(),
      };

      // Cache the response
      overlayCache.set(cacheKey, cachedResponse, cacheTtl);

      return cachedResponse;
    });
  }

  /**
   * Update base URL
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  /**
   * Update token
   */
  setToken(token: string | undefined): void {
    this.token = token;
  }
}

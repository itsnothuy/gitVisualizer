/**
 * Exponential backoff with jitter for rate limit handling
 * Implements retry logic with configurable backoff strategy
 */

import type { BackoffConfig } from "./types";

/**
 * Default backoff configuration
 */
export const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  initialDelay: 1000, // 1 second
  maxDelay: 60000, // 60 seconds
  multiplier: 2,
  maxAttempts: 5,
  jitter: true,
};

/**
 * Calculate exponential backoff delay with optional jitter
 */
export function calculateBackoff(
  attempt: number,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG
): number {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.multiplier, attempt),
    config.maxDelay
  );

  if (config.jitter) {
    // Add random jitter: 0.5 to 1.5 times the delay
    return delay * (0.5 + Math.random());
  }

  return delay;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 * @param fn Function to retry
 * @param config Backoff configuration
 * @param shouldRetry Optional predicate to determine if error is retryable
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG,
  shouldRetry?: (error: unknown, attempt: number) => boolean
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(error, attempt)) {
        throw error;
      }

      // Don't delay on the last attempt
      if (attempt < config.maxAttempts - 1) {
        const delay = calculateBackoff(attempt, config);
        await sleep(delay);
      }
    }
  }

  // All attempts failed
  throw lastError;
}

/**
 * Check if an HTTP error is retryable (429, 5xx)
 */
export function isRetryableHttpError(error: unknown): boolean {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    const status = error.status;
    // Retry on 429 (rate limit) and 5xx (server errors)
    return status === 429 || (status >= 500 && status < 600);
  }
  return false;
}

/**
 * Parse Retry-After header value (seconds or HTTP date)
 */
export function parseRetryAfter(retryAfter: string | null): number | null {
  if (!retryAfter) {
    return null;
  }

  // Try parsing as integer (seconds)
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000; // Convert to milliseconds
  }

  // Try parsing as HTTP date
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }

  return null;
}

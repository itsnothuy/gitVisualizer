/**
 * Unit tests for exponential backoff logic
 */

import { describe, it, expect, vi } from "vitest";
import {
  calculateBackoff,
  parseRetryAfter,
  isRetryableHttpError,
  retryWithBackoff,
  DEFAULT_BACKOFF_CONFIG,
} from "../backoff";

describe("calculateBackoff", () => {
  it("should calculate exponential backoff without jitter", () => {
    const config = { ...DEFAULT_BACKOFF_CONFIG, jitter: false };

    expect(calculateBackoff(0, config)).toBe(1000); // 1s
    expect(calculateBackoff(1, config)).toBe(2000); // 2s
    expect(calculateBackoff(2, config)).toBe(4000); // 4s
    expect(calculateBackoff(3, config)).toBe(8000); // 8s
  });

  it("should respect maximum delay", () => {
    const config = {
      ...DEFAULT_BACKOFF_CONFIG,
      jitter: false,
      maxDelay: 5000,
    };

    expect(calculateBackoff(0, config)).toBe(1000);
    expect(calculateBackoff(1, config)).toBe(2000);
    expect(calculateBackoff(2, config)).toBe(4000);
    expect(calculateBackoff(3, config)).toBe(5000); // capped at maxDelay
    expect(calculateBackoff(10, config)).toBe(5000); // still capped
  });

  it("should add jitter when enabled", () => {
    const config = { ...DEFAULT_BACKOFF_CONFIG, jitter: true };

    // With jitter, result should be between 0.5x and 1.5x the base delay
    const result = calculateBackoff(0, config);
    expect(result).toBeGreaterThanOrEqual(500);
    expect(result).toBeLessThanOrEqual(1500);
  });

  it("should use custom multiplier", () => {
    const config = {
      ...DEFAULT_BACKOFF_CONFIG,
      jitter: false,
      multiplier: 3,
    };

    expect(calculateBackoff(0, config)).toBe(1000); // 1s
    expect(calculateBackoff(1, config)).toBe(3000); // 3s
    expect(calculateBackoff(2, config)).toBe(9000); // 9s
  });
});

describe("parseRetryAfter", () => {
  it("should parse integer seconds", () => {
    expect(parseRetryAfter("60")).toBe(60000); // 60 seconds in ms
    expect(parseRetryAfter("120")).toBe(120000);
  });

  it("should parse HTTP date format", () => {
    const futureDate = new Date(Date.now() + 5000).toUTCString();
    const result = parseRetryAfter(futureDate);

    expect(result).not.toBeNull();
    expect(result).toBeGreaterThan(4000);
    expect(result).toBeLessThan(6000);
  });

  it("should return null for invalid input", () => {
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter("invalid")).toBeNull();
  });

  it("should return 0 for past dates", () => {
    const pastDate = new Date(Date.now() - 5000).toUTCString();
    expect(parseRetryAfter(pastDate)).toBe(0);
  });
});

describe("isRetryableHttpError", () => {
  it("should return true for 429 status", () => {
    const error = { status: 429 };
    expect(isRetryableHttpError(error)).toBe(true);
  });

  it("should return true for 5xx status codes", () => {
    expect(isRetryableHttpError({ status: 500 })).toBe(true);
    expect(isRetryableHttpError({ status: 502 })).toBe(true);
    expect(isRetryableHttpError({ status: 503 })).toBe(true);
    expect(isRetryableHttpError({ status: 504 })).toBe(true);
  });

  it("should return false for 4xx client errors (except 429)", () => {
    expect(isRetryableHttpError({ status: 400 })).toBe(false);
    expect(isRetryableHttpError({ status: 401 })).toBe(false);
    expect(isRetryableHttpError({ status: 403 })).toBe(false);
    expect(isRetryableHttpError({ status: 404 })).toBe(false);
  });

  it("should return false for non-error objects", () => {
    expect(isRetryableHttpError(null)).toBe(false);
    expect(isRetryableHttpError(undefined)).toBe(false);
    expect(isRetryableHttpError("error")).toBe(false);
    expect(isRetryableHttpError({})).toBe(false);
  });
});

describe("retryWithBackoff", () => {
  it("should succeed on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("success");

    const result = await retryWithBackoff(fn);

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on retryable errors", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 500 })
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValue("success");

    const result = await retryWithBackoff(
      fn,
      {
        ...DEFAULT_BACKOFF_CONFIG,
        initialDelay: 10, // Fast for testing
        maxAttempts: 5,
      },
      isRetryableHttpError
    );

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should throw after max attempts", async () => {
    const fn = vi.fn().mockRejectedValue({ status: 500 });

    await expect(
      retryWithBackoff(
        fn,
        {
          ...DEFAULT_BACKOFF_CONFIG,
          initialDelay: 10,
          maxAttempts: 3,
        },
        isRetryableHttpError
      )
    ).rejects.toEqual({ status: 500 });

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should not retry non-retryable errors", async () => {
    const fn = vi.fn().mockRejectedValue({ status: 404 });

    await expect(
      retryWithBackoff(
        fn,
        {
          ...DEFAULT_BACKOFF_CONFIG,
          initialDelay: 10,
        },
        isRetryableHttpError
      )
    ).rejects.toEqual({ status: 404 });

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

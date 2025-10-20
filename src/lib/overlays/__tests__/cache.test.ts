/**
 * Unit tests for overlay cache with TTL and inflight request collapsing
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { overlayCache, generateCacheKey } from "../cache/overlay-cache";
import type { CachedResponse } from "../types";

describe("generateCacheKey", () => {
  it("should generate consistent key from components", () => {
    const key = generateCacheKey("github", "prs", "owner", "repo", "open");
    expect(key).toBe("github:prs:owner:repo:open");
  });

  it("should handle variable number of parameters", () => {
    expect(generateCacheKey("github", "status")).toBe("github:status");
    expect(generateCacheKey("github", "status", "owner")).toBe(
      "github:status:owner"
    );
    expect(generateCacheKey("github", "status", "owner", "repo", "sha")).toBe(
      "github:status:owner:repo:sha"
    );
  });
});

describe("OverlayCache", () => {
  beforeEach(() => {
    overlayCache.clear();
  });

  describe("get/set", () => {
    it("should store and retrieve cached response", () => {
      const key = "test-key";
      const response: CachedResponse<{ data: string }> = {
        data: { data: "test" },
        etag: "abc123",
        timestamp: Date.now(),
      };

      overlayCache.set(key, response);
      const cached = overlayCache.get<{ data: string }>(key);

      expect(cached).toEqual(response);
    });

    it("should return null for non-existent key", () => {
      const cached = overlayCache.get("non-existent");
      expect(cached).toBeNull();
    });

    it("should return null for expired entries", () => {
      const key = "expired-key";
      const response: CachedResponse<{ data: string }> = {
        data: { data: "test" },
        timestamp: Date.now(),
      };

      // Set with very short TTL
      overlayCache.set(key, response, 10);

      // Wait for expiration
      vi.useFakeTimers();
      vi.advanceTimersByTime(20);

      const cached = overlayCache.get(key);
      expect(cached).toBeNull();

      vi.useRealTimers();
    });
  });

  describe("getETag", () => {
    it("should retrieve ETag from cached response", () => {
      const key = "test-key";
      const response: CachedResponse<{ data: string }> = {
        data: { data: "test" },
        etag: "abc123",
        timestamp: Date.now(),
      };

      overlayCache.set(key, response);
      expect(overlayCache.getETag(key)).toBe("abc123");
    });

    it("should return null for missing ETag", () => {
      const key = "test-key";
      const response: CachedResponse<{ data: string }> = {
        data: { data: "test" },
        timestamp: Date.now(),
      };

      overlayCache.set(key, response);
      expect(overlayCache.getETag(key)).toBeNull();
    });

    it("should return null for non-existent key", () => {
      expect(overlayCache.getETag("non-existent")).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete cache entry", () => {
      const key = "test-key";
      const response: CachedResponse<{ data: string }> = {
        data: { data: "test" },
        timestamp: Date.now(),
      };

      overlayCache.set(key, response);
      expect(overlayCache.get(key)).not.toBeNull();

      overlayCache.delete(key);
      expect(overlayCache.get(key)).toBeNull();
    });

    it("should return false for non-existent key", () => {
      expect(overlayCache.delete("non-existent")).toBe(false);
    });
  });

  describe("clear", () => {
    it("should clear all entries", () => {
      const response: CachedResponse<{ data: string }> = {
        data: { data: "test" },
        timestamp: Date.now(),
      };

      overlayCache.set("key1", response);
      overlayCache.set("key2", response);
      overlayCache.set("key3", response);

      overlayCache.clear();

      expect(overlayCache.get("key1")).toBeNull();
      expect(overlayCache.get("key2")).toBeNull();
      expect(overlayCache.get("key3")).toBeNull();
    });
  });

  describe("getStats", () => {
    it("should return cache statistics", () => {
      const response: CachedResponse<{ data: string }> = {
        data: { data: "test" },
        timestamp: Date.now(),
      };

      overlayCache.set("key1", response);
      overlayCache.set("key2", response);

      const stats = overlayCache.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.inflightRequests).toBe(0);
    });

    it("should count expired entries", () => {
      vi.useFakeTimers();

      const response: CachedResponse<{ data: string }> = {
        data: { data: "test" },
        timestamp: Date.now(),
      };

      overlayCache.set("key1", response, 100);
      overlayCache.set("key2", response, 100);

      vi.advanceTimersByTime(150);

      const stats = overlayCache.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.expiredEntries).toBe(2);

      vi.useRealTimers();
    });
  });

  describe("clearExpired", () => {
    it("should remove expired entries", () => {
      vi.useFakeTimers();

      const response: CachedResponse<{ data: string }> = {
        data: { data: "test" },
        timestamp: Date.now(),
      };

      overlayCache.set("key1", response, 100);
      overlayCache.set("key2", response, 100);
      overlayCache.set("key3", response, 10000); // Long TTL

      vi.advanceTimersByTime(150);

      const cleared = overlayCache.clearExpired();
      expect(cleared).toBe(2);

      expect(overlayCache.get("key1")).toBeNull();
      expect(overlayCache.get("key2")).toBeNull();
      expect(overlayCache.get("key3")).not.toBeNull();

      vi.useRealTimers();
    });
  });

  describe("withInflightCollapse", () => {
    it("should execute function and return result", async () => {
      const fn = vi.fn().mockResolvedValue("result");

      const result = await overlayCache.withInflightCollapse("key", fn);

      expect(result).toBe("result");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should collapse duplicate inflight requests", async () => {
      let resolveCount = 0;
      const fn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        resolveCount++;
        return `result-${resolveCount}`;
      });

      // Start multiple requests simultaneously
      const promise1 = overlayCache.withInflightCollapse("key", fn);
      const promise2 = overlayCache.withInflightCollapse("key", fn);
      const promise3 = overlayCache.withInflightCollapse("key", fn);

      const [result1, result2, result3] = await Promise.all([
        promise1,
        promise2,
        promise3,
      ]);

      // All should get the same result from the single execution
      expect(result1).toBe("result-1");
      expect(result2).toBe("result-1");
      expect(result3).toBe("result-1");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should allow new requests after previous completes", async () => {
      const fn = vi.fn().mockResolvedValue("result");

      const result1 = await overlayCache.withInflightCollapse("key", fn);
      const result2 = await overlayCache.withInflightCollapse("key", fn);

      expect(result1).toBe("result");
      expect(result2).toBe("result");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should clean up inflight tracking on error", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("test error"));

      await expect(
        overlayCache.withInflightCollapse("key", fn)
      ).rejects.toThrow("test error");

      const stats = overlayCache.getStats();
      expect(stats.inflightRequests).toBe(0);
    });
  });
});

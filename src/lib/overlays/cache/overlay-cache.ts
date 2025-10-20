/**
 * Cache layer for overlay responses with TTL and ETag support
 * Collapses duplicate inflight requests to same resource
 */

import type { CacheEntry, CachedResponse } from "../types";

/**
 * Default TTL for cache entries (5 minutes)
 */
export const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

/**
 * In-memory cache for overlay responses
 * Uses Map for O(1) lookups, with automatic expiration
 */
class OverlayCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inflightRequests = new Map<string, Promise<unknown>>();

  /**
   * Get cached response if valid (not expired)
   */
  get<T>(key: string): CachedResponse<T> | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const age = Date.now() - entry.createdAt;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(
    key: string,
    response: CachedResponse<T>,
    ttl: number = DEFAULT_CACHE_TTL
  ): void {
    const entry: CacheEntry<T> = {
      response,
      ttl,
      createdAt: Date.now(),
    };

    this.cache.set(key, entry as CacheEntry<unknown>);
  }

  /**
   * Get ETag for conditional request
   */
  getETag(key: string): string | null {
    const cached = this.get(key);
    return cached?.etag || null;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.inflightRequests.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    inflightRequests: number;
  } {
    let expiredEntries = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      const age = now - entry.createdAt;
      if (age > entry.ttl) {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries,
      inflightRequests: this.inflightRequests.size,
    };
  }

  /**
   * Clear expired entries (manual cleanup)
   */
  clearExpired(): number {
    let cleared = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.createdAt;
      if (age > entry.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Collapse duplicate inflight requests
   * Returns existing promise if request is already in flight
   */
  async withInflightCollapse<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // Check if request is already in flight
    const existing = this.inflightRequests.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    // Execute request and track it
    const promise = fn().finally(() => {
      // Clean up inflight tracking when done
      this.inflightRequests.delete(key);
    });

    this.inflightRequests.set(key, promise);
    return promise;
  }
}

/**
 * Singleton cache instance
 */
export const overlayCache = new OverlayCache();

/**
 * Generate cache key from components
 */
export function generateCacheKey(
  provider: string,
  resource: string,
  ...params: string[]
): string {
  return [provider, resource, ...params].join(":");
}

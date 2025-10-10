/**
 * Layout cache module for storing ELK layout results
 * Uses IndexedDB for persistent caching keyed by commit OIDs + layout params
 */

import type { ElkNode } from "elkjs";

export interface LayoutCacheKey {
  nodeIds: string[]; // sorted array of node IDs (commit OIDs)
  layoutOptions: string; // JSON stringified layout options
}

export interface LayoutCacheEntry {
  key: string;
  layout: ElkNode;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

const DB_NAME = "git-viz-cache";
const STORE_NAME = "layout-cache";
const DB_VERSION = 1;
const DEFAULT_TTL = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Generate a cache key from node IDs and layout options
 */
export function generateCacheKey(key: LayoutCacheKey): string {
  const sortedIds = [...key.nodeIds].sort();
  return `${sortedIds.join(",")}:${key.layoutOptions}`;
}

/**
 * Open IndexedDB connection
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

/**
 * Cache layout result
 */
export async function cacheLayout(
  key: LayoutCacheKey,
  layout: ElkNode,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  const db = await openDB();
  const cacheKey = generateCacheKey(key);
  const entry: LayoutCacheEntry = {
    key: cacheKey,
    layout,
    timestamp: Date.now(),
    ttl,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(entry);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve cached layout
 */
export async function getCachedLayout(
  key: LayoutCacheKey
): Promise<ElkNode | null> {
  const db = await openDB();
  const cacheKey = generateCacheKey(key);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(cacheKey);

    request.onsuccess = () => {
      const entry = request.result as LayoutCacheEntry | undefined;
      if (!entry) {
        resolve(null);
        return;
      }

      // Check if entry has expired
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) {
        // Entry expired, remove it
        const deleteTransaction = db.transaction([STORE_NAME], "readwrite");
        const deleteStore = deleteTransaction.objectStore(STORE_NAME);
        deleteStore.delete(cacheKey);
        resolve(null);
        return;
      }

      resolve(entry.layout);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  const db = await openDB();
  let cleared = 0;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const entry = cursor.value as LayoutCacheEntry;
        const age = Date.now() - entry.timestamp;
        if (age > entry.ttl) {
          cursor.delete();
          cleared++;
        }
        cursor.continue();
      } else {
        resolve(cleared);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all cache entries
 */
export async function clearAllCache(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  expiredEntries: number;
}> {
  const db = await openDB();
  let totalEntries = 0;
  let expiredEntries = 0;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        totalEntries++;
        const entry = cursor.value as LayoutCacheEntry;
        const age = Date.now() - entry.timestamp;
        if (age > entry.ttl) {
          expiredEntries++;
        }
        cursor.continue();
      } else {
        resolve({ totalEntries, expiredEntries });
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Permalink utilities for sharing sandbox scenarios
 * Handles base64 encoding/decoding and URL generation
 */

import type { GitStateSnapshot } from '@/tutorial/types';

const MAX_URL_LENGTH = 2000; // Safe limit for URLs across browsers
const URL_PARAM_KEY = 'state';

/**
 * Encode GitStateSnapshot to base64 for URL
 */
export function encodeStateToBase64(snapshot: GitStateSnapshot): string {
  const json = JSON.stringify(snapshot);
  // Use btoa for base64 encoding (browser-native)
  return btoa(json);
}

/**
 * Decode base64 string to GitStateSnapshot
 */
export function decodeStateFromBase64(encoded: string): GitStateSnapshot {
  try {
    const json = atob(encoded);
    return JSON.parse(json);
  } catch (error) {
    throw new Error(
      `Failed to decode state: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate a shareable URL with encoded state
 * Returns null if state is too large for URL
 */
export function generatePermalink(
  snapshot: GitStateSnapshot,
  baseUrl: string
): { url: string; isTruncated: boolean } | null {
  const encoded = encodeStateToBase64(snapshot);
  const url = `${baseUrl}?${URL_PARAM_KEY}=${encodeURIComponent(encoded)}`;

  if (url.length > MAX_URL_LENGTH) {
    return null; // State too large for URL
  }

  return {
    url,
    isTruncated: false,
  };
}

/**
 * Parse GitStateSnapshot from URL parameters
 */
export function parsePermalink(urlString: string): GitStateSnapshot | null {
  try {
    const url = new URL(urlString);
    const encoded = url.searchParams.get(URL_PARAM_KEY);

    if (!encoded) {
      return null;
    }

    return decodeStateFromBase64(decodeURIComponent(encoded));
  } catch (error) {
    console.error('Failed to parse permalink:', error);
    return null;
  }
}

/**
 * Get state from current window location
 */
export function getStateFromCurrentURL(): GitStateSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return parsePermalink(window.location.href);
}

/**
 * Compress state for URL by removing optional fields
 */
export function compressStateForURL(
  snapshot: GitStateSnapshot
): GitStateSnapshot {
  return {
    commits: snapshot.commits.map((c) => ({
      id: c.id,
      parents: c.parents,
      message: c.message,
      // Remove optional fields to save space
      timestamp: c.timestamp,
    })),
    branches: snapshot.branches,
    tags: snapshot.tags.length > 0 ? snapshot.tags : [],
    head: snapshot.head,
  };
}

/**
 * Estimate URL size for a state
 */
export function estimateURLSize(
  snapshot: GitStateSnapshot,
  baseUrl: string
): number {
  const encoded = encodeStateToBase64(snapshot);
  return baseUrl.length + URL_PARAM_KEY.length + encoded.length + 2; // +2 for "?="
}

/**
 * Check if state can fit in URL
 */
export function canFitInURL(
  snapshot: GitStateSnapshot,
  baseUrl: string
): boolean {
  return estimateURLSize(snapshot, baseUrl) <= MAX_URL_LENGTH;
}

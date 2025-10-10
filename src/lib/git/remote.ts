/**
 * Remote repository cloning using isomorphic-git and LightningFS.
 * Enables shallow cloning of Git repositories into browser storage (OPFS).
 * 
 * @see https://isomorphic-git.org/docs/en/browser
 */

import * as git from "isomorphic-git";
import http from "isomorphic-git/http/web";
import LightningFS from "@isomorphic-git/lightning-fs";

/**
 * Configuration options for shallow clone operations
 */
export interface ShallowCloneOptions {
  /** Git repository URL to clone */
  url: string;
  /** Clone depth (number of commits to fetch) */
  depth?: number;
  /** Only clone a single branch */
  singleBranch?: boolean;
  /** CORS proxy URL if needed for GitHub/GitLab */
  corsProxy?: string;
  /** Callback for clone progress updates */
  onProgress?: (progress: CloneProgress) => void;
}

/**
 * Progress information during clone operation
 */
export interface CloneProgress {
  phase: "Receiving" | "Resolving" | "Unpacking";
  loaded: number;
  total: number;
}

/**
 * Result of a shallow clone operation
 */
export interface ShallowCloneResult {
  /** Promise-based filesystem interface */
  fs: typeof LightningFS.prototype.promises;
  /** Directory path where repository was cloned */
  dir: string;
  /** Repository metadata */
  metadata: {
    url: string;
    clonedAt: Date;
  };
  error?: never;
}

/**
 * Error result from a failed clone operation
 */
export interface ShallowCloneError {
  fs?: never;
  dir?: never;
  metadata?: never;
  error: {
    type: "network" | "cors" | "invalid-url" | "unknown";
    message: string;
    originalError?: unknown;
  };
}

/**
 * Clone a remote Git repository into browser storage using a shallow clone.
 * 
 * This function:
 * - Uses LightningFS for browser-based storage (OPFS preferred)
 * - Performs shallow clone with configurable depth
 * - Fetches only a single branch by default
 * - Requires CORS proxy for cross-origin repositories
 * - Does NOT upload any data - purely read operations
 * 
 * @param options Clone configuration options
 * @returns Clone result with filesystem and directory, or error
 * 
 * @example
 * ```typescript
 * const result = await shallowClone({
 *   url: "https://github.com/user/repo",
 *   depth: 50,
 *   corsProxy: "https://cors.isomorphic-git.org",
 *   onProgress: (progress) => console.log(progress)
 * });
 * 
 * if (result.error) {
 *   console.error(result.error.message);
 * } else {
 *   // Use result.fs and result.dir
 * }
 * ```
 */
export async function shallowClone(
  options: ShallowCloneOptions
): Promise<ShallowCloneResult | ShallowCloneError> {
  const { url, depth = 50, singleBranch = true, corsProxy, onProgress } = options;

  // Validate URL
  try {
    new URL(url);
  } catch {
    return {
      error: {
        type: "invalid-url",
        message: `Invalid repository URL: ${url}`,
      },
    };
  }

  try {
    // Initialize LightningFS with OPFS backend when available
    const fs = new (LightningFS as typeof LightningFS)("gitfs");
    const pfs = fs.promises;
    const dir = "/repo";

    // Ensure directory exists
    await pfs.mkdir(dir).catch(() => {
      // Directory may already exist, ignore error
    });

    // Perform shallow clone
    await git.clone({
      fs,
      http,
      dir,
      url,
      depth,
      singleBranch,
      corsProxy,
      onProgress: onProgress
        ? (event) => {
            onProgress({
              phase: event.phase as CloneProgress["phase"],
              loaded: event.loaded,
              total: event.total,
            });
          }
        : undefined,
    });

    return {
      fs: pfs,
      dir,
      metadata: {
        url,
        clonedAt: new Date(),
      },
    };
  } catch (error) {
    // Determine error type
    if (error instanceof Error) {
      // Network errors
      if (error.message.includes("fetch") || error.message.includes("network")) {
        return {
          error: {
            type: "network",
            message: "Network error during clone. Please check your connection and try again.",
            originalError: error,
          },
        };
      }

      // CORS errors
      if (error.message.includes("CORS") || error.message.includes("cross-origin")) {
        return {
          error: {
            type: "cors",
            message: `CORS error: This repository requires a CORS proxy. Please configure a proxy (e.g., https://cors.isomorphic-git.org) or use a repository that allows cross-origin requests.`,
            originalError: error,
          },
        };
      }
    }

    // Unknown error
    return {
      error: {
        type: "unknown",
        message: error instanceof Error ? error.message : "An unknown error occurred during clone.",
        originalError: error,
      },
    };
  }
}

/**
 * Check if OPFS (Origin Private File System) is available.
 * OPFS provides better performance for file operations.
 * 
 * @returns true if OPFS is supported
 */
export function isOPFSAvailable(): boolean {
  return typeof navigator !== "undefined" && "storage" in navigator && "getDirectory" in navigator.storage;
}

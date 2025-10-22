/**
 * File System Access API integration for local repository ingestion.
 * Provides privacy-first local directory access with clear permission handling.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/File_System_API
 */

/**
 * Check if File System Access API is supported in the current browser.
 * 
 * @returns true if showDirectoryPicker is available
 */
export function isFileSystemAccessSupported(): boolean {
  const isSupported = typeof window !== "undefined" && "showDirectoryPicker" in window;
  console.log("🔧 isFileSystemAccessSupported:", isSupported, {
    hasWindow: typeof window !== "undefined",
    hasShowDirectoryPicker: typeof window !== "undefined" && "showDirectoryPicker" in window,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A"
  });
  return isSupported;
}

/**
 * Permission states for File System Access API
 */
export type PermissionState = "granted" | "denied" | "prompt";

/**
 * Result of attempting to pick a local repository directory
 */
export interface PickRepositoryResult {
  handle: FileSystemDirectoryHandle | null;
  error?: {
    type: "unsupported" | "permission-denied" | "user-cancelled" | "unknown";
    message: string;
  };
}

/**
 * Prompt user to open a local repository folder using File System Access API.
 * 
 * This function:
 * - Feature-detects File System Access API support
 * - Presents a directory picker with clear permission prompts
 * - Handles permission denial and user cancellation gracefully
 * - Does NOT persist handles or file contents by default
 * 
 * @returns Result object with handle or error information
 * 
 * @example
 * ```typescript
 * const result = await pickLocalRepoDir();
 * if (result.handle) {
 *   // Use the directory handle
 * } else if (result.error) {
 *   console.error(result.error.message);
 * }
 * ```
 */
export async function pickLocalRepoDir(): Promise<PickRepositoryResult> {
  console.log("🔧 pickLocalRepoDir: Starting directory picker...");
  
  // Check browser support
  if (!isFileSystemAccessSupported()) {
    console.log("🔧 pickLocalRepoDir: File System Access API not supported");
    return {
      handle: null,
      error: {
        type: "unsupported",
        message: "File System Access API is not supported in this browser. Please use Chrome 86+, Edge 86+, or another compatible browser.",
      },
    };
  }

  console.log("🔧 pickLocalRepoDir: File System Access API is supported, showing directory picker...");

  try {
    // Prompt user with directory picker
    // Note: Permission is requested at picker invocation, not persisted
    const handle = await window.showDirectoryPicker({
      mode: "read", // Request read-only access initially
      startIn: "documents", // Suggest starting location
    });
    
    console.log("🔧 pickLocalRepoDir: Directory picker successful, got handle:", handle.name);
    return { handle };
  } catch (error) {
    console.log("🔧 pickLocalRepoDir: Directory picker failed with error:", error);
    
    // Handle various error cases
    if (error instanceof Error) {
      // User cancelled the picker
      if (error.name === "AbortError") {
        console.log("🔧 pickLocalRepoDir: User cancelled directory selection");
        return {
          handle: null,
          error: {
            type: "user-cancelled",
            message: "Directory selection was cancelled.",
          },
        };
      }
      
      // Permission denied
      if (error.name === "NotAllowedError" || error.name === "SecurityError") {
        console.log("🔧 pickLocalRepoDir: Permission denied:", error.name);
        return {
          handle: null,
          error: {
            type: "permission-denied",
            message: "Permission to access the directory was denied. Please grant permission to visualize your repository.",
          },
        };
      }
    }
    
    // Unknown error
    return {
      handle: null,
      error: {
        type: "unknown",
        message: error instanceof Error ? error.message : "An unknown error occurred while selecting the directory.",
      },
    };
  }
}

/**
 * Verify that a directory handle points to a valid Git repository.
 * 
 * @param handle Directory handle to verify
 * @returns true if the directory contains a .git folder
 */
export async function isGitRepository(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    // Check if .git directory exists
    await handle.getDirectoryHandle(".git");
    return true;
  } catch {
    return false;
  }
}

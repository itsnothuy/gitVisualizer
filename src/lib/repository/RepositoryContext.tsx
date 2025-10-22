"use client";

/**
 * Repository Context Provider - State management for repository processing
 * 
 * This context provides:
 * - Repository loading and processing state
 * - Actions to load repositories from FileSystemDirectoryHandle
 * - Error handling and loading states
 * - Access to processed repository data and DAG
 * 
 * Privacy-first: All processing happens in-browser, no data leaves the device.
 */

import React, { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { processLocalRepository, type ProcessedRepository, type ProcessProgress } from "../git/processor";
import { processGitHubRepository } from "../github/processor";
import { parseGitHubUrl } from "../github/url-parser";

/**
 * Reference to a recently accessed repository
 */
export interface RepositoryReference {
  /** Unique identifier (repository path/name) */
  id: string;
  /** Repository display name */
  name: string;
  /** When the repository was last accessed */
  lastAccessed: Date;
  /** Commit count */
  commitCount: number;
  /** Branch count */
  branchCount: number;
  /** Source type */
  source: 'local' | 'github';
}

/**
 * Repository context value interface
 */
export interface RepositoryContextValue {
  /** Currently loaded repository (null if none loaded) */
  currentRepository: ProcessedRepository | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message (null if no error) */
  error: string | null;
  /** Progress information during loading */
  progress: ProcessProgress | null;
  /** Directory handle of current repository */
  handle: FileSystemDirectoryHandle | null;
  /** Recently accessed repositories */
  recentRepositories: RepositoryReference[];
  /** Repository source type */
  repositorySource: 'local' | 'github' | null;

  /** Load a repository from FileSystemDirectoryHandle */
  loadRepository: (handle: FileSystemDirectoryHandle, options?: LoadRepositoryOptions) => Promise<void>;
  /** Load a repository from GitHub URL */
  loadFromUrl: (url: string, token?: string) => Promise<void>;
  /** Load a GitHub repository by owner and name */
  loadGitHubRepository: (owner: string, name: string, token?: string) => Promise<void>;
  /** Clear the current repository */
  clearRepository: () => void;
  /** Clear the error state */
  clearError: () => void;
  /** Switch to a recent repository by ID */
  switchToRecent: (id: string) => Promise<void>;
}

/**
 * Options for loading a repository
 */
export interface LoadRepositoryOptions {
  /** Maximum number of commits to process */
  maxCommits?: number;
  /** Enable LFS detection */
  detectLFS?: boolean;
}

/**
 * Create the context with undefined default
 */
const RepositoryContext = createContext<RepositoryContextValue | undefined>(undefined);

/**
 * Hook to access the repository context
 * 
 * @throws Error if used outside of RepositoryProvider
 */
export function useRepository(): RepositoryContextValue {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error("useRepository must be used within a RepositoryProvider");
  }
  return context;
}

/**
 * Props for RepositoryProvider
 */
export interface RepositoryProviderProps {
  children: ReactNode;
}

// Maximum number of recent repositories to track
const MAX_RECENT_REPOS = 5;

/**
 * Repository Provider Component
 * 
 * Wraps the application to provide repository state management.
 * 
 * @example
 * ```tsx
 * <RepositoryProvider>
 *   <App />
 * </RepositoryProvider>
 * ```
 */
export function RepositoryProvider({ children }: RepositoryProviderProps): React.ReactElement {
  const [currentRepository, setCurrentRepository] = useState<ProcessedRepository | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProcessProgress | null>(null);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [recentRepositories, setRecentRepositories] = useState<RepositoryReference[]>([]);
  const [repositorySource, setRepositorySource] = useState<'local' | 'github' | null>(null);

  // Store mapping of repository IDs to their handles
  const [handleCache] = useState<Map<string, FileSystemDirectoryHandle>>(new Map());

  /**
   * Add or update a repository in the recent list
   */
  const addToRecent = useCallback((repo: ProcessedRepository, dirHandle: FileSystemDirectoryHandle | null, source: 'local' | 'github') => {
    const id = repo.metadata.name || (dirHandle ? dirHandle.name : repo.metadata.name);

    const reference: RepositoryReference = {
      id,
      name: repo.metadata.name,
      lastAccessed: new Date(),
      commitCount: repo.metadata.commitCount,
      branchCount: repo.metadata.branchCount,
      source,
    };

    setRecentRepositories(prev => {
      // Remove if already exists
      const filtered = prev.filter(r => r.id !== id);
      // Add to front
      const updated = [reference, ...filtered];
      // Limit to MAX_RECENT_REPOS
      return updated.slice(0, MAX_RECENT_REPOS);
    });

    // Cache the handle if provided
    if (dirHandle) {
      handleCache.set(id, dirHandle);
    }
  }, [handleCache]);

  /**
   * Load a repository from a FileSystemDirectoryHandle
   */
  const loadRepository = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    options: LoadRepositoryOptions = {}
  ): Promise<void> => {
    console.log("📁 Repository Context: Starting repository load...", dirHandle.name);

    // Clear previous state
    setError(null);
    setProgress(null);
    setCurrentRepository(null);
    setIsLoading(true);
    setHandle(dirHandle);

    try {
      console.log("📁 Repository Context: Setting up progress callback...");

      // Progress callback
      const onProgress = (progressInfo: ProcessProgress) => {
        console.log("📁 Repository Context: Progress update:", progressInfo);
        setProgress(progressInfo);
      };

      console.log("📁 Repository Context: Starting processLocalRepository...");

      // Process the repository
      const processed = await processLocalRepository(dirHandle, {
        maxCommits: options.maxCommits,
        detectLFS: options.detectLFS ?? true,
        onProgress,
      });

      console.log("📁 Repository Context: Processing completed successfully:", processed);

      // Update state with processed repository
      setCurrentRepository(processed);
      setRepositorySource('local');
      setProgress({
        phase: "complete",
        percentage: 100,
        message: "Repository loaded successfully",
      });

      console.log("📁 Repository Context: Adding to recent repositories...");
      // Add to recent repositories
      addToRecent(processed, dirHandle, 'local');

      console.log("📁 Repository Context: Repository load completed successfully!");
    } catch (err) {
      console.error("📁 Repository Context: Error during repository load:", err);

      // Handle errors
      const errorMessage = err instanceof Error ? err.message : "Failed to load repository";
      setError(errorMessage);
      setCurrentRepository(null);
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  }, [addToRecent]);

  /**
   * Load a repository from GitHub URL
   */
  const loadFromUrl = useCallback(async (url: string, token?: string): Promise<void> => {
    console.log("📁 Repository Context: Starting GitHub URL load...", url);

    setError(null);
    setProgress(null);
    setCurrentRepository(null);
    setIsLoading(true);
    setHandle(null);

    try {
      const parsed = parseGitHubUrl(url);
      const processed = await processGitHubRepository(parsed.owner, parsed.name, {
        token,
        onProgress: setProgress,
      });

      setCurrentRepository(processed);
      setRepositorySource('github');
      setProgress({
        phase: "complete",
        percentage: 100,
        message: "Repository loaded successfully",
      });
      addToRecent(processed, null, 'github');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load repository";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [addToRecent]);

  /**
   * Load a GitHub repository by owner and name
   */
  const loadGitHubRepository = useCallback(async (
    owner: string,
    name: string,
    token?: string
  ): Promise<void> => {
    console.log("📁 Repository Context: Starting GitHub repository load...", owner, name);

    setError(null);
    setProgress(null);
    setCurrentRepository(null);
    setIsLoading(true);
    setHandle(null);

    try {
      const processed = await processGitHubRepository(owner, name, {
        token,
        onProgress: setProgress,
      });

      setCurrentRepository(processed);
      setRepositorySource('github');
      setProgress({
        phase: "complete",
        percentage: 100,
        message: "Repository loaded successfully",
      });
      addToRecent(processed, null, 'github');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load repository";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [addToRecent]);

  /**
   * Clear the current repository
   */
  const clearRepository = useCallback(() => {
    setCurrentRepository(null);
    setHandle(null);
    setProgress(null);
    setError(null);
    setIsLoading(false);
    setRepositorySource(null);
  }, []);

  /**
   * Clear the error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Switch to a recent repository by ID
   */
  const switchToRecent = useCallback(async (id: string): Promise<void> => {
    const cachedHandle = handleCache.get(id);
    if (!cachedHandle) {
      setError(`Repository "${id}" not found in cache`);
      return;
    }

    await loadRepository(cachedHandle);
  }, [handleCache, loadRepository]);

  const value: RepositoryContextValue = {
    currentRepository,
    isLoading,
    error,
    progress,
    handle,
    recentRepositories,
    repositorySource,
    loadRepository,
    loadFromUrl,
    loadGitHubRepository,
    clearRepository,
    clearError,
    switchToRecent,
  };

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}

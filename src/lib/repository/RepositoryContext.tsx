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

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { processLocalRepository, type ProcessedRepository, type ProcessProgress } from "../git/processor";

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
  /** Path for local repositories (if available) */
  path?: string;
  /** Size estimate in bytes (for cache management) */
  sizeBytes?: number;
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
  /** Total cache size in bytes */
  cacheSize: number;

  /** Load a repository from FileSystemDirectoryHandle */
  loadRepository: (handle: FileSystemDirectoryHandle, options?: LoadRepositoryOptions) => Promise<void>;
  /** Clear the current repository */
  clearRepository: () => void;
  /** Clear the error state */
  clearError: () => void;
  /** Switch to a recent repository by ID */
  switchToRecent: (id: string) => Promise<void>;
  /** Refresh the current repository */
  refreshCurrentRepository: () => Promise<void>;
  /** Remove a repository from cache by ID */
  removeFromCache: (id: string) => void;
  /** Clear all repository cache */
  clearCache: () => void;
  /** Get a repository from cache without setting it as current */
  getRepositoryFromCache: (id: string) => ProcessedRepository | null;
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

// Maximum cache size in bytes (50MB as per requirements)
const MAX_CACHE_SIZE = 50 * 1024 * 1024;

/**
 * Estimate the size of a processed repository in bytes
 */
function estimateRepositorySize(repo: ProcessedRepository): number {
  // Rough estimate based on JSON serialization
  const jsonStr = JSON.stringify({
    metadata: repo.metadata,
    dag: {
      nodes: repo.dag.nodes.length,
      commits: repo.dag.commits.length,
      branches: repo.dag.branches.length,
      tags: repo.dag.tags.length,
    },
  });
  return jsonStr.length * 2; // Multiply by 2 for memory overhead
}

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
  const [cacheSize, setCacheSize] = useState<number>(0);
  
  // Store mapping of repository IDs to their handles and processed data
  const [handleCache] = useState<Map<string, FileSystemDirectoryHandle>>(new Map());
  const [repositoryCache] = useState<Map<string, ProcessedRepository>>(new Map());

  /**
   * Add or update a repository in the recent list and cache
   */
  const addToRecent = useCallback((repo: ProcessedRepository, dirHandle: FileSystemDirectoryHandle) => {
    const id = repo.metadata.name || dirHandle.name;
    const sizeBytes = estimateRepositorySize(repo);
    
    // Check if adding this repo would exceed cache limit
    let currentSize = cacheSize;
    if (repositoryCache.has(id)) {
      // If repo already exists, subtract its old size
      const oldRepo = repositoryCache.get(id);
      if (oldRepo) {
        currentSize -= estimateRepositorySize(oldRepo);
      }
    }
    
    // If adding would exceed limit, remove oldest repositories until there's space
    if (currentSize + sizeBytes > MAX_CACHE_SIZE) {
      const sortedRepos = [...recentRepositories].sort((a, b) => 
        a.lastAccessed.getTime() - b.lastAccessed.getTime()
      );
      
      for (const oldRepo of sortedRepos) {
        if (oldRepo.id === id) continue; // Don't remove the repo we're adding
        
        const cachedRepo = repositoryCache.get(oldRepo.id);
        if (cachedRepo) {
          currentSize -= estimateRepositorySize(cachedRepo);
          repositoryCache.delete(oldRepo.id);
          handleCache.delete(oldRepo.id);
          
          // Remove from recent list
          setRecentRepositories(prev => prev.filter(r => r.id !== oldRepo.id));
          
          if (currentSize + sizeBytes <= MAX_CACHE_SIZE) {
            break;
          }
        }
      }
    }
    
    const reference: RepositoryReference = {
      id,
      name: repo.metadata.name,
      lastAccessed: new Date(),
      commitCount: repo.metadata.commitCount,
      branchCount: repo.metadata.branchCount,
      path: dirHandle.name,
      sizeBytes,
    };
    
    setRecentRepositories(prev => {
      // Remove if already exists
      const filtered = prev.filter(r => r.id !== id);
      // Add to front
      const updated = [reference, ...filtered];
      // Limit to MAX_RECENT_REPOS
      return updated.slice(0, MAX_RECENT_REPOS);
    });
    
    // Cache the handle and repository
    handleCache.set(id, dirHandle);
    repositoryCache.set(id, repo);
    
    // Update cache size
    setCacheSize(currentSize + sizeBytes);
  }, [handleCache, repositoryCache, cacheSize, recentRepositories]);

  /**
   * Load a repository from a FileSystemDirectoryHandle
   */
  const loadRepository = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    options: LoadRepositoryOptions = {}
  ): Promise<void> => {
    // Clear previous state
    setError(null);
    setProgress(null);
    setCurrentRepository(null);
    setIsLoading(true);
    setHandle(dirHandle);

    try {
      // Progress callback
      const onProgress = (progressInfo: ProcessProgress) => {
        setProgress(progressInfo);
      };

      // Process the repository
      const processed = await processLocalRepository(dirHandle, {
        maxCommits: options.maxCommits,
        detectLFS: options.detectLFS ?? true,
        onProgress,
      });

      // Update state with processed repository
      setCurrentRepository(processed);
      setProgress({
        phase: "complete",
        percentage: 100,
        message: "Repository loaded successfully",
      });
      
      // Add to recent repositories
      addToRecent(processed, dirHandle);
    } catch (err) {
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
   * Clear the current repository
   */
  const clearRepository = useCallback(() => {
    setCurrentRepository(null);
    setHandle(null);
    setProgress(null);
    setError(null);
    setIsLoading(false);
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
    const cachedRepo = repositoryCache.get(id);
    const cachedHandle = handleCache.get(id);
    
    if (!cachedHandle) {
      setError(`Repository "${id}" not found in cache`);
      return;
    }
    
    // If repository is already fully processed, use cached version
    if (cachedRepo) {
      setCurrentRepository(cachedRepo);
      setHandle(cachedHandle);
      setError(null);
      setProgress(null);
      
      // Update last accessed time
      setRecentRepositories(prev => 
        prev.map(repo => 
          repo.id === id 
            ? { ...repo, lastAccessed: new Date() }
            : repo
        )
      );
    } else {
      // Otherwise, reload from handle
      await loadRepository(cachedHandle);
    }
  }, [handleCache, repositoryCache, loadRepository]);
  
  /**
   * Refresh the current repository
   */
  const refreshCurrentRepository = useCallback(async (): Promise<void> => {
    if (!handle) {
      setError("No repository handle available for refresh");
      return;
    }
    
    await loadRepository(handle);
  }, [handle, loadRepository]);
  
  /**
   * Remove a repository from cache by ID
   */
  const removeFromCache = useCallback((id: string): void => {
    const cachedRepo = repositoryCache.get(id);
    if (cachedRepo) {
      const sizeBytes = estimateRepositorySize(cachedRepo);
      repositoryCache.delete(id);
      handleCache.delete(id);
      setCacheSize(prev => Math.max(0, prev - sizeBytes));
      
      setRecentRepositories(prev => prev.filter(r => r.id !== id));
      
      // If the current repository was removed, clear it
      if (currentRepository?.metadata.name === id) {
        setCurrentRepository(null);
        setHandle(null);
      }
    }
  }, [repositoryCache, handleCache, currentRepository]);
  
  /**
   * Clear all repository cache
   */
  const clearCache = useCallback((): void => {
    repositoryCache.clear();
    handleCache.clear();
    setRecentRepositories([]);
    setCacheSize(0);
    setCurrentRepository(null);
    setHandle(null);
  }, [repositoryCache, handleCache]);
  
  /**
   * Get a repository from cache without setting it as current
   */
  const getRepositoryFromCache = useCallback((id: string): ProcessedRepository | null => {
    return repositoryCache.get(id) || null;
  }, [repositoryCache]);

  const value: RepositoryContextValue = {
    currentRepository,
    isLoading,
    error,
    progress,
    handle,
    recentRepositories,
    cacheSize,
    loadRepository,
    clearRepository,
    clearError,
    switchToRecent,
    refreshCurrentRepository,
    removeFromCache,
    clearCache,
    getRepositoryFromCache,
  };

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}

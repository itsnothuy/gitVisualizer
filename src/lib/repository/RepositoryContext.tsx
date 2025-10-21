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

  /** Load a repository from FileSystemDirectoryHandle */
  loadRepository: (handle: FileSystemDirectoryHandle, options?: LoadRepositoryOptions) => Promise<void>;
  /** Clear the current repository */
  clearRepository: () => void;
  /** Clear the error state */
  clearError: () => void;
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
    } catch (err) {
      // Handle errors
      const errorMessage = err instanceof Error ? err.message : "Failed to load repository";
      setError(errorMessage);
      setCurrentRepository(null);
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const value: RepositoryContextValue = {
    currentRepository,
    isLoading,
    error,
    progress,
    handle,
    loadRepository,
    clearRepository,
    clearError,
  };

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}

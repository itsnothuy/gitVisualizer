"use client";

/**
 * Enhanced Repository Picker Component
 * 
 * Provides multiple methods for repository ingestion:
 * - File System Access API (direct folder access)
 * - Recent repositories (quick access to cached repos)
 * - Sample repositories (for demo/tutorial)
 * 
 * Features:
 * - Recent repositories grid with thumbnails
 * - Processing progress overlay
 * - Keyboard accessible (WCAG 2.2 AA)
 * - Privacy-first: all processing local
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRepository } from "@/lib/repository/RepositoryContext";
import { isFileSystemAccessSupported, pickLocalRepoDir, isGitRepository } from "@/lib/git/local";
import { 
  FolderOpenIcon, 
  ClockIcon, 
  GitBranchIcon, 
  GitCommitIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XIcon,
} from "lucide-react";

export interface EnhancedRepositoryPickerProps {
  /** Callback when repository is successfully loaded */
  onRepositoryLoaded?: () => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Show recent repositories section */
  showRecentRepositories?: boolean;
}

/**
 * Enhanced Repository Picker
 * 
 * Main component for repository selection with multiple ingestion methods
 * and recent repositories display.
 */
export function EnhancedRepositoryPicker({
  onRepositoryLoaded,
  onError,
  showRecentRepositories = true,
}: EnhancedRepositoryPickerProps) {
  const {
    loadRepository,
    recentRepositories,
    switchToRecent,
    isLoading,
    progress,
    error: contextError,
    clearError,
  } = useRepository();

  const [localError, setLocalError] = React.useState<string | null>(null);
  const isSupported = React.useMemo(() => isFileSystemAccessSupported(), []);

  // Clear local error when context error changes
  React.useEffect(() => {
    if (contextError) {
      setLocalError(null);
    }
  }, [contextError]);

  const error = contextError || localError;

  /**
   * Handle selecting a local directory
   */
  const handleSelectDirectory = React.useCallback(async () => {
    setLocalError(null);

    try {
      const result = await pickLocalRepoDir();

      if (result.handle) {
        // Validate that it's a Git repository
        const isValid = await isGitRepository(result.handle);

        if (isValid) {
          await loadRepository(result.handle);
          onRepositoryLoaded?.();
        } else {
          const errorMsg = "The selected directory is not a valid Git repository. Please select a directory containing a .git folder.";
          setLocalError(errorMsg);
          onError?.(errorMsg);
        }
      } else if (result.error) {
        setLocalError(result.error.message);
        onError?.(result.error.message);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setLocalError(errorMsg);
      onError?.(errorMsg);
    }
  }, [loadRepository, onRepositoryLoaded, onError]);

  /**
   * Handle selecting a recent repository
   */
  const handleSelectRecent = React.useCallback(async (repoId: string) => {
    setLocalError(null);
    try {
      await switchToRecent(repoId);
      onRepositoryLoaded?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load repository.";
      setLocalError(errorMsg);
      onError?.(errorMsg);
    }
  }, [switchToRecent, onRepositoryLoaded, onError]);

  /**
   * Clear all errors
   */
  const handleClearError = React.useCallback(() => {
    setLocalError(null);
    clearError();
  }, [clearError]);

  /**
   * Format relative time for last accessed
   */
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Primary ingestion method */}
      <Card>
        <CardHeader>
          <CardTitle>Open Repository</CardTitle>
          <CardDescription>
            Select a local Git repository from your file system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Browser support warning */}
          {!isSupported && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-md" role="alert">
              <AlertCircleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold mb-1">Browser Not Supported</p>
                <p>
                  The File System Access API is not available in your browser.
                  Please use Chrome 86+, Edge 86+, or another compatible browser.
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-md" role="alert">
              <AlertCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="flex-1 text-sm text-red-800 dark:text-red-200">
                <p className="font-semibold mb-1">Error</p>
                <p>{error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearError}
                className="text-red-600 dark:text-red-400"
                aria-label="Dismiss error"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Processing progress */}
          {isLoading && progress && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md" role="status" aria-live="polite">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                    Processing Repository...
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {progress.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {progress.percentage}%
                    </span>
                  </div>
                  {progress.processed !== undefined && progress.total !== undefined && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {progress.processed} / {progress.total} items
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Select button */}
          <Button
            onClick={handleSelectDirectory}
            disabled={!isSupported || isLoading}
            className="w-full"
            size="lg"
          >
            <FolderOpenIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            Select Repository Folder
          </Button>

          {/* Privacy features */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-start gap-1">
              <CheckCircleIcon className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
              <span>Your repository data never leaves your device</span>
            </p>
            <p className="flex items-start gap-1">
              <CheckCircleIcon className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
              <span>Read-only access - we won&apos;t modify your files</span>
            </p>
            <p className="flex items-start gap-1">
              <CheckCircleIcon className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
              <span>You can disconnect at any time</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent repositories */}
      {showRecentRepositories && recentRepositories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" aria-hidden="true" />
              Recent Repositories
            </CardTitle>
            <CardDescription>
              Quick access to your recently opened repositories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentRepositories.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => handleSelectRecent(repo.id)}
                  disabled={isLoading}
                  className="flex flex-col gap-2 p-4 text-left border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label={`Open ${repo.name}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm truncate flex-1">
                      {repo.name}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(repo.lastAccessed)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GitCommitIcon className="h-3 w-3" aria-hidden="true" />
                      {repo.commitCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitBranchIcon className="h-3 w-3" aria-hidden="true" />
                      {repo.branchCount}
                    </span>
                  </div>
                  
                  {repo.path && (
                    <p className="text-xs text-muted-foreground truncate" title={repo.path}>
                      {repo.path}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

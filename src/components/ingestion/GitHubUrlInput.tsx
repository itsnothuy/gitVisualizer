"use client";

/**
 * GitHub URL Input Component
 * 
 * Provides UI for loading GitHub repositories via URL input.
 * Supports public and private repositories with optional token authentication.
 * 
 * Privacy-first: Tokens are stored in memory only, not persisted.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidGitHubUrl } from "@/lib/github/url-parser";
import { useRepository } from "@/lib/repository/RepositoryContext";
import { AlertCircleIcon, CheckCircleIcon, GithubIcon, LoaderIcon, LockIcon } from "lucide-react";
import * as React from "react";

/**
 * Props for GitHubUrlInput component
 */
export interface GitHubUrlInputProps {
  /** Callback when repository is successfully loaded */
  onRepositoryLoaded?: () => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
}

/**
 * GitHub URL Input Component
 * 
 * Allows users to paste GitHub repository URLs and optionally provide
 * an access token for private repositories.
 */
export function GitHubUrlInput({
  onRepositoryLoaded,
  onError,
}: GitHubUrlInputProps) {
  const [url, setUrl] = React.useState('');
  const [token, setToken] = React.useState('');
  const [validationError, setValidationError] = React.useState<string | null>(null);
  
  const { loadFromUrl, isLoading, progress, error: contextError } = useRepository();

  // Validate URL on change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    if (newUrl && !isValidGitHubUrl(newUrl)) {
      setValidationError('Invalid GitHub URL format');
    } else {
      setValidationError(null);
    }
  };

  // Update error display when context error changes
  React.useEffect(() => {
    if (contextError) {
      setValidationError(contextError);
      onError?.(contextError);
    }
  }, [contextError, onError]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate URL
    if (!url) {
      setValidationError('Please enter a GitHub repository URL');
      return;
    }

    if (!isValidGitHubUrl(url)) {
      setValidationError('Invalid GitHub URL format');
      return;
    }

    setValidationError(null);

    try {
      // Load repository via context
      await loadFromUrl(url, token || undefined);
      
      // Success - notify parent
      onRepositoryLoaded?.();
    } catch (error) {
      // Error is already handled by context
      const errorMessage = error instanceof Error ? error.message : 'Failed to load repository';
      setValidationError(errorMessage);
      onError?.(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="github-url">
          GitHub Repository URL
        </Label>
        <Input
          id="github-url"
          type="url"
          placeholder="https://github.com/facebook/react"
          value={url}
          onChange={handleUrlChange}
          disabled={isLoading}
          aria-invalid={!!validationError}
          aria-describedby={validationError ? "url-error" : undefined}
        />
        <p className="text-xs text-muted-foreground">
          Supported formats: https://github.com/owner/repo, git@github.com:owner/repo.git, or owner/repo
        </p>
      </div>

      {/* Token Input */}
      <div className="space-y-2">
        <Label htmlFor="github-token" className="flex items-center gap-2">
          <LockIcon className="h-3 w-3" aria-hidden="true" />
          GitHub Token (Optional)
        </Label>
        <Input
          id="github-token"
          type="password"
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          disabled={isLoading}
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Required for private repositories. Tokens are stored in memory only and never persisted.
        </p>
      </div>

      {/* Error Display */}
      {validationError && (
        <div
          id="url-error"
          className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-md"
          role="alert"
        >
          <AlertCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm text-red-800 dark:text-red-200">{validationError}</p>
        </div>
      )}

      {/* Progress Display */}
      {progress && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
          <LoaderIcon className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm text-blue-800 dark:text-blue-200">{progress.message}</p>
            <div className="mt-1 h-1.5 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
                role="progressbar"
                aria-valuenow={progress.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !!validationError || !url}
        className="w-full"
      >
        {isLoading ? (
          <>
            <LoaderIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading Repository...
          </>
        ) : (
          <>
            <GithubIcon className="h-4 w-4" aria-hidden="true" />
            Visualize Repository
          </>
        )}
      </Button>

      {/* Privacy Notice */}
      <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
        <p className="flex items-start gap-1">
          <CheckCircleIcon className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
          <span>Repository data fetched directly from GitHub API</span>
        </p>
        <p className="flex items-start gap-1">
          <CheckCircleIcon className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
          <span>Your token is never stored or sent to our servers</span>
        </p>
        <p className="flex items-start gap-1">
          <CheckCircleIcon className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
          <span>Read-only access - no modifications to your repository</span>
        </p>
      </div>
    </form>
  );
}

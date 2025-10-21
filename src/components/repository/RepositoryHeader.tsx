"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import type { ProcessedRepository } from "@/lib/git/processor";

interface RepositoryHeaderProps {
  repository: ProcessedRepository | null;
  onRefresh?: () => Promise<void>;
}

/**
 * Repository Header Component
 * 
 * Displays repository metadata and provides refresh action.
 * Follows WCAG 2.2 AA with keyboard navigation and semantic HTML.
 */
export function RepositoryHeader({ repository, onRefresh }: RepositoryHeaderProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  if (!repository) {
    return (
      <div className="border-b bg-muted/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-muted-foreground">No Repository Loaded</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Please select a repository to visualize
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { metadata } = repository;

  return (
    <header className="border-b bg-muted/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{metadata.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {metadata.commitCount} commits · {metadata.branchCount} branches · {metadata.tagCount} tags
            {metadata.defaultBranch && ` · Default: ${metadata.defaultBranch}`}
          </p>
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh repository data"
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

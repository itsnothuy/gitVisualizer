"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCwIcon, FolderGit2Icon } from "lucide-react";
import type { ProcessedRepository } from "@/lib/git/processor";
import { useRepository } from "@/lib/repository/RepositoryContext";

interface RepositoryHeaderProps {
  repository: ProcessedRepository | null;
  onRefresh?: () => Promise<void>;
}

/**
 * Repository Header Component
 * 
 * Displays repository metadata and provides refresh action.
 * Includes repository switcher for recent repositories.
 * Follows WCAG 2.2 AA with keyboard navigation and semantic HTML.
 */
export function RepositoryHeader({ repository, onRefresh }: RepositoryHeaderProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const { recentRepositories, switchToRecent } = useRepository();

  const handleRefresh = React.useCallback(async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const handleRepositorySwitch = React.useCallback(async (repoId: string) => {
    if (repoId === repository?.metadata.name) return;
    try {
      await switchToRecent(repoId);
    } catch (err) {
      console.error("Failed to switch repository:", err);
    }
  }, [repository, switchToRecent]);

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
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{metadata.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {metadata.commitCount} commits · {metadata.branchCount} branches · {metadata.tagCount} tags
              {metadata.defaultBranch && ` · Default: ${metadata.defaultBranch}`}
            </p>
          </div>
          
          {/* Repository Switcher - only show if there are recent repositories */}
          {recentRepositories.length > 1 && (
            <div className="flex items-center gap-2">
              <FolderGit2Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Select
                value={metadata.name}
                onValueChange={handleRepositorySwitch}
              >
                <SelectTrigger className="w-[200px]" aria-label="Switch repository">
                  <SelectValue placeholder="Switch repository" />
                </SelectTrigger>
                <SelectContent>
                  {recentRepositories.map((repo) => (
                    <SelectItem key={repo.id} value={repo.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{repo.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {repo.commitCount} commits · {repo.branchCount} branches
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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

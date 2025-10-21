/**
 * History Explorer Component
 * Provides interactive timeline navigation and history browsing
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { GitState, GitCommit } from '@/cli/types';

/**
 * History explorer props
 */
export interface HistoryExplorerProps {
  /** Current repository state */
  state: GitState;
  /** Callback when a commit is selected for time travel */
  onTimeTravel?: (commitId: string) => void;
  /** Callback when commits are selected for comparison */
  onCompareCommits?: (commitA: string, commitB: string) => void;
  /** Maximum number of commits to display */
  maxCommits?: number;
}

/**
 * Timeline mode
 */
export type TimelineMode = 'chronological' | 'topological' | 'branch';

/**
 * Commit item props
 */
interface CommitItemProps {
  commit: GitCommit;
  isSelected: boolean;
  isComparing: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

/**
 * Commit Item Component
 */
function CommitItem({
  commit,
  isSelected,
  isComparing,
  onClick,
  onDoubleClick,
}: CommitItemProps) {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`flex flex-col gap-1 rounded-md border p-3 transition-colors ${
        isSelected
          ? 'border-primary bg-primary/10'
          : isComparing
            ? 'border-accent bg-accent/10'
            : 'hover:bg-accent/50 cursor-pointer'
      }`}
      aria-label={`Commit ${commit.id.slice(0, 7)}: ${commit.message}`}
      aria-current={isSelected ? 'true' : undefined}
    >
      <div className="flex items-center justify-between">
        <code className="text-xs font-mono text-muted-foreground">
          {commit.id.slice(0, 7)}
        </code>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(commit.timestamp)}
        </span>
      </div>
      <div className="text-sm font-medium">{commit.message}</div>
      {commit.author && (
        <div className="text-xs text-muted-foreground">
          by {commit.author}
        </div>
      )}
      {commit.parents.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Parents: {commit.parents.map((p) => p.slice(0, 7)).join(', ')}
        </div>
      )}
    </div>
  );
}

/**
 * History Explorer Component
 * Interactive timeline for browsing commit history
 */
export function HistoryExplorer({
  state,
  onTimeTravel,
  onCompareCommits,
  maxCommits = 100,
}: HistoryExplorerProps) {
  const [selectedCommit, setSelectedCommit] = React.useState<string | null>(
    null
  );
  const [comparisonCommits, setComparisonCommits] = React.useState<string[]>(
    []
  );
  const [timelineMode, setTimelineMode] =
    React.useState<TimelineMode>('chronological');

  // Get commits sorted by the selected mode
  const sortedCommits = React.useMemo(() => {
    const commits = Array.from(state.commits.values());

    switch (timelineMode) {
      case 'chronological':
        return commits
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, maxCommits);
      case 'topological':
        // Simple topological sort - start from HEAD and walk backwards
        return commits
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, maxCommits);
      case 'branch':
        // Group by branches (simplified)
        return commits
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, maxCommits);
      default:
        return commits.slice(0, maxCommits);
    }
  }, [state.commits, timelineMode, maxCommits]);

  const handleCommitClick = (commitId: string) => {
    if (comparisonCommits.length === 0) {
      setSelectedCommit(commitId);
    } else if (comparisonCommits.length === 1) {
      if (commitId !== comparisonCommits[0]) {
        setComparisonCommits([...comparisonCommits, commitId]);
        if (onCompareCommits && comparisonCommits[0]) {
          onCompareCommits(comparisonCommits[0], commitId);
        }
      }
    } else {
      // Reset comparison
      setComparisonCommits([]);
      setSelectedCommit(commitId);
    }
  };

  const handleCommitDoubleClick = (commitId: string) => {
    if (onTimeTravel) {
      onTimeTravel(commitId);
    }
  };

  const startComparison = () => {
    if (selectedCommit) {
      setComparisonCommits([selectedCommit]);
      setSelectedCommit(null);
    }
  };

  const cancelComparison = () => {
    setComparisonCommits([]);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">History Explorer</h2>
        <div className="flex gap-2">
          <select
            value={timelineMode}
            onChange={(e) => setTimelineMode(e.target.value as TimelineMode)}
            className="rounded border bg-background px-3 py-1 text-sm"
            aria-label="Timeline mode"
          >
            <option value="chronological">Chronological</option>
            <option value="topological">Topological</option>
            <option value="branch">By Branch</option>
          </select>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-2 p-4">
        {selectedCommit && onTimeTravel && (
          <Button
            size="sm"
            onClick={() => onTimeTravel(selectedCommit)}
            aria-label="Time travel to selected commit"
          >
            Time Travel
          </Button>
        )}
        {selectedCommit && onCompareCommits && (
          <Button
            size="sm"
            variant="outline"
            onClick={startComparison}
            aria-label="Start commit comparison"
          >
            Compare
          </Button>
        )}
        {comparisonCommits.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={cancelComparison}
            aria-label="Cancel comparison"
          >
            Cancel Comparison ({comparisonCommits.length}/2)
          </Button>
        )}
      </div>

      {comparisonCommits.length > 0 && (
        <div className="px-4 pb-2 text-sm text-muted-foreground">
          {comparisonCommits.length === 1
            ? 'Select another commit to compare'
            : 'Comparing commits'}
        </div>
      )}

      <Separator />

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4" role="list" aria-label="Commit history">
          {sortedCommits.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">
              No commits found
            </div>
          ) : (
            sortedCommits.map((commit) => (
              <CommitItem
                key={commit.id}
                commit={commit}
                isSelected={selectedCommit === commit.id}
                isComparing={comparisonCommits.includes(commit.id)}
                onClick={() => handleCommitClick(commit.id)}
                onDoubleClick={() => handleCommitDoubleClick(commit.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <Separator />
      <div className="p-4 text-xs text-muted-foreground">
        Showing {sortedCommits.length} of {state.commits.size} commits
        {selectedCommit && (
          <span className="ml-2">• Selected: {selectedCommit.slice(0, 7)}</span>
        )}
      </div>
    </div>
  );
}

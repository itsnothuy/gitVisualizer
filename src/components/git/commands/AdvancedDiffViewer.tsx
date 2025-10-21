/**
 * Advanced Diff Viewer Component
 * Displays file changes with multiple view modes
 */

'use client';

import * as React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

/**
 * Diff view mode
 */
export type DiffViewMode = 'split' | 'unified';

/**
 * Diff line type
 */
export type DiffLineType = 'add' | 'remove' | 'context';

/**
 * Diff line
 */
export interface DiffLine {
  /** Line type */
  type: DiffLineType;
  /** Line content */
  content: string;
  /** Old line number (for context and remove) */
  oldLineNumber?: number;
  /** New line number (for context and add) */
  newLineNumber?: number;
}

/**
 * Diff hunk
 */
export interface DiffHunk {
  /** Starting line in old file */
  oldStart: number;
  /** Number of lines in old file */
  oldCount: number;
  /** Starting line in new file */
  newStart: number;
  /** Number of lines in new file */
  newCount: number;
  /** Lines in this hunk */
  lines: DiffLine[];
}

/**
 * File diff
 */
export interface FileDiff {
  /** Old file path */
  oldPath: string;
  /** New file path */
  newPath: string;
  /** Diff hunks */
  hunks: DiffHunk[];
  /** Number of additions */
  additions: number;
  /** Number of deletions */
  deletions: number;
}

/**
 * Advanced Diff Viewer props
 */
export interface AdvancedDiffViewerProps {
  /** File diff to display */
  diff: FileDiff;
  /** View mode */
  viewMode?: DiffViewMode;
  /** Callback when view mode changes */
  onViewModeChange?: (mode: DiffViewMode) => void;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
}

/**
 * Diff Header Component
 */
function DiffHeader({ diff }: { diff: FileDiff }) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <div className="text-sm font-medium">
          {diff.oldPath === diff.newPath ? diff.oldPath : `${diff.oldPath} → ${diff.newPath}`}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="text-green-600">+{diff.additions}</span>
          {' / '}
          <span className="text-red-600">-{diff.deletions}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Unified Diff View Component
 */
function UnifiedDiffView({
  diff,
  showLineNumbers,
}: {
  diff: FileDiff;
  showLineNumbers: boolean;
}) {
  return (
    <div className="font-mono text-xs">
      {diff.hunks.map((hunk, hunkIndex) => (
        <div key={hunkIndex} className="border-b">
          {/* Hunk header */}
          <div className="bg-muted px-2 py-1 text-muted-foreground">
            @@ -{hunk.oldStart},{hunk.oldCount} +{hunk.newStart},{hunk.newCount} @@
          </div>

          {/* Hunk lines */}
          {hunk.lines.map((line, lineIndex) => {
            const bgColor =
              line.type === 'add'
                ? 'bg-green-50 dark:bg-green-900/20'
                : line.type === 'remove'
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : '';

            const textColor =
              line.type === 'add'
                ? 'text-green-700 dark:text-green-300'
                : line.type === 'remove'
                  ? 'text-red-700 dark:text-red-300'
                  : '';

            const marker =
              line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';

            return (
              <div
                key={lineIndex}
                className={`flex ${bgColor}`}
                role="row"
                aria-label={`${line.type} line: ${line.content}`}
              >
                {showLineNumbers && (
                  <>
                    <div className="w-12 px-2 text-right text-muted-foreground select-none">
                      {line.oldLineNumber || ''}
                    </div>
                    <div className="w-12 px-2 text-right text-muted-foreground select-none">
                      {line.newLineNumber || ''}
                    </div>
                  </>
                )}
                <div className={`flex-1 px-2 ${textColor}`}>
                  <span className="select-none mr-1">{marker}</span>
                  {line.content}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * Split Diff View Component
 */
function SplitDiffView({
  diff,
  showLineNumbers,
}: {
  diff: FileDiff;
  showLineNumbers: boolean;
}) {
  return (
    <div className="font-mono text-xs">
      {diff.hunks.map((hunk, hunkIndex) => (
        <div key={hunkIndex} className="border-b">
          {/* Hunk header */}
          <div className="bg-muted px-2 py-1 text-muted-foreground">
            @@ -{hunk.oldStart},{hunk.oldCount} +{hunk.newStart},{hunk.newCount} @@
          </div>

          {/* Split view with old and new side by side */}
          <div className="grid grid-cols-2 divide-x">
            {/* Old side */}
            <div>
              {hunk.lines
                .filter((line) => line.type !== 'add')
                .map((line, lineIndex) => {
                  const bgColor =
                    line.type === 'remove'
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : '';
                  const textColor =
                    line.type === 'remove'
                      ? 'text-red-700 dark:text-red-300'
                      : '';

                  return (
                    <div
                      key={lineIndex}
                      className={`flex ${bgColor}`}
                      role="row"
                      aria-label={`Old: ${line.content}`}
                    >
                      {showLineNumbers && (
                        <div className="w-12 px-2 text-right text-muted-foreground select-none">
                          {line.oldLineNumber || ''}
                        </div>
                      )}
                      <div className={`flex-1 px-2 ${textColor}`}>
                        {line.content}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* New side */}
            <div>
              {hunk.lines
                .filter((line) => line.type !== 'remove')
                .map((line, lineIndex) => {
                  const bgColor =
                    line.type === 'add'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : '';
                  const textColor =
                    line.type === 'add'
                      ? 'text-green-700 dark:text-green-300'
                      : '';

                  return (
                    <div
                      key={lineIndex}
                      className={`flex ${bgColor}`}
                      role="row"
                      aria-label={`New: ${line.content}`}
                    >
                      {showLineNumbers && (
                        <div className="w-12 px-2 text-right text-muted-foreground select-none">
                          {line.newLineNumber || ''}
                        </div>
                      )}
                      <div className={`flex-1 px-2 ${textColor}`}>
                        {line.content}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Advanced Diff Viewer Component
 * Displays file differences with multiple view modes
 */
export function AdvancedDiffViewer({
  diff,
  viewMode: initialViewMode = 'unified',
  onViewModeChange,
  showLineNumbers = true,
}: AdvancedDiffViewerProps) {
  const [viewMode, setViewMode] = React.useState<DiffViewMode>(initialViewMode);

  React.useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  const handleViewModeChange = (mode: DiffViewMode) => {
    setViewMode(mode);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  return (
    <div className="flex h-full flex-col border rounded-lg">
      {/* Header */}
      <DiffHeader diff={diff} />

      {/* View mode selector */}
      <div className="flex gap-2 p-2 border-b">
        <Button
          size="sm"
          variant={viewMode === 'unified' ? 'default' : 'outline'}
          onClick={() => handleViewModeChange('unified')}
          aria-label="Unified diff view"
          aria-pressed={viewMode === 'unified'}
        >
          Unified
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'split' ? 'default' : 'outline'}
          onClick={() => handleViewModeChange('split')}
          aria-label="Split diff view"
          aria-pressed={viewMode === 'split'}
        >
          Split
        </Button>
      </div>

      <Separator />

      {/* Diff content */}
      <ScrollArea className="flex-1">
        <div role="table" aria-label="File diff">
          {viewMode === 'unified' ? (
            <UnifiedDiffView diff={diff} showLineNumbers={showLineNumbers} />
          ) : (
            <SplitDiffView diff={diff} showLineNumbers={showLineNumbers} />
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <Separator />
      <div className="p-2 text-xs text-muted-foreground">
        {diff.hunks.length} hunk{diff.hunks.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

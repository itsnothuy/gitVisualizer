/**
 * Conflict Resolution Modal
 * Provides UI for resolving merge/rebase conflicts
 */

'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ConflictInfo } from '@/cli/types';

export interface ConflictResolutionModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Conflict information */
  conflict: ConflictInfo;
  /** Callback when conflicts are resolved */
  onResolve: (resolution: 'ours' | 'theirs' | 'manual', files: string[]) => void;
  /** Callback when operation is aborted */
  onAbort: () => void;
}

interface FileResolution {
  file: string;
  resolution: 'ours' | 'theirs' | 'manual' | 'pending';
}

/**
 * Conflict Resolution Modal Component
 * Allows user to choose resolution strategy for conflicted files
 */
export function ConflictResolutionModal({
  open,
  onClose,
  conflict,
  onResolve,
  onAbort,
}: ConflictResolutionModalProps) {
  const [resolutions, setResolutions] = React.useState<FileResolution[]>(() =>
    conflict.files.map((file) => ({ file, resolution: 'pending' as const }))
  );

  // Update resolutions when conflict changes
  React.useEffect(() => {
    setResolutions(
      conflict.files.map((file) => ({ file, resolution: 'pending' as const }))
    );
  }, [conflict.files]);

  const handleResolutionChange = (
    file: string,
    resolution: 'ours' | 'theirs' | 'manual'
  ) => {
    setResolutions((prev) =>
      prev.map((r) => (r.file === file ? { ...r, resolution } : r))
    );
  };

  const handleResolveAll = (strategy: 'ours' | 'theirs') => {
    setResolutions((prev) =>
      prev.map((r) => ({ ...r, resolution: strategy }))
    );
  };

  const handleContinue = () => {
    // Check if all files have been resolved
    const allResolved = resolutions.every((r) => r.resolution !== 'pending');
    if (!allResolved) {
      // Could show an error toast here
      return;
    }

    // For simplicity, use the first resolution strategy
    // In a real implementation, we'd handle per-file resolutions
    const primaryResolution = resolutions[0]?.resolution;
    if (primaryResolution && primaryResolution !== 'pending') {
      onResolve(primaryResolution, conflict.files);
      onClose();
    }
  };

  const handleAbort = () => {
    onAbort();
    onClose();
  };

  const allResolved = resolutions.every((r) => r.resolution !== 'pending');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl"
        aria-describedby="conflict-resolution-description"
      >
        <DialogHeader>
          <DialogTitle>Resolve Conflicts</DialogTitle>
          <DialogDescription id="conflict-resolution-description">
            {conflict.operation === 'merge'
              ? `Conflicts occurred while merging ${conflict.source} into ${conflict.target}`
              : `Conflicts occurred while rebasing ${conflict.source} onto ${conflict.target}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResolveAll('ours')}
              aria-label="Resolve all conflicts using our version"
            >
              Use Ours (All)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResolveAll('theirs')}
              aria-label="Resolve all conflicts using their version"
            >
              Use Theirs (All)
            </Button>
          </div>

          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-2" role="list" aria-label="Conflicted files">
              {resolutions.map(({ file, resolution }) => (
                <div
                  key={file}
                  className="flex items-center justify-between rounded-md border p-3"
                  role="listitem"
                  aria-label={`File: ${file}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        resolution === 'pending'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      aria-label={
                        resolution === 'pending' ? 'Unresolved' : 'Resolved'
                      }
                    />
                    <code className="text-sm">{file}</code>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={resolution === 'ours' ? 'default' : 'outline'}
                      onClick={() => handleResolutionChange(file, 'ours')}
                      aria-label={`Use our version for ${file}`}
                    >
                      Ours
                    </Button>
                    <Button
                      size="sm"
                      variant={resolution === 'theirs' ? 'default' : 'outline'}
                      onClick={() => handleResolutionChange(file, 'theirs')}
                      aria-label={`Use their version for ${file}`}
                    >
                      Theirs
                    </Button>
                    <Button
                      size="sm"
                      variant={resolution === 'manual' ? 'default' : 'outline'}
                      onClick={() => handleResolutionChange(file, 'manual')}
                      aria-label={`Mark ${file} as manually resolved`}
                    >
                      Manual
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleAbort}
            aria-label={`Abort ${conflict.operation}`}
          >
            Abort {conflict.operation}
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!allResolved}
            aria-label="Continue with conflict resolution"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

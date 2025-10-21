"use client";

/**
 * Repository Picker Component
 * 
 * Provides UI for selecting local repositories via File System Access API
 * with clear permission prompts and error handling.
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PickRepositoryResult } from "@/lib/git/local";
import { isFileSystemAccessSupported, isGitRepository, pickLocalRepoDir } from "@/lib/git/local";
import { AlertCircleIcon, CheckCircleIcon, FolderOpenIcon } from "lucide-react";
import * as React from "react";

interface RepositoryPickerProps {
  onRepositorySelected?: (handle: FileSystemDirectoryHandle) => void;
  onError?: (error: string) => void;
}

export function RepositoryPicker({ onRepositorySelected, onError }: RepositoryPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<PickRepositoryResult | null>(null);
  const [validating, setValidating] = React.useState(false);

  const isSupported = React.useMemo(() => isFileSystemAccessSupported(), []);

  const handlePickDirectory = async () => {
    setLoading(true);
    setResult(null);
    setValidating(false);

    try {
      const pickResult = await pickLocalRepoDir();
      setResult(pickResult);

      if (pickResult.handle) {
        // Validate that it's a Git repository
        setValidating(true);
        const isValid = await isGitRepository(pickResult.handle);
        setValidating(false);

        if (isValid) {
          onRepositorySelected?.(pickResult.handle);
          setOpen(false);
        } else {
          const errorMsg = "The selected directory is not a valid Git repository. Please select a directory containing a .git folder.";
          setResult({
            handle: null,
            error: {
              type: "unknown",
              message: errorMsg,
            },
          });
          onError?.(errorMsg);
        }
      } else if (pickResult.error) {
        onError?.(pickResult.error.message);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
      setResult({
        handle: null,
        error: {
          type: "unknown",
          message: errorMsg,
        },
      });
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          disabled={!isSupported}
          aria-label="Open local repository"
          data-testid="open-repository"
        >
          <FolderOpenIcon className="mr-2 h-5 w-5" aria-hidden="true" />
          Open Repository
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open Local Repository</DialogTitle>
          <DialogDescription>
            Select a Git repository from your local file system. Your repository data stays on your device and is never uploaded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          {result?.error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-md" role="alert">
              <AlertCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-semibold mb-1">Error</p>
                <p>{result.error.message}</p>
              </div>
            </div>
          )}

          {validating && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Validating repository...
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handlePickDirectory}
              disabled={!isSupported || loading || validating}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                  Selecting...
                </>
              ) : (
                <>
                  <FolderOpenIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                  Select Repository Folder
                </>
              )}
            </Button>

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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

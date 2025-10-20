"use client";

/**
 * IngestDialog Component
 * 
 * Universal repository ingestion dialog with support for multiple methods:
 * 1. File System Access API (Chrome/Edge) - direct folder access
 * 2. Directory Input (Firefox/Safari) - webkitdirectory fallback
 * 3. ZIP Upload (all browsers) - universal fallback
 * 
 * Features:
 * - Automatic capability detection
 * - Progress tracking with cancellation
 * - Privacy-first (all processing local)
 * - Accessible (WCAG 2.2 AA)
 */

import * as React from "react";
import {
  FolderOpenIcon,
  UploadIcon,
  FileArchiveIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
  XIcon,
  BookOpenIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { pickLocalRepoDir, isGitRepository } from "@/lib/git/local";
import { selectDirectoryInput } from "@/lib/git/fallbacks/directory-input";
import { selectZipFile } from "@/lib/git/fallbacks/zip-input";
import {
  getBrowserCapabilities,
  getCapabilityMessage,
  getBrowserName,
} from "@/lib/git/capabilities";
import { isFeatureEnabled } from "@/lib/feature-flags";
import type { IngestResult, IngestProgress } from "@/lib/git/ingestion-types";
import { SampleReposPanel } from "@/components/samples/SampleReposPanel";

interface IngestDialogProps {
  onRepositorySelected?: (result: IngestResult) => void;
  onError?: (error: string) => void;
}

export function IngestDialog({ onRepositorySelected, onError }: IngestDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState<IngestProgress | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("auto");
  
  // Abort controller for cancellation
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Get browser capabilities
  const capabilities = React.useMemo(() => getBrowserCapabilities(), []);
  const fallbacksEnabled = React.useMemo(() => isFeatureEnabled('enableIngestFallbacks'), []);
  const browserName = React.useMemo(() => getBrowserName(), []);

  // Set initial tab to samples (for new users) or based on recommended method
  React.useEffect(() => {
    if (activeTab === "auto") {
      // Default to samples tab for first-time users
      setActiveTab("samples");
    }
  }, [activeTab]);

  // Handle File System Access API
  const handleFSAMethod = async () => {
    setLoading(true);
    setError(null);
    setProgress(null);

    try {
      const pickResult = await pickLocalRepoDir();

      if (pickResult.handle) {
        // Validate Git repository
        const isValid = await isGitRepository(pickResult.handle);

        if (isValid) {
          // Note: Full FSA integration requires additional work to convert handle to IngestResult
          // For now, we'll create a minimal result
          const result: IngestResult = {
            files: [],
            name: pickResult.handle.name,
            totalSize: 0,
          };
          onRepositorySelected?.(result);
          setOpen(false);
        } else {
          const errorMsg = "Not a valid Git repository (no .git directory found).";
          setError(errorMsg);
          onError?.(errorMsg);
        }
      } else if (pickResult.error) {
        setError(pickResult.error.message);
        onError?.(pickResult.error.message);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to open repository.";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Directory Input fallback
  const handleDirectoryMethod = async () => {
    setLoading(true);
    setError(null);
    setProgress(null);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      const result = await selectDirectoryInput({
        onProgress: setProgress,
        signal: abortControllerRef.current.signal,
      });

      onRepositorySelected?.(result);
      setOpen(false);
    } catch (err: unknown) {
      const error = err as { type?: string; message?: string };
      if (error.type !== 'user-cancelled') {
        const errorMsg = error.message || "Failed to load directory.";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } finally {
      setLoading(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  };

  // Handle ZIP Upload fallback
  const handleZipMethod = async () => {
    setLoading(true);
    setError(null);
    setProgress(null);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      const result = await selectZipFile({
        onProgress: setProgress,
        signal: abortControllerRef.current.signal,
      });

      onRepositorySelected?.(result);
      setOpen(false);
    } catch (err: unknown) {
      const error = err as { type?: string; message?: string };
      if (error.type !== 'user-cancelled') {
        const errorMsg = error.message || "Failed to load ZIP file.";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } finally {
      setLoading(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  };

  // Handle cancellation
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Determine if any method is available
  const hasAnyMethod = capabilities.fileSystemAccess || 
    (fallbacksEnabled && (capabilities.directoryInput || capabilities.fileInput));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          disabled={!hasAnyMethod}
          aria-label="Open repository"
          data-testid="open-repository"
        >
          <FolderOpenIcon className="mr-2 h-5 w-5" aria-hidden="true" />
          Open Repository
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Open Git Repository</DialogTitle>
          <DialogDescription>
            Select how you want to open your Git repository. Your data stays on your device and is never uploaded.
          </DialogDescription>
        </DialogHeader>

        {/* Capability Banner */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md" role="status">
          <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">{browserName} Support</p>
            <p>{getCapabilityMessage()}</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-md" role="alert">
            <AlertCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="flex-1 text-sm text-red-800 dark:text-red-200">
              <p className="font-semibold mb-1">Error</p>
              <p>{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-auto p-1"
              aria-label="Dismiss error"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Progress Display */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progress.message}</span>
              <span className="font-medium">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
                role="progressbar"
                aria-valuenow={progress.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {progress.current} / {progress.total} files processed
            </p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="samples"
              disabled={loading}
            >
              <BookOpenIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              Try a Sample
            </TabsTrigger>
            <TabsTrigger
              value="fsa"
              disabled={!capabilities.fileSystemAccess || loading}
            >
              <FolderOpenIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              Local Folder
            </TabsTrigger>
            <TabsTrigger
              value="directory"
              disabled={!capabilities.directoryInput || !fallbacksEnabled || loading}
            >
              <UploadIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              Upload Folder
            </TabsTrigger>
            <TabsTrigger
              value="zip"
              disabled={!capabilities.fileInput || !fallbacksEnabled || loading}
            >
              <FileArchiveIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              Upload ZIP
            </TabsTrigger>
          </TabsList>

          {/* Sample Repositories Tab */}
          <TabsContent value="samples" className="space-y-4">
            <SampleReposPanel
              onSampleSelected={onRepositorySelected}
              onError={(err) => {
                setError(err);
                onError?.(err);
              }}
              loading={loading}
              onLoadingChange={setLoading}
              onProgressChange={setProgress}
            />
          </TabsContent>

          {/* File System Access Tab */}
          <TabsContent value="fsa" className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Use your browser&apos;s native file picker to select a local Git repository folder.
                This provides the best experience with direct file system access.
              </p>
              <Button
                onClick={handleFSAMethod}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                    Opening...
                  </>
                ) : (
                  <>
                    <FolderOpenIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                    Select Local Folder
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Directory Input Tab */}
          <TabsContent value="directory" className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Upload a repository folder from your computer. All files will be read locally in your browser.
              </p>
              <Button
                onClick={handleDirectoryMethod}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                    Loading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                    Select Folder to Upload
                  </>
                )}
              </Button>
              {loading && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              )}
            </div>
          </TabsContent>

          {/* ZIP Upload Tab */}
          <TabsContent value="zip" className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Upload a ZIP archive of your repository. The file will be decompressed locally in your browser.
              </p>
              <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted rounded-md">
                <p className="font-semibold">To create a ZIP:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Right-click your repository folder</li>
                  <li>Select &quot;Compress&quot; or &quot;Send to → Compressed folder&quot;</li>
                  <li>Upload the resulting .zip file</li>
                </ul>
              </div>
              <Button
                onClick={handleZipMethod}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileArchiveIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                    Select ZIP File
                  </>
                )}
              </Button>
              {loading && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Privacy Assurances */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
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
      </DialogContent>
    </Dialog>
  );
}

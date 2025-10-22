"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RepositoryPicker } from "@/components/ingestion/repository-picker";
import { RepositoryHeader } from "@/components/repository/RepositoryHeader";
import { RepositoryVisualization } from "@/components/repository/RepositoryVisualization";
import { RepositoryInspector } from "@/components/repository/RepositoryInspector";
import { useRepository } from "@/lib/repository/RepositoryContext";
import type { GitCommit } from "@/cli/types";
import { AlertCircleIcon } from "lucide-react";

/**
 * Repository Visualization Page
 * 
 * Main page for visualizing Git repositories with interactive DAG.
 * Features:
 * - Local repository ingestion via File System Access API
 * - Real-time Git data processing
 * - Interactive commit graph visualization
 * - Commit detail inspector
 * 
 * Accessibility: WCAG 2.2 AA compliant with keyboard navigation
 * Performance: Automatic virtualization for large repositories
 */
export default function RepositoryPage() {
  const router = useRouter();
  const {
    currentRepository,
    isLoading,
    error,
    progress,
    handle,
    loadRepository,
    clearError,
    repositorySource,
  } = useRepository();
  const [selectedCommit, setSelectedCommit] = React.useState<GitCommit | null>(null);

  // Process repository when selected
  const handleRepositorySelected = React.useCallback(async (newHandle: FileSystemDirectoryHandle) => {
    try {
      await loadRepository(newHandle);
    } catch (err) {
      // Error is already handled by the context
      console.error("Repository selection error:", err);
    }
  }, [loadRepository]);

  // Handle GitHub repository loaded (already processed)
  const handleGitHubRepositoryLoaded = React.useCallback(() => {
    // Repository is already set in context by GitHubUrlInput component
    // Nothing to do here
  }, []);

  const handleError = React.useCallback((errorMessage: string) => {
    console.error("Repository selection error:", errorMessage);
  }, []);

  const handleRefresh = React.useCallback(async () => {
    // Only support refresh for local repositories
    if (handle && repositorySource === 'local') {
      await loadRepository(handle);
    }
  }, [handle, loadRepository, repositorySource]);

  const handleNodeSelect = React.useCallback((commit: GitCommit) => {
    setSelectedCommit(commit);
  }, []);

  const handleCloseInspector = React.useCallback(() => {
    setSelectedCommit(null);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <RepositoryHeader 
        repository={currentRepository} 
        onRefresh={currentRepository ? handleRefresh : undefined}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Repository selection or visualization */}
        {!currentRepository && !isLoading && (
          <div className="flex-1 flex items-center justify-center p-6">
            <Card className="max-w-2xl w-full">
              <CardHeader>
                <CardTitle>Repository Visualization</CardTitle>
                <CardDescription>
                  Select a local Git repository to visualize its commit history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This page provides an interactive visualization of your Git repository&apos;s
                  commit graph. You can explore commits, branches, and tags with full
                  keyboard navigation and accessibility support.
                </p>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-md border border-red-200 dark:border-red-800" role="alert">
                    <div className="flex gap-2">
                      <AlertCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                          Error Loading Repository
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          {error}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearError}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <RepositoryPicker
                    onRepositorySelected={handleRepositorySelected}
                    onGitHubRepositoryLoaded={handleGitHubRepositoryLoaded}
                    onError={handleError}
                  />
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                  >
                    Back to Home
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-2">Features</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Interactive commit graph with pan and zoom</li>
                    <li>• Keyboard navigation (Tab, Arrow keys, Enter, Escape)</li>
                    <li>• Branch and tag visualization</li>
                    <li>• Detailed commit inspector</li>
                    <li>• Performance optimized for large repositories</li>
                    <li>• Privacy-first: all processing happens locally</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Processing state */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold">Processing Repository...</div>
              {progress && (
                <>
                  <div className="text-sm text-muted-foreground">
                    {progress.message}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {progress.percentage}% complete
                  </div>
                  {progress.processed !== undefined && progress.total !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      {progress.processed} / {progress.total} items
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-center mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          </div>
        )}

        {/* Visualization */}
        {currentRepository && !isLoading && (
          <>
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <RepositoryVisualization
                repository={currentRepository}
                onNodeSelect={handleNodeSelect}
              />
            </div>

            {/* Inspector panel */}
            <RepositoryInspector
              selectedCommit={selectedCommit}
              repository={currentRepository}
              onClose={handleCloseInspector}
            />
          </>
        )}
      </div>
    </div>
  );
}

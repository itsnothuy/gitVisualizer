"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnhancedRepositoryPicker } from "@/components/ingestion/EnhancedRepositoryPicker";
import { RepositoryHeader } from "@/components/repository/RepositoryHeader";
import { RepositoryVisualization } from "@/components/repository/RepositoryVisualization";
import { RepositoryInspector } from "@/components/repository/RepositoryInspector";
import { useRepository } from "@/lib/repository/RepositoryContext";
import type { GitCommit } from "@/cli/types";

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
    refreshCurrentRepository,
  } = useRepository();
  const [selectedCommit, setSelectedCommit] = React.useState<GitCommit | null>(null);

  const handleRepositoryLoaded = React.useCallback(() => {
    // Repository loaded, UI will update automatically via context
  }, []);

  const handleError = React.useCallback((errorMessage: string) => {
    console.error("Repository selection error:", errorMessage);
  }, []);

  const handleRefresh = React.useCallback(async () => {
    await refreshCurrentRepository();
  }, [refreshCurrentRepository]);

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
        {!currentRepository && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-3xl w-full space-y-6">
              <Card>
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

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
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
                    <Button
                      variant="outline"
                      onClick={() => router.push('/')}
                    >
                      Back to Home
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Repository Picker */}
              <EnhancedRepositoryPicker
                onRepositoryLoaded={handleRepositoryLoaded}
                onError={handleError}
                showRecentRepositories={true}
              />
            </div>
          </div>
        )}

        {/* Visualization */}
        {currentRepository && (
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

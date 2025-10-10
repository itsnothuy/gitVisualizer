"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RepositoryPicker } from "@/components/ingestion/repository-picker";

export default function Home() {
  const [selectedRepo, setSelectedRepo] = React.useState<FileSystemDirectoryHandle | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleRepositorySelected = React.useCallback((handle: FileSystemDirectoryHandle) => {
    setSelectedRepo(handle);
    setError(null);
    console.log("Repository selected:", handle.name);
  }, []);

  const handleError = React.useCallback((errorMessage: string) => {
    setError(errorMessage);
    console.error("Repository selection error:", errorMessage);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Git Visualizer</h1>
        <p className="text-muted-foreground mt-2">
          A privacy-first, local-first Git commit graph visualizer
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Visualize your Git repository with an interactive commit graph
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Git Visualizer helps you understand your repository history with an accessible,
            interactive commit graph. All processing happens locally in your browser—no data
            is sent to external servers.
          </p>

          {selectedRepo && (
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-md" role="status">
              <p className="text-sm text-green-800 dark:text-green-200">
                <span className="font-semibold">Repository connected:</span> {selectedRepo.name}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-md" role="alert">
              <p className="text-sm text-red-800 dark:text-red-200">
                <span className="font-semibold">Error:</span> {error}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <RepositoryPicker
              onRepositorySelected={handleRepositorySelected}
              onError={handleError}
            />
            <Button variant="outline">Learn More</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

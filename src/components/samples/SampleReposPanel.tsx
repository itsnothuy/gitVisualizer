"use client";

/**
 * Sample Repositories Panel
 * 
 * Displays a list of available sample repositories that users can load
 * without requiring local files. Integrates with the ingestion flow.
 */

import * as React from "react";
import { BookOpenIcon, CheckCircleIcon, GitBranchIcon, TagIcon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSampleMetadata, loadSample } from "@/lib/samples";
import type { SampleMetadata } from "@/lib/samples/types";
import type { IngestResult, IngestProgress } from "@/lib/git/ingestion-types";

interface SampleReposPanelProps {
  onSampleSelected?: (result: IngestResult) => void;
  onError?: (error: string) => void;
  loading?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  onProgressChange?: (progress: IngestProgress | null) => void;
}

export function SampleReposPanel({
  onSampleSelected,
  onError,
  loading = false,
  onLoadingChange,
  onProgressChange,
}: SampleReposPanelProps) {
  const [samples, setSamples] = React.useState<SampleMetadata[]>([]);
  const [loadingSamples, setLoadingSamples] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load sample metadata on mount
  React.useEffect(() => {
    async function loadMetadata() {
      try {
        const data = await fetchSampleMetadata();
        setSamples(data.samples);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load samples";
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setLoadingSamples(false);
      }
    }

    loadMetadata();
  }, [onError]);

  const handleLoadSample = async (sample: SampleMetadata) => {
    onLoadingChange?.(true);
    setError(null);
    onProgressChange?.(null);

    try {
      const result = await loadSample(sample, {
        onProgress: (progress) => {
          // Convert to IngestProgress format
          onProgressChange?.({
            message: progress.message,
            percentage: progress.percentage,
            current: 0,
            total: 0,
          });
        },
      });

      onSampleSelected?.(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load sample";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      onLoadingChange?.(false);
      onProgressChange?.(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950";
      case "intermediate":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950";
      case "advanced":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950";
    }
  };

  if (loadingSamples) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">Loading samples...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600 dark:text-red-400">
        <p className="font-semibold">Error loading samples</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          Try out Git Visualizer with pre-built sample repositories. No local files needed!
        </p>
        <div className="flex items-start gap-1 text-xs">
          <CheckCircleIcon className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
          <span>All samples load entirely in your browser</span>
        </div>
      </div>

      <div className="grid gap-3">
        {samples.map((sample) => (
          <Card key={sample.id} className="hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpenIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {sample.name}
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    {sample.description}
                  </CardDescription>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${getDifficultyColor(
                    sample.difficulty
                  )}`}
                >
                  {sample.difficulty}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileTextIcon className="h-3 w-3" aria-hidden="true" />
                  <span>{sample.commits} commits</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitBranchIcon className="h-3 w-3" aria-hidden="true" />
                  <span>{sample.branches} {sample.branches === 1 ? "branch" : "branches"}</span>
                </div>
                {sample.tags > 0 && (
                  <div className="flex items-center gap-1">
                    <TagIcon className="h-3 w-3" aria-hidden="true" />
                    <span>{sample.tags} {sample.tags === 1 ? "tag" : "tags"}</span>
                  </div>
                )}
              </div>

              <ul className="text-xs text-muted-foreground space-y-1">
                {sample.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <CheckCircleIcon className="h-3 w-3 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleLoadSample(sample)}
                disabled={loading}
                className="w-full"
                size="sm"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                    Loading...
                  </>
                ) : (
                  <>Load Sample</>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

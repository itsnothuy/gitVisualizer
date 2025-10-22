"use client";

import * as React from "react";
import { GraphSVG } from "@/viz/svg/Graph";
import { elkLayout, type DagNode } from "@/viz/elk/layout";
import type { GitCommit } from "@/cli/types";
import type { ProcessedRepository } from "@/lib/git/processor";
import { useTheme } from "@/lib/theme/use-theme";
import { defaultSkin, lgbSkin } from "@/viz/skins/lgb/skin";

interface RepositoryVisualizationProps {
  repository: ProcessedRepository;
  onNodeSelect?: (commit: GitCommit) => void;
}

/**
 * Repository Visualization Component
 * 
 * Renders an interactive DAG visualization of a Git repository.
 * Integrates with ELK layout engine and GraphSVG renderer.
 */
export function RepositoryVisualization({ 
  repository, 
  onNodeSelect 
}: RepositoryVisualizationProps) {
  const [layoutData, setLayoutData] = React.useState<{
    positions: { [id: string]: { x: number; y: number } };
    edges: { id: string; source: string; target: string }[];
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { theme } = useTheme();

  // Select skin based on theme
  const skin = theme === 'lgb' ? lgbSkin : defaultSkin;

  // Convert commits to DagNodes
  const nodes: DagNode[] = React.useMemo(() => {
    return repository.dag.commits.map((commit) => {
      // Find branches and tags for this commit
      const branches = repository.dag.branches
        .filter(b => b.target === commit.id)
        .map(b => b.name);
      const tags = repository.dag.tags
        .filter(t => t.target === commit.id)
        .map(t => t.name);
      const refs = [...branches, ...tags];

      return {
        id: commit.id,
        title: commit.message.split('\n')[0], // First line only
        ts: commit.timestamp,
        parents: commit.parents,
        refs: refs.length > 0 ? refs : undefined,
      };
    });
  }, [repository]);

  // Compute layout
  React.useEffect(() => {
    async function computeLayout() {
      setIsLoading(true);
      setError(null);
      try {
        // Build edges from parent relationships
        const nodeIds = new Set(nodes.map(n => n.id));
        const edges = nodes.flatMap((node) =>
          node.parents.map((parentId, idx) => ({
            id: `${node.id}-${parentId}-${idx}`,
            source: node.id,
            target: parentId,
          }))
        ).filter((edge) => {
          // Validate that both source and target exist
          const isValid = nodeIds.has(edge.source) && nodeIds.has(edge.target);
          if (!isValid) {
            console.warn(`Invalid edge: ${edge.id} - source: ${nodeIds.has(edge.source)}, target: ${nodeIds.has(edge.target)}`);
          }
          return isValid;
        });

        // Compute layout using ELK
        const result = await elkLayout(nodes, edges, {
          direction: "RIGHT",
          spacing: {
            nodeNode: 24,
            layerLayer: 40,
          },
        });

        // Extract positions
        const positions: { [id: string]: { x: number; y: number } } = {};
        result.layout.children?.forEach((child) => {
          if (child.id) {
            positions[child.id] = {
              x: child.x || 0,
              y: child.y || 0,
            };
          }
        });

        setLayoutData({ positions, edges });
      } catch (err) {
        console.error("Layout computation failed:", err);
        setError(err instanceof Error ? err.message : "Failed to compute layout");
      } finally {
        setIsLoading(false);
      }
    }

    computeLayout();
  }, [nodes]);

  // Handle node selection
  const handleNodeSelect = React.useCallback((node: DagNode) => {
    const commit = repository.dag.commits.find(c => c.id === node.id);
    if (commit && onNodeSelect) {
      onNodeSelect(commit);
    }
  }, [repository, onNodeSelect]);

  const handleNodeFocus = React.useCallback((node: DagNode) => {
    console.log("Node focused:", node);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">Computing layout...</div>
          <div className="text-xs text-muted-foreground">
            Processing {nodes.length} commits
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-2">
          <div className="text-sm font-semibold text-destructive">Layout Error</div>
          <div className="text-xs text-muted-foreground max-w-md">{error}</div>
        </div>
      </div>
    );
  }

  if (!layoutData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-sm text-muted-foreground">No layout data available</div>
      </div>
    );
  }

  return (
    <div className="flex-1 border rounded-lg overflow-hidden bg-background">
      <GraphSVG
        nodes={nodes}
        edges={layoutData.edges}
        positions={layoutData.positions}
        height="100%"
        onNodeSelect={handleNodeSelect}
        onNodeFocus={handleNodeFocus}
        skin={skin}
      />
    </div>
  );
}

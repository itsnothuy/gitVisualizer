"use client";

import * as React from "react";
import { GraphSVG } from "@/viz/svg/Graph";
import { elkLayout, type DagNode } from "@/viz/elk/layout";
import { lgbSkin } from "@/viz/skins/lgb/skin";
import introFixture from "@/../fixtures/lgb/intro.json";
import rebaseFixture from "@/../fixtures/lgb/rebase.json";

/**
 * Convert fixture format to DagNode format
 */
function convertFixtureToNodes(fixture: typeof introFixture | typeof rebaseFixture): DagNode[] {
  return fixture.initialState.nodes.map((node) => ({
    id: node.id,
    title: node.id,
    ts: Date.now(),
    parents: node.parents,
    refs: node.refs,
  }));
}

export default function FixturePage({
  searchParams,
}: {
  searchParams: { fixture?: string };
}) {
  const fixtureName = searchParams.fixture || "intro";
  
  const [nodes] = React.useState<DagNode[]>(() => {
    const fixture = fixtureName === "rebase" ? rebaseFixture : introFixture;
    return convertFixtureToNodes(fixture);
  });
  
  const [layoutData, setLayoutData] = React.useState<{
    positions: { [id: string]: { x: number; y: number } };
    edges: { id: string; source: string; target: string }[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = React.useState(true);

  // Generate layout on mount
  React.useEffect(() => {
    async function computeLayout() {
      setIsLoading(true);
      try {
        // Build edges from parent relationships
        const edges = nodes.flatMap((node) =>
          node.parents.map((parentId, idx) => ({
            id: `${node.id}-${parentId}-${idx}`,
            source: node.id,
            target: parentId,
          }))
        );

        // Compute layout
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
      } finally {
        setIsLoading(false);
      }
    }

    computeLayout();
  }, [nodes]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          LGB Fixture: {fixtureName}
        </h1>
        <p className="text-muted-foreground mt-2">
          Visualizing {nodes.length} commits from fixture
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden bg-background" data-theme="lgb">
        {isLoading ? (
          <div className="h-[600px] flex items-center justify-center">
            <p className="text-muted-foreground">Computing layout...</p>
          </div>
        ) : layoutData ? (
          <GraphSVG
            nodes={nodes}
            edges={layoutData.edges}
            positions={layoutData.positions}
            height={600}
            skin={lgbSkin}
          />
        ) : (
          <div className="h-[600px] flex items-center justify-center">
            <p className="text-red-600">Failed to compute layout</p>
          </div>
        )}
      </div>
    </div>
  );
}

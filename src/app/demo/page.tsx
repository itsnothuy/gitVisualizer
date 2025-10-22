"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/lib/theme/use-theme";
import { elkLayout, type DagNode } from "@/viz/elk/layout";
import { defaultSkin, lgbSkin } from "@/viz/skins/lgb/skin";
import { GraphSVG } from "@/viz/svg/Graph";
import * as React from "react";

/**
 * Generate sample commit data for demo
 */
function generateSampleData(): DagNode[] {
  const now = Date.now();
  const hour = 3600000; // 1 hour in ms

  return [
    {
      id: "abc123",
      title: "Initial commit",
      ts: now - 10 * hour,
      parents: [],
      refs: ["main"],
    },
    {
      id: "def456",
      title: "Add README and documentation",
      ts: now - 9 * hour,
      parents: ["abc123"],
    },
    {
      id: "ghi789",
      title: "Implement core functionality",
      ts: now - 8 * hour,
      parents: ["def456"],
      ci: { status: "success" },
    },
    {
      id: "jkl012",
      title: "Add unit tests",
      ts: now - 7 * hour,
      parents: ["ghi789"],
      ci: { status: "success" },
    },
    {
      id: "mno345",
      title: "Create feature branch",
      ts: now - 6 * hour,
      parents: ["jkl012"],
      refs: ["feature/new-ui"],
    },
    {
      id: "pqr678",
      title: "Update UI components",
      ts: now - 5 * hour,
      parents: ["mno345"],
    },
    {
      id: "stu901",
      title: "Fix bug in parser",
      ts: now - 4 * hour,
      parents: ["jkl012"],
    },
    {
      id: "vwx234",
      title: "Merge feature branch",
      ts: now - 3 * hour,
      parents: ["stu901", "pqr678"],
      refs: ["main"],
      pr: { id: "42", url: "#" },
      ci: { status: "success" },
    },
    {
      id: "yza567",
      title: "Add integration tests",
      ts: now - 2 * hour,
      parents: ["vwx234"],
      ci: { status: "pending" },
    },
    {
      id: "bcd890",
      title: "Update dependencies",
      ts: now - 1 * hour,
      parents: ["yza567"],
      ci: { status: "failed" },
    },
    {
      id: "efg123",
      title: "Release v1.0.0",
      ts: now,
      parents: ["bcd890"],
      refs: ["main", "v1.0.0"],
      ci: { status: "success" },
    },
  ];
}

export default function DemoPage() {
  const [nodes] = React.useState<DagNode[]>(generateSampleData());
  const [layoutData, setLayoutData] = React.useState<{
    positions: { [id: string]: { x: number; y: number } };
    edges: { id: string; source: string; target: string }[];
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedNode, setSelectedNode] = React.useState<DagNode | null>(null);
  const { theme } = useTheme();

  // Select skin based on theme
  const skin = theme === 'lgb' ? lgbSkin : defaultSkin;

  // Generate layout on mount
  React.useEffect(() => {
    async function computeLayout() {
      setIsLoading(true);
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
            console.warn(`Invalid edge in demo: ${edge.id} - source: ${nodeIds.has(edge.source)}, target: ${nodeIds.has(edge.target)}`);
          }
          return isValid;
        });

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

  const handleNodeSelect = React.useCallback((node: DagNode) => {
    setSelectedNode(node);
    console.log("Node selected:", node);
  }, []);

  const handleNodeFocus = React.useCallback((node: DagNode) => {
    console.log("Node focused:", node);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Graph Renderer Demo</h1>
        <p className="text-muted-foreground mt-2">
          Interactive commit graph with keyboard navigation and tooltips
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Explore the graph visualization capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Keyboard Navigation:</strong> Press Tab to focus nodes, use Arrow keys to
              navigate, Enter/Space to select, Escape to unfocus
            </li>
            <li>
              <strong>Tooltips:</strong> Hover over or focus on nodes to see commit details
            </li>
            <li>
              <strong>Status Indicators:</strong> Color-independent shapes show CI status (✓ = pass,
              ✗ = fail, ⏱ = pending)
            </li>
            <li>
              <strong>Zoom & Pan:</strong> Use mouse wheel to zoom, click and drag to pan
            </li>
            <li>
              <strong>Accessibility:</strong> WCAG 2.2 AA compliant with screen reader support
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sample Git History</CardTitle>
          <CardDescription>
            {nodes.length} commits with branches, merges, and CI status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center">
              <p className="text-muted-foreground">Computing layout...</p>
            </div>
          ) : layoutData ? (
            <div className="border rounded-lg overflow-hidden bg-background">
              <GraphSVG
                nodes={nodes}
                edges={layoutData.edges}
                positions={layoutData.positions}
                height={600}
                onNodeSelect={handleNodeSelect}
                onNodeFocus={handleNodeFocus}
                skin={skin}
              />
            </div>
          ) : (
            <div className="h-[600px] flex items-center justify-center">
              <p className="text-red-600">Failed to compute layout</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Commit</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-semibold">ID:</dt>
                <dd className="font-mono text-muted-foreground">{selectedNode.id}</dd>
              </div>
              <div>
                <dt className="font-semibold">Message:</dt>
                <dd className="text-muted-foreground">{selectedNode.title}</dd>
              </div>
              <div>
                <dt className="font-semibold">Timestamp:</dt>
                <dd className="text-muted-foreground">
                  {new Date(selectedNode.ts).toLocaleString()}
                </dd>
              </div>
              {selectedNode.refs && selectedNode.refs.length > 0 && (
                <div>
                  <dt className="font-semibold">References:</dt>
                  <dd className="text-muted-foreground">{selectedNode.refs.join(", ")}</dd>
                </div>
              )}
              {selectedNode.pr && (
                <div>
                  <dt className="font-semibold">Pull Request:</dt>
                  <dd className="text-muted-foreground">#{selectedNode.pr.id}</dd>
                </div>
              )}
              {selectedNode.ci && (
                <div>
                  <dt className="font-semibold">CI Status:</dt>
                  <dd className="text-muted-foreground capitalize">{selectedNode.ci.status}</dd>
                </div>
              )}
            </dl>
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={() => setSelectedNode(null)}
            >
              Clear Selection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

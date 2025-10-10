/**
 * Web Worker for ELK layout computation
 * Offloads layout computation from the main thread to prevent UI blocking
 */

import ELK, { ElkNode, ElkExtendedEdge } from "elkjs";

export interface LayoutWorkerInput {
  id: string; // request ID for correlation
  nodes: Array<{
    id: string;
    title: string;
    width?: number;
    height?: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
  layoutOptions?: Record<string, string>;
}

export interface LayoutWorkerOutput {
  id: string; // matches request ID
  layout: ElkNode;
  duration: number; // layout computation time in ms
  error?: string;
}

// Initialize ELK instance
const elk = new ELK();

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<LayoutWorkerInput>) => {
  const { id, nodes, edges, layoutOptions } = event.data;
  const startTime = performance.now();

  try {
    // Default layout options following ADR-0004
    const defaultOptions: Record<string, string> = {
      "elk.algorithm": "layered",
      "elk.layered.spacing.nodeNodeBetweenLayers": "40",
      "elk.spacing.nodeNode": "24",
      "elk.direction": "RIGHT",
      ...layoutOptions,
    };

    // Build ELK graph
    const graph: ElkNode = {
      id: "root",
      layoutOptions: defaultOptions,
      children: nodes.map((n) => ({
        id: n.id,
        width: n.width || 160,
        height: n.height || 36,
        labels: [{ text: n.title }],
      })),
      edges: edges.map<ElkExtendedEdge>((e) => ({
        id: e.id,
        sources: [e.source], // ✅ arrays as required by ELK
        targets: [e.target],
      })),
    };

    // Perform layout computation
    const layout = await elk.layout(graph);
    const duration = performance.now() - startTime;

    // Send result back to main thread
    const response: LayoutWorkerOutput = {
      id,
      layout,
      duration,
    };
    self.postMessage(response);
  } catch (error) {
    // Send error back to main thread
    const response: LayoutWorkerOutput = {
      id,
      layout: { id: "root", children: [], edges: [] },
      duration: performance.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};

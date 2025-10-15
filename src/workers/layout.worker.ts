/**
 * Web Worker for ELK layout computation with Comlink interface
 * Offloads layout computation from the main thread to prevent UI blocking
 */

import ELK, { ElkNode, ElkExtendedEdge } from "elkjs";
import { expose } from "comlink";

export interface LayoutWorkerInput {
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
  layout: ElkNode;
  duration: number;
  error?: string;
}

// Default layout options following ADR-0004
const DEFAULT_OPTIONS: Record<string, string> = {
  "elk.algorithm": "layered",
  "elk.layered.spacing.nodeNodeBetweenLayers": "40",
  "elk.spacing.nodeNode": "24",
  "elk.direction": "RIGHT",
};

// Initialize ELK instance
const elk = new ELK();

/**
 * Compute layout using ELK
 */
async function computeLayout(
  input: LayoutWorkerInput
): Promise<LayoutWorkerOutput> {
  const { nodes, edges, layoutOptions } = input;
  const startTime = performance.now();

  try {
    // Merge with default options
    const finalOptions: Record<string, string> = {
      ...DEFAULT_OPTIONS,
      ...layoutOptions,
    };

    // Build ELK graph
    const graph: ElkNode = {
      id: "root",
      layoutOptions: finalOptions,
      children: nodes.map((n) => ({
        id: n.id,
        width: n.width || 160,
        height: n.height || 36,
        labels: [{ text: n.title }],
      })),
      edges: edges.map<ElkExtendedEdge>((e) => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      })),
    };

    // Perform layout computation
    const layout = await elk.layout(graph);
    const duration = performance.now() - startTime;

    return {
      layout,
      duration,
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      layout: { id: "root", children: [], edges: [] },
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Expose the worker API via Comlink
const workerApi = {
  computeLayout,
};

expose(workerApi);

export type LayoutWorkerApi = typeof workerApi;

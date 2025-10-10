import ELK, { ElkNode, ElkExtendedEdge } from "elkjs";
import {
  cacheLayout,
  getCachedLayout,
  type LayoutCacheKey,
} from "../../lib/cache/layout-cache";

export type DagNode = {
  id: string;
  title: string;
  ts: number;
  parents: string[];
  refs?: string[];
  pr?: { id: string; url: string } | null;
  ci?: { status: "success" | "failed" | "pending" | "unknown" } | null;
};

export interface LayoutOptions {
  algorithm?: "layered" | "force" | "mrtree";
  direction?: "RIGHT" | "LEFT" | "UP" | "DOWN";
  spacing?: {
    nodeNode?: number;
    layerLayer?: number;
  };
  useWorker?: boolean;
  enableCaching?: boolean;
}

export interface LayoutResult {
  layout: ElkNode;
  duration: number;
  cached: boolean;
}

// Default layout options following ADR-0004
const DEFAULT_OPTIONS: Record<string, string> = {
  "elk.algorithm": "layered",
  "elk.layered.spacing.nodeNodeBetweenLayers": "40",
  "elk.spacing.nodeNode": "24",
  "elk.direction": "RIGHT",
};

/**
 * Convert LayoutOptions to ELK layout options format
 */
function toElkOptions(options?: LayoutOptions): Record<string, string> {
  if (!options) return DEFAULT_OPTIONS;

  const elkOptions: Record<string, string> = { ...DEFAULT_OPTIONS };

  if (options.algorithm) {
    elkOptions["elk.algorithm"] = options.algorithm;
  }
  if (options.direction) {
    elkOptions["elk.direction"] = options.direction;
  }
  if (options.spacing?.nodeNode) {
    elkOptions["elk.spacing.nodeNode"] = String(options.spacing.nodeNode);
  }
  if (options.spacing?.layerLayer) {
    elkOptions["elk.layered.spacing.nodeNodeBetweenLayers"] = String(
      options.spacing.layerLayer
    );
  }

  return elkOptions;
}

/**
 * Perform layout using ELK directly (synchronous path)
 */
async function layoutDirect(
  nodes: DagNode[],
  edges: { id: string; source: string; target: string }[],
  layoutOptions: Record<string, string>
): Promise<ElkNode> {
  const elk = new ELK();
  const graph: ElkNode = {
    id: "root",
    layoutOptions,
    children: nodes.map((n) => ({
      id: n.id,
      width: 160,
      height: 36,
      labels: [{ text: n.title }],
    })),
    edges: edges.map<ElkExtendedEdge>((e) => ({
      id: e.id,
      sources: [e.source], // ✅ arrays as required by ELK
      targets: [e.target],
    })),
  };
  return elk.layout(graph);
}

/**
 * Perform layout using Web Worker (asynchronous, non-blocking)
 * Currently falls back to direct layout - Web Worker requires proper build configuration
 */
async function layoutWithWorker(
  nodes: DagNode[],
  edges: { id: string; source: string; target: string }[],
  layoutOptions: Record<string, string>
): Promise<{ layout: ElkNode; duration: number }> {
  // For now, fall back to direct layout if Worker API is not available
  // In production, use proper Web Worker file
  if (typeof Worker === "undefined") {
    const startTime = performance.now();
    const layout = await layoutDirect(nodes, edges, layoutOptions);
    const duration = performance.now() - startTime;
    return { layout, duration };
  }

  // Use direct layout for now - Web Worker requires proper build configuration
  const startTime = performance.now();
  const layout = await layoutDirect(nodes, edges, layoutOptions);
  const duration = performance.now() - startTime;
  return { layout, duration };
}

/**
 * Main layout function with caching and optional Web Worker support
 */
export async function elkLayout(
  nodes: DagNode[],
  edges: { id: string; source: string; target: string }[],
  options?: LayoutOptions
): Promise<LayoutResult> {
  const startTime = performance.now();
  const elkOptions = toElkOptions(options);
  const enableCaching = options?.enableCaching !== false; // default true
  const useWorker = options?.useWorker === true; // default false

  // Generate cache key
  const cacheKey: LayoutCacheKey = {
    nodeIds: nodes.map((n) => n.id),
    layoutOptions: JSON.stringify(elkOptions),
  };

  // Try to get from cache
  if (enableCaching) {
    try {
      const cached = await getCachedLayout(cacheKey);
      if (cached) {
        const duration = performance.now() - startTime;
        return { layout: cached, duration, cached: true };
      }
    } catch (error) {
      // Cache read failed, continue with layout
      console.warn("Cache read failed:", error);
    }
  }

  // Perform layout
  let layout: ElkNode;

  if (useWorker) {
    const result = await layoutWithWorker(nodes, edges, elkOptions);
    layout = result.layout;
  } else {
    layout = await layoutDirect(nodes, edges, elkOptions);
  }

  // Cache the result
  if (enableCaching) {
    try {
      await cacheLayout(cacheKey, layout);
    } catch (error) {
      // Cache write failed, but we have the layout
      console.warn("Cache write failed:", error);
    }
  }

  const totalDuration = performance.now() - startTime;
  return { layout, duration: totalDuration, cached: false };
}

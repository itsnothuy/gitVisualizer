import type { ElkNode, ElkExtendedEdge } from "elkjs";
import {
  cacheLayout,
  getCachedLayout,
  type LayoutCacheKey,
} from "../../lib/cache/layout-cache";
import { wrap } from "comlink";
import type { LayoutWorkerApi } from "../../workers/layout.worker";
import { DEFAULT_THRESHOLDS } from "../../lib/perf-config";

// Threshold for using Web Worker (nodes count)
// Can be configured via NEXT_PUBLIC_WORKER_THRESHOLD env var
const WORKER_THRESHOLD = DEFAULT_THRESHOLDS.workerThreshold;

// Lazy-load ELK to avoid loading it on non-graph pages
let elkInstance: InstanceType<typeof import("elkjs").default> | null = null;
async function getElk(): Promise<InstanceType<typeof import("elkjs").default>> {
  if (!elkInstance) {
    const ELK = await import("elkjs").then((m) => m.default);
    elkInstance = new ELK();
  }
  return elkInstance;
}

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
  const elk = await getElk();
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
 * Uses Comlink for type-safe worker communication
 */
async function layoutWithWorker(
  nodes: DagNode[],
  edges: { id: string; source: string; target: string }[],
  layoutOptions: Record<string, string>
): Promise<{ layout: ElkNode; duration: number }> {
  // Fall back to direct layout if Worker API is not available
  if (typeof Worker === "undefined") {
    const startTime = performance.now();
    const layout = await layoutDirect(nodes, edges, layoutOptions);
    const duration = performance.now() - startTime;
    return { layout, duration };
  }

  try {
    // Create worker and wrap with Comlink
    const worker = new Worker(
      new URL("../../workers/layout.worker.ts", import.meta.url),
      { type: "module" }
    );
    const workerApi = wrap<LayoutWorkerApi>(worker);

    // Call worker
    const result = await workerApi.computeLayout({
      nodes: nodes.map((n) => ({
        id: n.id,
        title: n.title,
        width: 160,
        height: 36,
      })),
      edges,
      layoutOptions,
    });

    // Terminate worker
    worker.terminate();

    if (result.error) {
      throw new Error(`Worker error: ${result.error}`);
    }

    return { layout: result.layout, duration: result.duration };
  } catch (error) {
    console.warn("Worker layout failed, falling back to direct:", error);
    // Fall back to direct layout on error
    const startTime = performance.now();
    const layout = await layoutDirect(nodes, edges, layoutOptions);
    const duration = performance.now() - startTime;
    return { layout, duration };
  }
}

/**
 * Main layout function with caching and optional Web Worker support
 * Automatically uses Worker for large graphs (>1500 nodes)
 */
export async function elkLayout(
  nodes: DagNode[],
  edges: { id: string; source: string; target: string }[],
  options?: LayoutOptions
): Promise<LayoutResult> {
  const startTime = performance.now();
  const elkOptions = toElkOptions(options);
  const enableCaching = options?.enableCaching !== false; // default true
  // Use worker if explicitly requested OR if node count > threshold
  const useWorker = 
    options?.useWorker === true || 
    (options?.useWorker !== false && nodes.length > WORKER_THRESHOLD);

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

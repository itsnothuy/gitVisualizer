/**
 * Rendering Mode Engine
 * 
 * Determines optimal rendering mode based on graph complexity, device capabilities,
 * and current performance metrics. Handles automatic degradation and upgrades.
 */

import type {
  DeviceCapabilities,
  PerformanceMetrics,
  ProcessedDAG,
  RenderingMode,
} from './types';

/**
 * Performance thresholds for mode selection
 */
export const RENDERING_THRESHOLDS = {
  SVG_MAX_NODES: 1500,
  SVG_MAX_EDGES: 3000,
  CANVAS_MAX_NODES: 10000,
  CANVAS_MAX_EDGES: 20000,
  WEBGL_THRESHOLD: 50000, // Total elements
} as const;

/**
 * Rendering Mode Engine
 * 
 * Automatically selects the optimal rendering mode based on:
 * - Graph size (nodes + edges)
 * - Device capabilities (WebGL support, memory, etc.)
 * - Current performance metrics
 */
export class RenderingModeEngine {
  private currentMode: RenderingMode = 'svg';
  private deviceCapabilities: DeviceCapabilities | null = null;

  /**
   * Get the performance thresholds
   */
  get THRESHOLDS() {
    return RENDERING_THRESHOLDS;
  }

  /**
   * Determine the optimal rendering mode for a graph
   */
  determineRenderingMode(graph: ProcessedDAG): RenderingMode {
    const nodeCount = graph.nodes.length;
    const edgeCount = graph.edges.length;
    const totalElements = nodeCount + edgeCount;

    // Check if we need WebGL (massive graphs)
    if (totalElements >= RENDERING_THRESHOLDS.WEBGL_THRESHOLD) {
      if (this.deviceCapabilities?.webgl2Supported || this.deviceCapabilities?.webglSupported) {
        return 'webgl';
      }
      // Fall back to Canvas if WebGL not available
      return 'canvas';
    }

    // Check if we need Canvas (large graphs)
    if (
      nodeCount > RENDERING_THRESHOLDS.SVG_MAX_NODES ||
      edgeCount > RENDERING_THRESHOLDS.SVG_MAX_EDGES ||
      totalElements > RENDERING_THRESHOLDS.CANVAS_MAX_NODES
    ) {
      return 'canvas';
    }

    // Use SVG for small to medium graphs
    return 'svg';
  }

  /**
   * Check if we can upgrade to a better rendering mode
   */
  canUpgradeMode(currentMode: RenderingMode, graph: ProcessedDAG): boolean {
    const optimalMode = this.determineRenderingMode(graph);

    // Define mode hierarchy: svg < canvas < webgl (in terms of capability, not quality)
    const modeRank: Record<RenderingMode, number> = {
      svg: 0,
      canvas: 1,
      webgl: 2,
    };

    // We can upgrade if optimal mode is "less capable" (meaning the graph is smaller)
    return modeRank[optimalMode] < modeRank[currentMode];
  }

  /**
   * Check if we should degrade to a lower rendering mode due to poor performance
   */
  shouldDegradeMode(metrics: PerformanceMetrics): boolean {
    // Degrade if frame time consistently exceeds 60 FPS target (16.7ms)
    const frameTimeExceeded = metrics.averageFrameTime > 20; // 20ms threshold with buffer

    // Degrade if too many dropped frames
    const tooManyDrops = metrics.frameDropCount > 5;

    // Degrade if memory usage is too high (over 400MB)
    const highMemory = metrics.memoryUsage > 400;

    return frameTimeExceeded || tooManyDrops || highMemory;
  }

  /**
   * Suggest a degraded mode when performance is poor
   */
  suggestDegradedMode(currentMode: RenderingMode, metrics: PerformanceMetrics): RenderingMode {
    // If already at SVG (lowest quality mode), can't degrade further
    if (currentMode === 'svg') {
      return 'svg';
    }

    // Degrade one step: webgl -> canvas -> svg
    if (currentMode === 'webgl') {
      // Check if we should go straight to SVG or stop at Canvas
      if (metrics.averageFrameTime > 50 || metrics.memoryUsage > 450) {
        return 'canvas'; // Severe issues, degrade to canvas
      }
      return 'canvas';
    }

    // currentMode === 'canvas'
    return 'svg';
  }

  /**
   * Set device capabilities for mode selection
   */
  adaptToDeviceCapabilities(capabilities: DeviceCapabilities): void {
    this.deviceCapabilities = capabilities;
  }

  /**
   * Get current rendering mode
   */
  getCurrentMode(): RenderingMode {
    return this.currentMode;
  }

  /**
   * Switch to a specific rendering mode
   */
  switchToMode(mode: RenderingMode): void {
    this.currentMode = mode;
  }
}

/**
 * Detect device capabilities
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      devicePixelRatio: 1,
      maxTextureSize: 2048,
      webglSupported: false,
      webgl2Supported: false,
      hardwareConcurrency: 1,
      memoryLimit: 0,
      offscreenCanvasSupported: false,
    };
  }

  // Detect WebGL support with comprehensive error handling
  let webglSupported = false;
  let webgl2Supported = false;
  let maxTextureSize = 2048; // Safe fallback

  try {
    const canvas = document.createElement('canvas');

    // Try WebGL2 first
    try {
      const gl2 = canvas.getContext('webgl2');
      if (gl2) {
        webgl2Supported = true;
        webglSupported = true;
        try {
          maxTextureSize = gl2.getParameter(gl2.MAX_TEXTURE_SIZE) || 2048;
        } catch {
          maxTextureSize = 2048; // Safe fallback
        }
      }
    } catch {
      // WebGL2 failed, continue to try WebGL1
    }

    // If WebGL2 failed, try WebGL1
    if (!webglSupported) {
      try {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          webglSupported = true;
          try {
            maxTextureSize = (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).MAX_TEXTURE_SIZE) || 2048;
          } catch {
            maxTextureSize = 2048; // Safe fallback
          }
        }
      } catch {
        // WebGL1 also failed
      }
    }
  } catch {
    // Canvas creation failed completely - use safe defaults
    webglSupported = false;
    webgl2Supported = false;
    maxTextureSize = 2048;
  }

  // Detect OffscreenCanvas support with error handling
  let offscreenCanvasSupported = false;
  try {
    offscreenCanvasSupported = typeof OffscreenCanvas !== 'undefined';
  } catch {
    offscreenCanvasSupported = false;
  }

  // Get device memory if available (Chrome only) with error handling
  let memoryLimit = 4096; // Default to 4GB in MB
  try {
    // @ts-expect-error - deviceMemory is not standard
    const deviceMemory = navigator.deviceMemory || 4; // Default to 4GB
    memoryLimit = deviceMemory * 1024; // Convert to MB
  } catch {
    memoryLimit = 4096; // Safe fallback
  }

  // Get device pixel ratio with error handling
  let devicePixelRatio = 1;
  try {
    devicePixelRatio = window.devicePixelRatio || 1;
  } catch {
    devicePixelRatio = 1;
  }

  // Get hardware concurrency with error handling
  let hardwareConcurrency = 4;
  try {
    hardwareConcurrency = navigator.hardwareConcurrency || 4;
  } catch {
    hardwareConcurrency = 4;
  }

  return {
    devicePixelRatio,
    maxTextureSize,
    webglSupported,
    webgl2Supported,
    hardwareConcurrency,
    memoryLimit,
    offscreenCanvasSupported,
  };
}

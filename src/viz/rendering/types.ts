/**
 * Rendering System Types
 * 
 * Core types and interfaces for the hybrid rendering system that supports
 * SVG, Canvas, and WebGL rendering modes with automatic mode selection.
 */

import type { DagNode } from '../elk/layout';

/**
 * Available rendering modes
 */
export type RenderingMode = 'svg' | 'canvas' | 'webgl';

/**
 * Performance metrics collected during rendering
 */
export interface PerformanceMetrics {
  /** Average frame time in milliseconds */
  averageFrameTime: number;
  /** Number of dropped frames (>16.7ms) */
  frameDropCount: number;
  /** Current memory usage in MB */
  memoryUsage: number;
  /** Last rendering operation time in ms */
  renderingTime: number;
  /** Interaction latency in ms */
  interactionLatency: number;
  /** Total number of nodes in graph */
  nodeCount: number;
  /** Total number of edges in graph */
  edgeCount: number;
}

/**
 * Device capabilities for adapting rendering
 */
export interface DeviceCapabilities {
  /** Device pixel ratio (for high-DPI displays) */
  devicePixelRatio: number;
  /** Maximum WebGL texture size */
  maxTextureSize: number;
  /** Whether WebGL 1.0 is supported */
  webglSupported: boolean;
  /** Whether WebGL 2.0 is supported */
  webgl2Supported: boolean;
  /** Number of logical CPU cores */
  hardwareConcurrency: number;
  /** Estimated memory limit in MB */
  memoryLimit: number;
  /** Whether OffscreenCanvas is supported */
  offscreenCanvasSupported: boolean;
}

/**
 * Processed DAG for rendering
 */
export interface ProcessedDAG {
  nodes: DagNode[];
  edges: Array<{ id: string; source: string; target: string }>;
  positions: Record<string, { x: number; y: number }>;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

/**
 * Viewport state for rendering
 */
export interface ViewportState {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

/**
 * Rendering options
 */
export interface RenderingOptions {
  /** Force a specific rendering mode (overrides automatic selection) */
  forceMode?: RenderingMode;
  /** Enable virtualization for large graphs */
  enableVirtualization: boolean;
  /** Maximum nodes to show in viewport */
  maxNodesInView: number;
  /** Rendering quality level */
  renderQuality: 'low' | 'medium' | 'high';
  /** Enable offscreen rendering (if supported) */
  enableOffscreenRendering: boolean;
  /** Device pixel ratio override */
  devicePixelRatio?: number;
}

/**
 * Level of Detail for progressive rendering
 */
export enum LODLevel {
  LOW = 0,    // Dots for nodes, no labels
  MEDIUM = 1, // Simple shapes, major labels only
  HIGH = 2,   // Full detail, all labels
  ULTRA = 3   // Maximum quality, all effects
}

/**
 * Visible elements after culling and LOD
 */
export interface VisibleElements {
  nodes: OptimizedNode[];
  edges: OptimizedEdge[];
  labels: OptimizedLabel[];
}

/**
 * Optimized node for rendering
 */
export interface OptimizedNode extends DagNode {
  renderStyle: NodeRenderStyle;
  shouldRenderDetails: boolean;
  shouldRenderLabels: boolean;
  bounds?: Bounds;
}

/**
 * Optimized edge for rendering
 */
export interface OptimizedEdge {
  id: string;
  source: string;
  target: string;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
  renderStyle: EdgeRenderStyle;
  bounds: Bounds;
}

/**
 * Optimized label for rendering
 */
export interface OptimizedLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  bounds: Bounds;
}

/**
 * Bounding box for spatial indexing
 */
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Node rendering style based on LOD
 */
export interface NodeRenderStyle {
  radius: number;
  strokeWidth: number;
  showLabel: boolean;
  showDetails: boolean;
  quality: LODLevel;
}

/**
 * Edge rendering style based on LOD
 */
export interface EdgeRenderStyle {
  strokeWidth: number;
  showArrow: boolean;
  quality: LODLevel;
}

/**
 * Interaction result from pointer events
 */
export interface InteractionResult {
  type: 'node' | 'edge' | 'none';
  id?: string;
  data?: DagNode | OptimizedEdge;
}

/**
 * Performance degradation thresholds
 */
export interface DegradationThresholds {
  /** Maximum frame time in ms (16.67ms for 60fps) */
  maxFrameTime: number;
  /** Maximum memory usage in MB */
  maxMemoryUsage: number;
  /** Maximum frame drop rate (percentage) */
  maxFrameDropRate: number;
  /** Maximum render time per frame in ms */
  maxRenderTime: number;
}

/**
 * Performance report for monitoring
 */
export interface PerformanceReport {
  timestamp: number;
  renderingMode: RenderingMode;
  metrics: PerformanceMetrics;
  recommendations: PerformanceRecommendation[];
  deviceCapabilities: DeviceCapabilities;
}

/**
 * Performance recommendation
 */
export interface PerformanceRecommendation {
  type: 'mode-change' | 'setting-change' | 'warning';
  message: string;
  suggestedMode?: RenderingMode;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Accessibility announcement
 */
export interface AccessibilityAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
  type: 'navigation' | 'selection' | 'structure' | 'status';
}

/**
 * Accessible element for Canvas/WebGL modes
 */
export interface AccessibleElement {
  element: HTMLElement;
  node: DagNode;
}

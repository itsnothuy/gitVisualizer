/**
 * Unified Graph Renderer
 * 
 * Automatically selects and switches between SVG, Canvas, and WebGL rendering modes
 * based on graph complexity and performance metrics.
 */

'use client';

import * as React from 'react';
import { GraphSVG } from '../svg/Graph';
import { RenderingModeEngine, detectDeviceCapabilities } from './RenderingModeEngine';
import { PerformanceMonitor } from './PerformanceMonitor';
import { CanvasRenderer } from './CanvasRenderer';
import { WebGLRenderer } from './WebGLRenderer';
import type { DagNode } from '../elk/layout';
import type { RenderingMode, ProcessedDAG, ViewportState } from './types';

/**
 * Graph renderer props
 */
export interface GraphRendererProps {
  /** Nodes in the graph */
  nodes: DagNode[];
  /** Edges connecting nodes */
  edges: Array<{ id: string; source: string; target: string }>;
  /** Node positions from layout */
  positions: Record<string, { x: number; y: number }>;
  /** Canvas width */
  width?: string | number;
  /** Canvas height */
  height?: string | number;
  /** Force a specific rendering mode */
  forceMode?: RenderingMode;
  /** Enable automatic performance-based mode switching */
  enableAutoSwitch?: boolean;
  /** Enable virtualization */
  enableVirtualization?: boolean;
  /** Callback when node is selected */
  onNodeSelect?: (node: DagNode) => void;
  /** Callback when node receives focus */
  onNodeFocus?: (node: DagNode) => void;
  /** Callback when rendering mode changes */
  onModeChange?: (mode: RenderingMode) => void;
}

/**
 * Unified Graph Renderer Component
 * 
 * Automatically selects optimal rendering mode and handles mode transitions.
 */
export function GraphRenderer({
  nodes,
  edges,
  positions,
  width = '100%',
  height = 600,
  forceMode,
  enableAutoSwitch = true,
  enableVirtualization = true,
  onNodeSelect,
  onNodeFocus,
  onModeChange,
}: GraphRendererProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRendererRef = React.useRef<CanvasRenderer | null>(null);
  const webglRendererRef = React.useRef<WebGLRenderer | null>(null);
  
  const [renderingMode, setRenderingMode] = React.useState<RenderingMode>('svg');
  const [perfMonitor] = React.useState(() => new PerformanceMonitor({
    onDegradation: (mode) => {
      if (enableAutoSwitch && !forceMode) {
        setRenderingMode(mode);
        onModeChange?.(mode);
      }
    },
  }));
  const [modeEngine] = React.useState(() => new RenderingModeEngine());

  // Detect device capabilities on mount
  React.useEffect(() => {
    const capabilities = detectDeviceCapabilities();
    modeEngine.adaptToDeviceCapabilities(capabilities);
    perfMonitor.setRenderingModeEngine(modeEngine);
  }, [modeEngine, perfMonitor]);

  // Determine rendering mode based on graph size
  React.useEffect(() => {
    if (forceMode) {
      setRenderingMode(forceMode);
      modeEngine.switchToMode(forceMode);
      return;
    }

    if (!enableAutoSwitch) {
      return;
    }

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      const pos = positions[node.id];
      if (pos) {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x);
        maxY = Math.max(maxY, pos.y);
      }
    });

    const graph: ProcessedDAG = {
      nodes,
      edges,
      positions,
      bounds: {
        minX: minX === Infinity ? 0 : minX,
        minY: minY === Infinity ? 0 : minY,
        maxX: maxX === -Infinity ? 1000 : maxX,
        maxY: maxY === -Infinity ? 1000 : maxY,
      },
    };

    const optimalMode = modeEngine.determineRenderingMode(graph);
    if (optimalMode !== renderingMode) {
      setRenderingMode(optimalMode);
      modeEngine.switchToMode(optimalMode);
      onModeChange?.(optimalMode);
    }

    // Update performance metrics
    perfMonitor.updateGraphSize(nodes.length, edges.length);
  }, [nodes.length, edges.length, forceMode, enableAutoSwitch, renderingMode, modeEngine, perfMonitor, onModeChange, nodes, edges, positions]);

  // Start performance monitoring
  React.useEffect(() => {
    if (enableAutoSwitch) {
      perfMonitor.startFrameTracking();
    }
    return () => {
      perfMonitor.stopFrameTracking();
    };
  }, [enableAutoSwitch, perfMonitor]);

  // Cleanup renderers on unmount
  React.useEffect(() => {
    return () => {
      canvasRendererRef.current?.destroy();
      webglRendererRef.current?.destroy();
    };
  }, []);

  // Handle Canvas rendering
  React.useEffect(() => {
    if (!containerRef.current || renderingMode !== 'canvas') return;

    // Create renderer if needed
    if (!canvasRendererRef.current) {
      canvasRendererRef.current = new CanvasRenderer(containerRef.current, {
        enableVirtualization,
        onNodeClick: onNodeSelect,
        onNodeFocus,
      });
    }

    // Calculate viewport
    const viewport: ViewportState = {
      x: 0,
      y: 0,
      width: typeof width === 'number' ? width : 1200,
      height: typeof height === 'number' ? height : 600,
      zoom: 1,
      bounds: {
        minX: 0,
        minY: 0,
        maxX: typeof width === 'number' ? width : 1200,
        maxY: typeof height === 'number' ? height : 600,
      },
    };

    // Build graph data
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      const pos = positions[node.id];
      if (pos) {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x);
        maxY = Math.max(maxY, pos.y);
      }
    });

    const graph: ProcessedDAG = {
      nodes,
      edges,
      positions,
      bounds: {
        minX: minX === Infinity ? 0 : minX,
        minY: minY === Infinity ? 0 : minY,
        maxX: maxX === -Infinity ? 1000 : maxX,
        maxY: maxY === -Infinity ? 1000 : maxY,
      },
    };

    // Render
    canvasRendererRef.current.render(graph, viewport);
  }, [renderingMode, nodes, edges, positions, width, height, enableVirtualization, onNodeSelect, onNodeFocus]);

  // Handle WebGL rendering
  React.useEffect(() => {
    if (!containerRef.current || renderingMode !== 'webgl') return;

    // Create renderer if needed
    if (!webglRendererRef.current) {
      try {
        webglRendererRef.current = new WebGLRenderer(containerRef.current, {
          onNodeClick: onNodeSelect,
        });
      } catch (error) {
        console.error('WebGL not supported, falling back to Canvas', error);
        setRenderingMode('canvas');
        return;
      }
    }

    // TODO: Render with WebGL
    // For now, this is a stub
  }, [renderingMode, onNodeSelect]);

  // Render based on mode
  if (renderingMode === 'canvas') {
    return (
      <div
        ref={containerRef}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          position: 'relative',
        }}
      />
    );
  }

  if (renderingMode === 'webgl') {
    return (
      <div
        ref={containerRef}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          position: 'relative',
        }}
      />
    );
  }

  // Default to SVG mode
  return (
    <GraphSVG
      nodes={nodes}
      edges={edges}
      positions={positions}
      width={width}
      height={height}
      onNodeSelect={onNodeSelect}
      onNodeFocus={onNodeFocus}
      enableVirtualization={enableVirtualization}
    />
  );
}

/**
 * Canvas Renderer
 * 
 * High-performance Canvas-based renderer for large graphs (1.5k - 10k nodes).
 * Supports virtualization, level-of-detail, and full accessibility.
 */

import type {
  ProcessedDAG,
  ViewportState,
  InteractionResult,
  RenderingOptions,
} from './types';
import { CanvasVirtualization, type VirtualizationOptions } from './CanvasVirtualization';
import { CanvasAccessibilityLayer } from './CanvasAccessibilityLayer';
import type { DagNode } from '../elk/layout';

/**
 * Canvas renderer options
 */
export interface CanvasRendererOptions extends Partial<RenderingOptions> {
  /** Callback when node is clicked */
  onNodeClick?: (node: DagNode) => void;
  /** Callback when node receives focus */
  onNodeFocus?: (node: DagNode) => void;
}

/**
 * Canvas Renderer
 * 
 * Renders Git graphs using HTML5 Canvas with viewport culling and LOD.
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private virtualization: CanvasVirtualization;
  private a11yLayer: CanvasAccessibilityLayer;
  private currentGraph: ProcessedDAG | null = null;
  private currentViewport: ViewportState | null = null;
  private options: CanvasRendererOptions;
  private devicePixelRatio: number;

  constructor(container: HTMLElement, options: CanvasRendererOptions = {}) {
    this.container = container;
    this.options = {
      enableVirtualization: true,
      maxNodesInView: 5000,
      renderQuality: 'high',
      enableOffscreenRendering: false,
      ...options,
    };

    this.devicePixelRatio = options.devicePixelRatio || window.devicePixelRatio || 1;

    // Setup canvas
    this.canvas = this.setupCanvas(container);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;

    // Setup virtualization
    const virtualizationOptions: VirtualizationOptions = {
      bounds: { minX: 0, minY: 0, maxX: 10000, maxY: 10000 },
      viewportPadding: 100,
    };
    this.virtualization = new CanvasVirtualization(virtualizationOptions);

    // Setup accessibility layer
    this.a11yLayer = new CanvasAccessibilityLayer(container, {
      onNodeActivate: options.onNodeClick,
      onNodeFocus: options.onNodeFocus,
    });

    // Setup pointer events
    this.setupPointerEvents();
  }

  /**
   * Setup canvas element
   */
  private setupCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    container.appendChild(canvas);
    
    // Set actual size based on device pixel ratio
    this.resizeCanvas(canvas);
    
    return canvas;
  }

  /**
   * Resize canvas to match container and device pixel ratio
   */
  private resizeCanvas(canvas: HTMLCanvasElement): void {
    const rect = this.container.getBoundingClientRect();
    canvas.width = rect.width * this.devicePixelRatio;
    canvas.height = rect.height * this.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    // Scale context for device pixel ratio
    this.ctx?.scale(this.devicePixelRatio, this.devicePixelRatio);
  }

  /**
   * Render the graph
   */
  render(graph: ProcessedDAG, viewport: ViewportState): void {
    this.currentGraph = graph;
    this.currentViewport = viewport;

    // Update spatial index
    this.virtualization.updateSpatialIndex(graph);

    // Get visible elements
    const visibleElements = this.virtualization.getVisibleElements(graph, viewport);

    // Clear canvas
    this.clearCanvas();

    // Save context state
    this.ctx.save();

    // Apply viewport transform
    this.applyViewportTransform(viewport);

    // Render in layers
    this.renderEdges(visibleElements.edges);
    this.renderNodes(visibleElements.nodes);
    this.renderLabels(visibleElements.labels);

    // Restore context state
    this.ctx.restore();

    // Update accessibility layer
    this.a11yLayer.updateFocusableElements(visibleElements);
  }

  /**
   * Clear the canvas
   */
  private clearCanvas(): void {
    const rect = this.container.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Fill background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
  }

  /**
   * Apply viewport transformation
   */
  private applyViewportTransform(viewport: ViewportState): void {
    this.ctx.translate(-viewport.x, -viewport.y);
    this.ctx.scale(viewport.zoom, viewport.zoom);
  }

  /**
   * Render edges
   */
  private renderEdges(edges: Array<{ sourcePos: { x: number; y: number }; targetPos: { x: number; y: number }; renderStyle: { strokeWidth: number } }>): void {
    this.ctx.strokeStyle = '#94a3b8'; // slate-400
    
    edges.forEach(edge => {
      this.ctx.lineWidth = edge.renderStyle.strokeWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(edge.sourcePos.x, edge.sourcePos.y);
      this.ctx.lineTo(edge.targetPos.x, edge.targetPos.y);
      this.ctx.stroke();
    });
  }

  /**
   * Render nodes
   */
  private renderNodes(nodes: Array<{ id: string; bounds?: { minX: number; minY: number; maxX: number; maxY: number }; renderStyle: { radius: number; strokeWidth: number } }>): void {
    nodes.forEach(node => {
      if (!node.bounds) return;
      
      const centerX = (node.bounds.minX + node.bounds.maxX) / 2;
      const centerY = (node.bounds.minY + node.bounds.maxY) / 2;
      const radius = node.renderStyle.radius;

      // Draw node circle
      this.ctx.fillStyle = '#1e293b'; // slate-800
      this.ctx.strokeStyle = '#64748b'; // slate-500
      this.ctx.lineWidth = node.renderStyle.strokeWidth;
      
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    });
  }

  /**
   * Render labels
   */
  private renderLabels(labels: Array<{ text: string; x: number; y: number; fontSize: number }>): void {
    this.ctx.fillStyle = '#0f172a'; // slate-900
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    
    labels.forEach(label => {
      this.ctx.font = `${label.fontSize}px sans-serif`;
      this.ctx.fillText(label.text, label.x, label.y);
    });
  }

  /**
   * Setup pointer event handlers
   */
  private setupPointerEvents(): void {
    this.canvas.addEventListener('pointerdown', this.handlePointerEvent.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerEvent.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerEvent.bind(this));
  }

  /**
   * Handle pointer events for interaction
   */
  handlePointerEvent(event: PointerEvent): InteractionResult {
    if (!this.currentViewport || !this.currentGraph) {
      return { type: 'none' };
    }

    // Convert screen coordinates to canvas coordinates
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) / this.currentViewport.zoom + this.currentViewport.x;
    const canvasY = (event.clientY - rect.top) / this.currentViewport.zoom + this.currentViewport.y;

    // Perform hit test
    const hitResult = this.performHitTest({ x: canvasX, y: canvasY });

    // Handle click events
    if (event.type === 'pointerup' && hitResult.type === 'node' && hitResult.data) {
      this.options.onNodeClick?.(hitResult.data as DagNode);
    }

    return hitResult;
  }

  /**
   * Perform hit test to find element at point
   */
  private performHitTest(point: { x: number; y: number }): InteractionResult {
    if (!this.currentGraph) {
      return { type: 'none' };
    }

    // Check nodes (simple distance check)
    for (const node of this.currentGraph.nodes) {
      const pos = this.currentGraph.positions[node.id];
      if (!pos) continue;

      const distance = Math.sqrt(
        Math.pow(point.x - pos.x, 2) + Math.pow(point.y - pos.y, 2)
      );

      if (distance <= 8) { // Node radius
        return {
          type: 'node',
          id: node.id,
          data: node,
        };
      }
    }

    return { type: 'none' };
  }

  /**
   * Resize the renderer
   */
  resize(): void {
    this.resizeCanvas(this.canvas);
    
    // Re-render if we have a graph
    if (this.currentGraph && this.currentViewport) {
      this.render(this.currentGraph, this.currentViewport);
    }
  }

  /**
   * Clean up and destroy the renderer
   */
  destroy(): void {
    this.a11yLayer.destroy();
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

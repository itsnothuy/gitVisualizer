/**
 * Canvas Virtualization System
 * 
 * Implements viewport culling and level-of-detail rendering for Canvas mode.
 * Uses spatial indexing (QuadTree) for efficient element queries.
 */

import {
  LODLevel,
  type ProcessedDAG,
  type ViewportState,
  type VisibleElements,
  type OptimizedNode,
  type OptimizedEdge,
  type OptimizedLabel,
  type NodeRenderStyle,
  type EdgeRenderStyle,
  type Bounds,
} from './types';
import { QuadTree } from './utils/QuadTree';
import type { DagNode } from '../elk/layout';

/**
 * Virtualization options
 */
export interface VirtualizationOptions {
  /** Graph bounds for spatial index */
  bounds: Bounds;
  /** LOD levels configuration */
  lodLevels?: LODLevelConfig[];
  /** Padding around viewport for smooth scrolling */
  viewportPadding?: number;
}

/**
 * LOD level configuration
 */
export interface LODLevelConfig {
  level: LODLevel;
  minZoom: number;
  maxZoom: number;
  nodeRadius: number;
  strokeWidth: number;
  showLabels: boolean;
  showDetails: boolean;
}

/**
 * Default LOD configuration
 */
const DEFAULT_LOD_LEVELS: LODLevelConfig[] = [
  {
    level: LODLevel.LOW,
    minZoom: 0,
    maxZoom: 0.25,
    nodeRadius: 2,
    strokeWidth: 1,
    showLabels: false,
    showDetails: false,
  },
  {
    level: LODLevel.MEDIUM,
    minZoom: 0.25,
    maxZoom: 0.75,
    nodeRadius: 6,
    strokeWidth: 1.5,
    showLabels: true,
    showDetails: false,
  },
  {
    level: LODLevel.HIGH,
    minZoom: 0.75,
    maxZoom: 1.5,
    nodeRadius: 8,
    strokeWidth: 2,
    showLabels: true,
    showDetails: true,
  },
  {
    level: LODLevel.ULTRA,
    minZoom: 1.5,
    maxZoom: Infinity,
    nodeRadius: 10,
    strokeWidth: 2.5,
    showLabels: true,
    showDetails: true,
  },
];

/**
 * Level of Detail System
 */
export class LevelOfDetailSystem {
  private lodLevels: LODLevelConfig[];

  constructor(lodLevels: LODLevelConfig[] = DEFAULT_LOD_LEVELS) {
    this.lodLevels = lodLevels.sort((a, b) => a.minZoom - b.minZoom);
  }

  /**
   * Get LOD level for current zoom
   */
  getLODLevel(zoom: number): LODLevel {
    for (const config of this.lodLevels) {
      if (zoom >= config.minZoom && zoom < config.maxZoom) {
        return config.level;
      }
    }
    return LODLevel.HIGH; // Default fallback
  }

  /**
   * Get node render style for LOD level
   */
  getNodeStyle(node: DagNode, lodLevel: LODLevel): NodeRenderStyle {
    const config = this.lodLevels.find(l => l.level === lodLevel) || this.lodLevels[2];
    return {
      radius: config.nodeRadius,
      strokeWidth: config.strokeWidth,
      showLabel: config.showLabels,
      showDetails: config.showDetails,
      quality: lodLevel,
    };
  }

  /**
   * Get edge render style for LOD level
   */
  getEdgeStyle(lodLevel: LODLevel): EdgeRenderStyle {
    const config = this.lodLevels.find(l => l.level === lodLevel) || this.lodLevels[2];
    return {
      strokeWidth: config.strokeWidth,
      showArrow: lodLevel >= LODLevel.HIGH,
      quality: lodLevel,
    };
  }
}

/**
 * Canvas Virtualization
 * 
 * Manages viewport culling and level-of-detail for Canvas rendering.
 */
export class CanvasVirtualization {
  private spatialIndex: QuadTree<DagNode>;
  private edgeSpatialIndex: QuadTree<{ id: string; source: string; target: string }>;
  private lodSystem: LevelOfDetailSystem;
  private viewportPadding: number;

  constructor(options: VirtualizationOptions) {
    this.spatialIndex = new QuadTree(options.bounds);
    this.edgeSpatialIndex = new QuadTree(options.bounds);
    this.lodSystem = new LevelOfDetailSystem(options.lodLevels);
    this.viewportPadding = options.viewportPadding ?? 100;
  }

  /**
   * Get visible elements within viewport with LOD applied
   */
  getVisibleElements(
    graph: ProcessedDAG,
    viewport: ViewportState
  ): VisibleElements {
    // Calculate padded viewport bounds for smooth scrolling
    const queryBounds: Bounds = {
      minX: viewport.bounds.minX - this.viewportPadding,
      minY: viewport.bounds.minY - this.viewportPadding,
      maxX: viewport.bounds.maxX + this.viewportPadding,
      maxY: viewport.bounds.maxY + this.viewportPadding,
    };

    // Query spatial index for potentially visible nodes
    const visibleNodes = this.spatialIndex.query(queryBounds);

    // Get LOD level based on zoom
    const lodLevel = this.lodSystem.getLODLevel(viewport.zoom);

    // Filter and optimize nodes
    const optimizedNodes = this.filterNodesByLOD(visibleNodes, lodLevel, graph.positions);

    // Get visible edges (edges connected to visible nodes)
    const visibleNodeIds = new Set(optimizedNodes.map(n => n.id));
    const optimizedEdges = this.filterEdgesByLOD(
      graph.edges,
      lodLevel,
      visibleNodeIds,
      graph.positions,
      queryBounds
    );

    // Extract labels from visible nodes
    const optimizedLabels = this.extractLabels(optimizedNodes, lodLevel);

    return {
      nodes: optimizedNodes,
      edges: optimizedEdges,
      labels: optimizedLabels,
    };
  }

  /**
   * Filter nodes by LOD level
   */
  private filterNodesByLOD(
    nodes: DagNode[],
    lodLevel: LODLevel,
    positions: Record<string, { x: number; y: number }>
  ): OptimizedNode[] {
    return nodes.map(node => {
      const position = positions[node.id];
      const renderStyle = this.lodSystem.getNodeStyle(node, lodLevel);
      
      return {
        ...node,
        renderStyle,
        shouldRenderDetails: renderStyle.showDetails,
        shouldRenderLabels: renderStyle.showLabel,
        bounds: this.getNodeBounds(position, renderStyle.radius),
      };
    });
  }

  /**
   * Filter edges by LOD level
   */
  private filterEdgesByLOD(
    edges: Array<{ id: string; source: string; target: string }>,
    lodLevel: LODLevel,
    visibleNodeIds: Set<string>,
    positions: Record<string, { x: number; y: number }>,
    viewportBounds: Bounds
  ): OptimizedEdge[] {
    const renderStyle = this.lodSystem.getEdgeStyle(lodLevel);
    
    return edges
      .filter(edge => {
        // Only render edges with at least one visible endpoint
        return visibleNodeIds.has(edge.source) || visibleNodeIds.has(edge.target);
      })
      .map(edge => {
        const sourcePos = positions[edge.source] || { x: 0, y: 0 };
        const targetPos = positions[edge.target] || { x: 0, y: 0 };
        
        return {
          ...edge,
          sourcePos,
          targetPos,
          renderStyle,
          bounds: this.getEdgeBounds(sourcePos, targetPos),
        };
      })
      .filter(edge => {
        // Cull edges that are completely outside viewport
        return this.intersects(edge.bounds, viewportBounds);
      });
  }

  /**
   * Extract labels from visible nodes
   */
  private extractLabels(
    nodes: OptimizedNode[],
    lodLevel: LODLevel
  ): OptimizedLabel[] {
    if (lodLevel < LODLevel.MEDIUM) {
      return []; // No labels at low LOD
    }

    return nodes
      .filter(node => node.shouldRenderLabels && node.bounds)
      .map(node => {
        const position = node.bounds!;
        return {
          id: `label-${node.id}`,
          text: node.title,
          x: (position.minX + position.maxX) / 2,
          y: position.minY - 10, // Above node
          fontSize: lodLevel >= LODLevel.HIGH ? 12 : 10,
          bounds: {
            minX: position.minX - 50,
            minY: position.minY - 30,
            maxX: position.maxX + 50,
            maxY: position.minY,
          },
        };
      });
  }

  /**
   * Update spatial index with new graph data
   */
  updateSpatialIndex(graph: ProcessedDAG): void {
    // Clear existing indexes
    this.spatialIndex.clear();
    this.edgeSpatialIndex.clear();

    // Build node spatial index
    graph.nodes.forEach(node => {
      const position = graph.positions[node.id];
      if (position) {
        const bounds = this.getNodeBounds(position, 8); // Default radius
        this.spatialIndex.insert(bounds, node);
      }
    });

    // Build edge spatial index
    graph.edges.forEach(edge => {
      const sourcePos = graph.positions[edge.source];
      const targetPos = graph.positions[edge.target];
      if (sourcePos && targetPos) {
        const bounds = this.getEdgeBounds(sourcePos, targetPos);
        this.edgeSpatialIndex.insert(bounds, edge);
      }
    });
  }

  /**
   * Get bounding box for a node
   */
  private getNodeBounds(position: { x: number; y: number }, radius: number): Bounds {
    return {
      minX: position.x - radius,
      minY: position.y - radius,
      maxX: position.x + radius,
      maxY: position.y + radius,
    };
  }

  /**
   * Get bounding box for an edge
   */
  private getEdgeBounds(
    source: { x: number; y: number },
    target: { x: number; y: number }
  ): Bounds {
    return {
      minX: Math.min(source.x, target.x),
      minY: Math.min(source.y, target.y),
      maxX: Math.max(source.x, target.x),
      maxY: Math.max(source.y, target.y),
    };
  }

  /**
   * Check if two bounds intersect
   */
  private intersects(a: Bounds, b: Bounds): boolean {
    return !(
      a.maxX < b.minX ||
      a.minX > b.maxX ||
      a.maxY < b.minY ||
      a.minY > b.maxY
    );
  }
}

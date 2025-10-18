/**
 * VisEdge - Visual representation of edges between commits
 * 
 * Renders curved SVG paths between commits using cubic Bezier curves.
 * Supports multiple parents (e.g., merge commits with two parents).
 */

import { VisBase, type GitEntity, type Visuals } from './VisBase';
import type { ScreenCoords, GridPosition } from './grid';
import { gridToScreen } from './grid';

/**
 * Edge entity representing a parent-child relationship
 */
export interface EdgeEntity extends GitEntity {
  /** Source commit ID (child) */
  source: string;
  /** Target commit ID (parent) */
  target: string;
  /** Source grid position */
  sourcePosition: GridPosition;
  /** Target grid position */
  targetPosition: GridPosition;
}

/**
 * VisEdge class for rendering curved edges
 */
export class VisEdge extends VisBase<EdgeEntity> {
  constructor(edge: EdgeEntity, visuals: Visuals) {
    super(edge, visuals);
  }

  /**
   * Get screen coordinates (midpoint of the edge)
   */
  getScreenCoords(): ScreenCoords {
    const sourceCoords = gridToScreen(this.gitEntity.sourcePosition);
    const targetCoords = gridToScreen(this.gitEntity.targetPosition);
    
    return {
      x: (sourceCoords.x + targetCoords.x) / 2,
      y: (sourceCoords.y + targetCoords.y) / 2,
    };
  }

  /**
   * Update edge positions
   */
  setPositions(source: GridPosition, target: GridPosition): void {
    this.gitEntity.sourcePosition = source;
    this.gitEntity.targetPosition = target;
    this.updatePath();
  }

  /**
   * Update the path attribute of the SVG element
   */
  private updatePath(): void {
    if (!this.svgElement) return;
    const path = this.computePath();
    this.svgElement.setAttribute('d', path);
  }

  /**
   * Compute the curved path between source and target using cubic Bezier
   * 
   * The curve is designed to smoothly connect commits while avoiding overlap.
   * Control points are placed to create natural-looking curves.
   */
  private computePath(): string {
    const sourceCoords = gridToScreen(this.gitEntity.sourcePosition);
    const targetCoords = gridToScreen(this.gitEntity.targetPosition);

    const dx = targetCoords.x - sourceCoords.x;
    const dy = targetCoords.y - sourceCoords.y;

    // For vertical or near-vertical edges, use a simple curve
    if (Math.abs(dx) < 10) {
      // Control points offset vertically
      const cp1y = sourceCoords.y + dy * 0.4;
      const cp2y = targetCoords.y - dy * 0.4;
      
      return `M ${sourceCoords.x} ${sourceCoords.y} ` +
             `C ${sourceCoords.x} ${cp1y}, ` +
             `${targetCoords.x} ${cp2y}, ` +
             `${targetCoords.x} ${targetCoords.y}`;
    }

    // For horizontal movement, create a smooth S-curve
    // Control points are offset both horizontally and vertically
    const controlOffset = Math.min(Math.abs(dx) * 0.5, 40);
    const cp1x = sourceCoords.x + (dx > 0 ? controlOffset : -controlOffset);
    const cp1y = sourceCoords.y + dy * 0.3;
    const cp2x = targetCoords.x - (dx > 0 ? controlOffset : -controlOffset);
    const cp2y = targetCoords.y - dy * 0.3;

    return `M ${sourceCoords.x} ${sourceCoords.y} ` +
           `C ${cp1x} ${cp1y}, ` +
           `${cp2x} ${cp2y}, ` +
           `${targetCoords.x} ${targetCoords.y}`;
  }

  /**
   * Render the edge as SVG path
   */
  render(): SVGElement {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    path.setAttribute('d', this.computePath());
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('class', 'text-muted-foreground');
    path.setAttribute('aria-hidden', 'true');
    path.setAttribute('data-testid', `graph-edge-${this.gitEntity.id}`);
    path.setAttribute('data-edge-id', this.gitEntity.id);
    path.setAttribute('data-edge-source', this.gitEntity.source);
    path.setAttribute('data-edge-target', this.gitEntity.target);

    this.svgElement = path;
    return path;
  }
}

/**
 * Create multiple edges for a commit with multiple parents (e.g., merge commit)
 * 
 * @param commitId - ID of the commit
 * @param commitPosition - Grid position of the commit
 * @param parents - Array of parent commit IDs and their positions
 * @param visuals - Visual styling configuration
 * @returns Array of VisEdge instances
 */
export function createEdgesForCommit(
  commitId: string,
  commitPosition: GridPosition,
  parents: Array<{ id: string; position: GridPosition }>,
  visuals: Visuals
): VisEdge[] {
  return parents.map((parent) => {
    const edgeEntity: EdgeEntity = {
      id: `${commitId}-${parent.id}`,
      source: commitId,
      target: parent.id,
      sourcePosition: commitPosition,
      targetPosition: parent.position,
    };
    
    return new VisEdge(edgeEntity, visuals);
  });
}

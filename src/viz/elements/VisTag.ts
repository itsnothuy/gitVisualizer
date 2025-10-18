/**
 * VisTag - Visual representation of branch labels, HEAD, and detached tags
 * 
 * Renders text labels for branches and special markers like HEAD.
 * Supports dynamic placement (inline at tip or above node when detached).
 */

import { VisBase, type GitEntity, type Visuals } from './VisBase';
import type { ScreenCoords, GridPosition } from './grid';
import { gridToScreen } from './grid';

/**
 * Tag types
 */
export type TagType = 'branch' | 'head' | 'detached';

/**
 * Tag entity with label and type
 */
export interface TagEntity extends GitEntity {
  /** Display label */
  label: string;
  /** Type of tag */
  type: TagType;
  /** Associated commit ID */
  commitId: string;
}

/**
 * Tag placement mode
 */
export type TagPlacement = 'inline' | 'above';

/**
 * VisTag class for rendering branch labels and HEAD markers
 */
export class VisTag extends VisBase<TagEntity> {
  private position: GridPosition;
  private placement: TagPlacement;

  constructor(
    tag: TagEntity,
    position: GridPosition,
    placement: TagPlacement,
    visuals: Visuals
  ) {
    super(tag, visuals);
    this.position = position;
    this.placement = placement;
  }

  /**
   * Get screen coordinates based on grid position and placement
   */
  getScreenCoords(): ScreenCoords {
    const baseCoords = gridToScreen(this.position);
    
    // Adjust y-coordinate based on placement
    if (this.placement === 'above') {
      return {
        x: baseCoords.x,
        y: baseCoords.y - 25, // Place above the node
      };
    }
    
    return baseCoords;
  }

  /**
   * Update the grid position of this tag
   */
  setPosition(position: GridPosition): void {
    this.position = position;
    this.updateTransform();
  }

  /**
   * Update the placement mode
   */
  setPlacement(placement: TagPlacement): void {
    this.placement = placement;
    this.updateTransform();
  }

  /**
   * Update the transform attribute of the SVG element
   */
  private updateTransform(): void {
    if (!this.svgElement) return;
    const coords = this.getScreenCoords();
    this.svgElement.setAttribute('transform', `translate(${coords.x},${coords.y})`);
  }

  /**
   * Get the color class based on tag type
   */
  private getColorClass(): string {
    switch (this.gitEntity.type) {
      case 'head':
        return 'text-blue-600';
      case 'detached':
        return 'text-orange-600';
      case 'branch':
      default:
        return 'text-green-600';
    }
  }

  /**
   * Get the background class based on tag type
   */
  private getBackgroundClass(): string {
    switch (this.gitEntity.type) {
      case 'head':
        return 'fill-blue-100';
      case 'detached':
        return 'fill-orange-100';
      case 'branch':
      default:
        return 'fill-green-100';
    }
  }

  /**
   * Render the tag as SVG
   */
  render(): SVGElement {
    const coords = this.getScreenCoords();
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    g.setAttribute('transform', `translate(${coords.x},${coords.y})`);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'label');
    g.setAttribute('class', 'cursor-default outline-none');
    g.setAttribute('data-testid', `graph-tag-${this.gitEntity.id}`);
    g.setAttribute('data-tag-type', this.gitEntity.type);
    g.setAttribute('data-commit-id', this.gitEntity.commitId);
    
    const typeLabel = this.gitEntity.type === 'head' 
      ? 'HEAD' 
      : this.gitEntity.type === 'detached' 
      ? 'Detached HEAD' 
      : 'Branch';
    g.setAttribute('aria-label', `${typeLabel}: ${this.gitEntity.label}`);

    // Calculate text dimensions (approximate)
    const textWidth = this.gitEntity.label.length * 7 + 8; // rough estimate
    const textHeight = 18;
    const padding = 4;

    // Background rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(-padding));
    rect.setAttribute('y', String(-textHeight / 2 - padding));
    rect.setAttribute('width', String(textWidth + padding * 2));
    rect.setAttribute('height', String(textHeight + padding * 2));
    rect.setAttribute('rx', '3');
    rect.setAttribute('ry', '3');
    rect.setAttribute('class', this.getBackgroundClass());
    rect.setAttribute('stroke', 'currentColor');
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('aria-hidden', 'true');
    g.appendChild(rect);

    // Label text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '4');
    text.setAttribute('y', '0');
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('class', `${this.getColorClass()} pointer-events-none select-none`);
    text.textContent = this.gitEntity.label;
    g.appendChild(text);

    // Add visual indicator for HEAD
    if (this.gitEntity.type === 'head') {
      const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      indicator.setAttribute('cx', String(-8));
      indicator.setAttribute('cy', '0');
      indicator.setAttribute('r', '3');
      indicator.setAttribute('fill', 'currentColor');
      indicator.setAttribute('class', 'text-blue-600');
      indicator.setAttribute('aria-hidden', 'true');
      g.appendChild(indicator);
    }

    this.svgElement = g;
    return g;
  }
}

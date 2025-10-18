/**
 * Base class for all visual elements in the Git DAG visualization
 * 
 * Provides common functionality for lifecycle management, coordinate transformation,
 * and rendering coordination. All visual elements (nodes, edges, branches, tags)
 * inherit from this base class.
 */

import type { ScreenCoords } from './grid';

/**
 * Base interface for any Git-related entity that can be visualized
 */
export interface GitEntity {
  /** Unique identifier for this entity */
  id: string;
}

/**
 * Visual styling configuration that can be passed to elements
 */
export interface Visuals {
  /** Colors from the skin system */
  colors: Record<string, string>;
  /** Node dimensions */
  node: {
    r: number;
    strokeWidth: number;
  };
}

/**
 * Abstract base class for all visual elements
 */
export abstract class VisBase<T extends GitEntity = GitEntity> {
  protected gitEntity: T;
  protected visuals: Visuals;
  protected svgElement: SVGElement | null = null;

  constructor(gitEntity: T, visuals: Visuals) {
    this.gitEntity = gitEntity;
    this.visuals = visuals;
  }

  /**
   * Get the unique identifier for this element
   */
  getID(): string {
    return this.gitEntity.id;
  }

  /**
   * Get the screen coordinates of this element
   * Must be implemented by subclasses
   */
  abstract getScreenCoords(): ScreenCoords;

  /**
   * Render this element to an SVG element
   * Must be implemented by subclasses
   * 
   * @returns SVG element representing this visual element
   */
  abstract render(): SVGElement;

  /**
   * Update the element's visual representation
   * Called when the underlying data changes
   */
  update(gitEntity: T): void {
    this.gitEntity = gitEntity;
    if (this.svgElement && this.svgElement.parentNode) {
      const newElement = this.render();
      this.svgElement.parentNode.replaceChild(newElement, this.svgElement);
      this.svgElement = newElement;
    }
  }

  /**
   * Remove this element from the DOM
   * Performs cleanup and removes the SVG element
   */
  remove(): void {
    if (this.svgElement && this.svgElement.parentNode) {
      this.svgElement.parentNode.removeChild(this.svgElement);
    }
    this.svgElement = null;
  }

  /**
   * Get the SVG element for this visual element
   * Returns null if not yet rendered
   */
  getSVGElement(): SVGElement | null {
    return this.svgElement;
  }

  /**
   * Check if this element has been rendered
   */
  isRendered(): boolean {
    return this.svgElement !== null;
  }
}

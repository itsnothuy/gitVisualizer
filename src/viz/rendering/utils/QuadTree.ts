/**
 * QuadTree for Spatial Indexing
 * 
 * Efficient spatial data structure for viewport culling and hit testing.
 * Used by virtualization system to quickly find visible elements.
 */

import type { Bounds } from '../types';

/**
 * QuadTree node data
 */
interface QuadTreeNode<T> {
  bounds: Bounds;
  data: T;
}

/**
 * QuadTree for efficient spatial queries
 */
export class QuadTree<T = unknown> {
  private maxItems: number = 10;
  private maxDepth: number = 8;
  private bounds: Bounds;
  private items: QuadTreeNode<T>[] = [];
  private children: QuadTree<T>[] | null = null;
  private depth: number;

  constructor(bounds: Bounds, depth = 0) {
    this.bounds = bounds;
    this.depth = depth;
  }

  /**
   * Insert an item into the quadtree
   */
  insert(bounds: Bounds, data: T): void {
    // If we have children, try to insert into appropriate child
    if (this.children) {
      const index = this.getChildIndex(bounds);
      if (index !== -1) {
        this.children[index].insert(bounds, data);
        return;
      }
    }

    // Add to this node
    this.items.push({ bounds, data });

    // Split if necessary
    if (this.items.length > this.maxItems && this.depth < this.maxDepth) {
      this.split();
    }
  }

  /**
   * Query items within a bounding box
   */
  query(queryBounds: Bounds): T[] {
    const results: T[] = [];

    // Check if query bounds intersect this node
    if (!this.intersects(queryBounds, this.bounds)) {
      return results;
    }

    // Add items from this node that intersect
    for (const item of this.items) {
      if (this.intersects(queryBounds, item.bounds)) {
        results.push(item.data);
      }
    }

    // Query children if they exist
    if (this.children) {
      for (const child of this.children) {
        results.push(...child.query(queryBounds));
      }
    }

    return results;
  }

  /**
   * Clear all items from the tree
   */
  clear(): void {
    this.items = [];
    this.children = null;
  }

  /**
   * Split this node into 4 children
   */
  private split(): void {
    const { minX, minY, maxX, maxY } = this.bounds;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    this.children = [
      // Top-left
      new QuadTree({ minX, minY, maxX: midX, maxY: midY }, this.depth + 1),
      // Top-right
      new QuadTree({ minX: midX, minY, maxX, maxY: midY }, this.depth + 1),
      // Bottom-left
      new QuadTree({ minX, minY: midY, maxX: midX, maxY }, this.depth + 1),
      // Bottom-right
      new QuadTree({ minX: midX, minY: midY, maxX, maxY }, this.depth + 1),
    ];

    // Redistribute items to children
    const itemsToRedistribute = [...this.items];
    this.items = [];

    for (const item of itemsToRedistribute) {
      const index = this.getChildIndex(item.bounds);
      if (index !== -1) {
        this.children[index].insert(item.bounds, item.data);
      } else {
        // Item spans multiple children, keep it at this level
        this.items.push(item);
      }
    }
  }

  /**
   * Get the index of the child that fully contains the bounds
   * Returns -1 if the bounds span multiple children
   */
  private getChildIndex(bounds: Bounds): number {
    const { minX, minY, maxX, maxY } = this.bounds;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const inTop = bounds.maxY <= midY;
    const inBottom = bounds.minY >= midY;
    const inLeft = bounds.maxX <= midX;
    const inRight = bounds.minX >= midX;

    if (inTop && inLeft) return 0;
    if (inTop && inRight) return 1;
    if (inBottom && inLeft) return 2;
    if (inBottom && inRight) return 3;

    return -1; // Spans multiple children
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

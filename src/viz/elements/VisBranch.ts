/**
 * VisBranch - Visual representation of a Git branch
 * 
 * Manages a branch's commits, calculates its x-coordinate via ROW_WIDTH,
 * and renders the branch's visual elements (line, arrow, label).
 */

import { VisBase, type GitEntity, type Visuals } from './VisBase';
import type { ScreenCoords, GridPosition } from './grid';
import { gridToScreen, ROW_WIDTH } from './grid';
import { VisTag, type TagEntity } from './VisTag';

/**
 * Branch entity with commits and metadata
 */
export interface BranchEntity extends GitEntity {
  /** Branch name */
  name: string;
  /** Commit IDs in this branch (ordered from tip to base) */
  commits: string[];
  /** Branch index (column number) */
  index: number;
  /** Tip commit position */
  tipPosition: GridPosition;
}

/**
 * VisBranch class for rendering branch visualization
 */
export class VisBranch extends VisBase<BranchEntity> {
  private tag: VisTag | null = null;

  constructor(branch: BranchEntity, visuals: Visuals) {
    super(branch, visuals);
  }

  /**
   * Get screen coordinates (at the branch's tip)
   */
  getScreenCoords(): ScreenCoords {
    return gridToScreen(this.gitEntity.tipPosition);
  }

  /**
   * Get the x-coordinate for this branch based on its index
   */
  getX(): number {
    return this.gitEntity.index * ROW_WIDTH;
  }

  /**
   * Update the branch with new commits or tip position
   */
  updateBranch(commits: string[], tipPosition: GridPosition): void {
    this.gitEntity.commits = commits;
    this.gitEntity.tipPosition = tipPosition;
    
    // Update tag position if it exists
    if (this.tag) {
      this.tag.setPosition(tipPosition);
    }
    
    this.updateVisualization();
  }

  /**
   * Update the visual representation
   */
  private updateVisualization(): void {
    if (this.svgElement && this.svgElement.parentNode) {
      const newElement = this.render();
      this.svgElement.parentNode.replaceChild(newElement, this.svgElement);
      this.svgElement = newElement;
    }
  }

  /**
   * Render the branch visualization (line, arrow, and label)
   */
  render(): SVGElement {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    g.setAttribute('data-testid', `graph-branch-${this.gitEntity.id}`);
    g.setAttribute('data-branch-name', this.gitEntity.name);
    g.setAttribute('aria-label', `Branch ${this.gitEntity.name}`);
    g.setAttribute('role', 'group');

    // Create branch label (tag) at the tip
    const tagEntity: TagEntity = {
      id: `tag-${this.gitEntity.id}`,
      label: this.gitEntity.name,
      type: 'branch',
      commitId: this.gitEntity.commits[0] || '',
    };

    this.tag = new VisTag(
      tagEntity,
      this.gitEntity.tipPosition,
      'inline',
      this.visuals
    );

    const tagElement = this.tag.render();
    g.appendChild(tagElement);

    // Create branch line (vertical line showing branch extent)
    // For now, we'll just show the tag; the line can be added if needed
    // based on commit positions

    this.svgElement = g;
    return g;
  }

  /**
   * Remove this branch and its tag from the DOM
   */
  remove(): void {
    if (this.tag) {
      this.tag.remove();
      this.tag = null;
    }
    super.remove();
  }

  /**
   * Get the associated tag
   */
  getTag(): VisTag | null {
    return this.tag;
  }
}

/**
 * Calculate branch index from commit positions
 * Branches are ordered left-to-right based on their tip positions
 * 
 * @param branches - Array of branches to index
 * @returns Map of branch ID to index
 */
export function calculateBranchIndices(
  branches: Array<{ id: string; tipPosition: GridPosition }>
): Map<string, number> {
  // Sort branches by their branchIndex in the grid position
  const sorted = [...branches].sort((a, b) => 
    a.tipPosition.branchIndex - b.tipPosition.branchIndex
  );

  const indices = new Map<string, number>();
  sorted.forEach((branch, index) => {
    indices.set(branch.id, index);
  });

  return indices;
}

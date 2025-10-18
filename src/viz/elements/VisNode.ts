/**
 * VisNode - Visual representation of a Git commit node
 * 
 * Renders a commit as a circle with a short SHA label, following accessibility
 * guidelines with proper ARIA labels and keyboard navigation support.
 */

import { VisBase, type GitEntity, type Visuals } from './VisBase';
import type { ScreenCoords, GridPosition } from './grid';
import { gridToScreen } from './grid';

/**
 * Commit node entity with all necessary metadata
 */
export interface CommitNode extends GitEntity {
  /** Commit message (first line) */
  title: string;
  /** Timestamp in milliseconds */
  ts: number;
  /** Parent commit IDs */
  parents: string[];
  /** Optional: branch/tag references */
  refs?: string[];
  /** Optional: PR information */
  pr?: { id: string; url: string } | null;
  /** Optional: CI status */
  ci?: { status: "success" | "failed" | "pending" | "unknown" } | null;
}

/**
 * VisNode class for rendering commit nodes
 */
export class VisNode extends VisBase<CommitNode> {
  private position: GridPosition;
  private isFocused: boolean = false;

  constructor(
    commit: CommitNode,
    position: GridPosition,
    visuals: Visuals
  ) {
    super(commit, visuals);
    this.position = position;
  }

  /**
   * Get screen coordinates based on grid position
   */
  getScreenCoords(): ScreenCoords {
    return gridToScreen(this.position);
  }

  /**
   * Update the grid position of this node
   */
  setPosition(position: GridPosition): void {
    this.position = position;
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
   * Create status marker for CI status (color-independent)
   */
  private createStatusMarker(
    status: "success" | "failed" | "pending" | "unknown",
    x: number,
    y: number
  ): SVGGElement {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x}, ${y})`);

    let ariaLabel = '';
    
    switch (status) {
      case 'success':
        ariaLabel = 'Build passed';
        // Checkmark
        {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M-3,-1 L-1,1 L3,-3');
          path.setAttribute('stroke', 'currentColor');
          path.setAttribute('stroke-width', '1.5');
          path.setAttribute('fill', 'none');
          path.setAttribute('class', 'text-green-600');
          g.appendChild(path);
        }
        break;
      case 'failed':
        ariaLabel = 'Build failed';
        // Cross
        {
          const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line1.setAttribute('x1', '-3');
          line1.setAttribute('y1', '-3');
          line1.setAttribute('x2', '3');
          line1.setAttribute('y2', '3');
          line1.setAttribute('stroke', 'currentColor');
          line1.setAttribute('stroke-width', '1.5');
          line1.setAttribute('class', 'text-red-600');
          g.appendChild(line1);
          
          const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line2.setAttribute('x1', '3');
          line2.setAttribute('y1', '-3');
          line2.setAttribute('x2', '-3');
          line2.setAttribute('y2', '3');
          line2.setAttribute('stroke', 'currentColor');
          line2.setAttribute('stroke-width', '1.5');
          line2.setAttribute('class', 'text-red-600');
          g.appendChild(line2);
        }
        break;
      case 'pending':
        ariaLabel = 'Build pending';
        // Clock
        {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('r', '3');
          circle.setAttribute('fill', 'none');
          circle.setAttribute('stroke', 'currentColor');
          circle.setAttribute('stroke-width', '1.5');
          circle.setAttribute('class', 'text-yellow-600');
          g.appendChild(circle);
          
          const hourHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          hourHand.setAttribute('x1', '0');
          hourHand.setAttribute('y1', '0');
          hourHand.setAttribute('x2', '0');
          hourHand.setAttribute('y2', '-2');
          hourHand.setAttribute('stroke', 'currentColor');
          hourHand.setAttribute('stroke-width', '1');
          hourHand.setAttribute('class', 'text-yellow-600');
          g.appendChild(hourHand);
          
          const minuteHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          minuteHand.setAttribute('x1', '0');
          minuteHand.setAttribute('y1', '0');
          minuteHand.setAttribute('x2', '1.5');
          minuteHand.setAttribute('y2', '1.5');
          minuteHand.setAttribute('stroke', 'currentColor');
          minuteHand.setAttribute('stroke-width', '1');
          minuteHand.setAttribute('class', 'text-yellow-600');
          g.appendChild(minuteHand);
        }
        break;
      default:
        ariaLabel = 'Build status unknown';
        // Question mark
        {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', '0');
          text.setAttribute('y', '0');
          text.setAttribute('font-size', '8');
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'central');
          text.setAttribute('class', 'text-gray-500');
          text.textContent = '?';
          g.appendChild(text);
        }
    }

    g.setAttribute('aria-label', ariaLabel);
    return g;
  }

  /**
   * Render the commit node as SVG
   */
  render(): SVGElement {
    const coords = this.getScreenCoords();
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    g.setAttribute('transform', `translate(${coords.x},${coords.y})`);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('class', 'cursor-pointer outline-none');
    g.setAttribute('data-testid', `graph-node-${this.gitEntity.id}`);
    g.setAttribute('data-node-id', this.gitEntity.id);

    const shortId = this.gitEntity.id.slice(0, 7);
    const ciLabel = this.gitEntity.ci?.status 
      ? `, ${this.getStatusLabel(this.gitEntity.ci.status)}` 
      : '';
    g.setAttribute('aria-label', `Commit ${shortId}: ${this.gitEntity.title}${ciLabel}`);

    // Focus ring (shown when focused)
    if (this.isFocused) {
      const focusRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      focusRing.setAttribute('r', '14');
      focusRing.setAttribute('fill', 'none');
      focusRing.setAttribute('stroke', 'currentColor');
      focusRing.setAttribute('stroke-width', '2');
      focusRing.setAttribute('class', 'text-ring');
      focusRing.setAttribute('aria-hidden', 'true');
      g.appendChild(focusRing);
    }

    // Main node circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const radius = this.visuals.node.r;
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', 'currentColor');
    circle.setAttribute('class', this.isFocused ? 'text-primary' : 'text-foreground');
    circle.setAttribute('aria-hidden', 'true');
    g.appendChild(circle);

    // Status indicator overlay (if CI status exists)
    if (this.gitEntity.ci?.status) {
      const statusMarker = this.createStatusMarker(
        this.gitEntity.ci.status, 
        8, 
        -8
      );
      g.appendChild(statusMarker);
    }

    // Branch/tag indicator (if refs exist)
    if (this.gitEntity.refs && this.gitEntity.refs.length > 0) {
      const refIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      refIndicator.setAttribute('r', '3');
      refIndicator.setAttribute('cx', '-8');
      refIndicator.setAttribute('cy', '-8');
      refIndicator.setAttribute('fill', 'currentColor');
      refIndicator.setAttribute('class', 'text-accent');
      refIndicator.setAttribute('aria-hidden', 'true');
      g.appendChild(refIndicator);
    }

    // PR indicator (if PR exists)
    if (this.gitEntity.pr?.id) {
      const prIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      prIndicator.setAttribute('x', '-10');
      prIndicator.setAttribute('y', '6');
      prIndicator.setAttribute('width', '4');
      prIndicator.setAttribute('height', '4');
      prIndicator.setAttribute('fill', 'currentColor');
      prIndicator.setAttribute('class', 'text-secondary');
      prIndicator.setAttribute('aria-hidden', 'true');
      g.appendChild(prIndicator);
    }

    // Short SHA label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', '12');
    label.setAttribute('y', '4');
    label.setAttribute('font-size', '12');
    label.setAttribute('class', 'fill-current pointer-events-none select-none');
    label.setAttribute('aria-hidden', 'true');
    label.textContent = shortId;
    g.appendChild(label);

    // Add event listeners
    g.addEventListener('focus', () => this.handleFocus());
    g.addEventListener('blur', () => this.handleBlur());

    this.svgElement = g;
    return g;
  }

  /**
   * Handle focus event
   */
  private handleFocus(): void {
    this.isFocused = true;
    if (this.svgElement && this.svgElement.parentNode) {
      const newElement = this.render();
      this.svgElement.parentNode.replaceChild(newElement, this.svgElement);
      this.svgElement = newElement;
    }
  }

  /**
   * Handle blur event
   */
  private handleBlur(): void {
    this.isFocused = false;
    if (this.svgElement && this.svgElement.parentNode) {
      const newElement = this.render();
      this.svgElement.parentNode.replaceChild(newElement, this.svgElement);
      this.svgElement = newElement;
    }
  }

  /**
   * Get status label for accessibility
   */
  private getStatusLabel(status: string): string {
    switch (status) {
      case 'success':
        return 'Build passed';
      case 'failed':
        return 'Build failed';
      case 'pending':
        return 'Build pending';
      default:
        return 'Build status unknown';
    }
  }
}

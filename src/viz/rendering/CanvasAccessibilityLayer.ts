/**
 * Canvas Accessibility Layer
 * 
 * Provides WCAG 2.2 AA compliant accessibility for Canvas rendering mode.
 * Creates invisible focusable elements overlay for keyboard navigation and screen readers.
 */

import type { DagNode } from '../elk/layout';
import type { VisibleElements, AccessibilityAnnouncement, AccessibleElement } from './types';

/**
 * Screen Reader Announcer
 * 
 * Manages aria-live region for announcing changes to screen readers.
 */
export class ScreenReaderAnnouncer {
  private announceElement: HTMLElement | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.createAnnounceElement();
    }
  }

  /**
   * Create aria-live region for announcements
   */
  private createAnnounceElement(): void {
    this.announceElement = document.createElement('div');
    this.announceElement.setAttribute('role', 'status');
    this.announceElement.setAttribute('aria-live', 'polite');
    this.announceElement.setAttribute('aria-atomic', 'true');
    this.announceElement.className = 'sr-only';
    this.announceElement.style.position = 'absolute';
    this.announceElement.style.left = '-10000px';
    this.announceElement.style.width = '1px';
    this.announceElement.style.height = '1px';
    this.announceElement.style.overflow = 'hidden';
    document.body.appendChild(this.announceElement);
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announceElement) return;

    this.announceElement.setAttribute('aria-live', priority);
    this.announceElement.textContent = message;
  }

  /**
   * Update context for screen readers
   */
  updateContext(visibleElements: VisibleElements): void {
    const nodeCount = visibleElements.nodes.length;
    const edgeCount = visibleElements.edges.length;
    
    if (nodeCount > 0) {
      this.announce(
        `Showing ${nodeCount} commits and ${edgeCount} connections`,
        'polite'
      );
    }
  }

  /**
   * Clean up
   */
  destroy(): void {
    if (this.announceElement && this.announceElement.parentNode) {
      this.announceElement.parentNode.removeChild(this.announceElement);
      this.announceElement = null;
    }
  }
}

/**
 * Canvas Accessibility Layer
 * 
 * Provides keyboard navigation and screen reader support for Canvas-rendered graphs.
 */
export class CanvasAccessibilityLayer {
  private container: HTMLElement;
  private overlayContainer: HTMLElement;
  private focusableElements: Map<string, AccessibleElement> = new Map();
  private currentFocus: string | null = null;
  private announcer: ScreenReaderAnnouncer;
  private onNodeActivate?: (node: DagNode) => void;
  private onNodeFocus?: (node: DagNode) => void;

  constructor(
    canvasContainer: HTMLElement,
    options?: {
      onNodeActivate?: (node: DagNode) => void;
      onNodeFocus?: (node: DagNode) => void;
    }
  ) {
    this.container = canvasContainer;
    this.onNodeActivate = options?.onNodeActivate;
    this.onNodeFocus = options?.onNodeFocus;
    this.announcer = new ScreenReaderAnnouncer();
    this.overlayContainer = this.setupAccessibilityOverlay();
  }

  /**
   * Setup accessibility overlay container
   */
  private setupAccessibilityOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'tree');
    overlay.setAttribute('aria-label', 'Git commit graph');
    overlay.className = 'canvas-a11y-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.pointerEvents = 'none'; // Allow clicks through to canvas
    
    this.container.style.position = 'relative';
    this.container.appendChild(overlay);
    
    return overlay;
  }

  /**
   * Update focusable elements based on visible elements
   */
  updateFocusableElements(visibleElements: VisibleElements): void {
    // Clear existing elements
    this.clearAccessibilityOverlay();

    // Create accessible elements for visible nodes
    visibleElements.nodes.forEach((node, index) => {
      const accessibleElement = this.createAccessibleNode(node, index);
      this.focusableElements.set(node.id, accessibleElement);
    });

    // Update screen reader context
    this.announcer.updateContext(visibleElements);
  }

  /**
   * Create an accessible element for a node
   */
  private createAccessibleNode(node: DagNode & { bounds?: { minX: number; minY: number; maxX: number; maxY: number } }, index: number): AccessibleElement {
    const element = document.createElement('button');
    element.className = 'canvas-accessible-node';
    element.style.position = 'absolute';
    element.style.pointerEvents = 'auto'; // Allow interaction
    
    // Position based on node bounds
    if (node.bounds) {
      element.style.left = `${node.bounds.minX}px`;
      element.style.top = `${node.bounds.minY}px`;
      element.style.width = `${node.bounds.maxX - node.bounds.minX}px`;
      element.style.height = `${node.bounds.maxY - node.bounds.minY}px`;
    } else {
      // Fallback if no bounds
      element.style.left = '0';
      element.style.top = '0';
      element.style.width = '20px';
      element.style.height = '20px';
    }
    
    // Make visually hidden but accessible
    element.style.opacity = '0';
    element.style.cursor = 'pointer';

    // Set accessibility attributes
    element.setAttribute('role', 'treeitem');
    element.setAttribute('aria-label', this.getNodeAriaLabel(node));
    element.setAttribute('aria-posinset', String(index + 1));
    element.tabIndex = 0;
    element.dataset.nodeId = node.id;

    // Add event listeners
    element.addEventListener('click', () => this.handleNodeActivation(node));
    element.addEventListener('keydown', (e) => this.handleNodeKeydown(e, node));
    element.addEventListener('focus', () => this.handleNodeFocus(node));

    this.overlayContainer.appendChild(element);
    
    return { element, node };
  }

  /**
   * Generate aria-label for a node
   */
  private getNodeAriaLabel(node: DagNode): string {
    const shortId = node.id.slice(0, 7);
    let label = `Commit ${shortId}: ${node.title}`;
    
    if (node.refs && node.refs.length > 0) {
      label += `. Branches: ${node.refs.join(', ')}`;
    }
    
    if (node.ci?.status) {
      label += `. Build ${node.ci.status}`;
    }
    
    if (node.pr?.id) {
      label += `. Pull request #${node.pr.id}`;
    }
    
    return label;
  }

  /**
   * Handle node activation (click or Enter/Space)
   */
  private handleNodeActivation(node: DagNode): void {
    this.onNodeActivate?.(node);
    this.announcer.announce(`Selected commit ${node.id.slice(0, 7)}`, 'assertive');
  }

  /**
   * Handle keyboard navigation
   */
  private handleNodeKeydown(event: KeyboardEvent, node: DagNode): void {
    const nodes = Array.from(this.focusableElements.values());
    const currentIndex = nodes.findIndex(n => n.node.id === node.id);
    
    let nextIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = Math.min(currentIndex + 1, nodes.length - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = nodes.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.handleNodeActivation(node);
        return;
      case 'Escape':
        event.preventDefault();
        (event.target as HTMLElement).blur();
        return;
      default:
        return;
    }
    
    if (nextIndex !== currentIndex && nodes[nextIndex]) {
      nodes[nextIndex].element.focus();
    }
  }

  /**
   * Handle node focus
   */
  private handleNodeFocus(node: DagNode): void {
    this.currentFocus = node.id;
    this.onNodeFocus?.(node);
    this.announcer.announce(
      `Focused on commit ${node.id.slice(0, 7)}: ${node.title}`,
      'polite'
    );
  }

  /**
   * Clear all accessible elements
   */
  private clearAccessibilityOverlay(): void {
    this.focusableElements.clear();
    while (this.overlayContainer.firstChild) {
      this.overlayContainer.removeChild(this.overlayContainer.firstChild);
    }
  }

  /**
   * Announce a change to screen readers
   */
  announceChange(announcement: AccessibilityAnnouncement): void {
    this.announcer.announce(announcement.message, announcement.priority);
  }

  /**
   * Get current focused node ID
   */
  getCurrentFocus(): string | null {
    return this.currentFocus;
  }

  /**
   * Clean up and remove all elements
   */
  destroy(): void {
    this.clearAccessibilityOverlay();
    if (this.overlayContainer.parentNode) {
      this.overlayContainer.parentNode.removeChild(this.overlayContainer);
    }
    this.announcer.destroy();
  }
}

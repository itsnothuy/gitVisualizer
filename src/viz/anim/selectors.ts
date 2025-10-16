/**
 * Animation selectors for targeting SVG elements
 * Provides type-safe ways to select nodes, edges, and labels by ID
 */

import type { AnimSelector } from './types';

/**
 * Select nodes by their commit IDs
 * Returns a selector object for use in AnimStep
 */
export function selectNodes(ids: string[]): AnimSelector {
  return { nodes: ids };
}

/**
 * Select edges by their edge IDs
 * Returns a selector object for use in AnimStep
 */
export function selectEdges(ids: string[]): AnimSelector {
  return { edges: ids };
}

/**
 * Select labels by their label IDs
 * Returns a selector object for use in AnimStep
 */
export function selectLabels(ids: string[]): AnimSelector {
  return { labels: ids };
}

/**
 * Select multiple types of elements
 * Combines node, edge, and label selectors
 */
export function selectMultiple(selector: AnimSelector): AnimSelector {
  return selector;
}

/**
 * Get actual DOM elements from selector
 * Used by animation engine to apply CSS changes
 */
export function getElements(
  rootElement: SVGSVGElement | null,
  selector: AnimSelector
): SVGElement[] {
  if (!rootElement) return [];

  const elements: SVGElement[] = [];

  // Select nodes
  if (selector.nodes) {
    for (const id of selector.nodes) {
      const node = rootElement.querySelector(`[data-testid="graph-node-${id}"]`);
      if (node instanceof SVGElement) {
        elements.push(node);
      }
    }
  }

  // Select edges
  if (selector.edges) {
    for (const id of selector.edges) {
      const edge = rootElement.querySelector(`[data-edge-id="${id}"]`);
      if (edge instanceof SVGElement) {
        elements.push(edge);
      }
    }
  }

  // Select labels
  if (selector.labels) {
    for (const id of selector.labels) {
      const label = rootElement.querySelector(`[data-label-id="${id}"]`);
      if (label instanceof SVGElement) {
        elements.push(label);
      }
    }
  }

  return elements;
}

/**
 * Check if a selector matches any elements
 */
export function hasElements(
  rootElement: SVGSVGElement | null,
  selector: AnimSelector
): boolean {
  return getElements(rootElement, selector).length > 0;
}

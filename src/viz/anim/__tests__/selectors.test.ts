/**
 * Unit tests for animation selectors
 * 
 * These tests verify:
 * - Selector construction helpers
 * - Element targeting by IDs
 * - Multi-selector combining
 * - DOM element retrieval
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  selectNodes,
  selectEdges,
  selectLabels,
  selectMultiple,
  getElements,
  hasElements,
} from '../selectors';

describe('Selector Helpers', () => {
  it('should create node selector', () => {
    const selector = selectNodes(['a', 'b', 'c']);
    expect(selector).toEqual({ nodes: ['a', 'b', 'c'] });
  });

  it('should create edge selector', () => {
    const selector = selectEdges(['e1', 'e2']);
    expect(selector).toEqual({ edges: ['e1', 'e2'] });
  });

  it('should create label selector', () => {
    const selector = selectLabels(['head', 'main']);
    expect(selector).toEqual({ labels: ['head', 'main'] });
  });

  it('should create multi-type selector', () => {
    const selector = selectMultiple({
      nodes: ['a'],
      edges: ['e1'],
      labels: ['head'],
    });

    expect(selector).toEqual({
      nodes: ['a'],
      edges: ['e1'],
      labels: ['head'],
    });
  });
});

describe('Element Retrieval', () => {
  let mockRoot: SVGSVGElement;

  beforeEach(() => {
    // Create mock SVG root with test elements
    mockRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(mockRoot);

    // Add test nodes
    const node1 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    node1.setAttribute('data-testid', 'graph-node-commit1');
    mockRoot.appendChild(node1);

    const node2 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    node2.setAttribute('data-testid', 'graph-node-commit2');
    mockRoot.appendChild(node2);

    // Add test edges
    const edge1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    edge1.setAttribute('data-edge-id', 'edge1');
    mockRoot.appendChild(edge1);

    // Add test labels
    const label1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label1.setAttribute('data-label-id', 'head');
    mockRoot.appendChild(label1);
  });

  afterEach(() => {
    document.body.removeChild(mockRoot);
  });

  it('should get elements by node IDs', () => {
    const elements = getElements(mockRoot, selectNodes(['commit1', 'commit2']));
    expect(elements).toHaveLength(2);
    expect(elements[0].getAttribute('data-testid')).toBe('graph-node-commit1');
    expect(elements[1].getAttribute('data-testid')).toBe('graph-node-commit2');
  });

  it('should get elements by edge IDs', () => {
    const elements = getElements(mockRoot, selectEdges(['edge1']));
    expect(elements).toHaveLength(1);
    expect(elements[0].getAttribute('data-edge-id')).toBe('edge1');
  });

  it('should get elements by label IDs', () => {
    const elements = getElements(mockRoot, selectLabels(['head']));
    expect(elements).toHaveLength(1);
    expect(elements[0].getAttribute('data-label-id')).toBe('head');
  });

  it('should get elements from multiple selectors', () => {
    const elements = getElements(mockRoot, {
      nodes: ['commit1'],
      edges: ['edge1'],
      labels: ['head'],
    });
    expect(elements).toHaveLength(3);
  });

  it('should return empty array for non-existent IDs', () => {
    const elements = getElements(mockRoot, selectNodes(['nonexistent']));
    expect(elements).toHaveLength(0);
  });

  it('should return empty array when root is null', () => {
    const elements = getElements(null, selectNodes(['commit1']));
    expect(elements).toHaveLength(0);
  });

  it('should handle empty selector', () => {
    const elements = getElements(mockRoot, {});
    expect(elements).toHaveLength(0);
  });

  it('should check if elements exist with hasElements', () => {
    expect(hasElements(mockRoot, selectNodes(['commit1']))).toBe(true);
    expect(hasElements(mockRoot, selectNodes(['nonexistent']))).toBe(false);
    expect(hasElements(null, selectNodes(['commit1']))).toBe(false);
  });
});

describe('Element Retrieval - Partial Matches', () => {
  let mockRoot: SVGSVGElement;

  beforeEach(() => {
    mockRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(mockRoot);

    const node1 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    node1.setAttribute('data-testid', 'graph-node-a');
    mockRoot.appendChild(node1);
  });

  afterEach(() => {
    document.body.removeChild(mockRoot);
  });

  it('should handle mix of existing and non-existing IDs', () => {
    const elements = getElements(mockRoot, selectNodes(['a', 'nonexistent', 'alsodoesnotexist']));
    
    // Should only return the one that exists
    expect(elements).toHaveLength(1);
    expect(elements[0].getAttribute('data-testid')).toBe('graph-node-a');
  });

  it('should not duplicate elements if same ID appears multiple times', () => {
    const elements = getElements(mockRoot, selectNodes(['a', 'a', 'a']));
    
    // querySelector should find the same element multiple times, but array will have all references
    expect(elements).toHaveLength(3);
    expect(elements[0]).toBe(elements[1]);
    expect(elements[1]).toBe(elements[2]);
  });
});

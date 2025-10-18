/**
 * Tests for visual element examples and usage patterns
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderSimpleDAG,
  updateNodePosition,
  addBranchLabel,
  removeElements,
  renderMergeCommit,
  VisualElementManager,
} from '../examples';
import { VisNode, type CommitNode, type Visuals } from '../index';
import type { GridPosition } from '../grid';

const mockVisuals: Visuals = {
  colors: {},
  node: { r: 8, strokeWidth: 2 },
};

// Helper to create an SVG container for testing
function createSVGContainer(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '800');
  svg.setAttribute('height', '600');
  return svg;
}

describe('Visual Element Examples', () => {
  describe('renderSimpleDAG', () => {
    it('should render a simple DAG with nodes and edges', () => {
      const svg = createSVGContainer();
      renderSimpleDAG(svg, mockVisuals);

      // Should have rendered nodes and edges
      const nodes = svg.querySelectorAll('[data-node-id]');
      const edges = svg.querySelectorAll('[data-edge-id]');

      expect(nodes.length).toBe(3); // 3 commits
      expect(edges.length).toBe(2); // 2 edges (connecting 3 commits)
    });

    it('should render edges before nodes (z-order)', () => {
      const svg = createSVGContainer();
      renderSimpleDAG(svg, mockVisuals);

      const children = Array.from(svg.children);
      const firstEdgeIndex = children.findIndex(
        child => child.hasAttribute('data-edge-id')
      );
      const firstNodeIndex = children.findIndex(
        child => child.hasAttribute('data-node-id')
      );

      // Edges should appear before nodes in DOM
      expect(firstEdgeIndex).toBeLessThan(firstNodeIndex);
    });
  });

  describe('updateNodePosition', () => {
    it('should update node position without re-rendering', () => {
      const commitNode: CommitNode = {
        id: 'abc123',
        title: 'Test commit',
        ts: Date.now(),
        parents: [],
      };

      const initialPosition: GridPosition = { branchIndex: 0, commitLevel: 0 };
      const node = new VisNode(commitNode, initialPosition, mockVisuals);
      
      const svg = createSVGContainer();
      const element = node.render();
      svg.appendChild(element);

      // Update position
      const newPosition: GridPosition = { branchIndex: 2, commitLevel: 3 };
      updateNodePosition(node, newPosition);

      // Check new coordinates
      const coords = node.getScreenCoords();
      expect(coords.x).toBe(160); // 2 * 80
      expect(coords.y).toBe(180); // 3 * 60
    });
  });

  describe('addBranchLabel', () => {
    it('should add a branch label to the SVG', () => {
      const svg = createSVGContainer();
      
      const tag = addBranchLabel(
        svg,
        'main',
        'abc123',
        { branchIndex: 0, commitLevel: 0 },
        mockVisuals
      );

      expect(tag).toBeDefined();
      
      // Check that tag was added to SVG
      const tagElement = svg.querySelector('[data-tag-type="branch"]');
      expect(tagElement).toBeTruthy();
      expect(tagElement?.getAttribute('data-commit-id')).toBe('abc123');
    });
  });

  describe('removeElements', () => {
    it('should remove all elements from DOM', () => {
      const svg = createSVGContainer();
      
      // Create some elements
      const commitNode: CommitNode = {
        id: 'abc123',
        title: 'Test commit',
        ts: Date.now(),
        parents: [],
      };

      const node1 = new VisNode(
        commitNode, 
        { branchIndex: 0, commitLevel: 0 }, 
        mockVisuals
      );
      const node2 = new VisNode(
        { ...commitNode, id: 'def456' }, 
        { branchIndex: 1, commitLevel: 1 }, 
        mockVisuals
      );

      svg.appendChild(node1.render());
      svg.appendChild(node2.render());

      expect(svg.children.length).toBe(2);

      // Remove elements
      removeElements([node1, node2]);

      expect(svg.children.length).toBe(0);
    });
  });

  describe('renderMergeCommit', () => {
    it('should render a merge commit with multiple parent edges', () => {
      const svg = createSVGContainer();

      const mergeCommit: CommitNode = {
        id: 'merge123',
        title: 'Merge feature into main',
        ts: Date.now(),
        parents: ['parent1', 'parent2'],
      };

      const mergePosition: GridPosition = { branchIndex: 1, commitLevel: 2 };
      const parentPositions = new Map<string, GridPosition>([
        ['parent1', { branchIndex: 0, commitLevel: 1 }],
        ['parent2', { branchIndex: 2, commitLevel: 1 }],
      ]);

      const { node, edges } = renderMergeCommit(
        svg,
        mergeCommit,
        mergePosition,
        parentPositions,
        mockVisuals
      );

      expect(node).toBeDefined();
      expect(edges).toHaveLength(2);

      // Check that elements were added to SVG
      const nodeElement = svg.querySelector('[data-node-id="merge123"]');
      expect(nodeElement).toBeTruthy();

      const edgeElements = svg.querySelectorAll('[data-edge-source="merge123"]');
      expect(edgeElements.length).toBe(2);
    });
  });

  describe('VisualElementManager', () => {
    let manager: VisualElementManager;

    beforeEach(() => {
      manager = new VisualElementManager();
    });

    it('should manage node lifecycle', () => {
      const commitNode: CommitNode = {
        id: 'abc123',
        title: 'Test commit',
        ts: Date.now(),
        parents: [],
      };

      const node = new VisNode(
        commitNode,
        { branchIndex: 0, commitLevel: 0 },
        mockVisuals
      );

      manager.addNode('abc123', node);
      
      expect(manager.getNode('abc123')).toBe(node);
      expect(manager.getAllNodes()).toHaveLength(1);

      manager.removeNode('abc123');
      
      expect(manager.getNode('abc123')).toBeUndefined();
      expect(manager.getAllNodes()).toHaveLength(0);
    });

    it('should clear all elements', () => {
      const svg = createSVGContainer();

      // Add some elements
      for (let i = 0; i < 3; i++) {
        const commitNode: CommitNode = {
          id: `commit-${i}`,
          title: `Commit ${i}`,
          ts: Date.now(),
          parents: [],
        };

        const node = new VisNode(
          commitNode,
          { branchIndex: i, commitLevel: 0 },
          mockVisuals
        );

        const element = node.render();
        svg.appendChild(element);
        manager.addNode(`commit-${i}`, node);
      }

      expect(manager.getAllNodes()).toHaveLength(3);
      expect(svg.children.length).toBe(3);

      manager.clear();

      expect(manager.getAllNodes()).toHaveLength(0);
      expect(svg.children.length).toBe(0);
    });

    it('should manage multiple element types', () => {
      const commitNode: CommitNode = {
        id: 'abc123',
        title: 'Test commit',
        ts: Date.now(),
        parents: [],
      };

      const node = new VisNode(
        commitNode,
        { branchIndex: 0, commitLevel: 0 },
        mockVisuals
      );

      manager.addNode('abc123', node);

      expect(manager.getAllNodes()).toHaveLength(1);
      expect(manager.getAllEdges()).toHaveLength(0);
      expect(manager.getAllTags()).toHaveLength(0);
      expect(manager.getAllBranches()).toHaveLength(0);
    });
  });
});

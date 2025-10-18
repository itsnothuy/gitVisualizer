/**
 * Unit tests for visual element classes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VisNode, type CommitNode } from '../VisNode';
import { VisTag, type TagEntity } from '../VisTag';
import { VisEdge, createEdgesForCommit, type EdgeEntity } from '../VisEdge';
import { VisBranch, type BranchEntity, calculateBranchIndices } from '../VisBranch';
import type { Visuals } from '../VisBase';
import type { GridPosition } from '../grid';

const mockVisuals: Visuals = {
  colors: {},
  node: { r: 8, strokeWidth: 2 },
};

describe('Visual Elements', () => {
  describe('VisNode', () => {
    let commitNode: CommitNode;
    let position: GridPosition;

    beforeEach(() => {
      commitNode = {
        id: 'abc123',
        title: 'Initial commit',
        ts: Date.now(),
        parents: [],
        refs: ['main'],
      };
      position = { branchIndex: 0, commitLevel: 0 };
    });

    it('should create a VisNode instance', () => {
      const node = new VisNode(commitNode, position, mockVisuals);
      expect(node).toBeDefined();
      expect(node.getID()).toBe('abc123');
    });

    it('should calculate screen coordinates from grid position', () => {
      const node = new VisNode(commitNode, position, mockVisuals);
      const coords = node.getScreenCoords();
      
      expect(coords.x).toBe(0);
      expect(coords.y).toBe(0);
    });

    it('should render SVG element', () => {
      const node = new VisNode(commitNode, position, mockVisuals);
      const element = node.render();
      
      expect(element.tagName).toBe('g');
      expect(element.getAttribute('data-node-id')).toBe('abc123');
      expect(element.getAttribute('role')).toBe('button');
      expect(element.getAttribute('tabindex')).toBe('0');
    });

    it('should include short SHA in rendered label', () => {
      const node = new VisNode(commitNode, position, mockVisuals);
      const element = node.render();
      
      const text = element.querySelector('text');
      expect(text?.textContent).toBe('abc123'.slice(0, 7));
    });

    it('should handle commits with CI status', () => {
      const commitWithCI: CommitNode = {
        ...commitNode,
        ci: { status: 'success' },
      };
      
      const node = new VisNode(commitWithCI, position, mockVisuals);
      const element = node.render();
      
      const ariaLabel = element.getAttribute('aria-label');
      expect(ariaLabel).toContain('Build passed');
    });

    it('should update position correctly', () => {
      const node = new VisNode(commitNode, position, mockVisuals);
      node.render();
      
      const newPosition: GridPosition = { branchIndex: 2, commitLevel: 3 };
      node.setPosition(newPosition);
      
      const coords = node.getScreenCoords();
      expect(coords.x).toBe(2 * 80); // 160
      expect(coords.y).toBe(3 * 60); // 180
    });
  });

  describe('VisTag', () => {
    let tagEntity: TagEntity;
    let position: GridPosition;

    beforeEach(() => {
      tagEntity = {
        id: 'tag-main',
        label: 'main',
        type: 'branch',
        commitId: 'abc123',
      };
      position = { branchIndex: 0, commitLevel: 0 };
    });

    it('should create a VisTag instance', () => {
      const tag = new VisTag(tagEntity, position, 'inline', mockVisuals);
      expect(tag).toBeDefined();
      expect(tag.getID()).toBe('tag-main');
    });

    it('should render inline tag at grid position', () => {
      const tag = new VisTag(tagEntity, position, 'inline', mockVisuals);
      const coords = tag.getScreenCoords();
      
      expect(coords.x).toBe(0);
      expect(coords.y).toBe(0);
    });

    it('should render tag above node when placement is "above"', () => {
      const tag = new VisTag(tagEntity, position, 'above', mockVisuals);
      const coords = tag.getScreenCoords();
      
      expect(coords.x).toBe(0);
      expect(coords.y).toBe(-25);
    });

    it('should render SVG element with correct attributes', () => {
      const tag = new VisTag(tagEntity, position, 'inline', mockVisuals);
      const element = tag.render();
      
      expect(element.tagName).toBe('g');
      expect(element.getAttribute('data-tag-type')).toBe('branch');
      expect(element.getAttribute('data-commit-id')).toBe('abc123');
    });

    it('should handle HEAD tag type', () => {
      const headTag: TagEntity = {
        ...tagEntity,
        type: 'head',
        label: 'HEAD',
      };
      
      const tag = new VisTag(headTag, position, 'inline', mockVisuals);
      const element = tag.render();
      
      const ariaLabel = element.getAttribute('aria-label');
      expect(ariaLabel).toContain('HEAD');
    });

    it('should change placement mode', () => {
      const tag = new VisTag(tagEntity, position, 'inline', mockVisuals);
      const coords1 = tag.getScreenCoords();
      
      tag.setPlacement('above');
      const coords2 = tag.getScreenCoords();
      
      expect(coords2.y).toBeLessThan(coords1.y);
    });
  });

  describe('VisEdge', () => {
    let edgeEntity: EdgeEntity;

    beforeEach(() => {
      edgeEntity = {
        id: 'edge-1',
        source: 'abc123',
        target: 'def456',
        sourcePosition: { branchIndex: 0, commitLevel: 1 },
        targetPosition: { branchIndex: 0, commitLevel: 0 },
      };
    });

    it('should create a VisEdge instance', () => {
      const edge = new VisEdge(edgeEntity, mockVisuals);
      expect(edge).toBeDefined();
      expect(edge.getID()).toBe('edge-1');
    });

    it('should calculate midpoint screen coordinates', () => {
      const edge = new VisEdge(edgeEntity, mockVisuals);
      const coords = edge.getScreenCoords();
      
      // Midpoint between (0, 60) and (0, 0)
      expect(coords.x).toBe(0);
      expect(coords.y).toBe(30);
    });

    it('should render SVG path element', () => {
      const edge = new VisEdge(edgeEntity, mockVisuals);
      const element = edge.render();
      
      expect(element.tagName).toBe('path');
      expect(element.getAttribute('data-edge-source')).toBe('abc123');
      expect(element.getAttribute('data-edge-target')).toBe('def456');
      expect(element.getAttribute('d')).toBeDefined();
    });

    it('should create curved path for vertical edges', () => {
      const edge = new VisEdge(edgeEntity, mockVisuals);
      const element = edge.render();
      const pathData = element.getAttribute('d');
      
      // Path should start with M (moveto) and contain C (cubic bezier)
      expect(pathData).toMatch(/^M .* C .*/);
    });

    it('should update edge positions', () => {
      const edge = new VisEdge(edgeEntity, mockVisuals);
      edge.render();
      
      const newSource: GridPosition = { branchIndex: 1, commitLevel: 2 };
      const newTarget: GridPosition = { branchIndex: 2, commitLevel: 1 };
      
      edge.setPositions(newSource, newTarget);
      
      const coords = edge.getScreenCoords();
      // Midpoint between (80, 120) and (160, 60)
      expect(coords.x).toBe(120);
      expect(coords.y).toBe(90);
    });
  });

  describe('createEdgesForCommit', () => {
    it('should create edges for commit with no parents', () => {
      const edges = createEdgesForCommit(
        'abc123',
        { branchIndex: 0, commitLevel: 0 },
        [],
        mockVisuals
      );
      
      expect(edges).toHaveLength(0);
    });

    it('should create edge for commit with one parent', () => {
      const edges = createEdgesForCommit(
        'abc123',
        { branchIndex: 0, commitLevel: 1 },
        [{ id: 'def456', position: { branchIndex: 0, commitLevel: 0 } }],
        mockVisuals
      );
      
      expect(edges).toHaveLength(1);
      expect(edges[0].getID()).toBe('abc123-def456');
    });

    it('should create multiple edges for merge commit', () => {
      const edges = createEdgesForCommit(
        'merge123',
        { branchIndex: 1, commitLevel: 2 },
        [
          { id: 'parent1', position: { branchIndex: 0, commitLevel: 1 } },
          { id: 'parent2', position: { branchIndex: 2, commitLevel: 1 } },
        ],
        mockVisuals
      );
      
      expect(edges).toHaveLength(2);
      expect(edges[0].getID()).toBe('merge123-parent1');
      expect(edges[1].getID()).toBe('merge123-parent2');
    });
  });

  describe('VisBranch', () => {
    let branchEntity: BranchEntity;

    beforeEach(() => {
      branchEntity = {
        id: 'branch-main',
        name: 'main',
        commits: ['abc123', 'def456'],
        index: 0,
        tipPosition: { branchIndex: 0, commitLevel: 0 },
      };
    });

    it('should create a VisBranch instance', () => {
      const branch = new VisBranch(branchEntity, mockVisuals);
      expect(branch).toBeDefined();
      expect(branch.getID()).toBe('branch-main');
    });

    it('should calculate x-coordinate from branch index', () => {
      const branch = new VisBranch(branchEntity, mockVisuals);
      expect(branch.getX()).toBe(0);
      
      const branch2 = new VisBranch(
        { ...branchEntity, index: 2 },
        mockVisuals
      );
      expect(branch2.getX()).toBe(160); // 2 * 80
    });

    it('should render SVG group with tag', () => {
      const branch = new VisBranch(branchEntity, mockVisuals);
      const element = branch.render();
      
      expect(element.tagName).toBe('g');
      expect(element.getAttribute('data-branch-name')).toBe('main');
      expect(branch.getTag()).not.toBeNull();
    });

    it('should update branch commits and tip position', () => {
      const branch = new VisBranch(branchEntity, mockVisuals);
      branch.render();
      
      const newTipPosition: GridPosition = { branchIndex: 0, commitLevel: 2 };
      branch.updateBranch(['xyz789', 'abc123'], newTipPosition);
      
      const coords = branch.getScreenCoords();
      expect(coords.y).toBe(120); // 2 * 60
    });
  });

  describe('calculateBranchIndices', () => {
    it('should calculate indices for single branch', () => {
      const branches = [
        { id: 'main', tipPosition: { branchIndex: 0, commitLevel: 0 } },
      ];
      
      const indices = calculateBranchIndices(branches);
      expect(indices.get('main')).toBe(0);
    });

    it('should order branches left-to-right', () => {
      const branches = [
        { id: 'feature', tipPosition: { branchIndex: 2, commitLevel: 0 } },
        { id: 'main', tipPosition: { branchIndex: 0, commitLevel: 0 } },
        { id: 'develop', tipPosition: { branchIndex: 1, commitLevel: 0 } },
      ];
      
      const indices = calculateBranchIndices(branches);
      expect(indices.get('main')).toBe(0);
      expect(indices.get('develop')).toBe(1);
      expect(indices.get('feature')).toBe(2);
    });
  });
});

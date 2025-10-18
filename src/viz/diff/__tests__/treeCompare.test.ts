/**
 * Unit tests for tree comparison and diff computation
 */

import { describe, it, expect } from 'vitest';
import {
  compareStates,
  classifyChange,
  getAffectedNodes,
  type Change,
} from '../treeCompare';
import type { GitState } from '../../anim/mapper';

describe('Tree Comparison', () => {
  describe('compareStates', () => {
    it('should detect added commits', () => {
      const oldState: GitState = {
        nodes: [{ id: 'c1', parents: [] }],
        refs: [{ name: 'main', target: 'c1' }],
        head: 'main',
      };

      const newState: GitState = {
        nodes: [
          { id: 'c1', parents: [] },
          { id: 'c2', parents: ['c1'] },
        ],
        refs: [{ name: 'main', target: 'c2' }],
        head: 'main',
      };

      const result = compareStates(oldState, newState);
      
      expect(result.changes).toHaveLength(2); // commit added + branch moved
      const commitAdded = result.changes.find(c => c.type === 'commitAdded');
      expect(commitAdded).toBeDefined();
      if (commitAdded?.type === 'commitAdded') {
        expect(commitAdded.nodeId).toBe('c2');
        expect(commitAdded.parents).toEqual(['c1']);
      }
    });

    it('should detect removed commits', () => {
      const oldState: GitState = {
        nodes: [
          { id: 'c1', parents: [] },
          { id: 'c2', parents: ['c1'] },
        ],
        refs: [{ name: 'main', target: 'c2' }],
        head: 'main',
      };

      const newState: GitState = {
        nodes: [{ id: 'c1', parents: [] }],
        refs: [{ name: 'main', target: 'c1' }],
        head: 'main',
      };

      const result = compareStates(oldState, newState);
      
      const commitRemoved = result.changes.find(c => c.type === 'commitRemoved');
      expect(commitRemoved).toBeDefined();
      if (commitRemoved?.type === 'commitRemoved') {
        expect(commitRemoved.nodeId).toBe('c2');
      }
    });

    it('should detect added branches', () => {
      const oldState: GitState = {
        nodes: [{ id: 'c1', parents: [] }],
        refs: [{ name: 'main', target: 'c1' }],
        head: 'main',
      };

      const newState: GitState = {
        nodes: [{ id: 'c1', parents: [] }],
        refs: [
          { name: 'main', target: 'c1' },
          { name: 'feature', target: 'c1' },
        ],
        head: 'main',
      };

      const result = compareStates(oldState, newState);
      
      const branchAdded = result.changes.find(c => c.type === 'branchAdded');
      expect(branchAdded).toBeDefined();
      if (branchAdded?.type === 'branchAdded') {
        expect(branchAdded.branchName).toBe('feature');
        expect(branchAdded.targetCommit).toBe('c1');
      }
    });

    it('should detect removed branches', () => {
      const oldState: GitState = {
        nodes: [{ id: 'c1', parents: [] }],
        refs: [
          { name: 'main', target: 'c1' },
          { name: 'feature', target: 'c1' },
        ],
        head: 'main',
      };

      const newState: GitState = {
        nodes: [{ id: 'c1', parents: [] }],
        refs: [{ name: 'main', target: 'c1' }],
        head: 'main',
      };

      const result = compareStates(oldState, newState);
      
      const branchRemoved = result.changes.find(c => c.type === 'branchRemoved');
      expect(branchRemoved).toBeDefined();
      if (branchRemoved?.type === 'branchRemoved') {
        expect(branchRemoved.branchName).toBe('feature');
      }
    });

    it('should detect branch moves', () => {
      const oldState: GitState = {
        nodes: [
          { id: 'c1', parents: [] },
          { id: 'c2', parents: ['c1'] },
        ],
        refs: [{ name: 'main', target: 'c1' }],
        head: 'main',
      };

      const newState: GitState = {
        nodes: [
          { id: 'c1', parents: [] },
          { id: 'c2', parents: ['c1'] },
        ],
        refs: [{ name: 'main', target: 'c2' }],
        head: 'main',
      };

      const result = compareStates(oldState, newState);
      
      const branchMoved = result.changes.find(c => c.type === 'branchMoved');
      expect(branchMoved).toBeDefined();
      if (branchMoved?.type === 'branchMoved') {
        expect(branchMoved.branchName).toBe('main');
        expect(branchMoved.oldCommit).toBe('c1');
        expect(branchMoved.newCommit).toBe('c2');
      }
    });

    it('should detect HEAD moves', () => {
      const oldState: GitState = {
        nodes: [{ id: 'c1', parents: [] }],
        refs: [
          { name: 'main', target: 'c1' },
          { name: 'feature', target: 'c1' },
        ],
        head: 'main',
      };

      const newState: GitState = {
        nodes: [{ id: 'c1', parents: [] }],
        refs: [
          { name: 'main', target: 'c1' },
          { name: 'feature', target: 'c1' },
        ],
        head: 'feature',
      };

      const result = compareStates(oldState, newState);
      
      const headMoved = result.changes.find(c => c.type === 'headMoved');
      expect(headMoved).toBeDefined();
      if (headMoved?.type === 'headMoved') {
        expect(headMoved.oldTarget).toBe('main');
        expect(headMoved.newTarget).toBe('feature');
      }
    });

    it('should detect merge commits', () => {
      const oldState: GitState = {
        nodes: [
          { id: 'c1', parents: [] },
          { id: 'c2', parents: ['c1'] },
          { id: 'c3', parents: ['c1'] },
        ],
        refs: [
          { name: 'main', target: 'c2' },
          { name: 'feature', target: 'c3' },
        ],
        head: 'main',
      };

      const newState: GitState = {
        nodes: [
          { id: 'c1', parents: [] },
          { id: 'c2', parents: ['c1'] },
          { id: 'c3', parents: ['c1'] },
          { id: 'c4', parents: ['c2', 'c3'] }, // Merge commit
        ],
        refs: [
          { name: 'main', target: 'c4' },
          { name: 'feature', target: 'c3' },
        ],
        head: 'main',
      };

      const result = compareStates(oldState, newState);
      
      const merge = result.changes.find(c => c.type === 'merge');
      expect(merge).toBeDefined();
      if (merge?.type === 'merge') {
        expect(merge.mergeCommit).toBe('c4');
        expect(merge.parents).toEqual(['c2', 'c3']);
      }
    });

    it('should detect rebase operations', () => {
      const oldState: GitState = {
        nodes: [
          { id: 'c1', parents: [] },
          { id: 'c2', parents: ['c1'] },
          { id: 'c3', parents: ['c2'] },
          { id: 'c4', parents: ['c1'] },
        ],
        refs: [
          { name: 'main', target: 'c2' },
          { name: 'feature', target: 'c4' },
        ],
        head: 'feature',
      };

      const newState: GitState = {
        nodes: [
          { id: 'c1', parents: [] },
          { id: 'c2', parents: ['c1'] },
          { id: 'c3', parents: ['c2'] },
          { id: 'c5', parents: ['c3'] }, // Rebased c4
        ],
        refs: [
          { name: 'main', target: 'c2' },
          { name: 'feature', target: 'c5' },
        ],
        head: 'feature',
      };

      const result = compareStates(oldState, newState);
      
      // Should have commit added, removed, and potentially rebase
      const commitAdded = result.changes.find(c => c.type === 'commitAdded');
      const commitRemoved = result.changes.find(c => c.type === 'commitRemoved');
      expect(commitAdded).toBeDefined();
      expect(commitRemoved).toBeDefined();
    });
  });

  describe('classifyChange', () => {
    it('should classify simple changes', () => {
      const change: Change = {
        type: 'commitAdded',
        nodeId: 'c1',
        parents: [],
      };

      const result = classifyChange(change);
      expect(result.category).toBe('simple');
      expect(result.operation).toBe('commitAdded');
    });

    it('should classify complex changes', () => {
      const change: Change = {
        type: 'merge',
        mergeCommit: 'c1',
        parents: ['c2', 'c3'],
      };

      const result = classifyChange(change);
      expect(result.category).toBe('complex');
      expect(result.operation).toBe('merge');
    });
  });

  describe('getAffectedNodes', () => {
    it('should get affected nodes for commit added', () => {
      const change: Change = {
        type: 'commitAdded',
        nodeId: 'c1',
        parents: [],
      };

      const nodes = getAffectedNodes(change);
      expect(nodes).toEqual(['c1']);
    });

    it('should get affected nodes for branch moved', () => {
      const change: Change = {
        type: 'branchMoved',
        branchName: 'main',
        oldCommit: 'c1',
        newCommit: 'c2',
      };

      const nodes = getAffectedNodes(change);
      expect(nodes).toEqual(['c1', 'c2']);
    });

    it('should get affected nodes for merge', () => {
      const change: Change = {
        type: 'merge',
        mergeCommit: 'c4',
        parents: ['c2', 'c3'],
      };

      const nodes = getAffectedNodes(change);
      expect(nodes).toEqual(['c4', 'c2', 'c3']);
    });
  });
});

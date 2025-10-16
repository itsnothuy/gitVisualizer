/**
 * Unit tests for animation mapper
 * Tests mapping Git state diffs to animation scenes
 */

import { describe, it, expect } from 'vitest';
import {
  mapDiffToScene,
  findIntermediateCommits,
  type GitDiff,
  type GitState,
  type GitNode,
  type GitOperation,
} from '../mapper';

describe('Animation Mapper', () => {
  describe('mapDiffToScene', () => {
    describe('commit operation', () => {
      it('should map a commit diff to a commit scene', () => {
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

        const diff: GitDiff = {
          operation: 'commit',
          oldState,
          newState,
        };

        const scene = mapDiffToScene(diff);
        expect(scene).not.toBeNull();
        expect(scene?.name).toBe('commit');
      });

      it('should throw if no new commit found', () => {
        const state: GitState = {
          nodes: [{ id: 'c1', parents: [] }],
          refs: [{ name: 'main', target: 'c1' }],
          head: 'main',
        };

        const diff: GitDiff = {
          operation: 'commit',
          oldState: state,
          newState: state, // Same state, no new commit
        };

        expect(() => mapDiffToScene(diff)).toThrow('No new commit found');
      });
    });

    describe('branch-create operation', () => {
      it('should map a branch-create diff to a branch-create scene', () => {
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

        const diff: GitDiff = {
          operation: 'branch-create',
          oldState,
          newState,
          metadata: { labelPosition: { x: 100, y: 50 } },
        };

        const scene = mapDiffToScene(diff);
        expect(scene).not.toBeNull();
        expect(scene?.name).toBe('branch-create');
        expect(scene?.description).toContain('feature');
      });
    });

    describe('branch-delete operation', () => {
      it('should map a branch-delete diff to a branch-delete scene', () => {
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

        const diff: GitDiff = {
          operation: 'branch-delete',
          oldState,
          newState,
        };

        const scene = mapDiffToScene(diff);
        expect(scene).not.toBeNull();
        expect(scene?.name).toBe('branch-delete');
        expect(scene?.description).toContain('feature');
      });
    });

    describe('checkout operation', () => {
      it('should map a checkout diff to a checkout scene', () => {
        const oldState: GitState = {
          nodes: [
            { id: 'c1', parents: [] },
            { id: 'c2', parents: ['c1'] },
          ],
          refs: [
            { name: 'main', target: 'c2' },
            { name: 'feature', target: 'c1' },
          ],
          head: 'main',
        };

        const newState: GitState = {
          nodes: [
            { id: 'c1', parents: [] },
            { id: 'c2', parents: ['c1'] },
          ],
          refs: [
            { name: 'main', target: 'c2' },
            { name: 'feature', target: 'c1' },
          ],
          head: 'feature',
        };

        const diff: GitDiff = {
          operation: 'checkout',
          oldState,
          newState,
          metadata: { labelPosition: { x: 200, y: 50 } },
        };

        const scene = mapDiffToScene(diff);
        expect(scene).not.toBeNull();
        expect(scene?.name).toBe('checkout');
      });

      it('should handle detached HEAD state', () => {
        const oldState: GitState = {
          nodes: [{ id: 'c1', parents: [] }],
          refs: [{ name: 'main', target: 'c1' }],
          head: 'main',
        };

        const newState: GitState = {
          nodes: [{ id: 'c1', parents: [] }],
          refs: [{ name: 'main', target: 'c1' }],
          head: 'c1', // Direct commit reference
        };

        const diff: GitDiff = {
          operation: 'checkout',
          oldState,
          newState,
          metadata: { labelPosition: { x: 200, y: 50 } },
        };

        const scene = mapDiffToScene(diff);
        expect(scene).not.toBeNull();
        expect(scene?.name).toBe('checkout');
      });
    });

    describe('fast-forward operation', () => {
      it('should map a fast-forward diff to a fast-forward scene', () => {
        const oldState: GitState = {
          nodes: [
            { id: 'c1', parents: [] },
            { id: 'c2', parents: ['c1'] },
            { id: 'c3', parents: ['c2'] },
          ],
          refs: [{ name: 'main', target: 'c1' }],
          head: 'main',
        };

        const newState: GitState = {
          nodes: [
            { id: 'c1', parents: [] },
            { id: 'c2', parents: ['c1'] },
            { id: 'c3', parents: ['c2'] },
          ],
          refs: [{ name: 'main', target: 'c3' }],
          head: 'main',
        };

        const diff: GitDiff = {
          operation: 'fast-forward',
          oldState,
          newState,
          metadata: {
            branchName: 'main',
            intermediateNodes: ['c2'],
            labelPosition: { x: 300, y: 50 },
          },
        };

        const scene = mapDiffToScene(diff);
        expect(scene).not.toBeNull();
        expect(scene?.name).toBe('fast-forward');
        expect(scene?.description).toContain('main');
      });
    });

    describe('merge operation', () => {
      it('should map a merge diff to a merge-2p scene', () => {
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
            { id: 'c4', parents: ['c2', 'c3'] },
          ],
          refs: [
            { name: 'main', target: 'c4' },
            { name: 'feature', target: 'c3' },
          ],
          head: 'main',
        };

        const diff: GitDiff = {
          operation: 'merge',
          oldState,
          newState,
          metadata: {
            branchName: 'main',
            labelPosition: { x: 400, y: 50 },
          },
        };

        const scene = mapDiffToScene(diff);
        expect(scene).not.toBeNull();
        expect(scene?.name).toBe('merge-2p');
        expect(scene?.description).toContain('Merging');
      });

      it('should throw if merge commit has less than 2 parents', () => {
        const oldState: GitState = {
          nodes: [{ id: 'c1', parents: [] }],
          refs: [{ name: 'main', target: 'c1' }],
          head: 'main',
        };

        const newState: GitState = {
          nodes: [
            { id: 'c1', parents: [] },
            { id: 'c2', parents: ['c1'] }, // Only 1 parent
          ],
          refs: [{ name: 'main', target: 'c2' }],
          head: 'main',
        };

        const diff: GitDiff = {
          operation: 'merge',
          oldState,
          newState,
        };

        expect(() => mapDiffToScene(diff)).toThrow('No valid merge commit');
      });
    });

    describe('reset operation', () => {
      it('should map a reset diff to a reset scene', () => {
        const oldState: GitState = {
          nodes: [
            { id: 'c1', parents: [] },
            { id: 'c2', parents: ['c1'] },
            { id: 'c3', parents: ['c2'] },
          ],
          refs: [{ name: 'main', target: 'c3' }],
          head: 'main',
        };

        const newState: GitState = {
          nodes: [
            { id: 'c1', parents: [] },
            { id: 'c2', parents: ['c1'] },
            { id: 'c3', parents: ['c2'] },
          ],
          refs: [{ name: 'main', target: 'c1' }],
          head: 'main',
        };

        const diff: GitDiff = {
          operation: 'reset',
          oldState,
          newState,
          metadata: {
            resetMode: 'hard',
            labelPosition: { x: 100, y: 50 },
          },
        };

        const scene = mapDiffToScene(diff);
        expect(scene).not.toBeNull();
        expect(scene?.name).toBe('reset');
        expect(scene?.description).toContain('hard');
      });

      it('should default to soft reset if mode not specified', () => {
        const oldState: GitState = {
          nodes: [
            { id: 'c1', parents: [] },
            { id: 'c2', parents: ['c1'] },
          ],
          refs: [{ name: 'main', target: 'c2' }],
          head: 'main',
        };

        const newState: GitState = {
          nodes: [
            { id: 'c1', parents: [] },
            { id: 'c2', parents: ['c1'] },
          ],
          refs: [{ name: 'main', target: 'c1' }],
          head: 'main',
        };

        const diff: GitDiff = {
          operation: 'reset',
          oldState,
          newState,
          metadata: { labelPosition: { x: 100, y: 50 } },
        };

        const scene = mapDiffToScene(diff);
        expect(scene).not.toBeNull();
        expect(scene?.description).toContain('soft');
      });
    });

    describe('revert operation', () => {
      it('should map a revert diff to a revert scene', () => {
        const oldState: GitState = {
          nodes: [
            { id: 'c1', parents: [] },
            { id: 'c2', parents: ['c1'] },
          ],
          refs: [{ name: 'main', target: 'c2' }],
          head: 'main',
        };

        const newState: GitState = {
          nodes: [
            { id: 'c1', parents: [] },
            { id: 'c2', parents: ['c1'] },
            { id: 'c3', parents: ['c2'] }, // Revert commit
          ],
          refs: [{ name: 'main', target: 'c3' }],
          head: 'main',
        };

        const diff: GitDiff = {
          operation: 'revert',
          oldState,
          newState,
          metadata: {
            commitId: 'c2', // Commit being reverted
            branchName: 'main',
            labelPosition: { x: 300, y: 50 },
          },
        };

        const scene = mapDiffToScene(diff);
        expect(scene).not.toBeNull();
        expect(scene?.name).toBe('revert');
      });
    });

    describe('rebase operation', () => {
      it('should map a rebase diff to a rebase scene', () => {
        const oldState: GitState = {
          nodes: [
            { id: 'c1', parents: [] },
            { id: 'c2', parents: ['c1'] },
            { id: 'c3', parents: ['c1'] },
            { id: 'c4', parents: ['c3'] },
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
            { id: 'c3', parents: ['c1'] },
            { id: 'c4', parents: ['c3'] },
            { id: 'c3-rebased', parents: ['c2'] },
            { id: 'c4-rebased', parents: ['c3-rebased'] },
          ],
          refs: [
            { name: 'main', target: 'c2' },
            { name: 'feature', target: 'c4-rebased' },
          ],
          head: 'feature',
        };

        const diff: GitDiff = {
          operation: 'rebase',
          oldState,
          newState,
          metadata: {
            pickedCommits: ['c3', 'c4'],
            oldBaseId: 'c1',
            newBaseId: 'c2',
            newCommitIds: ['c3-rebased', 'c4-rebased'],
            newPositions: [
              { x: 200, y: 50 },
              { x: 250, y: 50 },
            ],
            branchName: 'feature',
            labelPosition: { x: 250, y: 30 },
          },
        };

        const scene = mapDiffToScene(diff);
        expect(scene).not.toBeNull();
        expect(scene?.name).toBe('rebase');
        expect(scene?.description).toContain('Rebased 2 commits');
      });

      it('should throw if rebase metadata is missing', () => {
        const state: GitState = {
          nodes: [{ id: 'c1', parents: [] }],
          refs: [{ name: 'main', target: 'c1' }],
          head: 'main',
        };

        const diff: GitDiff = {
          operation: 'rebase',
          oldState: state,
          newState: state,
          metadata: {}, // Missing required fields
        };

        expect(() => mapDiffToScene(diff)).toThrow('Missing required rebase metadata');
      });
    });

    describe('interactive-rebase operation', () => {
      it('should map an interactive rebase diff to an interactive rebase scene', () => {
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
          head: 'feature',
        };

        const newState: GitState = {
          nodes: [
            { id: 'c1', parents: [] },
            { id: 'c2', parents: ['c1'] },
            { id: 'c3', parents: ['c1'] },
            { id: 'c3-rebased', parents: ['c2'] },
          ],
          refs: [
            { name: 'main', target: 'c2' },
            { name: 'feature', target: 'c3-rebased' },
          ],
          head: 'feature',
        };

        const diff: GitDiff = {
          operation: 'interactive-rebase',
          oldState,
          newState,
          metadata: {
            pickedCommits: ['c3'],
            oldBaseId: 'c1',
            newBaseId: 'c2',
            newCommitIds: ['c3-rebased'],
            newPositions: [{ x: 200, y: 50 }],
            branchName: 'feature',
            labelPosition: { x: 200, y: 30 },
          },
        };

        const scene = mapDiffToScene(diff);
        expect(scene).not.toBeNull();
        expect(scene?.name).toBe('interactive-rebase');
      });
    });

    describe('cherry-pick operation', () => {
      it('should map a cherry-pick diff to a cherry-pick scene', () => {
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
            { id: 'c4', parents: ['c2'] }, // Cherry-picked commit
          ],
          refs: [
            { name: 'main', target: 'c4' },
            { name: 'feature', target: 'c3' },
          ],
          head: 'main',
        };

        const diff: GitDiff = {
          operation: 'cherry-pick',
          oldState,
          newState,
          metadata: {
            sourceCommitId: 'c3',
            targetBaseId: 'c2',
            newPosition: { x: 200, y: 0 },
            branchName: 'main',
            labelPosition: { x: 200, y: -20 },
            hasConflict: false,
          },
        };

        const scene = mapDiffToScene(diff);
        expect(scene).not.toBeNull();
        expect(scene?.name).toBe('cherry-pick');
        expect(scene?.description).toContain('Cherry-picked');
      });

      it('should throw if cherry-pick metadata is missing', () => {
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

        const diff: GitDiff = {
          operation: 'cherry-pick',
          oldState,
          newState,
          metadata: {}, // Missing required fields
        };

        expect(() => mapDiffToScene(diff)).toThrow('Missing required cherry-pick metadata');
      });
    });

    describe('unknown operation', () => {
      it('should return null for unknown operations', () => {
        const state: GitState = {
          nodes: [{ id: 'c1', parents: [] }],
          refs: [{ name: 'main', target: 'c1' }],
          head: 'main',
        };

        const diff = {
          operation: 'unknown-op' as GitOperation,
          oldState: state,
          newState: state,
        } as GitDiff;

        const scene = mapDiffToScene(diff);
        expect(scene).toBeNull();
      });
    });
  });

  describe('findIntermediateCommits', () => {
    it('should find intermediate commits in a linear history', () => {
      const nodes: GitNode[] = [
        { id: 'c1', parents: [] },
        { id: 'c2', parents: ['c1'] },
        { id: 'c3', parents: ['c2'] },
        { id: 'c4', parents: ['c3'] },
      ];

      const intermediates = findIntermediateCommits('c1', 'c4', nodes);
      expect(intermediates).toContain('c2');
      expect(intermediates).toContain('c3');
      expect(intermediates).not.toContain('c1');
      expect(intermediates).not.toContain('c4');
    });

    it('should return empty array for adjacent commits', () => {
      const nodes: GitNode[] = [
        { id: 'c1', parents: [] },
        { id: 'c2', parents: ['c1'] },
      ];

      const intermediates = findIntermediateCommits('c1', 'c2', nodes);
      expect(intermediates).toHaveLength(0);
    });

    it('should handle branching history', () => {
      const nodes: GitNode[] = [
        { id: 'c1', parents: [] },
        { id: 'c2', parents: ['c1'] },
        { id: 'c3', parents: ['c1'] },
        { id: 'c4', parents: ['c2'] },
      ];

      const intermediates = findIntermediateCommits('c1', 'c4', nodes);
      // Should find path through c2
      expect(intermediates).toContain('c2');
    });

    it('should return empty array if no path exists', () => {
      const nodes: GitNode[] = [
        { id: 'c1', parents: [] },
        { id: 'c2', parents: [] }, // No connection to c1
      ];

      const intermediates = findIntermediateCommits('c1', 'c2', nodes);
      expect(intermediates).toHaveLength(0);
    });
  });
});

/**
 * Unit tests for core animation scenes
 * Tests all Git operation scenes for correct timing and composition
 */

import { describe, it, expect } from 'vitest';
import {
  sceneCommit,
  sceneBranchCreate,
  sceneBranchDelete,
  sceneCheckout,
  sceneFastForward,
  sceneMerge2P,
  sceneReset,
  sceneRevert,
} from '../scenes/core';
import { DURATIONS } from '../types';

describe('Core Animation Scenes', () => {
  describe('sceneCommit', () => {
    it('should create a commit scene with correct timing', () => {
      const scene = sceneCommit('new-commit');

      expect(scene.name).toBe('commit');
      expect(scene.description).toBe('Creating new commit');
      expect(scene.steps.length).toBeGreaterThan(0);
      expect(scene.total).toBeGreaterThan(0);
      expect(scene.total).toBeLessThanOrEqual(DURATIONS.long * 2);
    });

    it('should include fade and highlight steps', () => {
      const scene = sceneCommit('new-commit');
      const ops = scene.steps.map((s) => s.op);

      // Should include fade operations for node appearance
      expect(ops).toContain('fade');
      // Should include pulse or stroke for highlighting
      expect(ops.some((op) => op === 'pulse' || op === 'stroke')).toBe(true);
    });
  });

  describe('sceneBranchCreate', () => {
    it('should create a branch-create scene with correct timing', () => {
      const scene = sceneBranchCreate('feature', 'commit-1', { x: 100, y: 50 });

      expect(scene.name).toBe('branch-create');
      expect(scene.description).toContain('feature');
      expect(scene.steps.length).toBeGreaterThan(0);
      expect(scene.total).toBeLessThanOrEqual(DURATIONS.long);
    });

    it('should include label movement', () => {
      const scene = sceneBranchCreate('feature', 'commit-1', { x: 100, y: 50 });
      const ops = scene.steps.map((s) => s.op);

      // Label movement involves fade and move operations
      expect(ops).toContain('fade');
      expect(ops).toContain('move');
    });
  });

  describe('sceneBranchDelete', () => {
    it('should create a branch-delete scene', () => {
      const scene = sceneBranchDelete('feature');

      expect(scene.name).toBe('branch-delete');
      expect(scene.description).toContain('feature');
      expect(scene.steps.length).toBeGreaterThan(0);
    });

    it('should include fade out operation', () => {
      const scene = sceneBranchDelete('feature');
      const ops = scene.steps.map((s) => s.op);

      expect(ops).toContain('fade');
    });
  });

  describe('sceneCheckout', () => {
    it('should create a checkout scene with correct timing', () => {
      const scene = sceneCheckout('commit-1', 'commit-2', 'HEAD', { x: 200, y: 50 });

      expect(scene.name).toBe('checkout');
      expect(scene.description).toBe('Switching branch');
      expect(scene.steps.length).toBeGreaterThan(0);
      expect(scene.total).toBeLessThanOrEqual(DURATIONS.long * 2);
    });

    it('should include label movement and highlights', () => {
      const scene = sceneCheckout('commit-1', 'commit-2', 'HEAD', { x: 200, y: 50 });
      const ops = scene.steps.map((s) => s.op);

      expect(ops).toContain('fade');
      expect(ops).toContain('move');
      expect(ops.some((op) => op === 'pulse' || op === 'stroke')).toBe(true);
    });
  });

  describe('sceneFastForward', () => {
    it('should create a fast-forward scene with intermediate nodes', () => {
      const scene = sceneFastForward(
        'main',
        'commit-1',
        'commit-4',
        ['commit-2', 'commit-3'],
        { x: 300, y: 50 }
      );

      expect(scene.name).toBe('fast-forward');
      expect(scene.description).toContain('main');
      expect(scene.steps.length).toBeGreaterThan(0);
    });

    it('should include cascading highlights for path', () => {
      const scene = sceneFastForward(
        'main',
        'commit-1',
        'commit-4',
        ['commit-2', 'commit-3'],
        { x: 300, y: 50 }
      );

      const ops = scene.steps.map((s) => s.op);
      // Should have multiple highlights for cascade
      const pulseCount = ops.filter((op) => op === 'pulse').length;
      expect(pulseCount).toBeGreaterThan(1);
    });

    it('should handle empty intermediate nodes', () => {
      const scene = sceneFastForward('main', 'commit-1', 'commit-2', [], { x: 200, y: 50 });

      expect(scene.name).toBe('fast-forward');
      expect(scene.steps.length).toBeGreaterThan(0);
    });
  });

  describe('sceneMerge2P', () => {
    it('should create a 2-parent merge scene', () => {
      const scene = sceneMerge2P(
        'merge-commit',
        'parent-1',
        'parent-2',
        'edge-2',
        'main',
        { x: 400, y: 50 }
      );

      expect(scene.name).toBe('merge-2p');
      expect(scene.description).toContain('Merging');
      expect(scene.steps.length).toBeGreaterThan(0);
    });

    it('should include temporary dashed edge', () => {
      const scene = sceneMerge2P(
        'merge-commit',
        'parent-1',
        'parent-2',
        'edge-2',
        'main',
        { x: 400, y: 50 }
      );

      const ops = scene.steps.map((s) => s.op);
      expect(ops).toContain('classAdd');
      expect(ops).toContain('classRemove');
    });

    it('should highlight both parents', () => {
      const scene = sceneMerge2P(
        'merge-commit',
        'parent-1',
        'parent-2',
        'edge-2',
        'main',
        { x: 400, y: 50 }
      );

      // Check that both parent nodes are referenced in steps
      const nodeSelectors = scene.steps
        .filter((s) => s.sel.nodes)
        .flatMap((s) => s.sel.nodes || []);

      expect(nodeSelectors).toContain('parent-1');
      expect(nodeSelectors).toContain('parent-2');
    });
  });

  describe('sceneReset', () => {
    it('should create a reset scene with soft mode', () => {
      const scene = sceneReset('commit-3', 'commit-1', 'HEAD', { x: 100, y: 50 }, 'soft');

      expect(scene.name).toBe('reset');
      expect(scene.description).toContain('soft');
      expect(scene.steps.length).toBeGreaterThan(0);
    });

    it('should create a reset scene with hard mode', () => {
      const scene = sceneReset('commit-3', 'commit-1', 'HEAD', { x: 100, y: 50 }, 'hard');

      expect(scene.name).toBe('reset');
      expect(scene.description).toContain('hard');
    });

    it('should use emphasis color for hard reset', () => {
      const scene = sceneReset('commit-3', 'commit-1', 'HEAD', { x: 100, y: 50 }, 'hard');

      // Check for danger color in stroke operations
      const strokeSteps = scene.steps.filter((s) => s.op === 'stroke');
      const hasDangerColor = strokeSteps.some((s) => {
        if (typeof s.to === 'object' && 'color' in s.to) {
          return (s.to as { color?: string }).color?.includes('danger');
        }
        return false;
      });

      expect(hasDangerColor).toBe(true);
    });

    it('should have quick snap timing', () => {
      const scene = sceneReset('commit-3', 'commit-1', 'HEAD', { x: 100, y: 50 });

      // Reset should be relatively quick
      expect(scene.total).toBeLessThanOrEqual(DURATIONS.long * 2);
    });
  });

  describe('sceneRevert', () => {
    it('should create a revert scene', () => {
      const scene = sceneRevert('revert-commit', 'original-commit', 'main', { x: 500, y: 50 });

      expect(scene.name).toBe('revert');
      expect(scene.description).toBe('Creating revert commit');
      expect(scene.steps.length).toBeGreaterThan(0);
    });

    it('should highlight original commit first', () => {
      const scene = sceneRevert('revert-commit', 'original-commit', 'main', { x: 500, y: 50 });

      // First steps should reference the original commit
      const firstNodeSteps = scene.steps.filter((s) => s.sel.nodes).slice(0, 3);
      const nodeIds = firstNodeSteps.flatMap((s) => s.sel.nodes || []);

      expect(nodeIds).toContain('original-commit');
    });

    it('should use danger color for revert node', () => {
      const scene = sceneRevert('revert-commit', 'original-commit', 'main', { x: 500, y: 50 });

      const strokeSteps = scene.steps.filter((s) => s.op === 'stroke');
      const hasDangerColor = strokeSteps.some((s) => {
        if (typeof s.to === 'object' && 'color' in s.to) {
          return (s.to as { color?: string }).color?.includes('danger');
        }
        return false;
      });

      expect(hasDangerColor).toBe(true);
    });
  });

  describe('Scene Composition - No Overlapping Locks', () => {
    it('should have sequential step timing without negative times', () => {
      const scenes = [
        sceneCommit('c1'),
        sceneBranchCreate('feature', 'c1', { x: 100, y: 50 }),
        sceneCheckout('c1', 'c2', 'HEAD', { x: 200, y: 50 }),
        sceneFastForward('main', 'c1', 'c3', ['c2'], { x: 300, y: 50 }),
        sceneMerge2P('m1', 'p1', 'p2', 'e1', 'main', { x: 400, y: 50 }),
        sceneReset('c3', 'c1', 'HEAD', { x: 100, y: 50 }),
        sceneRevert('r1', 'c3', 'main', { x: 500, y: 50 }),
      ];

      for (const scene of scenes) {
        // All steps should have non-negative start times
        for (const step of scene.steps) {
          expect(step.t).toBeGreaterThanOrEqual(0);
        }

        // Total duration should be positive
        expect(scene.total).toBeGreaterThan(0);
      }
    });
  });

  describe('Timing Windows', () => {
    it('should respect timing bounds (120-480ms per operation)', () => {
      const scenes = [
        sceneCommit('c1'),
        sceneBranchCreate('feature', 'c1', { x: 100, y: 50 }),
        sceneCheckout('c1', 'c2', 'HEAD', { x: 200, y: 50 }),
      ];

      for (const scene of scenes) {
        // Individual operations should be within reasonable bounds
        // Total can be longer for complex scenes
        expect(scene.total).toBeGreaterThanOrEqual(DURATIONS.veryShort);
        expect(scene.total).toBeLessThanOrEqual(DURATIONS.long * 3);
      }
    });

    it('should have individual step durations within bounds', () => {
      const scene = sceneCommit('c1');

      for (const step of scene.steps) {
        const dur = step.dur || DURATIONS.short;
        expect(dur).toBeGreaterThanOrEqual(0);
        expect(dur).toBeLessThanOrEqual(DURATIONS.long);
      }
    });
  });
});

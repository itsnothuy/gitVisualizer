/**
 * Unit tests for rebase and cherry-pick animation scenes
 * Tests rebase, interactive rebase, and cherry-pick scenes
 */

import { describe, it, expect } from 'vitest';
import {
  sceneRebase,
  sceneInteractiveRebase,
  sceneCherryPick,
} from '../scenes/rebase';

describe('Rebase Animation Scenes', () => {
  describe('sceneRebase', () => {
    it('should create a rebase scene with correct timing', () => {
      const scene = sceneRebase(
        ['c3', 'c4'],
        'c1',
        'c2',
        ['c3-new', 'c4-new'],
        'feature',
        [
          { x: 200, y: 50 },
          { x: 250, y: 50 },
        ],
        { x: 250, y: 30 }
      );

      expect(scene.name).toBe('rebase');
      expect(scene.description).toContain('Rebased 2 commits');
      expect(scene.description).toContain('c2');
      expect(scene.steps.length).toBeGreaterThan(0);
      expect(scene.total).toBeGreaterThan(0);
    });

    it('should animate commits sequentially', () => {
      const scene = sceneRebase(
        ['c3', 'c4'],
        'c1',
        'c2',
        ['c3-new', 'c4-new'],
        'feature',
        [
          { x: 200, y: 50 },
          { x: 250, y: 50 },
        ],
        { x: 250, y: 30 }
      );

      // Check that new commits appear in sequence
      const fadeInSteps = scene.steps.filter(
        (s) => s.op === 'fade' && s.to === 1
      );
      const newCommitFades = fadeInSteps.filter((s) =>
        s.sel.nodes?.some((id) => id.includes('new'))
      );

      // Should have 2 fade-ins for new commits
      expect(newCommitFades.length).toBe(2);

      // Second commit should start after first
      if (newCommitFades.length >= 2) {
        expect(newCommitFades[1].t).toBeGreaterThan(newCommitFades[0].t);
      }
    });

    it('should include ghost nodes for each commit', () => {
      const scene = sceneRebase(
        ['c3', 'c4'],
        'c1',
        'c2',
        ['c3-new', 'c4-new'],
        'feature',
        [
          { x: 200, y: 50 },
          { x: 250, y: 50 },
        ],
        { x: 250, y: 30 }
      );

      // Should have ghost class operations
      const ops = scene.steps.map((s) => s.op);
      expect(ops).toContain('classAdd');
      expect(ops).toContain('classRemove');

      // Check for ghost node references
      const nodeSelectors = scene.steps
        .filter((s) => s.sel.nodes)
        .flatMap((s) => s.sel.nodes || []);

      expect(nodeSelectors.some((id) => id.includes('ghost'))).toBe(true);
    });

    it('should include dashed edges', () => {
      const scene = sceneRebase(
        ['c3', 'c4'],
        'c1',
        'c2',
        ['c3-new', 'c4-new'],
        'feature',
        [
          { x: 200, y: 50 },
          { x: 250, y: 50 },
        ],
        { x: 250, y: 30 }
      );

      // Should have dashed edge operations
      const edgeSelectors = scene.steps
        .filter((s) => s.sel.edges)
        .flatMap((s) => s.sel.edges || []);

      expect(edgeSelectors.some((id) => id.includes('arc'))).toBe(true);
    });

    it('should dim original commits after copying', () => {
      const scene = sceneRebase(
        ['c3', 'c4'],
        'c1',
        'c2',
        ['c3-new', 'c4-new'],
        'feature',
        [
          { x: 200, y: 50 },
          { x: 250, y: 50 },
        ],
        { x: 250, y: 30 }
      );

      // Should have fade operations for original commits
      const fadeSteps = scene.steps.filter(
        (s) => s.op === 'fade' && s.to === 0.3
      );
      expect(fadeSteps.length).toBeGreaterThan(0);

      // Check that both original commits are faded
      const fadedNodes = fadeSteps.flatMap((s) => s.sel.nodes || []);
      expect(fadedNodes).toContain('c3');
      expect(fadedNodes).toContain('c4');
    });

    it('should move branch label at the end', () => {
      const scene = sceneRebase(
        ['c3', 'c4'],
        'c1',
        'c2',
        ['c3-new', 'c4-new'],
        'feature',
        [
          { x: 200, y: 50 },
          { x: 250, y: 50 },
        ],
        { x: 250, y: 30 }
      );

      // Should have label movement operations
      const labelOps = scene.steps.filter((s) => s.sel.labels);
      expect(labelOps.length).toBeGreaterThan(0);

      // Label operations should be towards the end
      const lastLabelOpTime = Math.max(...labelOps.map((s) => s.t));
      expect(lastLabelOpTime).toBeGreaterThan(scene.total * 0.7);
    });

    it('should handle single commit rebase', () => {
      const scene = sceneRebase(
        ['c3'],
        'c1',
        'c2',
        ['c3-new'],
        'feature',
        [{ x: 200, y: 50 }],
        { x: 200, y: 30 }
      );

      expect(scene.name).toBe('rebase');
      expect(scene.description).toContain('Rebased 1 commit');
      expect(scene.steps.length).toBeGreaterThan(0);
    });

    it('should preserve commit order', () => {
      const scene = sceneRebase(
        ['c3', 'c4', 'c5'],
        'c1',
        'c2',
        ['c3-new', 'c4-new', 'c5-new'],
        'feature',
        [
          { x: 200, y: 50 },
          { x: 250, y: 50 },
          { x: 300, y: 50 },
        ],
        { x: 300, y: 30 }
      );

      // Verify that new commits appear in order
      const fadeInSteps = scene.steps.filter(
        (s) => s.op === 'fade' && s.to === 1
      );
      const newCommitFades = fadeInSteps.filter((s) =>
        s.sel.nodes?.some((id) => id.includes('new'))
      );

      // Should have 3 fade-ins for new commits
      expect(newCommitFades.length).toBe(3);

      // Check timing order
      const times = newCommitFades.map((s) => s.t);
      expect(times[0]).toBeLessThan(times[1]);
      expect(times[1]).toBeLessThan(times[2]);
    });
  });

  describe('sceneInteractiveRebase', () => {
    it('should create an interactive rebase scene with reduced motion', () => {
      const scene = sceneInteractiveRebase(
        ['c3', 'c4'],
        'c1',
        'c2',
        ['c3-new', 'c4-new'],
        'feature',
        [
          { x: 200, y: 50 },
          { x: 250, y: 50 },
        ],
        { x: 250, y: 30 }
      );

      expect(scene.name).toBe('interactive-rebase');
      expect(scene.description).toContain('Interactively rebased 2 commits');
      expect(scene.steps.length).toBeGreaterThan(0);
    });

    it('should use fast timing for interactive rebase', () => {
      const scene = sceneInteractiveRebase(
        ['c3', 'c4'],
        'c1',
        'c2',
        ['c3-new', 'c4-new'],
        'feature',
        [
          { x: 200, y: 50 },
          { x: 250, y: 50 },
        ],
        { x: 250, y: 30 }
      );

      // Interactive rebase should be relatively fast
      // Most individual operations should be ≤80ms
      const shortDurations = scene.steps.filter(
        (s) => s.dur && s.dur <= 80
      ).length;
      const totalSteps = scene.steps.filter((s) => s.dur && s.dur > 0).length;

      // At least half of the steps with duration should be fast
      expect(shortDurations).toBeGreaterThan(totalSteps / 2);
    });

    it('should show cue overlay', () => {
      const scene = sceneInteractiveRebase(
        ['c3', 'c4'],
        'c1',
        'c2',
        ['c3-new', 'c4-new'],
        'feature',
        [
          { x: 200, y: 50 },
          { x: 250, y: 50 },
        ],
        { x: 250, y: 30 }
      );

      // Should have cue overlay operations
      const cueOps = scene.steps.filter((s) =>
        s.sel.nodes?.includes('rebase-cue-overlay')
      );
      expect(cueOps.length).toBeGreaterThan(0);

      // Should add and remove visible class
      const addOps = cueOps.filter((s) => s.op === 'classAdd');
      const removeOps = cueOps.filter((s) => s.op === 'classRemove');
      expect(addOps.length).toBeGreaterThan(0);
      expect(removeOps.length).toBeGreaterThan(0);
    });

    it('should use outline flashes instead of ghost movement', () => {
      const scene = sceneInteractiveRebase(
        ['c3', 'c4'],
        'c1',
        'c2',
        ['c3-new', 'c4-new'],
        'feature',
        [
          { x: 200, y: 50 },
          { x: 250, y: 50 },
        ],
        { x: 250, y: 30 }
      );

      // Should have outline-flash class operations
      const ops = scene.steps.map((s) => s.op);
      expect(ops).toContain('classAdd');
      expect(ops).toContain('classRemove');

      // Check for outline-flash in class operations
      const classOps = scene.steps.filter(
        (s) => s.op === 'classAdd' || s.op === 'classRemove'
      );
      const hasOutlineFlash = classOps.some((s) =>
        String(s.to).includes('outline-flash')
      );
      expect(hasOutlineFlash).toBe(true);
    });
  });

  describe('sceneCherryPick', () => {
    it('should create a cherry-pick scene', () => {
      const scene = sceneCherryPick(
        'c3',
        'c5',
        'c2',
        'main',
        { x: 200, y: 0 },
        { x: 200, y: -20 }
      );

      expect(scene.name).toBe('cherry-pick');
      expect(scene.description).toContain('Cherry-picked');
      expect(scene.description).toContain('c3'.substring(0, 7));
      expect(scene.steps.length).toBeGreaterThan(0);
    });

    it('should include ghost node animation', () => {
      const scene = sceneCherryPick(
        'c3',
        'c5',
        'c2',
        'main',
        { x: 200, y: 0 },
        { x: 200, y: -20 }
      );

      // Should have ghost class operations
      const ops = scene.steps.map((s) => s.op);
      expect(ops).toContain('classAdd');
      expect(ops).toContain('classRemove');

      // Check for ghost node reference
      const nodeSelectors = scene.steps
        .filter((s) => s.sel.nodes)
        .flatMap((s) => s.sel.nodes || []);

      expect(nodeSelectors.some((id) => id.includes('ghost'))).toBe(true);
    });

    it('should include dashed arc', () => {
      const scene = sceneCherryPick(
        'c3',
        'c5',
        'c2',
        'main',
        { x: 200, y: 0 },
        { x: 200, y: -20 }
      );

      // Should have dashed edge operations
      const edgeSelectors = scene.steps
        .filter((s) => s.sel.edges)
        .flatMap((s) => s.sel.edges || []);

      expect(edgeSelectors.some((id) => id.includes('arc'))).toBe(true);
    });

    it('should highlight source commit first', () => {
      const scene = sceneCherryPick(
        'c3',
        'c5',
        'c2',
        'main',
        { x: 200, y: 0 },
        { x: 200, y: -20 }
      );

      // First node operation should reference source commit
      const firstNodeSteps = scene.steps.filter((s) => s.sel.nodes).slice(0, 3);
      const nodeIds = firstNodeSteps.flatMap((s) => s.sel.nodes || []);

      expect(nodeIds).toContain('c3');
    });

    it('should show conflict badge when hasConflict is true', () => {
      const scene = sceneCherryPick(
        'c3',
        'c5',
        'c2',
        'main',
        { x: 200, y: 0 },
        { x: 200, y: -20 },
        true // hasConflict
      );

      // Should have conflict-badge class operation
      const classOps = scene.steps.filter((s) => s.op === 'classAdd');
      const hasConflictBadge = classOps.some((s) =>
        String(s.to).includes('conflict-badge')
      );
      expect(hasConflictBadge).toBe(true);

      // Description should mention conflict
      expect(scene.description).toContain('conflict');
    });

    it('should not show conflict badge when hasConflict is false', () => {
      const scene = sceneCherryPick(
        'c3',
        'c5',
        'c2',
        'main',
        { x: 200, y: 0 },
        { x: 200, y: -20 },
        false // hasConflict
      );

      // Should not have conflict-badge class operation
      const classOps = scene.steps.filter((s) => s.op === 'classAdd');
      const hasConflictBadge = classOps.some((s) =>
        String(s.to).includes('conflict-badge')
      );
      expect(hasConflictBadge).toBe(false);

      // Description should not mention conflict
      expect(scene.description).not.toContain('conflict');
    });

    it('should move branch label and highlight new commit', () => {
      const scene = sceneCherryPick(
        'c3',
        'c5',
        'c2',
        'main',
        { x: 200, y: 0 },
        { x: 200, y: -20 }
      );

      // Should have label movement
      const labelOps = scene.steps.filter((s) => s.sel.labels);
      expect(labelOps.length).toBeGreaterThan(0);

      // Should have highlight operations
      const pulseOps = scene.steps.filter((s) => s.op === 'pulse');
      expect(pulseOps.length).toBeGreaterThan(0);
    });
  });

  describe('Scene Timing and Composition', () => {
    it('should have positive total duration for all scenes', () => {
      const scenes = [
        sceneRebase(
          ['c3', 'c4'],
          'c1',
          'c2',
          ['c3-new', 'c4-new'],
          'feature',
          [
            { x: 200, y: 50 },
            { x: 250, y: 50 },
          ],
          { x: 250, y: 30 }
        ),
        sceneInteractiveRebase(
          ['c3', 'c4'],
          'c1',
          'c2',
          ['c3-new', 'c4-new'],
          'feature',
          [
            { x: 200, y: 50 },
            { x: 250, y: 50 },
          ],
          { x: 250, y: 30 }
        ),
        sceneCherryPick(
          'c3',
          'c5',
          'c2',
          'main',
          { x: 200, y: 0 },
          { x: 200, y: -20 }
        ),
      ];

      for (const scene of scenes) {
        expect(scene.total).toBeGreaterThan(0);

        // All steps should have non-negative start times
        for (const step of scene.steps) {
          expect(step.t).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should have reasonable total durations', () => {
      const rebaseScene = sceneRebase(
        ['c3', 'c4'],
        'c1',
        'c2',
        ['c3-new', 'c4-new'],
        'feature',
        [
          { x: 200, y: 50 },
          { x: 250, y: 50 },
        ],
        { x: 250, y: 30 }
      );

      const cherryPickScene = sceneCherryPick(
        'c3',
        'c5',
        'c2',
        'main',
        { x: 200, y: 0 },
        { x: 200, y: -20 }
      );

      // Rebase should be longer than cherry-pick (multiple commits)
      expect(rebaseScene.total).toBeGreaterThan(cherryPickScene.total);

      // Should be within reasonable bounds (not too short or too long)
      expect(rebaseScene.total).toBeLessThan(5000); // < 5 seconds
      expect(cherryPickScene.total).toBeLessThan(2000); // < 2 seconds
    });
  });
});

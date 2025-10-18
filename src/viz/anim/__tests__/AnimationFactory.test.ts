/**
 * Unit tests for AnimationFactory
 */

import { describe, it, expect } from 'vitest';
import { AnimationFactory } from '../AnimationFactory';

describe('AnimationFactory', () => {
  describe('commitBirth', () => {
    it('should generate animation steps for commit birth', () => {
      const steps = AnimationFactory.commitBirth('c1', {
        position: { x: 100, y: 200 },
        branchLabel: 'main',
      });

      expect(steps.length).toBeGreaterThan(0);
      
      // Should have fade in step
      const fadeStep = steps.find(s => s.op === 'fade');
      expect(fadeStep).toBeDefined();
      expect(fadeStep?.sel.nodes).toContain('c1');
      
      // Should have pulse step
      const pulseStep = steps.find(s => s.op === 'pulse');
      expect(pulseStep).toBeDefined();
    });

    it('should use provided start time', () => {
      const startTime = 500;
      const steps = AnimationFactory.commitBirth('c1', {
        position: { x: 100, y: 200 },
        startTime,
      });

      const firstStep = steps[0];
      expect(firstStep.t).toBe(startTime);
    });
  });

  describe('branchMove', () => {
    it('should generate animation steps for branch move', () => {
      const steps = AnimationFactory.branchMove('main', {
        oldPosition: { x: 100, y: 100 },
        newPosition: { x: 200, y: 200 },
      });

      expect(steps.length).toBeGreaterThan(0);
      
      // Should have move step
      const moveStep = steps.find(s => s.op === 'move');
      expect(moveStep).toBeDefined();
      expect(moveStep?.sel.labels).toContain('main');
    });
  });

  describe('merge', () => {
    it('should generate animation steps for merge', () => {
      const steps = AnimationFactory.merge({
        mergeCommitId: 'c4',
        parent1Id: 'c2',
        parent2Id: 'c3',
        position: { x: 100, y: 200 },
        branchLabel: 'main',
      });

      expect(steps.length).toBeGreaterThan(0);
      
      // Should highlight both parents
      const highlightSteps = steps.filter(s => 
        s.sel.nodes?.includes('c2') || s.sel.nodes?.includes('c3')
      );
      expect(highlightSteps.length).toBeGreaterThan(0);
    });

    it('should create dashed edge for merge arc', () => {
      const steps = AnimationFactory.merge({
        mergeCommitId: 'c4',
        parent1Id: 'c2',
        parent2Id: 'c3',
        position: { x: 100, y: 200 },
      });

      // Should have temporary dashed edge
      const dashedEdgeSteps = steps.filter(s => 
        s.sel.edges?.some(e => e.includes('merge-arc'))
      );
      expect(dashedEdgeSteps.length).toBeGreaterThan(0);
    });
  });

  describe('rebase', () => {
    it('should generate animation steps for rebase', () => {
      const steps = AnimationFactory.rebase({
        oldCommits: ['c4', 'c5'],
        newCommits: ['c6', 'c7'],
        oldPositions: [
          { x: 100, y: 100 },
          { x: 100, y: 200 },
        ],
        newPositions: [
          { x: 200, y: 100 },
          { x: 200, y: 200 },
        ],
        branchLabel: 'feature',
        labelPosition: { x: 200, y: 250 },
      });

      expect(steps.length).toBeGreaterThan(0);
      
      // Should have ghost nodes
      const ghostSteps = steps.filter(s => 
        s.sel.nodes?.some(n => n.includes('ghost'))
      );
      expect(ghostSteps.length).toBeGreaterThan(0);
      
      // Should have dashed arcs
      const arcSteps = steps.filter(s => 
        s.sel.edges?.some(e => e.includes('rebase-arc'))
      );
      expect(arcSteps.length).toBeGreaterThan(0);
    });

    it('should throw if array lengths do not match', () => {
      expect(() => {
        AnimationFactory.rebase({
          oldCommits: ['c4'],
          newCommits: ['c6', 'c7'], // Mismatch
          oldPositions: [{ x: 100, y: 100 }],
          newPositions: [
            { x: 200, y: 100 },
            { x: 200, y: 200 },
          ],
        });
      }).toThrow('oldCommits and newCommits must have the same length');
    });

    it('should animate commits sequentially', () => {
      const steps = AnimationFactory.rebase({
        oldCommits: ['c4', 'c5'],
        newCommits: ['c6', 'c7'],
        oldPositions: [
          { x: 100, y: 100 },
          { x: 100, y: 200 },
        ],
        newPositions: [
          { x: 200, y: 100 },
          { x: 200, y: 200 },
        ],
      });

      // Steps for second commit should start after first commit
      const firstCommitSteps = steps.filter(s => 
        s.sel.nodes?.includes('c6') || s.sel.nodes?.includes('c4-ghost')
      );
      const secondCommitSteps = steps.filter(s => 
        s.sel.nodes?.includes('c7') || s.sel.nodes?.includes('c5-ghost')
      );

      if (firstCommitSteps.length > 0 && secondCommitSteps.length > 0) {
        const firstStartTime = Math.min(...firstCommitSteps.map(s => s.t));
        const secondStartTime = Math.min(...secondCommitSteps.map(s => s.t));
        expect(secondStartTime).toBeGreaterThan(firstStartTime);
      }
    });
  });

  describe('reset', () => {
    it('should generate animation steps for soft reset', () => {
      const steps = AnimationFactory.reset({
        affectedCommits: ['c2', 'c3'],
        oldPosition: { x: 200, y: 200 },
        newPosition: { x: 100, y: 100 },
        branchLabel: 'main',
        mode: 'soft',
      });

      expect(steps.length).toBeGreaterThan(0);
      
      // Should dim affected commits (fade to 0.4)
      const fadeSteps = steps.filter(s => 
        s.op === 'fade' && 
        (s.sel.nodes?.includes('c2') || s.sel.nodes?.includes('c3'))
      );
      expect(fadeSteps.length).toBeGreaterThan(0);
    });

    it('should generate animation steps for hard reset', () => {
      const steps = AnimationFactory.reset({
        affectedCommits: ['c2', 'c3'],
        oldPosition: { x: 200, y: 200 },
        newPosition: { x: 100, y: 100 },
        branchLabel: 'main',
        mode: 'hard',
      });

      expect(steps.length).toBeGreaterThan(0);
      
      // Should fade out affected commits completely
      const fadeSteps = steps.filter(s => 
        s.op === 'fade' &&
        (s.sel.nodes?.includes('c2') || s.sel.nodes?.includes('c3'))
      );
      expect(fadeSteps.length).toBeGreaterThan(0);
    });

    it('should move branch label', () => {
      const steps = AnimationFactory.reset({
        affectedCommits: ['c2'],
        oldPosition: { x: 200, y: 200 },
        newPosition: { x: 100, y: 100 },
        branchLabel: 'main',
        mode: 'soft',
      });

      // Should have move step for branch label
      const moveSteps = steps.filter(s => 
        s.sel.labels?.includes('main')
      );
      expect(moveSteps.length).toBeGreaterThan(0);
    });
  });

  describe('revert', () => {
    it('should generate animation steps for revert', () => {
      const steps = AnimationFactory.revert({
        revertedCommitId: 'c2',
        revertCommitId: 'c3',
        position: { x: 100, y: 200 },
        branchLabel: 'main',
      });

      expect(steps.length).toBeGreaterThan(0);
      
      // Should highlight reverted commit
      const highlightSteps = steps.filter(s => 
        s.sel.nodes?.includes('c2')
      );
      expect(highlightSteps.length).toBeGreaterThan(0);
      
      // Should add revert-commit class
      const classSteps = steps.filter(s => 
        s.op === 'classAdd' && s.to === 'revert-commit'
      );
      expect(classSteps.length).toBeGreaterThan(0);
    });

    it('should create dashed arc for revert', () => {
      const steps = AnimationFactory.revert({
        revertedCommitId: 'c2',
        revertCommitId: 'c3',
        position: { x: 100, y: 200 },
      });

      // Should have temporary dashed edge
      const arcSteps = steps.filter(s => 
        s.sel.edges?.some(e => e.includes('revert-arc'))
      );
      expect(arcSteps.length).toBeGreaterThan(0);
    });
  });

  describe('computeArcPath', () => {
    it('should compute SVG path for arc', () => {
      const path = AnimationFactory.computeArcPath(
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      );

      expect(path).toContain('M');
      expect(path).toContain('Q');
      expect(path).toMatch(/M \d+,\d+ Q [\d.]+,[\d.]+ \d+,\d+/);
    });

    it('should accept custom curvature', () => {
      const path1 = AnimationFactory.computeArcPath(
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        0.3
      );
      const path2 = AnimationFactory.computeArcPath(
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        0.5
      );

      expect(path1).not.toBe(path2);
    });
  });

  describe('arcPathAnimation', () => {
    it('should generate steps for arc path animation', () => {
      const path = AnimationFactory.computeArcPath(
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      );
      
      const steps = AnimationFactory.arcPathAnimation('c1', path);

      expect(steps.length).toBeGreaterThan(0);
      
      // Should have path fade in/out
      const fadeSteps = steps.filter(s => s.op === 'fade');
      expect(fadeSteps.length).toBeGreaterThanOrEqual(2);
    });

    it('should use provided duration', () => {
      const path = 'M 0,0 Q 50,50 100,100';
      const duration = 1000;
      
      const steps = AnimationFactory.arcPathAnimation('c1', path, { duration });

      const lastStep = steps[steps.length - 1];
      expect(lastStep.t).toBeGreaterThanOrEqual(duration);
    });
  });
});

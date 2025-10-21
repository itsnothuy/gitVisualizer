/**
 * Tests for AdvancedGitOperations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AdvancedGitOperations,
  InteractiveRebaseSession,
  type CherryPickOptions,
  type MergeStrategy,
} from '../AdvancedOperations';
import type { GitState } from '@/cli/types';

// Helper to create a basic Git state
function createBasicState(): GitState {
  const commits = new Map([
    [
      'commit1',
      {
        id: 'commit1',
        parents: [],
        message: 'Initial commit',
        timestamp: Date.now() - 3000,
      },
    ],
    [
      'commit2',
      {
        id: 'commit2',
        parents: ['commit1'],
        message: 'Second commit',
        timestamp: Date.now() - 2000,
      },
    ],
    [
      'commit3',
      {
        id: 'commit3',
        parents: ['commit2'],
        message: 'Third commit',
        timestamp: Date.now() - 1000,
      },
    ],
  ]);

  return {
    commits,
    branches: new Map([
      ['main', { name: 'main', target: 'commit3' }],
      ['feature', { name: 'feature', target: 'commit2' }],
    ]),
    tags: new Map(),
    head: { type: 'branch', name: 'main' },
  };
}

describe('InteractiveRebaseSession', () => {
  let session: InteractiveRebaseSession;

  beforeEach(() => {
    session = new InteractiveRebaseSession(
      'session-1',
      'commit1',
      ['commit2', 'commit3']
    );
  });

  it('should initialize with correct properties', () => {
    expect(session.id).toBe('session-1');
    expect(session.baseCommit).toBe('commit1');
    expect(session.commits).toEqual(['commit2', 'commit3']);
    expect(session.state).toBe('planning');
  });

  it('should allow setting a plan', () => {
    const plan = {
      baseCommit: 'commit1',
      steps: [
        { action: 'pick' as const, commit: 'commit2', order: 0 },
        { action: 'squash' as const, commit: 'commit3', order: 1 },
      ],
      originalCommits: ['commit2', 'commit3'],
    };

    session.setPlan(plan);

    expect(session.plan).toEqual(plan);
  });

  it('should start in planning state and move to in-progress', () => {
    expect(session.state).toBe('planning');

    session.start();

    expect(session.state).toBe('in-progress');
  });

  it('should allow pausing and resuming', () => {
    session.start();

    session.pause();
    expect(session.state).toBe('paused');

    session.resume();
    expect(session.state).toBe('in-progress');
  });

  it('should not pause when not in progress', () => {
    expect(session.state).toBe('planning');

    session.pause();

    expect(session.state).toBe('planning');
  });

  it('should allow aborting', async () => {
    session.start();

    await session.abort();

    expect(session.state).toBe('aborted');
  });

  it('should continue through steps', async () => {
    const plan = {
      baseCommit: 'commit1',
      steps: [
        { action: 'pick' as const, commit: 'commit2', order: 0 },
        { action: 'squash' as const, commit: 'commit3', order: 1 },
      ],
      originalCommits: ['commit2', 'commit3'],
    };

    session.setPlan(plan);
    session.start();

    const result1 = await session.continue();
    expect(result1).not.toBeNull();
    expect(result1?.step.action).toBe('pick');
    expect(session.currentStep).toBe(1);

    const result2 = await session.continue();
    expect(result2).not.toBeNull();
    expect(result2?.step.action).toBe('squash');
    expect(session.currentStep).toBe(2);

    const result3 = await session.continue();
    expect(result3).toBeNull();
    expect(session.state).toBe('completed');
  });

  it('should allow reordering steps', () => {
    const plan = {
      baseCommit: 'commit1',
      steps: [
        { action: 'pick' as const, commit: 'commit2', order: 0 },
        { action: 'squash' as const, commit: 'commit3', order: 1 },
        { action: 'edit' as const, commit: 'commit4', order: 2 },
      ],
      originalCommits: ['commit2', 'commit3', 'commit4'],
    };

    session.setPlan(plan);
    session.reorderSteps([2, 0, 1]); // Move edit to front

    expect(session.plan.steps[0]?.action).toBe('edit');
    expect(session.plan.steps[1]?.action).toBe('pick');
    expect(session.plan.steps[2]?.action).toBe('squash');
  });

  it('should allow changing step action', () => {
    const plan = {
      baseCommit: 'commit1',
      steps: [{ action: 'pick' as const, commit: 'commit2', order: 0 }],
      originalCommits: ['commit2'],
    };

    session.setPlan(plan);
    session.changeStepAction(0, 'squash');

    expect(session.plan.steps[0]?.action).toBe('squash');
  });

  it('should allow adding steps', () => {
    const plan = {
      baseCommit: 'commit1',
      steps: [{ action: 'pick' as const, commit: 'commit2', order: 0 }],
      originalCommits: ['commit2'],
    };

    session.setPlan(plan);
    session.addStep({ action: 'edit', commit: 'commit3', order: 1 });

    expect(session.plan.steps.length).toBe(2);
    expect(session.plan.steps[1]?.action).toBe('edit');
  });

  it('should allow removing steps', () => {
    const plan = {
      baseCommit: 'commit1',
      steps: [
        { action: 'pick' as const, commit: 'commit2', order: 0 },
        { action: 'squash' as const, commit: 'commit3', order: 1 },
      ],
      originalCommits: ['commit2', 'commit3'],
    };

    session.setPlan(plan);
    session.removeStep(0);

    expect(session.plan.steps.length).toBe(1);
    expect(session.plan.steps[0]?.action).toBe('squash');
    expect(session.plan.steps[0]?.order).toBe(0); // Order should be recalculated
  });
});

describe('AdvancedGitOperations', () => {
  let state: GitState;
  let operations: AdvancedGitOperations;

  beforeEach(() => {
    state = createBasicState();
    operations = new AdvancedGitOperations(state);
  });

  describe('startInteractiveRebase', () => {
    it('should create an interactive rebase session', async () => {
      const session = await operations.startInteractiveRebase('commit1', [
        'commit2',
        'commit3',
      ]);

      expect(session).toBeInstanceOf(InteractiveRebaseSession);
      expect(session.baseCommit).toBe('commit1');
      expect(session.commits).toEqual(['commit2', 'commit3']);
    });

    it('should create a default plan with pick actions', async () => {
      const session = await operations.startInteractiveRebase('commit1', [
        'commit2',
        'commit3',
      ]);

      expect(session.plan.steps.length).toBe(2);
      expect(session.plan.steps[0]?.action).toBe('pick');
      expect(session.plan.steps[1]?.action).toBe('pick');
    });
  });

  describe('executeRebaseStep', () => {
    it('should execute pick step', async () => {
      const session = await operations.startInteractiveRebase('commit1', [
        'commit2',
      ]);
      const step = session.plan.steps[0];

      if (step) {
        const result = await operations.executeRebaseStep(session, step);

        expect(result.success).toBe(true);
        expect(result.newCommit).toBe('commit2');
      }
    });

    it('should execute edit step', async () => {
      const session = await operations.startInteractiveRebase('commit1', [
        'commit2',
      ]);
      session.changeStepAction(0, 'edit');
      const step = session.plan.steps[0];

      if (step) {
        const result = await operations.executeRebaseStep(session, step);

        expect(result.success).toBe(true);
        expect(result.message).toContain('editing');
      }
    });

    it('should execute squash step', async () => {
      const session = await operations.startInteractiveRebase('commit1', [
        'commit2',
      ]);
      session.changeStepAction(0, 'squash');
      const step = session.plan.steps[0];

      if (step) {
        const result = await operations.executeRebaseStep(session, step);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Squashed');
      }
    });

    it('should execute drop step', async () => {
      const session = await operations.startInteractiveRebase('commit1', [
        'commit2',
      ]);
      session.changeStepAction(0, 'drop');
      const step = session.plan.steps[0];

      if (step) {
        const result = await operations.executeRebaseStep(session, step);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Dropped');
      }
    });
  });

  describe('cherryPick', () => {
    it('should cherry-pick commits successfully', async () => {
      const result = await operations.cherryPick(
        ['commit2'],
        'feature',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.appliedCommits.length).toBeGreaterThan(0);
    });

    it('should skip missing commits', async () => {
      const result = await operations.cherryPick(
        ['nonexistent'],
        'feature',
        {}
      );

      expect(result.skippedCommits.length).toBe(1);
      expect(result.skippedCommits[0]?.reason).toContain('not found');
    });

    it('should handle multiple commits', async () => {
      const result = await operations.cherryPick(
        ['commit2', 'commit3'],
        'feature',
        {}
      );

      expect(result.appliedCommits.length).toBe(2);
    });

    it('should respect options', async () => {
      const options: CherryPickOptions = {
        keepMessage: true,
        allowEmpty: true,
      };

      const result = await operations.cherryPick(
        ['commit2'],
        'feature',
        options
      );

      expect(result.success).toBe(true);
    });
  });

  describe('mergeWithStrategy', () => {
    it('should perform fast-forward merge when possible', async () => {
      // Add a branch that can be fast-forwarded
      state.branches.set('feature2', { name: 'feature2', target: 'commit1' });

      const strategy: MergeStrategy = {
        type: 'fast-forward',
      };

      const result = await operations.mergeWithStrategy(
        'main',
        'feature2',
        strategy
      );

      expect(result.success).toBe(true);
      expect(result.fastForward).toBe(true);
    });

    it('should perform three-way merge', async () => {
      const strategy: MergeStrategy = {
        type: 'three-way',
      };

      const result = await operations.mergeWithStrategy(
        'feature',
        'main',
        strategy
      );

      expect(result.success).toBe(true);
      expect(result.mergeCommit).toBeTruthy();
    });

    it('should perform octopus merge', async () => {
      const strategy: MergeStrategy = {
        type: 'octopus',
      };

      const result = await operations.mergeWithStrategy(
        'feature',
        'main',
        strategy
      );

      expect(result.success).toBe(true);
    });

    it('should perform ours merge', async () => {
      const strategy: MergeStrategy = {
        type: 'ours',
      };

      const result = await operations.mergeWithStrategy(
        'feature',
        'main',
        strategy
      );

      expect(result.success).toBe(true);
    });

    it('should perform subtree merge', async () => {
      const strategy: MergeStrategy = {
        type: 'subtree',
        options: {
          subtreePath: 'subdir',
        },
      };

      const result = await operations.mergeWithStrategy(
        'feature',
        'main',
        strategy
      );

      expect(result.success).toBe(true);
    });

    it('should handle missing branches', async () => {
      const strategy: MergeStrategy = {
        type: 'fast-forward',
      };

      const result = await operations.mergeWithStrategy(
        'nonexistent',
        'main',
        strategy
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });
});

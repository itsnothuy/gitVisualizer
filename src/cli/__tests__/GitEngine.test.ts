/**
 * Unit tests for GitEngine
 * Tests in-memory Git operations and state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GitEngine } from '../GitEngine';
import type { GitState, ParsedCommand } from '../types';

describe('GitEngine', () => {
  let initialState: GitState;

  beforeEach(() => {
    initialState = GitEngine.createInitialState();
  });

  describe('createInitialState', () => {
    it('should create initial state with one commit and main branch', () => {
      expect(initialState.commits.size).toBe(1);
      expect(initialState.branches.size).toBe(1);
      expect(initialState.branches.has('main')).toBe(true);
      expect(initialState.head).toEqual({ type: 'branch', name: 'main' });
    });
  });

  describe('commit', () => {
    it('should create a new commit', () => {
      const command: ParsedCommand = {
        name: 'commit',
        args: [],
        options: { m: 'Test commit' },
      };

      const result = GitEngine.commit(initialState, command);
      expect(result.success).toBe(true);
      expect(result.newState!.commits.size).toBe(2);
    });

    it('should move branch pointer to new commit', () => {
      const command: ParsedCommand = {
        name: 'commit',
        args: [],
        options: { m: 'Test commit' },
      };

      const result = GitEngine.commit(initialState, command);
      const mainBranch = result.newState!.branches.get('main');
      const commits = Array.from(result.newState!.commits.values());
      const newCommit = commits[commits.length - 1];

      expect(mainBranch!.target).toBe(newCommit.id);
    });

    it('should amend previous commit', () => {
      const command: ParsedCommand = {
        name: 'commit',
        args: [],
        options: { amend: true, m: 'Amended message' },
      };

      const result = GitEngine.commit(initialState, command);
      expect(result.success).toBe(true);
      expect(result.newState!.commits.size).toBe(1); // Still one commit
      
      const commit = Array.from(result.newState!.commits.values())[0];
      expect(commit.message).toBe('Amended message');
    });

    it('should set parent correctly', () => {
      const command: ParsedCommand = {
        name: 'commit',
        args: [],
        options: { m: 'Second commit' },
      };

      const result = GitEngine.commit(initialState, command);
      const commits = Array.from(result.newState!.commits.values());
      const newCommit = commits[commits.length - 1];
      const initialCommit = commits[0];

      expect(newCommit.parents).toEqual([initialCommit.id]);
    });
  });

  describe('branch', () => {
    it('should list branches', () => {
      const command: ParsedCommand = {
        name: 'branch',
        args: [],
        options: {},
      };

      const result = GitEngine.branch(initialState, command);
      expect(result.success).toBe(true);
      expect(result.message).toContain('main');
      expect(result.message).toContain('*');
    });

    it('should create a new branch', () => {
      const command: ParsedCommand = {
        name: 'branch',
        args: ['feature'],
        options: {},
      };

      const result = GitEngine.branch(initialState, command);
      expect(result.success).toBe(true);
      expect(result.newState!.branches.has('feature')).toBe(true);
    });

    it('should not create duplicate branch', () => {
      const command: ParsedCommand = {
        name: 'branch',
        args: ['main'],
        options: {},
      };

      const result = GitEngine.branch(initialState, command);
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should delete branch', () => {
      // First create a branch
      const createCmd: ParsedCommand = {
        name: 'branch',
        args: ['feature'],
        options: {},
      };
      const state1 = GitEngine.branch(initialState, createCmd).newState!;

      // Then delete it
      const deleteCmd: ParsedCommand = {
        name: 'branch',
        args: ['feature'],
        options: { d: true },
      };
      const result = GitEngine.branch(state1, deleteCmd);

      expect(result.success).toBe(true);
      expect(result.newState!.branches.has('feature')).toBe(false);
    });

    it('should not delete current branch', () => {
      const command: ParsedCommand = {
        name: 'branch',
        args: ['main'],
        options: { d: true },
      };

      const result = GitEngine.branch(initialState, command);
      expect(result.success).toBe(false);
      expect(result.error).toContain('checked out');
    });
  });

  describe('checkout', () => {
    it('should checkout existing branch', () => {
      // Create a feature branch first
      const createCmd: ParsedCommand = {
        name: 'branch',
        args: ['feature'],
        options: {},
      };
      const state1 = GitEngine.branch(initialState, createCmd).newState!;

      // Checkout feature
      const checkoutCmd: ParsedCommand = {
        name: 'checkout',
        args: ['feature'],
        options: {},
      };
      const result = GitEngine.checkout(state1, checkoutCmd);

      expect(result.success).toBe(true);
      expect(result.newState!.head).toEqual({ type: 'branch', name: 'feature' });
    });

    it('should checkout and create new branch with -b', () => {
      const command: ParsedCommand = {
        name: 'checkout',
        args: ['feature'],
        options: { b: true },
      };

      const result = GitEngine.checkout(initialState, command);
      expect(result.success).toBe(true);
      expect(result.newState!.branches.has('feature')).toBe(true);
      expect(result.newState!.head).toEqual({ type: 'branch', name: 'feature' });
    });

    it('should not create duplicate branch with -b', () => {
      const command: ParsedCommand = {
        name: 'checkout',
        args: ['main'],
        options: { b: true },
      };

      const result = GitEngine.checkout(initialState, command);
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should force create branch with -B', () => {
      const command: ParsedCommand = {
        name: 'checkout',
        args: ['main'],
        options: { B: true },
      };

      const result = GitEngine.checkout(initialState, command);
      expect(result.success).toBe(true);
    });

    it('should checkout detached HEAD by commit SHA', () => {
      const commitId = Array.from(initialState.commits.keys())[0];
      const command: ParsedCommand = {
        name: 'checkout',
        args: [commitId],
        options: {},
      };

      const result = GitEngine.checkout(initialState, command);
      expect(result.success).toBe(true);
      expect(result.newState!.head).toEqual({ type: 'detached', commit: commitId });
    });
  });

  describe('switch', () => {
    it('should switch to existing branch', () => {
      // Create feature branch
      const createCmd: ParsedCommand = {
        name: 'branch',
        args: ['feature'],
        options: {},
      };
      const state1 = GitEngine.branch(initialState, createCmd).newState!;

      // Switch to feature
      const switchCmd: ParsedCommand = {
        name: 'switch',
        args: ['feature'],
        options: {},
      };
      const result = GitEngine.switch(state1, switchCmd);

      expect(result.success).toBe(true);
      expect(result.newState!.head).toEqual({ type: 'branch', name: 'feature' });
    });

    it('should create and switch with -c', () => {
      const command: ParsedCommand = {
        name: 'switch',
        args: ['feature'],
        options: { c: true },
      };

      const result = GitEngine.switch(initialState, command);
      expect(result.success).toBe(true);
      expect(result.newState!.branches.has('feature')).toBe(true);
      expect(result.newState!.head).toEqual({ type: 'branch', name: 'feature' });
    });

    it('should reject switching to non-existent branch', () => {
      const command: ParsedCommand = {
        name: 'switch',
        args: ['nonexistent'],
        options: {},
      };

      const result = GitEngine.switch(initialState, command);
      expect(result.success).toBe(false);
    });
  });

  describe('merge', () => {
    it('should fast-forward merge', () => {
      // Create feature branch
      const createCmd: ParsedCommand = {
        name: 'branch',
        args: ['feature'],
        options: {},
      };
      let state = GitEngine.branch(initialState, createCmd).newState!;

      // Checkout feature
      const checkoutCmd: ParsedCommand = {
        name: 'checkout',
        args: ['feature'],
        options: {},
      };
      state = GitEngine.checkout(state, checkoutCmd).newState!;

      // Make a commit on feature
      const commitCmd: ParsedCommand = {
        name: 'commit',
        args: [],
        options: { m: 'Feature commit' },
      };
      state = GitEngine.commit(state, commitCmd).newState!;

      // Checkout main
      const checkoutMainCmd: ParsedCommand = {
        name: 'checkout',
        args: ['main'],
        options: {},
      };
      state = GitEngine.checkout(state, checkoutMainCmd).newState!;

      // Merge feature into main
      const mergeCmd: ParsedCommand = {
        name: 'merge',
        args: ['feature'],
        options: {},
      };
      const result = GitEngine.merge(state, mergeCmd);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Fast-forward');
    });

    it('should create merge commit with --no-ff', () => {
      // Setup similar to fast-forward test
      let state = initialState;
      
      const createCmd: ParsedCommand = {
        name: 'branch',
        args: ['feature'],
        options: {},
      };
      state = GitEngine.branch(state, createCmd).newState!;

      const checkoutCmd: ParsedCommand = {
        name: 'checkout',
        args: ['feature'],
        options: {},
      };
      state = GitEngine.checkout(state, checkoutCmd).newState!;

      const commitCmd: ParsedCommand = {
        name: 'commit',
        args: [],
        options: { m: 'Feature commit' },
      };
      state = GitEngine.commit(state, commitCmd).newState!;

      const checkoutMainCmd: ParsedCommand = {
        name: 'checkout',
        args: ['main'],
        options: {},
      };
      state = GitEngine.checkout(state, checkoutMainCmd).newState!;

      // Merge with --no-ff
      const mergeCmd: ParsedCommand = {
        name: 'merge',
        args: ['feature'],
        options: { 'no-ff': true },
      };
      const result = GitEngine.merge(state, mergeCmd);

      expect(result.success).toBe(true);
      
      // Check that a merge commit was created (has 2 parents)
      const mainBranch = result.newState!.branches.get('main');
      const mergeCommit = result.newState!.commits.get(mainBranch!.target);
      expect(mergeCommit!.parents.length).toBe(2);
    });
  });

  describe('reset', () => {
    it('should reset to previous commit', () => {
      // Make a second commit
      const commitCmd: ParsedCommand = {
        name: 'commit',
        args: [],
        options: { m: 'Second commit' },
      };
      const state = GitEngine.commit(initialState, commitCmd).newState!;

      // Reset to HEAD~1
      const resetCmd: ParsedCommand = {
        name: 'reset',
        args: ['HEAD~1'],
        options: {},
      };
      const result = GitEngine.reset(state, resetCmd);

      expect(result.success).toBe(true);
      
      // Branch should point to initial commit again
      const mainBranch = result.newState!.branches.get('main');
      const initialCommitId = Array.from(initialState.commits.keys())[0];
      expect(mainBranch!.target).toBe(initialCommitId);
    });

    it('should support hard reset', () => {
      const commitCmd: ParsedCommand = {
        name: 'commit',
        args: [],
        options: { m: 'Second commit' },
      };
      const state = GitEngine.commit(initialState, commitCmd).newState!;

      const resetCmd: ParsedCommand = {
        name: 'reset',
        args: ['HEAD~1'],
        options: { hard: true },
      };
      const result = GitEngine.reset(state, resetCmd);

      expect(result.success).toBe(true);
      expect(result.message).toContain('hard reset');
    });
  });

  describe('revert', () => {
    it('should create revert commit', () => {
      // Make a second commit
      const commitCmd: ParsedCommand = {
        name: 'commit',
        args: [],
        options: { m: 'Bad commit' },
      };
      const state = GitEngine.commit(initialState, commitCmd).newState!;
      
      const commits = Array.from(state.commits.keys());
      const lastCommit = commits[commits.length - 1];

      // Revert the commit
      const revertCmd: ParsedCommand = {
        name: 'revert',
        args: [lastCommit],
        options: {},
      };
      const result = GitEngine.revert(state, revertCmd);

      expect(result.success).toBe(true);
      expect(result.newState!.commits.size).toBe(3); // initial + bad + revert
    });
  });

  describe('tag', () => {
    it('should list tags when no args', () => {
      const command: ParsedCommand = {
        name: 'tag',
        args: [],
        options: {},
      };

      const result = GitEngine.tag(initialState, command);
      expect(result.success).toBe(true);
      expect(result.message).toContain('No tags');
    });

    it('should create a tag', () => {
      const command: ParsedCommand = {
        name: 'tag',
        args: ['v1.0.0'],
        options: {},
      };

      const result = GitEngine.tag(initialState, command);
      expect(result.success).toBe(true);
      expect(result.newState!.tags.has('v1.0.0')).toBe(true);
    });

    it('should not create duplicate tag', () => {
      const command: ParsedCommand = {
        name: 'tag',
        args: ['v1.0.0'],
        options: {},
      };

      const state = GitEngine.tag(initialState, command).newState!;
      const result = GitEngine.tag(state, command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('status', () => {
    it('should show current branch', () => {
      const result = GitEngine.status(initialState);
      expect(result.success).toBe(true);
      expect(result.message).toContain('On branch main');
    });

    it('should show detached HEAD', () => {
      const commitId = Array.from(initialState.commits.keys())[0];
      const checkoutCmd: ParsedCommand = {
        name: 'checkout',
        args: [commitId],
        options: {},
      };
      const state = GitEngine.checkout(initialState, checkoutCmd).newState!;

      const result = GitEngine.status(state);
      expect(result.success).toBe(true);
      expect(result.message).toContain('HEAD detached');
    });
  });

  describe('log', () => {
    it('should show commit history', () => {
      const result = GitEngine.log(initialState, {
        name: 'log',
        args: [],
        options: {},
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('commit');
      expect(result.message).toContain('Initial commit');
    });

    it('should show history from specific commit', () => {
      // Make a few commits
      let state = initialState;
      for (let i = 0; i < 3; i++) {
        const commitCmd: ParsedCommand = {
          name: 'commit',
          args: [],
          options: { m: `Commit ${i + 1}` },
        };
        state = GitEngine.commit(state, commitCmd).newState!;
      }

      const result = GitEngine.log(state, {
        name: 'log',
        args: ['HEAD~1'],
        options: {},
      });

      expect(result.success).toBe(true);
      expect(result.message).not.toContain('Commit 3');
    });
  });
});

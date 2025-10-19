/**
 * Tests for GitEngine rebase operations
 */

import { describe, it, expect } from 'vitest';
import { GitEngine } from '../GitEngine';
import type { GitState, ParsedCommand } from '../types';

describe('GitEngine - Interactive Rebase', () => {
  function createTestState(): GitState {
    const state = GitEngine.createInitialState();
    
    // Create a few commits
    let result = GitEngine.commit(state, {
      name: 'commit',
      args: [],
      options: { m: 'Second commit' },
    });
    if (!result.success) throw new Error('Failed to create commit');
    
    result = GitEngine.commit(result.newState, {
      name: 'commit',
      args: [],
      options: { m: 'Third commit' },
    });
    if (!result.success) throw new Error('Failed to create commit');
    
    result = GitEngine.commit(result.newState, {
      name: 'commit',
      args: [],
      options: { m: 'Fourth commit' },
    });
    if (!result.success) throw new Error('Failed to create commit');
    
    return result.newState;
  }

  it('should start interactive rebase', () => {
    const state = createTestState();
    const commits = Array.from(state.commits.values());
    const firstCommit = commits[0];

    const command: ParsedCommand = {
      name: 'rebase',
      args: [firstCommit.id],
      options: { i: true },
    };

    const result = GitEngine.rebaseInteractive(state, command);
    
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.newState.rebaseState).toBeDefined();
    expect(result.newState.rebaseState?.todos.length).toBe(3);
    expect(result.newState.rebaseState?.operation).toBe('rebase-interactive');
  });

  it('should create todos with correct order', () => {
    const state = createTestState();
    const commits = Array.from(state.commits.values());
    const firstCommit = commits[0];

    const command: ParsedCommand = {
      name: 'rebase',
      args: [firstCommit.id],
      options: { i: true },
    };

    const result = GitEngine.rebaseInteractive(state, command);
    
    expect(result.success).toBe(true);
    if (!result.success) return;
    const todos = result.newState.rebaseState?.todos || [];
    
    todos.forEach((todo, index) => {
      expect(todo.order).toBe(index);
      expect(todo.operation).toBe('pick');
    });
  });

  it('should execute rebase with pick operations', () => {
    const state = createTestState();
    const commits = Array.from(state.commits.values());
    const firstCommit = commits[0];

    // Start rebase
    let result = GitEngine.rebaseInteractive(state, {
      name: 'rebase',
      args: [firstCommit.id],
      options: { i: true },
    });
    
    expect(result.success).toBe(true);
    if (!result.success) return;

    // Execute rebase
    result = GitEngine.executeRebase(result.newState);
    
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.newState.rebaseState).toBeUndefined();
    expect(result.newState.commits.size).toBeGreaterThan(state.commits.size);
  });

  it('should handle drop operation', () => {
    const state = createTestState();
    const commits = Array.from(state.commits.values());
    const firstCommit = commits[0];

    // Start rebase
    const rebaseResult = GitEngine.rebaseInteractive(state, {
      name: 'rebase',
      args: [firstCommit.id],
      options: { i: true },
    });
    
    expect(rebaseResult.success).toBe(true);
    if (!rebaseResult.success) return;

    // Modify todos to drop second commit
    const stateWithDroppedCommit = {
      ...rebaseResult.newState,
      rebaseState: {
        ...rebaseResult.newState.rebaseState!,
        todos: rebaseResult.newState.rebaseState!.todos.map((todo, i) =>
          i === 1 ? { ...todo, operation: 'drop' as const } : todo
        ),
      },
    };

    // Execute rebase
    const result = GitEngine.executeRebase(stateWithDroppedCommit);
    
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.message).toContain('2 commits applied');
  });

  it('should abort rebase and restore original state', () => {
    const state = createTestState();
    const commits = Array.from(state.commits.values());
    const firstCommit = commits[0];
    const originalHead = Array.from(state.branches.get('main')?.target || '');

    // Start rebase
    const rebaseResult = GitEngine.rebaseInteractive(state, {
      name: 'rebase',
      args: [firstCommit.id],
      options: { i: true },
    });
    
    expect(rebaseResult.success).toBe(true);
    if (!rebaseResult.success) return;

    // Abort rebase
    const result = GitEngine.abortRebase(rebaseResult.newState);
    
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.newState.rebaseState).toBeUndefined();
    expect(result.newState.branches.get('main')?.target).toBe(originalHead.join(''));
  });

  it('should fail to abort when no rebase in progress', () => {
    const state = createTestState();
    
    const result = GitEngine.abortRebase(state);
    
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain('No rebase in progress');
  });
});

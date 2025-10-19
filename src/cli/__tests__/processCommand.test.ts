/**
 * Unit tests for command pipeline
 * Tests command processing, undo/redo, and integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  processCommand,
  createCommandHistory,
  type CommandExecutionContext,
} from '../processCommand';
import { GitEngine } from '../GitEngine';

describe('processCommand', () => {
  let context: CommandExecutionContext;

  beforeEach(() => {
    context = {
      state: GitEngine.createInitialState(),
      history: createCommandHistory(),
      sandboxMode: true,
    };
  });

  describe('command execution', () => {
    it('should execute commit command', () => {
      const result = processCommand('commit -m "Test"', context);
      expect(result.success).toBe(true);
      expect(result.newState).toBeDefined();
      expect(result.newState!.commits.size).toBe(2);
    });

    it('should execute branch command', () => {
      const result = processCommand('branch feature', context);
      expect(result.success).toBe(true);
      expect(result.newState!.branches.has('feature')).toBe(true);
    });

    it('should execute checkout command', () => {
      const branchResult = processCommand('branch feature', context);
      context.state = branchResult.newState!;
      
      const result = processCommand('checkout feature', context);
      expect(result.success).toBe(true);
      expect(result.newState!.head).toEqual({ type: 'branch', name: 'feature' });
    });

    it('should handle parse errors', () => {
      const result = processCommand('', context);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Empty command');
    });

    it('should handle unknown commands', () => {
      const result = processCommand('foo', context);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });

    it('should handle unimplemented commands', () => {
      const result = processCommand('cherry-pick abc123', context);
      expect(result.success).toBe(false);
      expect(result.message).toContain('not yet implemented');
    });
  });

  describe('undo/redo', () => {
    it('should undo a command', () => {
      // Execute a commit
      const commitResult = processCommand('commit -m "Test"', context);
      context.state = commitResult.newState!;

      expect(context.state.commits.size).toBe(2);

      // Undo
      const undoResult = processCommand('undo', context);
      expect(undoResult.success).toBe(true);
      expect(undoResult.newState!.commits.size).toBe(1);
    });

    it('should redo a command', () => {
      // Execute and undo
      const commitResult = processCommand('commit -m "Test"', context);
      context.state = commitResult.newState!;

      const undoResult = processCommand('undo', context);
      context.state = undoResult.newState!;

      expect(context.state.commits.size).toBe(1);

      // Redo
      const redoResult = processCommand('redo', context);
      expect(redoResult.success).toBe(true);
      expect(redoResult.newState!.commits.size).toBe(2);
    });

    it('should handle undo with empty stack', () => {
      const result = processCommand('undo', context);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Nothing to undo');
    });

    it('should handle redo with empty stack', () => {
      const result = processCommand('redo', context);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Nothing to redo');
    });

    it('should clear redo stack on new command', () => {
      // Execute and undo
      const commit1 = processCommand('commit -m "First"', context);
      context.state = commit1.newState!;

      const undo1 = processCommand('undo', context);
      context.state = undo1.newState!;

      // Execute new command (should clear redo)
      const commit2 = processCommand('commit -m "Second"', context);
      context.state = commit2.newState!;

      // Try to redo (should fail)
      const redo = processCommand('redo', context);
      expect(redo.success).toBe(false);
    });

    it('should maintain undo history', () => {
      // Execute multiple commands
      let result = processCommand('commit -m "First"', context);
      context.state = result.newState!;

      result = processCommand('commit -m "Second"', context);
      context.state = result.newState!;

      result = processCommand('commit -m "Third"', context);
      context.state = result.newState!;

      expect(context.state.commits.size).toBe(4); // initial + 3

      // Undo twice
      result = processCommand('undo', context);
      context.state = result.newState!;

      result = processCommand('undo', context);
      context.state = result.newState!;

      expect(context.state.commits.size).toBe(2); // initial + 1
    });
  });

  describe('animation callbacks', () => {
    it('should trigger animation for commit', () => {
      const onAnimate = vi.fn();
      context.onAnimate = onAnimate;

      const result = processCommand('commit -m "Test"', context);
      expect(result.success).toBe(true);
      expect(result.animate).toBe(true);
      expect(result.animationType).toBe('commit');
      expect(onAnimate).toHaveBeenCalled();
    });

    it('should trigger animation for merge', () => {
      const onAnimate = vi.fn();
      context.onAnimate = onAnimate;

      // Setup: create and checkout feature branch, make commit, checkout main, merge
      let result = processCommand('branch feature', context);
      context.state = result.newState!;
      
      result = processCommand('checkout feature', context);
      context.state = result.newState!;

      result = processCommand('commit -m "Feature"', context);
      context.state = result.newState!;

      result = processCommand('checkout main', context);
      context.state = result.newState!;

      onAnimate.mockClear();
      result = processCommand('merge feature', context);
      expect(result.success).toBe(true);
      expect(result.animate).toBe(true);
      expect(onAnimate).toHaveBeenCalled();
    });

    it('should not trigger animation for status', () => {
      const onAnimate = vi.fn();
      context.onAnimate = onAnimate;

      const result = processCommand('status', context);
      expect(result.success).toBe(true);
      expect(result.animate).toBe(false);
      expect(onAnimate).not.toHaveBeenCalled();
    });

    it('should not trigger animation for failed commands', () => {
      const onAnimate = vi.fn();
      context.onAnimate = onAnimate;

      const result = processCommand('invalid', context);
      expect(result.success).toBe(false);
      expect(onAnimate).not.toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    it('should preserve state on failed command', () => {
      const initialSize = context.state.commits.size;

      // Try invalid command
      processCommand('commit', context); // Missing -m

      // State should be unchanged
      expect(context.state.commits.size).toBe(initialSize);
    });

    it('should update state on successful command', () => {
      const result = processCommand('commit -m "Test"', context);
      context.state = result.newState!;

      expect(context.state.commits.size).toBe(2);
    });

    it('should handle command chaining', () => {
      let result = processCommand('branch feature', context);
      context.state = result.newState!;

      result = processCommand('checkout feature', context);
      context.state = result.newState!;

      result = processCommand('commit -m "Feature work"', context);
      context.state = result.newState!;

      expect(context.state.branches.has('feature')).toBe(true);
      expect(context.state.head).toEqual({ type: 'branch', name: 'feature' });
      expect(context.state.commits.size).toBe(2);
    });
  });

  describe('command history', () => {
    it('should create history with default size', () => {
      const history = createCommandHistory();
      expect(history.maxSize).toBe(50);
      expect(history.undoStack).toEqual([]);
      expect(history.redoStack).toEqual([]);
    });

    it('should create history with custom size', () => {
      const history = createCommandHistory(100);
      expect(history.maxSize).toBe(100);
    });

    it('should limit undo stack size', () => {
      const smallHistory = createCommandHistory(3);
      const smallContext = {
        ...context,
        history: smallHistory,
      };

      // Execute 5 commands
      for (let i = 0; i < 5; i++) {
        const result = processCommand(`commit -m "Commit ${i}"`, smallContext);
        smallContext.state = result.newState!;
      }

      // Stack should be limited to 3
      expect(smallContext.history.undoStack.length).toBe(3);
    });
  });

  describe('integration tests', () => {
    it('should handle complex workflow', () => {
      // Create feature branch
      let result = processCommand('branch feature', context);
      context.state = result.newState!;

      // Switch to feature
      result = processCommand('checkout feature', context);
      context.state = result.newState!;

      // Make commits on feature
      result = processCommand('commit -m "Feature 1"', context);
      context.state = result.newState!;

      result = processCommand('commit -m "Feature 2"', context);
      context.state = result.newState!;

      // Switch back to main
      result = processCommand('checkout main', context);
      context.state = result.newState!;

      // Make commit on main
      result = processCommand('commit -m "Main work"', context);
      context.state = result.newState!;

      // Merge feature
      result = processCommand('merge feature', context);
      expect(result.success).toBe(true);
      context.state = result.newState!;

      // Check final state
      expect(context.state.branches.has('feature')).toBe(true);
      expect(context.state.branches.has('main')).toBe(true);
      expect(context.state.head).toEqual({ type: 'branch', name: 'main' });
    });

    it('should handle undo of merge', () => {
      // Setup and merge
      let result = processCommand('branch feature', context);
      context.state = result.newState!;
      
      result = processCommand('checkout feature', context);
      context.state = result.newState!;

      result = processCommand('commit -m "Feature"', context);
      context.state = result.newState!;

      result = processCommand('checkout main', context);
      context.state = result.newState!;

      const beforeMergeSize = context.state.commits.size;

      result = processCommand('merge feature', context);
      context.state = result.newState!;

      // Undo merge
      result = processCommand('undo', context);
      expect(result.success).toBe(true);
      expect(result.newState!.commits.size).toBe(beforeMergeSize);
    });
  });
});

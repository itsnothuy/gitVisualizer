/**
 * Tests for SandboxSession
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SandboxSession } from '../SandboxSession';
import { GitEngine } from '@/cli/GitEngine';

describe('SandboxSession', () => {
  let session: SandboxSession;

  beforeEach(() => {
    session = new SandboxSession({ name: 'Test Session' });
  });

  describe('initialization', () => {
    it('should create session with default initial state', () => {
      const state = session.getState();
      expect(state).toBeDefined();
      expect(state.commits.size).toBeGreaterThan(0);
      expect(state.branches.size).toBeGreaterThan(0);
    });

    it('should create session with custom name', () => {
      expect(session.getName()).toBe('Test Session');
    });

    it('should create session with custom initial state', () => {
      const customState = GitEngine.createInitialState();
      customState.branches.set('custom', { name: 'custom', target: 'abc' });

      const customSession = new SandboxSession({
        name: 'Custom',
        initialState: customState,
      });

      expect(customSession.getState().branches.has('custom')).toBe(true);
    });

    it('should generate unique session ID', () => {
      const session1 = new SandboxSession();
      const session2 = new SandboxSession();
      expect(session1.getId()).not.toBe(session2.getId());
    });
  });

  describe('state management', () => {
    it('should get and set state', () => {
      const newState = GitEngine.createInitialState();
      session.setState(newState);
      expect(session.getState()).toBe(newState);
    });

    it('should track command history', () => {
      session.addCommand('commit -m "test"');
      session.addCommand('branch feature');

      const history = session.getCommandHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toBe('commit -m "test"');
      expect(history[1]).toBe('branch feature');
    });
  });

  describe('undo/redo', () => {
    it('should push and pop undo stack', () => {
      const state1 = session.getState();
      const state2 = GitEngine.createInitialState();

      session.pushUndo(state1, 'test command');
      session.setState(state2);

      const undoResult = session.undo();
      expect(undoResult.success).toBe(true);
      expect(undoResult.command).toBe('test command');
    });

    it('should not undo when stack is empty', () => {
      const undoResult = session.undo();
      expect(undoResult.success).toBe(false);
    });

    it('should support redo after undo', () => {
      const state1 = session.getState();
      const state2 = GitEngine.createInitialState();

      session.pushUndo(state1, 'command 1');
      session.setState(state2);

      session.undo();
      const redoResult = session.redo();

      expect(redoResult.success).toBe(true);
    });

    it('should not redo when stack is empty', () => {
      const redoResult = session.redo();
      expect(redoResult.success).toBe(false);
    });

    it('should clear redo stack when new command is executed', () => {
      const state1 = session.getState();
      const state2 = GitEngine.createInitialState();
      const state3 = GitEngine.createInitialState();

      session.pushUndo(state1, 'command 1');
      session.setState(state2);

      session.undo();

      const historyBefore = session.getHistoryInfo();
      expect(historyBefore.canRedo).toBe(true);

      // Execute new command
      session.pushUndo(state2, 'command 2');
      session.setState(state3);

      const historyAfter = session.getHistoryInfo();
      expect(historyAfter.canRedo).toBe(false);
    });

    it('should limit undo stack size', () => {
      const smallSession = new SandboxSession({ maxHistorySize: 3 });

      for (let i = 0; i < 5; i++) {
        const state = GitEngine.createInitialState();
        smallSession.pushUndo(state, `command ${i}`);
      }

      const history = smallSession.getHistoryInfo();
      expect(history.undoCount).toBe(3);
    });
  });

  describe('history info', () => {
    it('should report correct history info', () => {
      const info = session.getHistoryInfo();
      expect(info.canUndo).toBe(false);
      expect(info.canRedo).toBe(false);
      expect(info.undoCount).toBe(0);
      expect(info.redoCount).toBe(0);
      expect(info.lastCommand).toBeUndefined();
    });

    it('should report last command', () => {
      const state1 = session.getState();
      session.pushUndo(state1, 'my command');

      const info = session.getHistoryInfo();
      expect(info.lastCommand).toBe('my command');
    });
  });

  describe('export/import', () => {
    it('should export state as snapshot', () => {
      const snapshot = session.exportState();
      expect(snapshot.commits).toBeDefined();
      expect(snapshot.branches).toBeDefined();
      expect(snapshot.tags).toBeDefined();
      expect(snapshot.head).toBeDefined();
    });

    it('should strip messages when requested', () => {
      const snapshot = session.exportState({ stripMessages: true });
      expect(snapshot.commits.every((c) => c.message === '[Message removed for privacy]')).toBe(
        true
      );
    });

    it('should import state from snapshot', () => {
      const snapshot = session.exportState();
      const newSession = new SandboxSession();

      newSession.importState(snapshot);

      const newSnapshot = newSession.exportState();
      expect(newSnapshot).toEqual(snapshot);
    });
  });

  describe('reset and clear', () => {
    it('should clear history but keep state', () => {
      session.addCommand('command 1');
      session.pushUndo(session.getState(), 'command 1');

      session.clearHistory();

      expect(session.getCommandHistory()).toHaveLength(0);
      expect(session.getHistoryInfo().undoCount).toBe(0);
      expect(session.getState()).toBeDefined();
    });

    it('should reset to initial state', () => {
      session.addCommand('command 1');
      const initialCommitCount = session.getState().commits.size;

      // Modify state
      const modifiedState = GitEngine.createInitialState();
      modifiedState.branches.set('feature', { name: 'feature', target: 'abc' });
      session.setState(modifiedState);

      session.reset();

      expect(session.getCommandHistory()).toHaveLength(0);
      expect(session.getHistoryInfo().undoCount).toBe(0);
      expect(session.getState().commits.size).toBe(initialCommitCount);
      expect(session.getState().branches.has('feature')).toBe(false);
    });
  });

  describe('metadata', () => {
    it('should provide session metadata', () => {
      const metadata = session.getMetadata();

      expect(metadata.id).toBeTruthy();
      expect(metadata.name).toBe('Test Session');
      expect(metadata.createdAt).toBeGreaterThan(0);
      expect(metadata.updatedAt).toBeGreaterThan(0);
      expect(metadata.commandCount).toBe(0);
      expect(metadata.commitCount).toBeGreaterThan(0);
      expect(metadata.branchCount).toBeGreaterThan(0);
    });

    it('should update metadata on changes', () => {
      const metadataBefore = session.getMetadata();
      const updatedBefore = metadataBefore.updatedAt;

      // Wait a bit to ensure timestamp changes
      const wait = () => new Promise((resolve) => setTimeout(resolve, 10));

      return wait().then(() => {
        session.setName('Updated Name');
        const metadataAfter = session.getMetadata();

        expect(metadataAfter.name).toBe('Updated Name');
        expect(metadataAfter.updatedAt).toBeGreaterThan(updatedBefore);
      });
    });
  });
});

/**
 * Tests for GitCommandSystem
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitCommandSystem, type GitCommand } from '../CommandSystem';
import type { GitState } from '@/cli/types';

// Helper to create a basic Git state
function createBasicState(): GitState {
  return {
    commits: new Map([
      [
        'abc123',
        {
          id: 'abc123',
          parents: [],
          message: 'Initial commit',
          timestamp: Date.now(),
        },
      ],
    ]),
    branches: new Map([['main', { name: 'main', target: 'abc123' }]]),
    tags: new Map(),
    head: { type: 'branch', name: 'main' },
  };
}

// Helper to create a test command
function createTestCommand(type: string = 'commit'): GitCommand {
  return {
    id: `cmd-${Date.now()}-${Math.random()}`,
    type: type as GitCommand['type'],
    parameters: {},
    metadata: {
      timestamp: Date.now(),
    },
  };
}

describe('GitCommandSystem', () => {
  let state: GitState;
  let mockExecutor: ReturnType<typeof vi.fn>;
  let commandSystem: GitCommandSystem;

  beforeEach(() => {
    state = createBasicState();
    mockExecutor = vi.fn();
    commandSystem = new GitCommandSystem(state, mockExecutor);
  });

  describe('executeCommand', () => {
    it('should execute a valid command successfully', async () => {
      const newState = createBasicState();
      newState.commits.set('def456', {
        id: 'def456',
        parents: ['abc123'],
        message: 'Second commit',
        timestamp: Date.now(),
      });

      mockExecutor.mockResolvedValue({
        success: true,
        message: 'Commit created',
        newState,
      });

      const command = createTestCommand('commit');
      const result = await commandSystem.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.commandId).toBe(command.id);
      expect(result.newState).toBe(newState);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should handle command validation errors', async () => {
      const invalidCommand = createTestCommand();
      invalidCommand.id = ''; // Invalid: missing ID

      const result = await commandSystem.executeCommand(invalidCommand);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.code).toBe('VALIDATION_ERROR');
    });

    it('should handle execution errors', async () => {
      mockExecutor.mockResolvedValue({
        success: false,
        message: 'Execution failed',
      });

      const command = createTestCommand();
      const result = await commandSystem.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.code).toBe('EXECUTION_ERROR');
    });

    it('should handle unexpected errors', async () => {
      mockExecutor.mockRejectedValue(new Error('Unexpected error'));

      const command = createTestCommand();
      const result = await commandSystem.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.code).toBe('UNEXPECTED_ERROR');
    });

    it('should emit command executed event', async () => {
      const newState = createBasicState();
      mockExecutor.mockResolvedValue({
        success: true,
        message: 'Success',
        newState,
      });

      const eventHandler = vi.fn();
      commandSystem.onCommandExecuted.subscribe(eventHandler);

      const command = createTestCommand();
      await commandSystem.executeCommand(command);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          command,
          result: expect.any(Object),
          timestamp: expect.any(Number),
        })
      );
    });

    it('should emit state changed event', async () => {
      const newState = createBasicState();
      mockExecutor.mockResolvedValue({
        success: true,
        message: 'Success',
        newState,
      });

      const eventHandler = vi.fn();
      commandSystem.onStateChanged.subscribe(eventHandler);

      const command = createTestCommand();
      await commandSystem.executeCommand(command);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          oldState: expect.any(Object),
          newState,
          command,
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('executeCommandSequence', () => {
    it('should execute multiple commands in sequence', async () => {
      const newState1 = createBasicState();
      const newState2 = createBasicState();

      mockExecutor
        .mockResolvedValueOnce({
          success: true,
          message: 'Success 1',
          newState: newState1,
        })
        .mockResolvedValueOnce({
          success: true,
          message: 'Success 2',
          newState: newState2,
        });

      const commands = [createTestCommand(), createTestCommand()];
      const result = await commandSystem.executeCommandSequence(commands);

      expect(result.success).toBe(true);
      expect(result.results.length).toBe(2);
      expect(result.finalState).toBe(newState2);
    });

    it('should stop on first failure', async () => {
      mockExecutor
        .mockResolvedValueOnce({
          success: true,
          message: 'Success',
          newState: createBasicState(),
        })
        .mockResolvedValueOnce({
          success: false,
          message: 'Failure',
        });

      const commands = [
        createTestCommand(),
        createTestCommand(),
        createTestCommand(),
      ];
      const result = await commandSystem.executeCommandSequence(commands);

      expect(result.success).toBe(false);
      expect(result.results.length).toBe(2);
    });
  });

  describe('undoCommand', () => {
    it('should undo the last command', async () => {
      const newState = createBasicState();
      mockExecutor.mockResolvedValue({
        success: true,
        message: 'Success',
        newState,
      });

      const command = createTestCommand();
      await commandSystem.executeCommand(command);

      const undoResult = await commandSystem.undoCommand();

      expect(undoResult.success).toBe(true);
      expect(undoResult.restoredState).toBe(state);
      expect(undoResult.undoneCommand).toBe(command);
    });

    it('should undo a specific command by ID', async () => {
      const newState1 = createBasicState();
      const newState2 = createBasicState();

      mockExecutor
        .mockResolvedValueOnce({
          success: true,
          message: 'Success',
          newState: newState1,
        })
        .mockResolvedValueOnce({
          success: true,
          message: 'Success',
          newState: newState2,
        });

      const command1 = createTestCommand();
      const command2 = createTestCommand();

      await commandSystem.executeCommand(command1);
      await commandSystem.executeCommand(command2);

      const undoResult = await commandSystem.undoCommand(command1.id);

      expect(undoResult.success).toBe(true);
      expect(undoResult.undoneCommand).toBe(command1);
    });

    it('should return failure when nothing to undo', async () => {
      const undoResult = await commandSystem.undoCommand();

      expect(undoResult.success).toBe(false);
    });

    it('should emit command undone event', async () => {
      const newState = createBasicState();
      mockExecutor.mockResolvedValue({
        success: true,
        message: 'Success',
        newState,
      });

      const eventHandler = vi.fn();
      commandSystem.onCommandUndone.subscribe(eventHandler);

      const command = createTestCommand();
      await commandSystem.executeCommand(command);
      await commandSystem.undoCommand();

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          command,
          result: expect.any(Object),
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('redoCommand', () => {
    it('should redo an undone command', async () => {
      const newState = createBasicState();
      mockExecutor.mockResolvedValue({
        success: true,
        message: 'Success',
        newState,
      });

      const command = createTestCommand();
      await commandSystem.executeCommand(command);
      await commandSystem.undoCommand();

      const redoResult = await commandSystem.redoCommand();

      expect(redoResult.success).toBe(true);
      expect(redoResult.restoredState).toBe(newState);
      expect(redoResult.redoneCommand).toBe(command);
    });

    it('should return failure when nothing to redo', async () => {
      const redoResult = await commandSystem.redoCommand();

      expect(redoResult.success).toBe(false);
    });
  });

  describe('validateCommand', () => {
    it('should validate a valid command', () => {
      const command = createTestCommand();
      const result = commandSystem.validateCommand(command);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject command without type', () => {
      const command = createTestCommand();
      command.type = '' as GitCommand['type'];

      const result = commandSystem.validateCommand(command);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject command without ID', () => {
      const command = createTestCommand();
      command.id = '';

      const result = commandSystem.validateCommand(command);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('previewCommand', () => {
    it('should generate a preview for a valid command', async () => {
      const command = createTestCommand();
      const preview = await commandSystem.previewCommand(command);

      expect(preview.isValid).toBe(true);
      expect(preview.visualPreview).toBeTruthy();
    });

    it('should indicate invalid commands in preview', async () => {
      const command = createTestCommand();
      command.id = '';

      const preview = await commandSystem.previewCommand(command);

      expect(preview.isValid).toBe(false);
    });
  });

  describe('getCommandHistory', () => {
    it('should return command history', async () => {
      const newState = createBasicState();
      mockExecutor.mockResolvedValue({
        success: true,
        message: 'Success',
        newState,
      });

      const command = createTestCommand();
      await commandSystem.executeCommand(command);

      const history = commandSystem.getCommandHistory();

      expect(history).toHaveLength(1);
      expect(history[0]?.command).toBe(command);
    });

    it('should return a copy of the history', () => {
      const history = commandSystem.getCommandHistory();
      const originalLength = history.length;
      history.push({
        command: createTestCommand(),
        beforeState: createBasicState(),
        afterState: createBasicState(),
        result: {
          success: true,
          commandId: 'test',
          newState: createBasicState(),
          changes: [],
          warnings: [],
          errors: [],
          performance: { executionTime: 0 },
        },
      });

      const history2 = commandSystem.getCommandHistory();

      expect(history.length).toBe(originalLength + 1);
      expect(history2.length).toBe(originalLength);
    });
  });

  describe('getCurrentState', () => {
    it('should return current state', () => {
      const currentState = commandSystem.getCurrentState();

      expect(currentState).toBe(state);
    });

    it('should return updated state after command execution', async () => {
      const newState = createBasicState();
      mockExecutor.mockResolvedValue({
        success: true,
        message: 'Success',
        newState,
      });

      await commandSystem.executeCommand(createTestCommand());

      const currentState = commandSystem.getCurrentState();

      expect(currentState).toBe(newState);
    });
  });

  describe('getStateAtCommand', () => {
    it('should return state at a specific command', async () => {
      const newState = createBasicState();
      mockExecutor.mockResolvedValue({
        success: true,
        message: 'Success',
        newState,
      });

      const command = createTestCommand();
      await commandSystem.executeCommand(command);

      const stateAtCommand = commandSystem.getStateAtCommand(command.id);

      expect(stateAtCommand).toBe(newState);
    });

    it('should return null for unknown command ID', () => {
      const stateAtCommand = commandSystem.getStateAtCommand('unknown');

      expect(stateAtCommand).toBeNull();
    });
  });
});

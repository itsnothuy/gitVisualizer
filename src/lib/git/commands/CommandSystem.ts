/**
 * Git Command System
 * Provides a unified interface for executing Git commands with validation,
 * preview, undo/redo support, and event handling
 */

import type { GitState, ParsedCommand, CommandResult } from '@/cli/types';

/**
 * Git command type enumeration
 */
export type GitCommandType =
  | 'commit'
  | 'branch'
  | 'checkout'
  | 'merge'
  | 'rebase'
  | 'cherry-pick'
  | 'reset'
  | 'revert'
  | 'tag'
  | 'stash'
  | 'fetch'
  | 'pull'
  | 'push'
  | 'remote'
  | 'submodule'
  | 'bisect'
  | 'blame'
  | 'log'
  | 'diff'
  | 'show';

/**
 * Command parameters interface
 */
export interface CommandParameters {
  [key: string]: string | boolean | number | string[] | undefined;
}

/**
 * Command metadata
 */
export interface CommandMetadata {
  /** Command description */
  description?: string;
  /** User who initiated the command */
  user?: string;
  /** Timestamp when command was created */
  timestamp: number;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Git command structure
 */
export interface GitCommand {
  /** Unique command identifier */
  id: string;
  /** Command type */
  type: GitCommandType;
  /** Command parameters */
  parameters: CommandParameters;
  /** Command metadata */
  metadata: CommandMetadata;
  /** Whether this is a preview only */
  preview?: boolean;
}

/**
 * Command validation result
 */
export interface ValidationResult {
  /** Whether the command is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}

/**
 * Repository change from a command
 */
export interface RepositoryChange {
  /** Type of change */
  type: 'commit' | 'branch' | 'tag' | 'ref' | 'head';
  /** Item affected by the change */
  item: string;
  /** Action performed */
  action: 'create' | 'update' | 'delete';
  /** Old value (if applicable) */
  oldValue?: string;
  /** New value */
  newValue: string;
}

/**
 * Command warning
 */
export interface CommandWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Affected items */
  affectedItems?: string[];
}

/**
 * Command error
 */
export interface CommandError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Stack trace (if available) */
  stack?: string;
}

/**
 * Command performance metrics
 */
export interface CommandPerformanceMetrics {
  /** Execution time in milliseconds */
  executionTime: number;
  /** Memory usage delta (bytes) */
  memoryDelta?: number;
  /** Number of objects affected */
  objectsAffected?: number;
}

/**
 * Command execution result
 */
export interface CommandExecutionResult {
  /** Whether execution succeeded */
  success: boolean;
  /** Command ID */
  commandId: string;
  /** New repository state */
  newState: GitState;
  /** List of changes made */
  changes: RepositoryChange[];
  /** Warnings encountered */
  warnings: CommandWarning[];
  /** Errors encountered */
  errors: CommandError[];
  /** Performance metrics */
  performance: CommandPerformanceMetrics;
}

/**
 * Command preview result
 */
export interface PreviewResult {
  /** Whether the command is valid */
  isValid: boolean;
  /** Predicted changes */
  predictedChanges: RepositoryChange[];
  /** Potential conflicts */
  conflicts: string[];
  /** Preview warnings */
  warnings: string[];
  /** Visual preview description */
  visualPreview: string;
}

/**
 * Command history entry
 */
export interface CommandHistoryEntry {
  /** Command that was executed */
  command: GitCommand;
  /** State before execution */
  beforeState: GitState;
  /** State after execution */
  afterState: GitState;
  /** Execution result */
  result: CommandExecutionResult;
}

/**
 * Command sequence result
 */
export interface SequenceResult {
  /** Whether all commands succeeded */
  success: boolean;
  /** Results for each command */
  results: CommandExecutionResult[];
  /** Final state */
  finalState: GitState;
}

/**
 * Undo result
 */
export interface UndoResult {
  /** Whether undo succeeded */
  success: boolean;
  /** Restored state */
  restoredState: GitState;
  /** Command that was undone */
  undoneCommand: GitCommand;
}

/**
 * Redo result
 */
export interface RedoResult {
  /** Whether redo succeeded */
  success: boolean;
  /** Restored state */
  restoredState: GitState;
  /** Command that was redone */
  redoneCommand: GitCommand;
}

/**
 * Event emitter type
 */
export type EventEmitter<T> = {
  subscribe: (handler: (event: T) => void) => () => void;
  emit: (event: T) => void;
};

/**
 * Command executed event
 */
export interface CommandExecutedEvent {
  command: GitCommand;
  result: CommandExecutionResult;
  timestamp: number;
}

/**
 * Command undone event
 */
export interface CommandUndoneEvent {
  command: GitCommand;
  result: UndoResult;
  timestamp: number;
}

/**
 * State changed event
 */
export interface StateChangedEvent {
  oldState: GitState;
  newState: GitState;
  command?: GitCommand;
  timestamp: number;
}

/**
 * Create an event emitter
 */
function createEventEmitter<T>(): EventEmitter<T> {
  const handlers: Array<(event: T) => void> = [];

  return {
    subscribe: (handler: (event: T) => void) => {
      handlers.push(handler);
      return () => {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      };
    },
    emit: (event: T) => {
      handlers.forEach((handler) => handler(event));
    },
  };
}

/**
 * Git Command System
 * Main interface for executing and managing Git commands
 */
export class GitCommandSystem {
  private history: CommandHistoryEntry[] = [];
  private undoStack: CommandHistoryEntry[] = [];
  private redoStack: CommandHistoryEntry[] = [];
  private maxHistorySize = 100;

  private onCommandExecutedEmitter = createEventEmitter<CommandExecutedEvent>();
  private onCommandUndoneEmitter = createEventEmitter<CommandUndoneEvent>();
  private onStateChangedEmitter = createEventEmitter<StateChangedEvent>();

  public onCommandExecuted = this.onCommandExecutedEmitter;
  public onCommandUndone = this.onCommandUndoneEmitter;
  public onStateChanged = this.onStateChangedEmitter;

  constructor(
    private currentState: GitState,
    private commandExecutor: (
      command: ParsedCommand,
      state: GitState
    ) => Promise<CommandResult>
  ) {}

  /**
   * Execute a Git command
   */
  async executeCommand(command: GitCommand): Promise<CommandExecutionResult> {
    const startTime = performance.now();

    // Validate command
    const validation = this.validateCommand(command);
    if (!validation.isValid) {
      return {
        success: false,
        commandId: command.id,
        newState: this.currentState,
        changes: [],
        warnings: [],
        errors: validation.errors.map((error) => ({
          code: 'VALIDATION_ERROR',
          message: error,
        })),
        performance: {
          executionTime: performance.now() - startTime,
        },
      };
    }

    // Convert to ParsedCommand format
    const parsedCommand: ParsedCommand = {
      name: command.type,
      args: this.extractArgs(command.parameters),
      options: this.extractOptions(command.parameters),
    };

    try {
      // Execute command
      const result = await this.commandExecutor(parsedCommand, this.currentState);

      if (!result.success || !result.newState) {
        return {
          success: false,
          commandId: command.id,
          newState: this.currentState,
          changes: [],
          warnings: [],
          errors: [
            {
              code: 'EXECUTION_ERROR',
              message: result.message,
            },
          ],
          performance: {
            executionTime: performance.now() - startTime,
          },
        };
      }

      // Calculate changes
      const changes = this.calculateChanges(this.currentState, result.newState);

      const executionResult: CommandExecutionResult = {
        success: true,
        commandId: command.id,
        newState: result.newState,
        changes,
        warnings: validation.warnings.map((warning) => ({
          code: 'VALIDATION_WARNING',
          message: warning,
        })),
        errors: [],
        performance: {
          executionTime: performance.now() - startTime,
        },
      };

      // Update history
      const historyEntry: CommandHistoryEntry = {
        command,
        beforeState: this.currentState,
        afterState: result.newState,
        result: executionResult,
      };

      this.history.push(historyEntry);
      this.undoStack.push(historyEntry);
      this.redoStack = []; // Clear redo stack on new command

      // Trim history if needed
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }
      if (this.undoStack.length > this.maxHistorySize) {
        this.undoStack.shift();
      }

      // Update current state
      const oldState = this.currentState;
      this.currentState = result.newState;

      // Emit events
      this.onCommandExecutedEmitter.emit({
        command,
        result: executionResult,
        timestamp: Date.now(),
      });

      this.onStateChangedEmitter.emit({
        oldState,
        newState: this.currentState,
        command,
        timestamp: Date.now(),
      });

      return executionResult;
    } catch (error) {
      return {
        success: false,
        commandId: command.id,
        newState: this.currentState,
        changes: [],
        warnings: [],
        errors: [
          {
            code: 'UNEXPECTED_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          },
        ],
        performance: {
          executionTime: performance.now() - startTime,
        },
      };
    }
  }

  /**
   * Execute a sequence of commands
   */
  async executeCommandSequence(
    commands: GitCommand[]
  ): Promise<SequenceResult> {
    const results: CommandExecutionResult[] = [];
    let success = true;

    for (const command of commands) {
      const result = await this.executeCommand(command);
      results.push(result);

      if (!result.success) {
        success = false;
        break;
      }
    }

    return {
      success,
      results,
      finalState: this.currentState,
    };
  }

  /**
   * Undo the last command
   */
  async undoCommand(commandId?: string): Promise<UndoResult> {
    const entry = commandId
      ? this.undoStack.find((e) => e.command.id === commandId)
      : this.undoStack[this.undoStack.length - 1];

    if (!entry) {
      return {
        success: false,
        restoredState: this.currentState,
        undoneCommand: {} as GitCommand,
      };
    }

    // Remove from undo stack
    const index = this.undoStack.indexOf(entry);
    if (index > -1) {
      this.undoStack.splice(index, 1);
    }

    // Add to redo stack
    this.redoStack.push(entry);

    // Restore state
    const oldState = this.currentState;
    this.currentState = entry.beforeState;

    const result: UndoResult = {
      success: true,
      restoredState: this.currentState,
      undoneCommand: entry.command,
    };

    // Emit events
    this.onCommandUndoneEmitter.emit({
      command: entry.command,
      result,
      timestamp: Date.now(),
    });

    this.onStateChangedEmitter.emit({
      oldState,
      newState: this.currentState,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Redo a previously undone command
   */
  async redoCommand(commandId?: string): Promise<RedoResult> {
    const entry = commandId
      ? this.redoStack.find((e) => e.command.id === commandId)
      : this.redoStack[this.redoStack.length - 1];

    if (!entry) {
      return {
        success: false,
        restoredState: this.currentState,
        redoneCommand: {} as GitCommand,
      };
    }

    // Remove from redo stack
    const index = this.redoStack.indexOf(entry);
    if (index > -1) {
      this.redoStack.splice(index, 1);
    }

    // Add back to undo stack
    this.undoStack.push(entry);

    // Restore state
    const oldState = this.currentState;
    this.currentState = entry.afterState;

    const result: RedoResult = {
      success: true,
      restoredState: this.currentState,
      redoneCommand: entry.command,
    };

    // Emit events
    this.onStateChangedEmitter.emit({
      oldState,
      newState: this.currentState,
      command: entry.command,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Validate a command
   */
  validateCommand(command: GitCommand): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!command.type) {
      errors.push('Command type is required');
    }

    if (!command.id) {
      errors.push('Command ID is required');
    }

    // Type-specific validation would go here
    // For now, just basic structure validation

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Preview a command without executing it
   */
  async previewCommand(command: GitCommand): Promise<PreviewResult> {
    // This is a simplified preview - real implementation would need
    // more sophisticated prediction logic
    const validation = this.validateCommand(command);

    return {
      isValid: validation.isValid,
      predictedChanges: [],
      conflicts: [],
      warnings: validation.warnings,
      visualPreview: `Preview for ${command.type} command`,
    };
  }

  /**
   * Get command history
   */
  getCommandHistory(): CommandHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Get current state
   */
  getCurrentState(): GitState {
    return this.currentState;
  }

  /**
   * Get state at a specific command
   */
  getStateAtCommand(commandId: string): GitState | null {
    const entry = this.history.find((e) => e.command.id === commandId);
    return entry ? entry.afterState : null;
  }

  /**
   * Extract positional arguments from parameters
   */
  private extractArgs(parameters: CommandParameters): string[] {
    const args: string[] = [];
    for (const [key, value] of Object.entries(parameters)) {
      if (key.match(/^arg\d+$/) && typeof value === 'string') {
        args.push(value);
      }
    }
    return args;
  }

  /**
   * Extract named options from parameters
   */
  private extractOptions(
    parameters: CommandParameters
  ): Record<string, string | boolean> {
    const options: Record<string, string | boolean> = {};
    for (const [key, value] of Object.entries(parameters)) {
      if (!key.match(/^arg\d+$/)) {
        if (typeof value === 'string' || typeof value === 'boolean') {
          options[key] = value;
        }
      }
    }
    return options;
  }

  /**
   * Calculate changes between two states
   */
  private calculateChanges(
    oldState: GitState,
    newState: GitState
  ): RepositoryChange[] {
    const changes: RepositoryChange[] = [];

    // Check for new commits
    for (const [commitId, commit] of newState.commits) {
      if (!oldState.commits.has(commitId)) {
        changes.push({
          type: 'commit',
          item: commitId,
          action: 'create',
          newValue: commit.message,
        });
      }
    }

    // Check for new/modified branches
    for (const [branchName, branch] of newState.branches) {
      const oldBranch = oldState.branches.get(branchName);
      if (!oldBranch) {
        changes.push({
          type: 'branch',
          item: branchName,
          action: 'create',
          newValue: branch.target,
        });
      } else if (oldBranch.target !== branch.target) {
        changes.push({
          type: 'branch',
          item: branchName,
          action: 'update',
          oldValue: oldBranch.target,
          newValue: branch.target,
        });
      }
    }

    // Check for deleted branches
    for (const branchName of oldState.branches.keys()) {
      if (!newState.branches.has(branchName)) {
        changes.push({
          type: 'branch',
          item: branchName,
          action: 'delete',
          oldValue: oldState.branches.get(branchName)?.target,
          newValue: '',
        });
      }
    }

    // Check for HEAD changes
    const oldHead =
      oldState.head.type === 'branch'
        ? oldState.head.name
        : oldState.head.commit;
    const newHead =
      newState.head.type === 'branch'
        ? newState.head.name
        : newState.head.commit;

    if (oldHead !== newHead) {
      changes.push({
        type: 'head',
        item: 'HEAD',
        action: 'update',
        oldValue: oldHead,
        newValue: newHead,
      });
    }

    return changes;
  }
}

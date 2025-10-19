/**
 * Command Pipeline
 * Orchestrates command parsing, execution, state management, and animations
 */

import { parseCommand } from './CommandParser';
import { GitEngine } from './GitEngine';
import type {
  GitState,
  CommandResult,
  CommandHistory,
  ParsedCommand,
} from './types';

/**
 * Command execution context with history
 */
export interface CommandExecutionContext {
  /** Current Git state */
  state: GitState;
  /** Command history for undo/redo */
  history: CommandHistory;
  /** Whether in sandbox mode */
  sandboxMode: boolean;
  /** Optional callback for animation triggers */
  onAnimate?: (operation: string, oldState: GitState, newState: GitState) => void;
}

/**
 * Initialize command history
 */
export function createCommandHistory(maxSize = 50): CommandHistory {
  return {
    undoStack: [],
    redoStack: [],
    maxSize,
  };
}

/**
 * Push state to undo stack
 */
function pushToUndoStack(
  history: CommandHistory,
  state: GitState,
  command: string
): void {
  history.undoStack.push({
    state: cloneState(state),
    command,
    timestamp: Date.now(),
  });

  // Limit stack size
  if (history.undoStack.length > history.maxSize) {
    history.undoStack.shift();
  }

  // Clear redo stack when new command is executed
  history.redoStack = [];
}

/**
 * Clone Git state for history
 */
function cloneState(state: GitState): GitState {
  return {
    commits: new Map(state.commits),
    branches: new Map(state.branches),
    tags: new Map(state.tags),
    head: { ...state.head },
    staging: state.staging ? new Set(state.staging) : undefined,
    remotes: state.remotes ? new Map(state.remotes) : undefined,
    remoteConfigs: state.remoteConfigs ? new Map(state.remoteConfigs) : undefined,
    remoteTrackingBranches: state.remoteTrackingBranches ? new Map(state.remoteTrackingBranches) : undefined,
    conflict: state.conflict ? { ...state.conflict } : undefined,
    rebaseState: state.rebaseState ? { ...state.rebaseState, todos: [...state.rebaseState.todos] } : undefined,
  };
}

/**
 * Process a command string through the full pipeline
 */
export function processCommand(
  input: string,
  context: CommandExecutionContext
): CommandResult {
  // Parse command
  const parseResult = parseCommand(input);
  if (!parseResult.success) {
    return {
      success: false,
      message: parseResult.error,
    };
  }

  const command = parseResult.command;

  // Handle undo/redo specially
  if (command.name === 'undo') {
    return handleUndo(context);
  }
  if (command.name === 'redo') {
    return handleRedo(context);
  }

  // Save current state to undo stack before executing
  pushToUndoStack(context.history, context.state, input);

  // Execute command
  const result = executeCommand(command, context.state);

  // Trigger animation if successful and animation callback provided
  if (result.success && result.newState && context.onAnimate) {
    const shouldAnimate = shouldTriggerAnimation(command.name);
    if (shouldAnimate) {
      context.onAnimate(command.name, context.state, result.newState);
    }
  }

  return result;
}

/**
 * Execute a parsed command against the Git engine
 */
function executeCommand(
  command: ParsedCommand,
  state: GitState
): CommandResult {
  try {
    let result;

    switch (command.name) {
      case 'commit':
        result = GitEngine.commit(state, command);
        break;
      case 'branch':
        result = GitEngine.branch(state, command);
        break;
      case 'checkout':
        result = GitEngine.checkout(state, command);
        break;
      case 'switch':
        result = GitEngine.switch(state, command);
        break;
      case 'merge':
        result = GitEngine.merge(state, command);
        break;
      case 'reset':
        result = GitEngine.reset(state, command);
        break;
      case 'revert':
        result = GitEngine.revert(state, command);
        break;
      case 'tag':
        result = GitEngine.tag(state, command);
        break;
      case 'status':
        result = GitEngine.status(state);
        break;
      case 'log':
        result = GitEngine.log(state, command);
        break;
      case 'rebase':
        if (command.options.i || command.options.interactive) {
          result = GitEngine.rebaseInteractive(state, command);
        } else if (command.options.abort) {
          result = GitEngine.abortRebase(state);
        } else if (command.options.continue) {
          result = GitEngine.executeRebase(state);
        } else {
          return {
            success: false,
            message: 'Use --interactive, --continue, or --abort',
          };
        }
        break;
      case 'remote':
        if (command.args[0] === 'add') {
          result = GitEngine.remoteAdd(state, {
            ...command,
            args: command.args.slice(1),
          });
        } else {
          result = GitEngine.remoteList(state);
        }
        break;
      case 'fetch':
        result = GitEngine.fetch(state, command);
        break;
      case 'pull':
        result = GitEngine.pull(state, command);
        break;
      case 'push':
        result = GitEngine.push(state, command);
        break;
      case 'cherry-pick':
      case 'clone':
      case 'describe':
        // Not yet implemented
        return {
          success: false,
          message: `Command '${command.name}' is not yet implemented`,
        };
      default:
        return {
          success: false,
          message: `Unknown command: ${command.name}`,
        };
    }

    return {
      success: result.success,
      message: result.success ? result.message : result.error,
      newState: result.success ? result.newState : undefined,
      animate: shouldTriggerAnimation(command.name),
      animationType: getAnimationType(command.name),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle undo command
 */
function handleUndo(context: CommandExecutionContext): CommandResult {
  if (context.history.undoStack.length === 0) {
    return {
      success: false,
      message: 'Nothing to undo',
    };
  }

  // Pop from undo stack
  const entry = context.history.undoStack.pop()!;

  // Push current state to redo stack
  context.history.redoStack.push({
    state: cloneState(context.state),
    command: 'redo',
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Undid: ${entry.command}`,
    newState: entry.state,
  };
}

/**
 * Handle redo command
 */
function handleRedo(context: CommandExecutionContext): CommandResult {
  if (context.history.redoStack.length === 0) {
    return {
      success: false,
      message: 'Nothing to redo',
    };
  }

  // Pop from redo stack
  const entry = context.history.redoStack.pop()!;

  // Push current state to undo stack
  context.history.undoStack.push({
    state: cloneState(context.state),
    command: 'undo',
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: 'Redo successful',
    newState: entry.state,
  };
}

/**
 * Determine if a command should trigger animation
 */
function shouldTriggerAnimation(commandName: string): boolean {
  const animatedCommands = [
    'commit',
    'branch',
    'checkout',
    'switch',
    'merge',
    'reset',
    'revert',
    'rebase',
    'cherry-pick',
  ];
  return animatedCommands.includes(commandName);
}

/**
 * Get animation type hint for a command
 */
function getAnimationType(commandName: string): string {
  const typeMap: Record<string, string> = {
    commit: 'commit',
    branch: 'branch-create',
    checkout: 'checkout',
    switch: 'checkout',
    merge: 'merge',
    reset: 'reset',
    revert: 'revert',
    rebase: 'rebase',
    'cherry-pick': 'cherry-pick',
  };
  return typeMap[commandName] || commandName;
}

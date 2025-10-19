/**
 * SandboxSession - Manages sandbox mode state with persistence
 * Handles command history, undo/redo stack, and state snapshots
 */

import { GitEngine } from '@/cli/GitEngine';
import { stateToSnapshot, snapshotToState } from '@/tutorial/stateUtils';
import type { GitState, HistoryEntry } from '@/cli/types';
import type { GitStateSnapshot } from '@/tutorial/types';
import {
  saveSession,
  loadSession,
  deleteSession,
  type StoredSession,
} from './db';

export interface SandboxSessionConfig {
  id?: string;
  name?: string;
  initialState?: GitState;
  maxHistorySize?: number;
}

export class SandboxSession {
  private id: string;
  private name: string;
  private currentState: GitState;
  private commandHistory: string[];
  private undoStack: HistoryEntry[];
  private redoStack: HistoryEntry[];
  private maxHistorySize: number;
  private createdAt: number;
  private updatedAt: number;

  constructor(config: SandboxSessionConfig = {}) {
    this.id = config.id || this.generateId();
    this.name = config.name || 'Untitled Sandbox';
    this.currentState = config.initialState || GitEngine.createInitialState();
    this.commandHistory = [];
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistorySize = config.maxHistorySize || 50;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }

  /**
   * Generate a unique session ID
   */
  private generateId(): string {
    return `sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get session name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Set session name
   */
  setName(name: string): void {
    this.name = name;
    this.updatedAt = Date.now();
  }

  /**
   * Get current state
   */
  getState(): GitState {
    return this.currentState;
  }

  /**
   * Set current state (for imports)
   */
  setState(state: GitState): void {
    this.currentState = state;
    this.updatedAt = Date.now();
  }

  /**
   * Get command history
   */
  getCommandHistory(): string[] {
    return [...this.commandHistory];
  }

  /**
   * Add command to history
   */
  addCommand(command: string): void {
    this.commandHistory.push(command);
    this.updatedAt = Date.now();
  }

  /**
   * Push state to undo stack
   */
  pushUndo(state: GitState, command: string): void {
    this.undoStack.push({
      state: this.cloneState(state),
      command,
      timestamp: Date.now(),
    });

    // Limit stack size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    // Clear redo stack when new command is executed
    this.redoStack = [];
    this.updatedAt = Date.now();
  }

  /**
   * Undo last command
   */
  undo(): { success: boolean; state?: GitState; command?: string } {
    if (this.undoStack.length === 0) {
      return { success: false };
    }

    const entry = this.undoStack.pop()!;

    // Push current state to redo stack
    this.redoStack.push({
      state: this.cloneState(this.currentState),
      command: 'redo',
      timestamp: Date.now(),
    });

    this.currentState = entry.state;
    this.updatedAt = Date.now();

    return { success: true, state: entry.state, command: entry.command };
  }

  /**
   * Redo last undone command
   */
  redo(): { success: boolean; state?: GitState } {
    if (this.redoStack.length === 0) {
      return { success: false };
    }

    const entry = this.redoStack.pop()!;

    // Push current state to undo stack
    this.undoStack.push({
      state: this.cloneState(this.currentState),
      command: 'undo',
      timestamp: Date.now(),
    });

    this.currentState = entry.state;
    this.updatedAt = Date.now();

    return { success: true, state: entry.state };
  }

  /**
   * Get undo/redo stack info
   */
  getHistoryInfo(): {
    canUndo: boolean;
    canRedo: boolean;
    undoCount: number;
    redoCount: number;
    lastCommand?: string;
  } {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      lastCommand:
        this.undoStack.length > 0
          ? this.undoStack[this.undoStack.length - 1].command
          : undefined,
    };
  }

  /**
   * Clone Git state for history
   */
  private cloneState(state: GitState): GitState {
    return {
      commits: new Map(state.commits),
      branches: new Map(state.branches),
      tags: new Map(state.tags),
      head: { ...state.head },
      staging: state.staging ? new Set(state.staging) : undefined,
      remotes: state.remotes ? new Map(state.remotes) : undefined,
    };
  }

  /**
   * Export state as JSON
   */
  exportState(options?: { stripMessages?: boolean }): GitStateSnapshot {
    const snapshot = stateToSnapshot(this.currentState);

    // Strip commit messages if requested (for privacy)
    if (options?.stripMessages) {
      snapshot.commits.forEach((commit) => {
        commit.message = '[Message removed for privacy]';
      });
    }

    return snapshot;
  }

  /**
   * Import state from JSON
   */
  importState(snapshot: GitStateSnapshot): void {
    this.currentState = snapshotToState(snapshot);
    this.updatedAt = Date.now();
  }

  /**
   * Save session to IndexedDB
   */
  async save(): Promise<void> {
    const stored: StoredSession = {
      id: this.id,
      name: this.name,
      state: JSON.stringify(stateToSnapshot(this.currentState)),
      commandHistory: this.commandHistory,
      undoStack: this.undoStack.map((e) => JSON.stringify(e)),
      redoStack: this.redoStack.map((e) => JSON.stringify(e)),
      undoIndex: this.undoStack.length,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    await saveSession(stored);
  }

  /**
   * Load session from IndexedDB
   */
  static async load(id: string): Promise<SandboxSession | null> {
    const stored = await loadSession(id);
    if (!stored) return null;

    const session = new SandboxSession({ id: stored.id, name: stored.name });
    session.currentState = snapshotToState(JSON.parse(stored.state));
    session.commandHistory = stored.commandHistory;
    session.undoStack = stored.undoStack.map((s) => JSON.parse(s));
    session.redoStack = stored.redoStack.map((s) => JSON.parse(s));
    session.createdAt = stored.createdAt;
    session.updatedAt = stored.updatedAt;

    return session;
  }

  /**
   * Delete this session from storage
   */
  async delete(): Promise<void> {
    await deleteSession(this.id);
  }

  /**
   * Clear all history (but keep current state)
   */
  clearHistory(): void {
    this.commandHistory = [];
    this.undoStack = [];
    this.redoStack = [];
    this.updatedAt = Date.now();
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.currentState = GitEngine.createInitialState();
    this.commandHistory = [];
    this.undoStack = [];
    this.redoStack = [];
    this.updatedAt = Date.now();
  }

  /**
   * Get session metadata
   */
  getMetadata(): {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    commandCount: number;
    commitCount: number;
    branchCount: number;
  } {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      commandCount: this.commandHistory.length,
      commitCount: this.currentState.commits.size,
      branchCount: this.currentState.branches.size,
    };
  }
}

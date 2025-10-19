/**
 * TutorialEngine - Orchestrates tutorial presentation and progression
 * Manages tutorial steps, state, and validation
 */

import type { GitState } from '@/cli/types';
import type {
  Level,
  TutorialState,
  TutorialStep,
  ValidationResult,
  UserProgress,
} from './types';
import { snapshotToState, cloneState } from './stateUtils';
import { validateSolution } from './validator';
import {
  loadProgress,
  saveProgress,
  updateLevelProgress,
  createInitialProgress,
} from './ProgressTracker';

/**
 * Tutorial Engine class
 */
export class TutorialEngine {
  private state: TutorialState;
  private userId: string;
  private userProgress: UserProgress | null = null;
  private onStateChange?: (state: TutorialState) => void;

  constructor(userId: string = 'default') {
    this.userId = userId;
    this.state = {
      currentLevel: null,
      currentStepIndex: 0,
      userState: this.createEmptyState(),
      commandHistory: [],
      active: false,
      currentHintIndex: 0,
    };
  }

  /**
   * Initialize the engine and load user progress
   */
  async initialize(): Promise<void> {
    this.userProgress = await loadProgress(this.userId);
    if (!this.userProgress) {
      this.userProgress = createInitialProgress(this.userId);
      await saveProgress(this.userProgress);
    }
  }

  /**
   * Load and start a level
   */
  async startLevel(level: Level): Promise<void> {
    // Convert initial state from snapshot
    const initialState = snapshotToState(level.initialState);

    this.state = {
      currentLevel: level,
      currentStepIndex: 0,
      userState: cloneState(initialState),
      commandHistory: [],
      active: true,
      currentHintIndex: 0,
    };

    this.notifyStateChange();
  }

  /**
   * Get current tutorial state
   */
  getState(): TutorialState {
    return this.state;
  }

  /**
   * Get current tutorial step
   */
  getCurrentStep(): TutorialStep | null {
    if (!this.state.currentLevel || !this.state.active) return null;
    return this.state.currentLevel.tutorialSteps[this.state.currentStepIndex] || null;
  }

  /**
   * Move to next tutorial step
   */
  next(): boolean {
    if (!this.state.currentLevel || !this.state.active) return false;

    const totalSteps = this.state.currentLevel.tutorialSteps.length;
    if (this.state.currentStepIndex < totalSteps - 1) {
      this.state.currentStepIndex++;
      this.notifyStateChange();
      return true;
    }

    return false;
  }

  /**
   * Move to previous tutorial step
   */
  prev(): boolean {
    if (!this.state.currentLevel || !this.state.active) return false;

    if (this.state.currentStepIndex > 0) {
      this.state.currentStepIndex--;
      this.notifyStateChange();
      return true;
    }

    return false;
  }

  /**
   * Get current hint
   */
  showHint(locale: string = 'en_US'): string[] | null {
    if (!this.state.currentLevel) return null;

    const hints = this.state.currentLevel.hints;
    if (hints.length === 0) return null;

    const hintIndex = Math.min(this.state.currentHintIndex, hints.length - 1);
    const hint = hints[hintIndex];

    // Increment hint index for next time
    if (this.state.currentHintIndex < hints.length - 1) {
      this.state.currentHintIndex++;
    }

    return hint[locale] || hint['en_US'] || null;
  }

  /**
   * Update user state after a command
   */
  updateState(newState: GitState, command: string): void {
    this.state.userState = cloneState(newState);
    this.state.commandHistory.push(command);
    this.notifyStateChange();
  }

  /**
   * Validate current solution
   */
  validateSolution(): ValidationResult {
    if (!this.state.currentLevel) {
      return {
        valid: false,
        message: 'No level loaded',
      };
    }

    const commandsUsed = this.state.commandHistory.length;
    return validateSolution(
      this.state.userState,
      this.state.currentLevel,
      commandsUsed,
    );
  }

  /**
   * Complete the current level
   */
  async completeLevel(result: ValidationResult): Promise<void> {
    if (!this.state.currentLevel || !this.userProgress) return;

    const level = this.state.currentLevel;
    const commandsUsed = this.state.commandHistory.length;
    const optimalCommands = level.solutionCommands.length;

    // Update progress
    this.userProgress = updateLevelProgress(
      this.userProgress,
      level.id,
      commandsUsed,
      optimalCommands,
      this.state.currentHintIndex,
    );

    // Save progress
    await saveProgress(this.userProgress);

    // Mark as inactive
    this.state.active = false;
    this.notifyStateChange();
  }

  /**
   * Reset level to initial state
   */
  reset(): void {
    if (!this.state.currentLevel) return;

    const initialState = snapshotToState(this.state.currentLevel.initialState);
    this.state.userState = cloneState(initialState);
    this.state.commandHistory = [];
    this.state.currentHintIndex = 0;
    this.notifyStateChange();
  }

  /**
   * Get user progress
   */
  getUserProgress(): UserProgress | null {
    return this.userProgress;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: TutorialState) => void): () => void {
    this.onStateChange = callback;
    return () => {
      this.onStateChange = undefined;
    };
  }

  /**
   * Notify subscribers of state change
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  /**
   * Create an empty Git state
   */
  private createEmptyState(): GitState {
    return {
      commits: new Map(),
      branches: new Map(),
      tags: new Map(),
      head: { type: 'branch', name: 'main' },
    };
  }

  /**
   * Check if tutorial is active
   */
  isActive(): boolean {
    return this.state.active;
  }

  /**
   * Get current level
   */
  getCurrentLevel(): Level | null {
    return this.state.currentLevel;
  }

  /**
   * Get command history
   */
  getCommandHistory(): string[] {
    return [...this.state.commandHistory];
  }

  /**
   * Get commands used vs optimal
   */
  getScore(): { used: number; optimal: number } | null {
    if (!this.state.currentLevel) return null;

    return {
      used: this.state.commandHistory.length,
      optimal: this.state.currentLevel.solutionCommands.length,
    };
  }
}

/**
 * Create a global tutorial engine instance
 */
let globalEngine: TutorialEngine | null = null;

/**
 * Get or create the global tutorial engine
 */
export function getTutorialEngine(userId: string = 'default'): TutorialEngine {
  if (!globalEngine || globalEngine['userId'] !== userId) {
    globalEngine = new TutorialEngine(userId);
  }
  return globalEngine;
}

/**
 * Reset the global tutorial engine
 */
export function resetTutorialEngine(): void {
  globalEngine = null;
}

/**
 * Unit tests for TutorialEngine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TutorialEngine } from '../TutorialEngine';
import { loadLevel } from '../LevelStore';
import type { GitState } from '@/cli/types';

// Mock progress persistence
vi.mock('../ProgressTracker', () => ({
  loadProgress: vi.fn().mockResolvedValue(null),
  saveProgress: vi.fn().mockResolvedValue({ success: true }),
  createInitialProgress: vi.fn().mockReturnValue({
    userId: 'test',
    locale: 'en_US',
    levels: new Map(),
    unlockedSequences: new Set(['intro']),
    lastUpdated: Date.now(),
  }),
  updateLevelProgress: vi.fn((progress) => progress),
}));

describe('TutorialEngine', () => {
  let engine: TutorialEngine;

  beforeEach(async () => {
    engine = new TutorialEngine('test-user');
    await engine.initialize();
  });

  describe('initialization', () => {
    it('should initialize with inactive state', () => {
      const state = engine.getState();

      expect(state.active).toBe(false);
      expect(state.currentLevel).toBeNull();
      expect(state.currentStepIndex).toBe(0);
      expect(state.commandHistory).toEqual([]);
    });
  });

  describe('startLevel', () => {
    it('should load and start a level', async () => {
      const levelResult = await loadLevel('intro1');
      expect(levelResult.success).toBe(true);

      if (levelResult.success) {
        await engine.startLevel(levelResult.level);

        const state = engine.getState();
        expect(state.active).toBe(true);
        expect(state.currentLevel?.id).toBe('intro1');
        expect(state.currentStepIndex).toBe(0);
      }
    });

    it('should reset state when starting a new level', async () => {
      const levelResult = await loadLevel('intro1');
      if (!levelResult.success) return;

      await engine.startLevel(levelResult.level);
      engine.updateState(engine.getState().userState, 'git commit');

      // Start another level
      const level2Result = await loadLevel('intro2');
      if (!level2Result.success) return;

      await engine.startLevel(level2Result.level);

      const state = engine.getState();
      expect(state.commandHistory).toEqual([]);
      expect(state.currentStepIndex).toBe(0);
    });
  });

  describe('navigation', () => {
    beforeEach(async () => {
      const levelResult = await loadLevel('intro1');
      if (levelResult.success) {
        await engine.startLevel(levelResult.level);
      }
    });

    it('should move to next step', () => {
      const result = engine.next();

      expect(result).toBe(true);
      expect(engine.getState().currentStepIndex).toBe(1);
    });

    it('should move to previous step', () => {
      engine.next();
      const result = engine.prev();

      expect(result).toBe(true);
      expect(engine.getState().currentStepIndex).toBe(0);
    });

    it('should not go before first step', () => {
      const result = engine.prev();

      expect(result).toBe(false);
      expect(engine.getState().currentStepIndex).toBe(0);
    });

    it('should not go beyond last step', () => {
      const level = engine.getCurrentLevel();
      if (!level) return;

      const totalSteps = level.tutorialSteps.length;
      
      // Move to last step
      for (let i = 0; i < totalSteps - 1; i++) {
        engine.next();
      }

      // Try to go beyond
      const result = engine.next();

      expect(result).toBe(false);
      expect(engine.getState().currentStepIndex).toBe(totalSteps - 1);
    });
  });

  describe('getCurrentStep', () => {
    it('should return null when no level is loaded', () => {
      const step = engine.getCurrentStep();

      expect(step).toBeNull();
    });

    it('should return current tutorial step', async () => {
      const levelResult = await loadLevel('intro1');
      if (!levelResult.success) return;

      await engine.startLevel(levelResult.level);
      const step = engine.getCurrentStep();

      expect(step).not.toBeNull();
      expect(step?.type).toBe('dialog');
    });
  });

  describe('updateState', () => {
    beforeEach(async () => {
      const levelResult = await loadLevel('intro1');
      if (levelResult.success) {
        await engine.startLevel(levelResult.level);
      }
    });

    it('should update user state and command history', () => {
      const newState: GitState = {
        commits: new Map(),
        branches: new Map(),
        tags: new Map(),
        head: { type: 'branch', name: 'main' },
      };

      engine.updateState(newState, 'git commit');

      const state = engine.getState();
      expect(state.commandHistory).toEqual(['git commit']);
    });

    it('should accumulate command history', () => {
      const newState: GitState = {
        commits: new Map(),
        branches: new Map(),
        tags: new Map(),
        head: { type: 'branch', name: 'main' },
      };

      engine.updateState(newState, 'git commit');
      engine.updateState(newState, 'git branch feature');

      const state = engine.getState();
      expect(state.commandHistory).toEqual(['git commit', 'git branch feature']);
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      const levelResult = await loadLevel('intro1');
      if (levelResult.success) {
        await engine.startLevel(levelResult.level);
      }
    });

    it('should reset level to initial state', () => {
      const newState: GitState = {
        commits: new Map(),
        branches: new Map(),
        tags: new Map(),
        head: { type: 'branch', name: 'main' },
      };

      engine.updateState(newState, 'git commit');
      engine.updateState(newState, 'git branch feature');

      engine.reset();

      const state = engine.getState();
      expect(state.commandHistory).toEqual([]);
      expect(state.currentHintIndex).toBe(0);
    });
  });

  describe('hints', () => {
    beforeEach(async () => {
      const levelResult = await loadLevel('intro1');
      if (levelResult.success) {
        await engine.startLevel(levelResult.level);
      }
    });

    it('should show hints in order', () => {
      const hint1 = engine.showHint();
      expect(hint1).not.toBeNull();

      // For intro1, we have one hint
      const state = engine.getState();
      expect(state.currentHintIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getScore', () => {
    it('should return null when no level is loaded', () => {
      const score = engine.getScore();

      expect(score).toBeNull();
    });

    it('should return score for active level', async () => {
      const levelResult = await loadLevel('intro1');
      if (!levelResult.success) return;

      await engine.startLevel(levelResult.level);
      
      const newState: GitState = {
        commits: new Map(),
        branches: new Map(),
        tags: new Map(),
        head: { type: 'branch', name: 'main' },
      };

      engine.updateState(newState, 'git commit');
      engine.updateState(newState, 'git commit');

      const score = engine.getScore();

      expect(score).not.toBeNull();
      expect(score?.used).toBe(2);
      expect(score?.optimal).toBe(1); // intro1 solution is 1 command
    });
  });
});

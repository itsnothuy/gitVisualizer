/**
 * Unit tests for ProgressTracker
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialProgress,
  updateLevelProgress,
  isLevelCompleted,
  isSequenceUnlocked,
  unlockSequence,
  getSequenceStats,
} from '../ProgressTracker';

describe('ProgressTracker', () => {
  describe('createInitialProgress', () => {
    it('should create initial progress with default values', () => {
      const progress = createInitialProgress('user123');

      expect(progress.userId).toBe('user123');
      expect(progress.locale).toBe('en_US');
      expect(progress.levels.size).toBe(0);
      expect(progress.unlockedSequences.has('intro')).toBe(true);
      expect(progress.lastUpdated).toBeGreaterThan(0);
    });

    it('should create initial progress with custom locale', () => {
      const progress = createInitialProgress('user123', 'de_DE');

      expect(progress.locale).toBe('de_DE');
    });
  });

  describe('updateLevelProgress', () => {
    it('should update progress for a completed level', () => {
      const progress = createInitialProgress('user123');
      const updated = updateLevelProgress(progress, 'intro1', 1, 1, 0);

      const levelProgress = updated.levels.get('intro1');
      expect(levelProgress).toBeDefined();
      expect(levelProgress?.completed).toBe(true);
      expect(levelProgress?.commandsUsed).toBe(1);
      expect(levelProgress?.optimalCommands).toBe(1);
      expect(levelProgress?.bestScore).toBe(1);
      expect(levelProgress?.hintsUsed).toBe(0);
    });

    it('should track best score across multiple attempts', () => {
      const progress = createInitialProgress('user123');
      
      // First attempt: 3 commands
      let updated = updateLevelProgress(progress, 'intro1', 3, 1, 0);
      expect(updated.levels.get('intro1')?.bestScore).toBe(3);

      // Second attempt: 2 commands (better)
      updated = updateLevelProgress(updated, 'intro1', 2, 1, 0);
      expect(updated.levels.get('intro1')?.bestScore).toBe(2);

      // Third attempt: 4 commands (worse)
      updated = updateLevelProgress(updated, 'intro1', 4, 1, 0);
      expect(updated.levels.get('intro1')?.bestScore).toBe(2); // Still 2
    });

    it('should accumulate hints used', () => {
      const progress = createInitialProgress('user123');
      
      let updated = updateLevelProgress(progress, 'intro1', 1, 1, 1);
      expect(updated.levels.get('intro1')?.hintsUsed).toBe(1);

      updated = updateLevelProgress(updated, 'intro1', 1, 1, 2);
      expect(updated.levels.get('intro1')?.hintsUsed).toBe(3);
    });
  });

  describe('isLevelCompleted', () => {
    it('should return false for incomplete level', () => {
      const progress = createInitialProgress('user123');

      expect(isLevelCompleted(progress, 'intro1')).toBe(false);
    });

    it('should return true for completed level', () => {
      const progress = createInitialProgress('user123');
      const updated = updateLevelProgress(progress, 'intro1', 1, 1, 0);

      expect(isLevelCompleted(updated, 'intro1')).toBe(true);
    });
  });

  describe('isSequenceUnlocked', () => {
    it('should return true for intro sequence by default', () => {
      const progress = createInitialProgress('user123');

      expect(isSequenceUnlocked(progress, 'intro')).toBe(true);
    });

    it('should return false for locked sequences', () => {
      const progress = createInitialProgress('user123');

      expect(isSequenceUnlocked(progress, 'rampup')).toBe(false);
      expect(isSequenceUnlocked(progress, 'advanced')).toBe(false);
    });

    it('should return true after unlocking a sequence', () => {
      const progress = createInitialProgress('user123');
      const updated = unlockSequence(progress, 'rampup');

      expect(isSequenceUnlocked(updated, 'rampup')).toBe(true);
    });
  });

  describe('unlockSequence', () => {
    it('should unlock a sequence', () => {
      const progress = createInitialProgress('user123');
      const updated = unlockSequence(progress, 'rampup');

      expect(updated.unlockedSequences.has('rampup')).toBe(true);
      expect(updated.lastUpdated).toBeGreaterThanOrEqual(progress.lastUpdated);
    });

    it('should not duplicate unlocked sequences', () => {
      const progress = createInitialProgress('user123');
      let updated = unlockSequence(progress, 'rampup');
      updated = unlockSequence(updated, 'rampup');

      expect(updated.unlockedSequences.size).toBe(2); // intro + rampup
    });
  });

  describe('getSequenceStats', () => {
    it('should return correct stats for empty progress', () => {
      const progress = createInitialProgress('user123');
      const stats = getSequenceStats(progress, ['intro1', 'intro2', 'intro3']);

      expect(stats.completed).toBe(0);
      expect(stats.total).toBe(3);
      expect(stats.percentage).toBe(0);
    });

    it('should return correct stats for partial progress', () => {
      let progress = createInitialProgress('user123');
      progress = updateLevelProgress(progress, 'intro1', 1, 1, 0);
      progress = updateLevelProgress(progress, 'intro2', 2, 2, 0);

      const stats = getSequenceStats(progress, ['intro1', 'intro2', 'intro3']);

      expect(stats.completed).toBe(2);
      expect(stats.total).toBe(3);
      expect(stats.percentage).toBe(67); // 2/3 * 100 = 66.67 rounded to 67
    });

    it('should return correct stats for complete sequence', () => {
      let progress = createInitialProgress('user123');
      progress = updateLevelProgress(progress, 'intro1', 1, 1, 0);
      progress = updateLevelProgress(progress, 'intro2', 2, 2, 0);
      progress = updateLevelProgress(progress, 'intro3', 1, 1, 0);

      const stats = getSequenceStats(progress, ['intro1', 'intro2', 'intro3']);

      expect(stats.completed).toBe(3);
      expect(stats.total).toBe(3);
      expect(stats.percentage).toBe(100);
    });

    it('should handle empty level list', () => {
      const progress = createInitialProgress('user123');
      const stats = getSequenceStats(progress, []);

      expect(stats.completed).toBe(0);
      expect(stats.total).toBe(0);
      expect(stats.percentage).toBe(0);
    });
  });
});

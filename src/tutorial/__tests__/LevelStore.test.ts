/**
 * Unit tests for LevelStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadLevel,
  loadSequence,
  getAllSequences,
  getLevelsForSequence,
  clearCache,
} from '../LevelStore';

describe('LevelStore', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('loadLevel', () => {
    it('should load intro1 level successfully', async () => {
      const result = await loadLevel('intro1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level.id).toBe('intro1');
        expect(result.level.difficulty).toBe('intro');
        expect(result.level.name.en_US).toBe('Introduction to Commits');
        expect(result.level.tutorialSteps.length).toBeGreaterThan(0);
      }
    });

    it('should load intro2 level successfully', async () => {
      const result = await loadLevel('intro2');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level.id).toBe('intro2');
        expect(result.level.name.en_US).toBe('Branching in Git');
      }
    });

    it('should load intro3 level successfully', async () => {
      const result = await loadLevel('intro3');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level.id).toBe('intro3');
        expect(result.level.name.en_US).toBe('Merging Branches');
      }
    });

    it('should fail to load non-existent level', async () => {
      const result = await loadLevel('nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('nonexistent');
      }
    });

    it('should cache loaded levels', async () => {
      const result1 = await loadLevel('intro1');
      const result2 = await loadLevel('intro1');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        // Should be the same object (cached)
        expect(result1.level).toBe(result2.level);
      }
    });
  });

  describe('loadSequence', () => {
    it('should load intro sequence successfully', async () => {
      const result = await loadSequence('intro');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.sequence.id).toBe('intro');
        expect(result.sequence.name.en_US).toBe('Introduction to Git');
        expect(result.sequence.levelIds).toContain('intro1');
        expect(result.sequence.levelIds).toContain('intro2');
        expect(result.sequence.levelIds).toContain('intro3');
      }
    });

    it('should load rampup sequence successfully', async () => {
      const result = await loadSequence('rampup');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.sequence.id).toBe('rampup');
        expect(result.sequence.locked).toBe(true);
      }
    });

    it('should fail to load non-existent sequence', async () => {
      const result = await loadSequence('nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('nonexistent');
      }
    });
  });

  describe('getAllSequences', () => {
    it('should load all available sequences', async () => {
      const sequences = await getAllSequences();

      expect(sequences.length).toBeGreaterThan(0);
      expect(sequences.some((s) => s.id === 'intro')).toBe(true);
      expect(sequences.some((s) => s.id === 'rampup')).toBe(true);
      expect(sequences.some((s) => s.id === 'advanced')).toBe(true);
    });
  });

  describe('getLevelsForSequence', () => {
    it('should load all levels for intro sequence', async () => {
      const levels = await getLevelsForSequence('intro');

      expect(levels.length).toBe(3);
      expect(levels[0].id).toBe('intro1');
      expect(levels[1].id).toBe('intro2');
      expect(levels[2].id).toBe('intro3');
    });

    it('should return empty array for non-existent sequence', async () => {
      const levels = await getLevelsForSequence('nonexistent');

      expect(levels).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', async () => {
      // Load a level
      const result1 = await loadLevel('intro1');
      expect(result1.success).toBe(true);

      // Clear cache
      clearCache();

      // Load again - should reload from file
      const result2 = await loadLevel('intro1');
      expect(result2.success).toBe(true);

      // Content should be the same
      if (result1.success && result2.success) {
        expect(result1.level.id).toBe(result2.level.id);
        expect(result1.level.name.en_US).toBe(result2.level.name.en_US);
      }
    });
  });
});

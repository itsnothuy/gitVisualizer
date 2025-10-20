/**
 * Tests for Level Validation
 */

import type { Level } from '@/tutorial/types';
import { describe, expect, it } from 'vitest';
import {
  isValidLevelId,
  sanitizeLevelId,
  validateLevel,
} from '../validation';

describe('Level Validation', () => {
  const validLevel: Level = {
    id: 'test-level-1',
    name: { en_US: 'Test Level' },
    description: { en_US: 'A test level' },
    difficulty: 'intro',
    order: 1,
    initialState: {
      commits: [
        { id: 'C0', parents: [], message: 'Initial', timestamp: 1700000000000 },
      ],
      branches: [{ name: 'main', target: 'C0' }],
      tags: [],
      head: { type: 'branch', name: 'main' },
    },
    goalState: {
      commits: [
        { id: 'C0', parents: [], message: 'Initial', timestamp: 1700000000000 },
        { id: 'C1', parents: ['C0'], message: 'New', timestamp: 1700000001000 },
      ],
      branches: [{ name: 'main', target: 'C1' }],
      tags: [],
      head: { type: 'branch', name: 'main' },
    },
    tutorialSteps: [
      {
        type: 'challenge',
        id: 'test-challenge',
        instructions: { en_US: ['Complete the challenge'] },
        hints: [],
      },
    ],
    solutionCommands: ['git commit'],
    hints: [],
  };

  describe('validateLevel', () => {
    it('should validate a correct level', () => {
      const result = validateLevel(validLevel);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject level without id', () => {
      const level = { ...validLevel, id: '' };
      const result = validateLevel(level);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'id')).toBe(true);
    });

    it('should reject level with invalid id characters', () => {
      const level = { ...validLevel, id: 'test level!' };
      const result = validateLevel(level);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'id')).toBe(true);
    });

    it('should reject level without name', () => {
      const level = { ...validLevel, name: {} };
      const result = validateLevel(level);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('should warn if name is missing en_US translation', () => {
      const level = { ...validLevel, name: { de_DE: 'Test' } };
      const result = validateLevel(level);
      expect(result.warnings.some((w) => w.field === 'name')).toBe(true);
    });

    it('should reject level with invalid difficulty', () => {
      // Cast via unknown to bypass static typing for an intentionally invalid runtime case
      const level = { ...validLevel, difficulty: 'super-hard' } as unknown as Level;
      const result = validateLevel(level);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'difficulty')).toBe(true);
    });

    it('should reject level without initial state', () => {
      const level = { ...validLevel, initialState: undefined } as unknown as Level;
      const result = validateLevel(level);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'initialState')).toBe(true);
    });

    it('should reject level with invalid commit structure', () => {
      const level = {
        ...validLevel,
        initialState: {
          ...validLevel.initialState,
          commits: [{ id: '', parents: [], message: '', timestamp: 0 }],
        },
      };
      const result = validateLevel(level);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field.includes('commits'))).toBe(true);
    });

    it('should reject level without tutorial steps', () => {
      const level = { ...validLevel, tutorialSteps: [] };
      const result = validateLevel(level);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'tutorialSteps')).toBe(true);
    });

    it('should warn if solution commands are missing', () => {
      const level = { ...validLevel, solutionCommands: [] };
      const result = validateLevel(level);
      expect(result.warnings.some((w) => w.field === 'solutionCommands')).toBe(true);
    });
  });

  describe('isValidLevelId', () => {
    it('should accept valid level IDs', () => {
      expect(isValidLevelId('test-level-1')).toBe(true);
      expect(isValidLevelId('intro_1')).toBe(true);
      expect(isValidLevelId('advanced-rebase')).toBe(true);
    });

    it('should reject invalid level IDs', () => {
      expect(isValidLevelId('')).toBe(false);
      expect(isValidLevelId('test level')).toBe(false);
      expect(isValidLevelId('test!level')).toBe(false);
      expect(isValidLevelId('test.level')).toBe(false);
    });
  });

  describe('sanitizeLevelId', () => {
    it('should convert spaces to hyphens', () => {
      expect(sanitizeLevelId('test level')).toBe('test-level');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeLevelId('test!@#level')).toBe('test-level');
    });

    it('should collapse multiple hyphens', () => {
      expect(sanitizeLevelId('test---level')).toBe('test-level');
    });

    it('should trim leading and trailing hyphens', () => {
      expect(sanitizeLevelId('-test-level-')).toBe('test-level');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeLevelId('TestLevel')).toBe('testlevel');
    });
  });
});

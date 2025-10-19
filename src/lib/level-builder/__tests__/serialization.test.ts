/**
 * Tests for Level Serialization
 */

import { describe, it, expect } from 'vitest';
import {
  serializeLevel,
  deserializeLevel,
  generateLevelId,
  generateLevelShareURL,
  parseLevelFromURL,
} from '../serialization';
import type { Level } from '@/tutorial/types';

describe('Level Serialization', () => {
  const testLevel: Level = {
    id: 'test-level',
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

  describe('serializeLevel', () => {
    it('should serialize level with metadata', () => {
      const json = serializeLevel(testLevel, 'testuser');
      const parsed = JSON.parse(json);
      
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.version).toBe('1.0');
      expect(parsed.metadata.creator).toBe('testuser');
      expect(parsed.metadata.createdAt).toBeGreaterThan(0);
      expect(parsed.level).toEqual(testLevel);
    });

    it('should serialize without creator', () => {
      const json = serializeLevel(testLevel);
      const parsed = JSON.parse(json);
      
      expect(parsed.metadata.creator).toBeUndefined();
      expect(parsed.level).toEqual(testLevel);
    });
  });

  describe('deserializeLevel', () => {
    it('should deserialize level with metadata', () => {
      const json = serializeLevel(testLevel, 'testuser');
      const { level, metadata } = deserializeLevel(json);
      
      expect(level).toEqual(testLevel);
      expect(metadata.creator).toBe('testuser');
      expect(metadata.version).toBe('1.0');
    });

    it('should deserialize legacy format (direct level object)', () => {
      const json = JSON.stringify(testLevel);
      const { level, metadata } = deserializeLevel(json);
      
      expect(level).toEqual(testLevel);
      expect(metadata.toolVersion).toBe('unknown');
    });
  });

  describe('generateLevelId', () => {
    it('should generate id from name', () => {
      expect(generateLevelId('Test Level')).toBe('test-level');
    });

    it('should handle special characters', () => {
      expect(generateLevelId('Test! Level? #1')).toBe('test-level-1');
    });

    it('should collapse multiple spaces', () => {
      expect(generateLevelId('Test    Level')).toBe('test-level');
    });

    it('should trim leading and trailing hyphens', () => {
      expect(generateLevelId('!Test Level!')).toBe('test-level');
    });
  });

  describe('generateLevelShareURL', () => {
    it('should generate share URL for small level', () => {
      const url = generateLevelShareURL(testLevel, 'https://example.com/build-level');
      
      expect(url).toBeDefined();
      expect(url).toContain('https://example.com/build-level');
      expect(url).toContain('?level=');
    });

    it('should return null for very large levels', () => {
      // Create a level with many commits to make it large
      const largeLevel: Level = {
        ...testLevel,
        goalState: {
          ...testLevel.goalState,
          commits: Array.from({ length: 100 }, (_, i) => ({
            id: `C${i}`,
            parents: i === 0 ? [] : [`C${i - 1}`],
            message: `Commit ${i} with a long message to make the JSON larger`,
            timestamp: 1700000000000 + i,
          })),
        },
      };

      const url = generateLevelShareURL(largeLevel, 'https://example.com/build-level');
      
      // Should return null because the URL would be too long
      expect(url).toBeNull();
    });
  });

  describe('parseLevelFromURL', () => {
    it('should parse level from valid URL', () => {
      const url = generateLevelShareURL(testLevel, 'https://example.com/build-level');
      
      if (url) {
        const parsed = parseLevelFromURL(url);
        expect(parsed).toEqual(testLevel);
      }
    });

    it('should return null for URL without level parameter', () => {
      const parsed = parseLevelFromURL('https://example.com/build-level');
      expect(parsed).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      const parsed = parseLevelFromURL('https://example.com/build-level?level=invalid');
      expect(parsed).toBeNull();
    });
  });
});

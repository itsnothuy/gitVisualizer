/**
 * Tests for permalink utilities
 */

import { describe, it, expect } from 'vitest';
import {
  encodeStateToBase64,
  decodeStateFromBase64,
  generatePermalink,
  parsePermalink,
  compressStateForURL,
  canFitInURL,
} from '../permalink';
import type { GitStateSnapshot } from '@/tutorial/types';

describe('permalink utilities', () => {
  const sampleState: GitStateSnapshot = {
    commits: [
      {
        id: 'abc123',
        parents: [],
        message: 'Initial commit',
        timestamp: 1234567890,
      },
      {
        id: 'def456',
        parents: ['abc123'],
        message: 'Second commit',
        timestamp: 1234567900,
      },
    ],
    branches: [
      { name: 'main', target: 'def456' },
      { name: 'feature', target: 'abc123' },
    ],
    tags: [{ name: 'v1.0', target: 'abc123' }],
    head: { type: 'branch', name: 'main' },
  };

  describe('encodeStateToBase64', () => {
    it('should encode state to base64', () => {
      const encoded = encodeStateToBase64(sampleState);
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
    });

    it('should produce valid base64', () => {
      const encoded = encodeStateToBase64(sampleState);
      // Base64 only contains A-Z, a-z, 0-9, +, /, =
      expect(encoded).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });

  describe('decodeStateFromBase64', () => {
    it('should decode base64 to state', () => {
      const encoded = encodeStateToBase64(sampleState);
      const decoded = decodeStateFromBase64(encoded);
      expect(decoded).toEqual(sampleState);
    });

    it('should throw error for invalid base64', () => {
      expect(() => decodeStateFromBase64('not-valid-base64!!!')).toThrow();
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = btoa('not valid json');
      expect(() => decodeStateFromBase64(invalidJson)).toThrow();
    });
  });

  describe('generatePermalink', () => {
    const baseUrl = 'http://localhost:3000/sandbox';

    it('should generate permalink for small state', () => {
      const result = generatePermalink(sampleState, baseUrl);
      expect(result).toBeTruthy();
      expect(result?.url).toContain(baseUrl);
      expect(result?.url).toContain('?state=');
      expect(result?.isTruncated).toBe(false);
    });

    it('should return null for very large state', () => {
      // Create a very large state
      const largeState: GitStateSnapshot = {
        ...sampleState,
        commits: Array.from({ length: 1000 }, (_, i) => ({
          id: `commit-${i}`,
          parents: i > 0 ? [`commit-${i - 1}`] : [],
          message: `Commit message ${i}`.repeat(50), // Long messages
          timestamp: Date.now(),
        })),
      };

      const result = generatePermalink(largeState, baseUrl);
      expect(result).toBeNull();
    });
  });

  describe('parsePermalink', () => {
    const baseUrl = 'http://localhost:3000/sandbox';

    it('should parse valid permalink', () => {
      const result = generatePermalink(sampleState, baseUrl);
      expect(result).toBeTruthy();

      const parsed = parsePermalink(result!.url);
      expect(parsed).toEqual(sampleState);
    });

    it('should return null for URL without state param', () => {
      const parsed = parsePermalink('http://localhost:3000/sandbox');
      expect(parsed).toBeNull();
    });

    it('should return null for invalid URL', () => {
      const parsed = parsePermalink('not-a-url');
      expect(parsed).toBeNull();
    });
  });

  describe('compressStateForURL', () => {
    it('should compress state by removing optional fields', () => {
      const stateWithAuthor: GitStateSnapshot = {
        ...sampleState,
        commits: [
          {
            id: 'abc123',
            parents: [],
            message: 'Initial commit',
            author: 'John Doe',
            timestamp: 1234567890,
          },
        ],
      };

      const compressed = compressStateForURL(stateWithAuthor);
      expect(compressed.commits[0]).not.toHaveProperty('author');
      expect(compressed.commits[0]).toHaveProperty('message');
    });
  });

  describe('canFitInURL', () => {
    const baseUrl = 'http://localhost:3000/sandbox';

    it('should return true for small state', () => {
      expect(canFitInURL(sampleState, baseUrl)).toBe(true);
    });

    it('should return false for very large state', () => {
      const largeState: GitStateSnapshot = {
        ...sampleState,
        commits: Array.from({ length: 1000 }, (_, i) => ({
          id: `commit-${i}`,
          parents: i > 0 ? [`commit-${i - 1}`] : [],
          message: `Commit message ${i}`.repeat(50),
          timestamp: Date.now(),
        })),
      };

      expect(canFitInURL(largeState, baseUrl)).toBe(false);
    });
  });

  describe('round-trip encoding', () => {
    it('should maintain state through encode-decode cycle', () => {
      const encoded = encodeStateToBase64(sampleState);
      const decoded = decodeStateFromBase64(encoded);
      const reEncoded = encodeStateToBase64(decoded);

      expect(encoded).toBe(reEncoded);
      expect(decoded).toEqual(sampleState);
    });

    it('should maintain state through permalink generation and parsing', () => {
      const baseUrl = 'http://localhost:3000/sandbox';
      const result = generatePermalink(sampleState, baseUrl);
      expect(result).toBeTruthy();

      const parsed = parsePermalink(result!.url);
      expect(parsed).toEqual(sampleState);
    });
  });
});

/**
 * Tests for GitHub URL parser
 */

import { describe, test, expect } from 'vitest';
import { parseGitHubUrl, isValidGitHubUrl, normalizeGitHubUrl } from '../url-parser';

describe('parseGitHubUrl', () => {
  test('parses standard HTTPS URL', () => {
    const result = parseGitHubUrl('https://github.com/facebook/react');
    expect(result).toEqual({
      owner: 'facebook',
      name: 'react',
      branch: undefined,
      path: undefined,
    });
  });

  test('parses HTTPS URL with .git extension', () => {
    const result = parseGitHubUrl('https://github.com/facebook/react.git');
    expect(result).toEqual({
      owner: 'facebook',
      name: 'react',
      branch: undefined,
      path: undefined,
    });
  });

  test('parses SSH URL', () => {
    const result = parseGitHubUrl('git@github.com:facebook/react.git');
    expect(result).toEqual({
      owner: 'facebook',
      name: 'react',
      branch: undefined,
      path: undefined,
    });
  });

  test('parses SSH URL without .git', () => {
    const result = parseGitHubUrl('git@github.com:facebook/react');
    expect(result).toEqual({
      owner: 'facebook',
      name: 'react',
      branch: undefined,
      path: undefined,
    });
  });

  test('parses short format owner/repo', () => {
    const result = parseGitHubUrl('facebook/react');
    expect(result).toEqual({
      owner: 'facebook',
      name: 'react',
      branch: undefined,
      path: undefined,
    });
  });

  test('parses URL with branch', () => {
    const result = parseGitHubUrl('https://github.com/facebook/react/tree/main');
    expect(result).toEqual({
      owner: 'facebook',
      name: 'react',
      branch: 'main',
      path: undefined,
    });
  });

  test('parses URL with branch and path', () => {
    const result = parseGitHubUrl('https://github.com/facebook/react/tree/main/packages');
    expect(result).toEqual({
      owner: 'facebook',
      name: 'react',
      branch: 'main',
      path: 'packages',
    });
  });

  test('handles HTTP (non-secure) URL', () => {
    const result = parseGitHubUrl('http://github.com/facebook/react');
    expect(result).toEqual({
      owner: 'facebook',
      name: 'react',
      branch: undefined,
      path: undefined,
    });
  });

  test('throws error for invalid URL', () => {
    expect(() => parseGitHubUrl('not-a-valid-url')).toThrow('Invalid GitHub URL format');
  });

  test('throws error for non-GitHub URL', () => {
    expect(() => parseGitHubUrl('https://gitlab.com/owner/repo')).toThrow('Invalid GitHub URL format');
  });

  test('throws error for empty string', () => {
    expect(() => parseGitHubUrl('')).toThrow('Invalid GitHub URL format');
  });

  test('handles whitespace in URL', () => {
    const result = parseGitHubUrl('  https://github.com/facebook/react  ');
    expect(result).toEqual({
      owner: 'facebook',
      name: 'react',
      branch: undefined,
      path: undefined,
    });
  });
});

describe('isValidGitHubUrl', () => {
  test('returns true for valid HTTPS URL', () => {
    expect(isValidGitHubUrl('https://github.com/facebook/react')).toBe(true);
  });

  test('returns true for valid SSH URL', () => {
    expect(isValidGitHubUrl('git@github.com:facebook/react.git')).toBe(true);
  });

  test('returns true for short format', () => {
    expect(isValidGitHubUrl('facebook/react')).toBe(true);
  });

  test('returns false for invalid URL', () => {
    expect(isValidGitHubUrl('not-a-valid-url')).toBe(false);
  });

  test('returns false for non-GitHub URL', () => {
    expect(isValidGitHubUrl('https://gitlab.com/owner/repo')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isValidGitHubUrl('')).toBe(false);
  });
});

describe('normalizeGitHubUrl', () => {
  test('normalizes SSH URL to HTTPS', () => {
    const result = normalizeGitHubUrl('git@github.com:facebook/react.git');
    expect(result).toBe('https://github.com/facebook/react');
  });

  test('normalizes short format to HTTPS', () => {
    const result = normalizeGitHubUrl('facebook/react');
    expect(result).toBe('https://github.com/facebook/react');
  });

  test('removes .git extension', () => {
    const result = normalizeGitHubUrl('https://github.com/facebook/react.git');
    expect(result).toBe('https://github.com/facebook/react');
  });

  test('keeps standard HTTPS URL unchanged', () => {
    const result = normalizeGitHubUrl('https://github.com/facebook/react');
    expect(result).toBe('https://github.com/facebook/react');
  });

  test('throws error for invalid URL', () => {
    expect(() => normalizeGitHubUrl('invalid-url')).toThrow('Invalid GitHub URL format');
  });
});

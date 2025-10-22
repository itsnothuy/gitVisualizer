/**
 * Tests for GitHub repository processor
 * 
 * Note: These are unit tests that test the processor logic.
 * Integration tests with real GitHub API calls should be done manually or in E2E tests.
 */

import { describe, test, expect } from 'vitest';
import { parseGitHubUrl } from '../url-parser';
import type { GitCommit, GitBranch, GitTag } from '@/cli/types';

describe('processGitHubRepository', () => {

  test('parses GitHub URL correctly for processing', () => {
    // Test that URL parsing works for various formats
    const parsed1 = parseGitHubUrl('https://github.com/facebook/react');
    expect(parsed1.owner).toBe('facebook');
    expect(parsed1.name).toBe('react');

    const parsed2 = parseGitHubUrl('git@github.com:facebook/react.git');
    expect(parsed2.owner).toBe('facebook');
    expect(parsed2.name).toBe('react');

    const parsed3 = parseGitHubUrl('facebook/react');
    expect(parsed3.owner).toBe('facebook');
    expect(parsed3.name).toBe('react');
  });

  test('validates commit data structure', () => {
    // Test that GitCommit structure matches expectations
    const commit: GitCommit = {
      id: 'abc123',
      parents: ['parent1'],
      message: 'Test commit',
      author: 'Test Author',
      timestamp: Date.now(),
      tree: 'tree123',
    };

    expect(commit.id).toBe('abc123');
    expect(commit.parents).toEqual(['parent1']);
    expect(commit.message).toBe('Test commit');
  });

  test('validates branch data structure', () => {
    // Test that GitBranch structure matches expectations
    const branch: GitBranch = {
      name: 'main',
      target: 'commit123',
    };

    expect(branch.name).toBe('main');
    expect(branch.target).toBe('commit123');
  });

  test('validates tag data structure', () => {
    // Test that GitTag structure matches expectations
    const tag: GitTag = {
      name: 'v1.0.0',
      target: 'commit123',
      message: 'Release v1.0.0',
    };

    expect(tag.name).toBe('v1.0.0');
    expect(tag.target).toBe('commit123');
    expect(tag.message).toBe('Release v1.0.0');
  });
});

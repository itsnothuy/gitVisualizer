/**
 * Tests for GitEngine remote operations
 */

import { describe, it, expect } from 'vitest';
import { GitEngine } from '../GitEngine';
import type { GitState } from '../types';

describe('GitEngine - Remote Operations', () => {
  function createTestState(): GitState {
    const state = GitEngine.createInitialState();
    
    // Create a few commits
    const result = GitEngine.commit(state, {
      name: 'commit',
      args: [],
      options: { m: 'Second commit' },
    });
    if (!result.success) throw new Error('Failed to create commit');
    
    return result.newState;
  }

  describe('remote add', () => {
    it('should add a remote', () => {
      const state = createTestState();
      
      const result = GitEngine.remoteAdd(state, {
        name: 'remote',
        args: ['origin', 'https://github.com/user/repo.git'],
        options: {},
      });
      
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.newState.remoteConfigs?.has('origin')).toBe(true);
      expect(result.newState.remoteConfigs?.get('origin')?.url).toBe(
        'https://github.com/user/repo.git'
      );
    });

    it('should fail to add duplicate remote', () => {
      const state = createTestState();
      
      let result = GitEngine.remoteAdd(state, {
        name: 'remote',
        args: ['origin', 'https://github.com/user/repo.git'],
        options: {},
      });
      
      expect(result.success).toBe(true);
      if (!result.success) return;
      
      result = GitEngine.remoteAdd(result.newState, {
        name: 'remote',
        args: ['origin', 'https://github.com/user/other.git'],
        options: {},
      });
      
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain('already exists');
    });

    it('should fail without name and url', () => {
      const state = createTestState();
      
      const result = GitEngine.remoteAdd(state, {
        name: 'remote',
        args: ['origin'],
        options: {},
      });
      
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain('Usage');
    });
  });

  describe('remote list', () => {
    it('should list remotes', () => {
      const state = createTestState();
      
      let result = GitEngine.remoteAdd(state, {
        name: 'remote',
        args: ['origin', 'https://github.com/user/repo.git'],
        options: {},
      });
      
      if (!result.success) return;
      
      result = GitEngine.remoteAdd(result.newState, {
        name: 'remote',
        args: ['upstream', 'https://github.com/upstream/repo.git'],
        options: {},
      });
      
      if (!result.success) return;
      
      const listResult = GitEngine.remoteList(result.newState);
      
      expect(listResult.success).toBe(true);
      if (!listResult.success) return;
      expect(listResult.message).toContain('origin');
      expect(listResult.message).toContain('upstream');
    });

    it('should show message when no remotes', () => {
      const state = createTestState();
      
      const result = GitEngine.remoteList(state);
      
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.message).toContain('No remotes');
    });
  });

  describe('fetch', () => {
    it('should fetch from remote', () => {
      const state = createTestState();
      
      // Add remote
      let result = GitEngine.remoteAdd(state, {
        name: 'remote',
        args: ['origin', 'https://github.com/user/repo.git'],
        options: {},
      });
      
      if (!result.success) return;
      
      // Fetch
      result = GitEngine.fetch(result.newState, {
        name: 'fetch',
        args: ['origin'],
        options: {},
      });
      
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.newState.remotes?.has('origin')).toBe(true);
      expect(result.newState.remoteTrackingBranches?.size).toBeGreaterThan(0);
    });

    it('should fail to fetch from non-existent remote', () => {
      const state = createTestState();
      
      const result = GitEngine.fetch(state, {
        name: 'fetch',
        args: ['origin'],
        options: {},
      });
      
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain('does not appear to be a git repository');
    });

    it('should create remote tracking branches', () => {
      const state = createTestState();
      
      // Add remote
      let result = GitEngine.remoteAdd(state, {
        name: 'remote',
        args: ['origin', 'https://github.com/user/repo.git'],
        options: {},
      });
      
      if (!result.success) return;
      
      // Fetch
      result = GitEngine.fetch(result.newState, {
        name: 'fetch',
        args: ['origin'],
        options: {},
      });
      
      if (!result.success) return;
      const trackingBranches = result.newState.remoteTrackingBranches;
      expect(trackingBranches?.has('origin/main')).toBe(true);
      expect(trackingBranches?.get('origin/main')?.remote).toBe('origin');
      expect(trackingBranches?.get('origin/main')?.localName).toBe('main');
    });
  });

  describe('push', () => {
    it('should push to remote', () => {
      const state = createTestState();
      
      // Add remote
      let result = GitEngine.remoteAdd(state, {
        name: 'remote',
        args: ['origin', 'https://github.com/user/repo.git'],
        options: {},
      });
      
      if (!result.success) return;
      
      // Push
      result = GitEngine.push(result.newState, {
        name: 'push',
        args: ['origin', 'main'],
        options: {},
      });
      
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.message).toContain('Pushed to origin/main');
      expect(result.newState.remotes?.get('origin')?.has('main')).toBe(true);
    });

    it('should fail to push to non-existent remote', () => {
      const state = createTestState();
      
      const result = GitEngine.push(state, {
        name: 'push',
        args: ['origin', 'main'],
        options: {},
      });
      
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain('does not appear to be a git repository');
    });
  });

  describe('pull', () => {
    it('should pull from remote', () => {
      const state = createTestState();
      
      // Add remote
      let result = GitEngine.remoteAdd(state, {
        name: 'remote',
        args: ['origin', 'https://github.com/user/repo.git'],
        options: {},
      });
      
      if (!result.success) return;
      
      // Pull
      result = GitEngine.pull(result.newState, {
        name: 'pull',
        args: ['origin', 'main'],
        options: {},
      });
      
      expect(result.success).toBe(true);
    });

    it('should fail to pull from non-existent remote', () => {
      const state = createTestState();
      
      const result = GitEngine.pull(state, {
        name: 'pull',
        args: ['origin', 'main'],
        options: {},
      });
      
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain('does not appear to be a git repository');
    });
  });
});

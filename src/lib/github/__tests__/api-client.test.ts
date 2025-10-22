/**
 * Tests for GitHub API client
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GitHubApiClient, GitHubApiError } from '../api-client';

// Mock fetch
global.fetch = vi.fn();

describe('GitHubApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRepository', () => {
    test('fetches repository data successfully', async () => {
      const mockResponse = {
        data: {
          repository: {
            name: 'react',
            owner: { login: 'facebook' },
            isPrivate: false,
            defaultBranchRef: {
              name: 'main',
              target: {
                history: {
                  totalCount: 100,
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: null,
                  },
                  nodes: [
                    {
                      oid: 'abc123',
                      message: 'Initial commit',
                      author: {
                        name: 'Test Author',
                        email: 'test@example.com',
                        date: '2024-01-01T00:00:00Z',
                      },
                      parents: {
                        nodes: [],
                      },
                    },
                  ],
                },
              },
            },
            refs: {
              nodes: [
                { name: 'main', target: { oid: 'abc123' } },
              ],
            },
            tags: {
              nodes: [],
            },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => mockResponse,
      });

      const client = new GitHubApiClient();
      const result = await client.getRepository('facebook', 'react');

      expect(result.name).toBe('react');
      expect(result.owner.login).toBe('facebook');
      expect(result.defaultBranchRef.name).toBe('main');
      expect(result.defaultBranchRef.target.history.nodes).toHaveLength(1);
    });

    test('throws error when repository not found', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        text: async () => JSON.stringify({ message: 'Not Found' }),
      });

      const client = new GitHubApiClient();
      
      await expect(client.getRepository('nonexistent', 'repo')).rejects.toThrow(
        GitHubApiError
      );
    });

    test('includes authorization header when token provided', async () => {
      const mockResponse = {
        data: {
          repository: {
            name: 'test',
            owner: { login: 'test' },
            isPrivate: true,
            defaultBranchRef: {
              name: 'main',
              target: {
                history: {
                  totalCount: 0,
                  pageInfo: { hasNextPage: false, endCursor: null },
                  nodes: [],
                },
              },
            },
            refs: { nodes: [] },
            tags: { nodes: [] },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => mockResponse,
      });

      const client = new GitHubApiClient('test-token');
      await client.getRepository('test', 'test');

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = fetchCall[1].headers;
      expect(headers.Authorization).toBe('Bearer test-token');
    });

    test('handles GraphQL errors', async () => {
      const mockResponse = {
        data: null,
        errors: [
          { message: 'GraphQL error occurred' },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => mockResponse,
      });

      const client = new GitHubApiClient();
      
      await expect(client.getRepository('test', 'test')).rejects.toThrow(
        'GraphQL errors: GraphQL error occurred'
      );
    });
  });

  describe('getRateLimit', () => {
    test('fetches rate limit information', async () => {
      const mockResponse = {
        data: {
          rateLimit: {
            limit: 5000,
            remaining: 4999,
            resetAt: '2024-01-01T01:00:00Z',
            used: 1,
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => mockResponse,
      });

      const client = new GitHubApiClient('test-token');
      const rateLimit = await client.getRateLimit();

      expect(rateLimit.limit).toBe(5000);
      expect(rateLimit.remaining).toBe(4999);
      expect(rateLimit.used).toBe(1);
    });
  });
});

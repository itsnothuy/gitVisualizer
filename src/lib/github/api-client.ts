/**
 * GitHub API Client for repository data retrieval
 * 
 * Fetches repository metadata, commits, branches, and tags via GraphQL API.
 * Respects GitHub rate limits and provides progress feedback.
 * 
 * Privacy-first: Only fetches data when explicitly requested by user.
 */

import type { RateLimitInfo } from '../overlays/types';

/**
 * GitHub repository data from GraphQL API
 */
export interface GitHubRepository {
  /** Repository name */
  name: string;
  /** Repository owner */
  owner: {
    login: string;
  };
  /** Default branch reference */
  defaultBranchRef: {
    name: string;
    target: {
      history: {
        totalCount: number;
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
        nodes: GitHubCommit[];
      };
    };
  };
  /** All branches */
  refs: {
    nodes: Array<{
      name: string;
      target: {
        oid: string;
      };
    }>;
  };
  /** Tags */
  tags: {
    nodes: Array<{
      name: string;
      target: {
        oid: string;
      };
    }>;
  };
  /** Whether repository is private */
  isPrivate: boolean;
}

/**
 * GitHub commit from GraphQL API
 */
export interface GitHubCommit {
  /** Commit SHA */
  oid: string;
  /** Commit message */
  message: string;
  /** Commit author */
  author: {
    name: string;
    email: string;
    date: string;
  };
  /** Parent commits */
  parents: {
    nodes: Array<{
      oid: string;
    }>;
  };
}

/**
 * GitHub API response wrapper
 */
interface GitHubGraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    type?: string;
  }>;
}

/**
 * GitHub API error
 */
export class GitHubApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public rateLimit?: RateLimitInfo
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

/**
 * GitHub API client for repository data
 */
export class GitHubApiClient {
  private static readonly GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
  private token?: string;

  /**
   * Create a new GitHub API client
   * 
   * @param token Optional GitHub personal access token for private repos and higher rate limits
   */
  constructor(token?: string) {
    this.token = token;
  }

  /**
   * Get repository data including commits, branches, and tags
   * 
   * @param owner Repository owner (username or organization)
   * @param name Repository name
   * @param options Query options
   * @returns Repository data
   * @throws GitHubApiError if request fails
   */
  async getRepository(
    owner: string,
    name: string,
    options: {
      maxCommits?: number;
      after?: string | null;
    } = {}
  ): Promise<GitHubRepository> {
    const { maxCommits = 100, after = null } = options;

    const query = `
      query GetRepository($owner: String!, $name: String!, $maxCommits: Int!, $after: String) {
        repository(owner: $owner, name: $name) {
          name
          owner { login }
          isPrivate
          
          defaultBranchRef {
            name
            target {
              ... on Commit {
                history(first: $maxCommits, after: $after) {
                  totalCount
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                  nodes {
                    oid
                    message
                    author {
                      name
                      email
                      date
                    }
                    parents(first: 10) {
                      nodes {
                        oid
                      }
                    }
                  }
                }
              }
            }
          }
          
          refs(refPrefix: "refs/heads/", first: 100) {
            nodes {
              name
              target {
                oid
              }
            }
          }
          
          tags: refs(refPrefix: "refs/tags/", first: 100) {
            nodes {
              name
              target {
                oid
              }
            }
          }
        }
      }
    `;

    const variables = {
      owner,
      name,
      maxCommits,
      after,
    };

    const response = await this.graphqlRequest<{ repository: GitHubRepository }>(
      query,
      variables
    );

    if (!response.data?.repository) {
      throw new GitHubApiError(
        'Repository not found or access denied',
        404
      );
    }

    return response.data.repository;
  }

  /**
   * Get rate limit status
   * 
   * @returns Current rate limit information
   */
  async getRateLimit(): Promise<RateLimitInfo> {
    const query = `
      query {
        rateLimit {
          limit
          remaining
          resetAt
          used
        }
      }
    `;

    const response = await this.graphqlRequest<{
      rateLimit: {
        limit: number;
        remaining: number;
        resetAt: string;
        used: number;
      };
    }>(query, {});

    const rateLimit = response.data?.rateLimit;
    if (!rateLimit) {
      throw new GitHubApiError('Failed to fetch rate limit information');
    }

    return {
      limit: rateLimit.limit,
      remaining: rateLimit.remaining,
      reset: new Date(rateLimit.resetAt).getTime() / 1000,
      used: rateLimit.used,
    };
  }

  /**
   * Execute a GraphQL request
   * 
   * @param query GraphQL query string
   * @param variables Query variables
   * @returns Response data
   * @throws GitHubApiError on request failure
   */
  private async graphqlRequest<T>(
    query: string,
    variables: Record<string, unknown>
  ): Promise<GitHubGraphQLResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(GitHubApiClient.GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });

      // Extract rate limit from headers
      const rateLimit = this.extractRateLimit(response.headers);

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `GitHub API error: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(text);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Keep default error message
        }

        throw new GitHubApiError(errorMessage, response.status, rateLimit);
      }

      const data: GitHubGraphQLResponse<T> = await response.json();

      if (data.errors && data.errors.length > 0) {
        const errorMsg = data.errors.map(e => e.message).join(', ');
        throw new GitHubApiError(`GraphQL errors: ${errorMsg}`, undefined, rateLimit);
      }

      return data;
    } catch (error) {
      if (error instanceof GitHubApiError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new GitHubApiError(`Network error: ${error.message}`);
      }

      throw new GitHubApiError('Unknown error occurred');
    }
  }

  /**
   * Extract rate limit information from response headers
   * 
   * @param headers Response headers
   * @returns Rate limit information
   */
  private extractRateLimit(headers: Headers): RateLimitInfo | undefined {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');
    const used = headers.get('X-RateLimit-Used');

    if (!limit || !remaining || !reset) {
      return undefined;
    }

    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
      used: used ? parseInt(used, 10) : undefined,
    };
  }
}

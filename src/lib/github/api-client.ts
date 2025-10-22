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
    this.token = token || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    
    // Debug environment variable availability
    console.log('🐛 GitHub API Client initialized:', {
      hasProvidedToken: !!token,
      hasEnvToken: !!process.env.NEXT_PUBLIC_GITHUB_TOKEN,
      finalHasToken: !!this.token,
      nodeEnv: process.env.NODE_ENV,
      isClient: typeof window !== 'undefined',
    });
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

    // For requests larger than 100, we need to paginate
    if (maxCommits > 100) {
      return this.getRepositoryWithPagination(owner, name, maxCommits);
    }

    // Ensure we don't exceed the GitHub API limit of 100 records per request
    const requestLimit = Math.min(maxCommits, 100);

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
      maxCommits: requestLimit,
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
      'User-Agent': 'GitVisualizer/1.0.0 (https://github.com/itsnothuy/gitVisualizer)',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Debug logging for production issues
    console.log('🐛 GitHub API Debug:', {
      endpoint: GitHubApiClient.GRAPHQL_ENDPOINT,
      hasToken: !!this.token,
      tokenPrefix: this.token ? this.token.substring(0, 10) + '...' : 'none',
      environment: typeof window !== 'undefined' ? 'browser' : 'server',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(GitHubApiClient.GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Extract rate limit from headers
      const rateLimit = this.extractRateLimit(response.headers);

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `GitHub API error: ${response.statusText}`;

        console.error('🚨 GitHub API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: text,
        });

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
      console.error('🚨 GitHub API Network Error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });

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
   * Get repository data with pagination for large commit counts
   * 
   * @param owner Repository owner
   * @param name Repository name
   * @param maxCommits Total commits to fetch
   * @returns Repository data with paginated commits
   */
  private async getRepositoryWithPagination(
    owner: string,
    name: string,
    maxCommits: number
  ): Promise<GitHubRepository> {
    let allCommits: GitHubCommit[] = [];
    let after: string | null = null;
    let hasNextPage = true;
    let totalFetched = 0;

    // Get the base repository data with first page of commits
    const baseRepo = await this.getRepository(owner, name, { maxCommits: 100, after: null });

    allCommits = baseRepo.defaultBranchRef.target.history.nodes;
    totalFetched = allCommits.length;
    hasNextPage = baseRepo.defaultBranchRef.target.history.pageInfo.hasNextPage;
    after = baseRepo.defaultBranchRef.target.history.pageInfo.endCursor;

    // Fetch additional pages if needed
    while (hasNextPage && totalFetched < maxCommits) {
      const remainingCommits = maxCommits - totalFetched;
      const pageSize = Math.min(remainingCommits, 100);

      const pageRepo = await this.getRepository(owner, name, {
        maxCommits: pageSize,
        after
      });

      allCommits.push(...pageRepo.defaultBranchRef.target.history.nodes);
      totalFetched += pageRepo.defaultBranchRef.target.history.nodes.length;
      hasNextPage = pageRepo.defaultBranchRef.target.history.pageInfo.hasNextPage;
      after = pageRepo.defaultBranchRef.target.history.pageInfo.endCursor;
    }

    // Return the base repository with all collected commits
    return {
      ...baseRepo,
      defaultBranchRef: {
        ...baseRepo.defaultBranchRef,
        target: {
          ...baseRepo.defaultBranchRef.target,
          history: {
            ...baseRepo.defaultBranchRef.target.history,
            nodes: allCommits,
            pageInfo: {
              hasNextPage,
              endCursor: after
            }
          }
        }
      }
    };
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

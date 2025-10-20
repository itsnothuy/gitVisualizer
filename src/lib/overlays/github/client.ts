/**
 * GitHub overlay client with rate-limit aware REST/GraphQL access
 * Read-only operations for PRs, commits, and CI status
 */

import { HttpClient } from "../http-client";
import { generateCacheKey } from "../cache/overlay-cache";
import type {
  OverlayConfig,
  PullRequestMetadata,
  CheckStatus,
  RequestOptions,
} from "../types";
import type {
  GitHubPullRequest,
  GitHubCommitStatus,
  GitHubCheckSuite,
  GitHubGraphQLResponse,
} from "./types";

/**
 * GitHub overlay client
 */
export class GitHubClient {
  private httpClient: HttpClient;
  private config: OverlayConfig;

  constructor(config: OverlayConfig) {
    this.config = config;
    this.httpClient = new HttpClient(config.baseUrl, config.token);
  }

  /**
   * Get pull requests for repository
   */
  async getPullRequests(
    state: "open" | "closed" | "all" = "all",
    options: RequestOptions = {}
  ): Promise<PullRequestMetadata[]> {
    const cacheKey = generateCacheKey(
      "github",
      "prs",
      this.config.owner,
      this.config.repo,
      state
    );

    const response = await this.httpClient.get<GitHubPullRequest[]>(
      `/repos/${this.config.owner}/${this.config.repo}/pulls?state=${state}&per_page=100`,
      cacheKey,
      options
    );

    return response.data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.merged ? "merged" : pr.state,
      url: pr.html_url,
      sha: pr.head.sha,
    }));
  }

  /**
   * Get commit status (CI/checks)
   */
  async getCommitStatus(
    sha: string,
    options: RequestOptions = {}
  ): Promise<CheckStatus[]> {
    const cacheKey = generateCacheKey(
      "github",
      "commit-status",
      this.config.owner,
      this.config.repo,
      sha
    );

    const response = await this.httpClient.get<{ statuses: GitHubCommitStatus[] }>(
      `/repos/${this.config.owner}/${this.config.repo}/commits/${sha}/status`,
      cacheKey,
      options
    );

    return response.data.statuses.map((status) => ({
      status: status.state as CheckStatus["status"],
      context: status.context,
      targetUrl: status.target_url,
    }));
  }

  /**
   * Get check runs for commit
   */
  async getCheckRuns(
    sha: string,
    options: RequestOptions = {}
  ): Promise<CheckStatus[]> {
    const cacheKey = generateCacheKey(
      "github",
      "check-runs",
      this.config.owner,
      this.config.repo,
      sha
    );

    const response = await this.httpClient.get<GitHubCheckSuite>(
      `/repos/${this.config.owner}/${this.config.repo}/commits/${sha}/check-runs`,
      cacheKey,
      options
    );

    return response.data.check_runs.map((run) => {
      let status: CheckStatus["status"] = "pending";
      if (run.status === "completed" && run.conclusion) {
        status =
          run.conclusion === "success"
            ? "success"
            : run.conclusion === "neutral"
              ? "neutral"
              : "failure";
      }

      return {
        status,
        context: run.name,
        targetUrl: run.html_url,
      };
    });
  }

  /**
   * Get PRs associated with commit using GraphQL
   * More efficient than REST for this specific query
   */
  async getCommitPRs(
    sha: string,
    options: RequestOptions = {}
  ): Promise<PullRequestMetadata[]> {
    const cacheKey = generateCacheKey(
      "github",
      "commit-prs",
      this.config.owner,
      this.config.repo,
      sha
    );

    const query = `
      query($owner: String!, $repo: String!, $oid: GitObjectID!) {
        repository(owner: $owner, name: $repo) {
          object(oid: $oid) {
            ... on Commit {
              associatedPullRequests(first: 10) {
                nodes {
                  number
                  title
                  state
                  url
                }
              }
            }
          }
        }
      }
    `;

    const variables = {
      owner: this.config.owner,
      repo: this.config.repo,
      oid: sha,
    };

    // GraphQL uses POST but we can still use our cache
    const response = await this.httpClient.get<
      GitHubGraphQLResponse<{
        repository: {
          object: {
            associatedPullRequests: {
              nodes: Array<{
                number: number;
                title: string;
                state: "OPEN" | "CLOSED" | "MERGED";
                url: string;
              }>;
            };
          };
        };
      }>
    >(
      `/graphql?query=${encodeURIComponent(query)}&variables=${encodeURIComponent(JSON.stringify(variables))}`,
      cacheKey,
      options
    );

    if (response.data.errors) {
      throw new Error(
        `GraphQL errors: ${response.data.errors.map((e) => e.message).join(", ")}`
      );
    }

    const prs =
      response.data.data?.repository?.object?.associatedPullRequests?.nodes ||
      [];

    return prs.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state:
        pr.state === "MERGED"
          ? "merged"
          : pr.state === "OPEN"
            ? "open"
            : "closed",
      url: pr.url,
      sha,
    }));
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OverlayConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.baseUrl) {
      this.httpClient.setBaseUrl(config.baseUrl);
    }
    if (config.token !== undefined) {
      this.httpClient.setToken(config.token);
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    // Rate limit info is tracked in cache responses
    // This is a placeholder for accessing that info
    return null;
  }
}

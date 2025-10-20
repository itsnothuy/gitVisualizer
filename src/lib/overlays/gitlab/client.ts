/**
 * GitLab overlay client with rate-limit aware REST access
 * Read-only operations for MRs, commits, and pipeline status
 */

import { HttpClient } from "../http-client";
import { generateCacheKey } from "../cache/overlay-cache";
import type {
  OverlayConfig,
  PullRequestMetadata,
  CheckStatus,
  RequestOptions,
} from "../types";
import type { GitLabMergeRequest, GitLabPipeline } from "./types";

/**
 * GitLab overlay client
 */
export class GitLabClient {
  private httpClient: HttpClient;
  private config: OverlayConfig;

  constructor(config: OverlayConfig) {
    this.config = config;
    this.httpClient = new HttpClient(config.baseUrl, config.token);
  }

  /**
   * Get project ID from owner/repo (GitLab uses encoded project path)
   */
  private getProjectPath(): string {
    return encodeURIComponent(`${this.config.owner}/${this.config.repo}`);
  }

  /**
   * Get merge requests for project
   */
  async getMergeRequests(
    state: "opened" | "closed" | "merged" | "all" = "all",
    options: RequestOptions = {}
  ): Promise<PullRequestMetadata[]> {
    const projectPath = this.getProjectPath();
    const cacheKey = generateCacheKey(
      "gitlab",
      "mrs",
      this.config.owner,
      this.config.repo,
      state
    );

    const endpoint =
      state === "all"
        ? `/projects/${projectPath}/merge_requests?per_page=100`
        : `/projects/${projectPath}/merge_requests?state=${state}&per_page=100`;

    const response = await this.httpClient.get<GitLabMergeRequest[]>(
      endpoint,
      cacheKey,
      options
    );

    return response.data.map((mr) => ({
      number: mr.iid,
      title: mr.title,
      state: mr.state === "merged" ? "merged" : mr.state === "opened" ? "open" : "closed",
      url: mr.web_url,
      sha: mr.sha,
    }));
  }

  /**
   * Get pipelines for commit
   */
  async getCommitPipelines(
    sha: string,
    options: RequestOptions = {}
  ): Promise<CheckStatus[]> {
    const projectPath = this.getProjectPath();
    const cacheKey = generateCacheKey(
      "gitlab",
      "pipelines",
      this.config.owner,
      this.config.repo,
      sha
    );

    const response = await this.httpClient.get<GitLabPipeline[]>(
      `/projects/${projectPath}/repository/commits/${sha}/pipelines`,
      cacheKey,
      options
    );

    return response.data.map((pipeline) => {
      let status: CheckStatus["status"] = "pending";
      if (
        pipeline.status === "success" ||
        pipeline.status === "skipped" ||
        pipeline.status === "manual"
      ) {
        status = "success";
      } else if (
        pipeline.status === "failed" ||
        pipeline.status === "canceled"
      ) {
        status = "failure";
      } else if (
        pipeline.status === "running" ||
        pipeline.status === "pending" ||
        pipeline.status === "created" ||
        pipeline.status === "waiting_for_resource" ||
        pipeline.status === "preparing" ||
        pipeline.status === "scheduled"
      ) {
        status = "pending";
      }

      return {
        status,
        context: `Pipeline ${pipeline.id} (${pipeline.ref})`,
        targetUrl: pipeline.web_url,
      };
    });
  }

  /**
   * Get MRs associated with commit
   */
  async getCommitMRs(
    sha: string,
    options: RequestOptions = {}
  ): Promise<PullRequestMetadata[]> {
    const projectPath = this.getProjectPath();
    const cacheKey = generateCacheKey(
      "gitlab",
      "commit-mrs",
      this.config.owner,
      this.config.repo,
      sha
    );

    const response = await this.httpClient.get<GitLabMergeRequest[]>(
      `/projects/${projectPath}/repository/commits/${sha}/merge_requests`,
      cacheKey,
      options
    );

    return response.data.map((mr) => ({
      number: mr.iid,
      title: mr.title,
      state: mr.state === "merged" ? "merged" : mr.state === "opened" ? "open" : "closed",
      url: mr.web_url,
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

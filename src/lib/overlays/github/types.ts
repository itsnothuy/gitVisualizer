/**
 * GitHub API types for overlays
 * Read-only access to PRs, commits, and checks
 */

/**
 * GitHub Pull Request (simplified)
 */
export interface GitHubPullRequest {
  number: number;
  title: string;
  state: "open" | "closed";
  merged: boolean;
  html_url: string;
  head: {
    sha: string;
    ref: string;
  };
  base: {
    ref: string;
  };
}

/**
 * GitHub commit status
 */
export interface GitHubCommitStatus {
  state: "success" | "failure" | "pending" | "error";
  context: string;
  description?: string;
  target_url?: string;
}

/**
 * GitHub check run
 */
export interface GitHubCheckRun {
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion?:
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required";
  html_url?: string;
}

/**
 * GitHub check suite response
 */
export interface GitHubCheckSuite {
  check_runs: GitHubCheckRun[];
}

/**
 * GitHub commit with associated PRs (GraphQL)
 */
export interface GitHubCommitWithPRs {
  commit: {
    oid: string;
    message: string;
    associatedPullRequests: {
      nodes: Array<{
        number: number;
        title: string;
        state: "OPEN" | "CLOSED" | "MERGED";
        url: string;
      }>;
    };
  };
}

/**
 * GitHub GraphQL response wrapper
 */
export interface GitHubGraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    type?: string;
  }>;
}

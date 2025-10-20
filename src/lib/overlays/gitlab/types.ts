/**
 * GitLab API types for overlays
 * Read-only access to MRs, commits, and pipelines
 */

/**
 * GitLab Merge Request (simplified)
 */
export interface GitLabMergeRequest {
  iid: number;
  title: string;
  state: "opened" | "closed" | "locked" | "merged";
  web_url: string;
  sha: string;
  source_branch: string;
  target_branch: string;
}

/**
 * GitLab pipeline status
 */
export interface GitLabPipeline {
  id: number;
  status:
    | "created"
    | "waiting_for_resource"
    | "preparing"
    | "pending"
    | "running"
    | "success"
    | "failed"
    | "canceled"
    | "skipped"
    | "manual"
    | "scheduled";
  ref: string;
  sha: string;
  web_url: string;
}

/**
 * GitLab commit with pipelines
 */
export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  last_pipeline?: GitLabPipeline;
}

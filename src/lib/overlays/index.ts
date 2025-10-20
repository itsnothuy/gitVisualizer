/**
 * Overlay system exports
 * Privacy-first, read-only GitHub/GitLab integration with rate-limit safety
 */

export * from "./types";
export * from "./backoff";
export * from "./http-client";
export * from "./cache/overlay-cache";

// GitHub
export { GitHubClient } from "./github/client";
export type * from "./github/types";

// GitLab
export { GitLabClient } from "./gitlab/client";
export type * from "./gitlab/types";

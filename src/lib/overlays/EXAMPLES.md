# Overlay System Examples

Practical examples for using the overlay system with GitHub and GitLab.

## Example 1: Basic GitHub Integration

```typescript
import { GitHubClient } from "@/lib/overlays";

async function enrichCommitWithGitHub(commitSha: string) {
  const client = new GitHubClient({
    provider: "github",
    baseUrl: "https://api.github.com",
    token: process.env.GITHUB_TOKEN,
    owner: "facebook",
    repo: "react",
    enabled: true,
  });

  // Get PRs associated with commit
  const prs = await client.getCommitPRs(commitSha);
  
  // Get CI status
  const checks = await client.getCommitStatus(commitSha);
  
  return {
    commitSha,
    pullRequests: prs,
    checks,
  };
}
```

## Example 2: Rate Limit Monitoring

```typescript
import { GitHubClient } from "@/lib/overlays";
import type { RateLimitInfo } from "@/lib/overlays";

class GitHubOverlayManager {
  private client: GitHubClient;
  private currentRateLimit: RateLimitInfo | null = null;

  constructor(config: OverlayConfig) {
    this.client = new GitHubClient(config);
  }

  async fetchWithRateLimitTracking<T>(
    fetcher: () => Promise<T>
  ): Promise<T> {
    const result = await fetcher();
    
    // Extract rate limit from response
    // (In practice, this would be from the cached response)
    
    if (this.currentRateLimit) {
      const percentage = (this.currentRateLimit.remaining / this.currentRateLimit.limit) * 100;
      
      if (percentage < 10) {
        console.warn("⚠️ Rate limit low:", this.currentRateLimit);
      }
      
      if (percentage < 5) {
        throw new Error("Rate limit critically low. Pausing requests.");
      }
    }
    
    return result;
  }

  async getPullRequestsSafely(state: "open" | "closed" | "all") {
    return this.fetchWithRateLimitTracking(() =>
      this.client.getPullRequests(state)
    );
  }
}
```

## Example 3: Batch Commit Enrichment

```typescript
import { GitHubClient } from "@/lib/overlays";

async function enrichMultipleCommits(commits: string[]) {
  const client = new GitHubClient({
    provider: "github",
    baseUrl: "https://api.github.com",
    token: process.env.GITHUB_TOKEN!,
    owner: "vercel",
    repo: "next.js",
    enabled: true,
  });

  // Batch requests with error handling
  const enrichedCommits = await Promise.allSettled(
    commits.map(async (sha) => {
      try {
        const [prs, checks] = await Promise.all([
          client.getCommitPRs(sha),
          client.getCommitStatus(sha),
        ]);

        return { sha, prs, checks, status: "success" as const };
      } catch (error) {
        console.error(`Failed to enrich ${sha}:`, error);
        return { sha, error, status: "failed" as const };
      }
    })
  );

  const successful = enrichedCommits
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  const failed = enrichedCommits
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason);

  return { successful, failed };
}
```

## Example 4: GitLab Pipeline Monitoring

```typescript
import { GitLabClient } from "@/lib/overlays";

async function monitorPipelineStatus(commitSha: string) {
  const client = new GitLabClient({
    provider: "gitlab",
    baseUrl: "https://gitlab.com/api/v4",
    token: process.env.GITLAB_TOKEN,
    owner: "gitlab-org",
    repo: "gitlab",
    enabled: true,
  });

  const pipelines = await client.getCommitPipelines(commitSha);

  const summary = {
    total: pipelines.length,
    success: pipelines.filter((p) => p.status === "success").length,
    failure: pipelines.filter((p) => p.status === "failure").length,
    pending: pipelines.filter((p) => p.status === "pending").length,
  };

  return {
    commitSha,
    pipelines,
    summary,
  };
}
```

## Example 5: React Hook for Overlay Status

```typescript
import { useEffect, useState } from "react";
import { GitHubClient } from "@/lib/overlays";
import type { RateLimitInfo } from "@/lib/overlays";

export function useGitHubOverlay(
  owner: string,
  repo: string,
  token?: string
) {
  const [client, setClient] = useState<GitHubClient | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!token) return;

    const newClient = new GitHubClient({
      provider: "github",
      baseUrl: "https://api.github.com",
      token,
      owner,
      repo,
      enabled: true,
    });

    setClient(newClient);
  }, [owner, repo, token]);

  const refreshPullRequests = async () => {
    if (!client) return;

    try {
      const response = await client.getPullRequests("open");
      setLastRefresh(Date.now());
      setError(null);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    client,
    rateLimit,
    lastRefresh,
    error,
    refreshPullRequests,
  };
}

// Usage in component
function MyComponent() {
  const { rateLimit, lastRefresh, refreshPullRequests } = useGitHubOverlay(
    "facebook",
    "react",
    process.env.NEXT_PUBLIC_GITHUB_TOKEN
  );

  return (
    <div>
      <OverlayStatusPanel
        provider="github"
        rateLimit={rateLimit}
        lastRefresh={lastRefresh}
      />
      <button onClick={refreshPullRequests}>Refresh PRs</button>
    </div>
  );
}
```

## Example 6: Custom Cache TTL for Different Resources

```typescript
import { GitHubClient } from "@/lib/overlays";

const client = new GitHubClient({
  provider: "github",
  baseUrl: "https://api.github.com",
  token: process.env.GITHUB_TOKEN,
  owner: "microsoft",
  repo: "TypeScript",
  enabled: true,
});

// Short TTL for CI status (1 minute)
const checks = await client.getCommitStatus("abc123", {
  cacheTtl: 60 * 1000,
});

// Long TTL for PR metadata (15 minutes)
const prs = await client.getPullRequests("open", {
  cacheTtl: 15 * 60 * 1000,
});

// Force refresh (bypass cache)
const freshPrs = await client.getPullRequests("open", {
  forceRefresh: true,
});
```

## Example 7: Error Handling with Retry

```typescript
import { GitHubClient, RateLimitError, HttpError } from "@/lib/overlays";

async function fetchWithRetry(commitSha: string, maxRetries = 3) {
  const client = new GitHubClient({
    provider: "github",
    baseUrl: "https://api.github.com",
    token: process.env.GITHUB_TOKEN,
    owner: "nodejs",
    repo: "node",
    enabled: true,
  });

  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await client.getCommitPRs(commitSha);
    } catch (error) {
      attempt++;

      if (error instanceof RateLimitError) {
        console.error("Rate limited. Waiting before retry...");
        if (error.retryAfter) {
          await new Promise((resolve) => setTimeout(resolve, error.retryAfter));
        }
      } else if (error instanceof HttpError) {
        if (error.status === 404) {
          console.error("Commit not found");
          return []; // Return empty array for not found
        } else if (error.status >= 500 && attempt < maxRetries) {
          console.error(`Server error. Retry ${attempt}/${maxRetries}`);
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} retries`);
}
```

## Example 8: Multi-Provider Support

```typescript
import { GitHubClient, GitLabClient } from "@/lib/overlays";
import type { OverlayConfig, PullRequestMetadata } from "@/lib/overlays";

interface ProviderClient {
  getPRsForCommit(sha: string): Promise<PullRequestMetadata[]>;
  getCIStatus(sha: string): Promise<CheckStatus[]>;
}

class UnifiedOverlayManager {
  private client: ProviderClient;

  constructor(config: OverlayConfig) {
    if (config.provider === "github") {
      this.client = new GitHubClient(config);
    } else {
      this.client = new GitLabClient(config) as unknown as ProviderClient;
    }
  }

  async enrichCommit(sha: string) {
    const [prs, checks] = await Promise.all([
      this.client.getPRsForCommit(sha).catch(() => []),
      this.client.getCIStatus(sha).catch(() => []),
    ]);

    return {
      sha,
      pullRequests: prs,
      checks,
    };
  }
}

// Usage
const githubManager = new UnifiedOverlayManager({
  provider: "github",
  baseUrl: "https://api.github.com",
  token: process.env.GITHUB_TOKEN!,
  owner: "facebook",
  repo: "react",
  enabled: true,
});

const gitlabManager = new UnifiedOverlayManager({
  provider: "gitlab",
  baseUrl: "https://gitlab.com/api/v4",
  token: process.env.GITLAB_TOKEN!,
  owner: "gitlab-org",
  repo: "gitlab",
  enabled: true,
});
```

## Example 9: Status Panel with Auto-Refresh

```tsx
import { useState, useEffect } from "react";
import { GitHubClient } from "@/lib/overlays";
import { OverlayStatusPanel } from "@/components/overlays";
import type { RateLimitInfo } from "@/lib/overlays";

function OverlayDashboard() {
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const client = new GitHubClient({
    provider: "github",
    baseUrl: "https://api.github.com",
    token: process.env.NEXT_PUBLIC_GITHUB_TOKEN,
    owner: "vercel",
    repo: "next.js",
    enabled: true,
  });

  useEffect(() => {
    const refreshStatus = async () => {
      try {
        const response = await client.getPullRequests("open", {
          cacheTtl: 60 * 1000, // 1 minute
        });

        if (response.rateLimit) {
          setRateLimit(response.rateLimit);
        }
        setLastRefresh(Date.now());
      } catch (error) {
        console.error("Failed to refresh status:", error);
      }
    };

    // Initial fetch
    refreshStatus();

    // Auto-refresh every 5 minutes
    const interval = setInterval(refreshStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-bold">Overlay Status</h2>
      <OverlayStatusPanel
        provider="github"
        rateLimit={rateLimit}
        lastRefresh={lastRefresh}
      />
    </div>
  );
}
```

## Example 10: Progressive Enhancement

```typescript
import { GitHubClient } from "@/lib/overlays";

async function enrichDAGWithOverlays(commits: DagNode[]) {
  // Check if overlay is enabled
  const overlayEnabled = localStorage.getItem("overlay-enabled") === "true";
  const token = sessionStorage.getItem("github-token");

  if (!overlayEnabled || !token) {
    // Return commits without enrichment
    return commits;
  }

  const client = new GitHubClient({
    provider: "github",
    baseUrl: "https://api.github.com",
    token,
    owner: "owner",
    repo: "repo",
    enabled: true,
  });

  // Enrich in parallel, but don't block rendering
  const enrichedCommits = await Promise.all(
    commits.map(async (commit) => {
      try {
        const prs = await client.getCommitPRs(commit.id);
        const checks = await client.getCommitStatus(commit.id);

        return {
          ...commit,
          pr: prs[0] || null,
          ci: checks[0] || null,
        };
      } catch (error) {
        // Silently fail, return original commit
        console.warn(`Failed to enrich ${commit.id}:`, error);
        return commit;
      }
    })
  );

  return enrichedCommits;
}
```

These examples demonstrate the flexibility and robustness of the overlay system for various use cases while maintaining privacy, performance, and user experience.

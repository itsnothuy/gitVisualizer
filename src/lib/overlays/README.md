# Overlay System

Privacy-first, read-only GitHub/GitLab integration with rate-limit safety and defensive caching.

## Overview

The overlay system enriches local Git commit graphs with optional remote metadata (PRs, CI status, tags) from GitHub or GitLab APIs. All integration is:

- **Read-only**: Minimal OAuth scopes, no write operations
- **Privacy-first**: Tokens in memory only, explicit user consent
- **Rate-limit safe**: Conditional requests (ETags), caching, exponential backoff
- **Gracefully degrading**: Overlays never block core DAG rendering

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Overlay System                         │
├─────────────────────────────────────────────────────────┤
│  UI Layer                                               │
│  └─ OverlayStatusPanel (rate limits, cache stats)      │
├─────────────────────────────────────────────────────────┤
│  Provider Clients                                       │
│  ├─ GitHubClient (REST + GraphQL)                      │
│  └─ GitLabClient (REST)                                │
├─────────────────────────────────────────────────────────┤
│  HTTP Client (conditional requests, retries)            │
│  ├─ ETag / If-None-Match support                       │
│  ├─ Rate limit parsing (X-RateLimit-*, RateLimit-*)   │
│  └─ Exponential backoff with jitter                    │
├─────────────────────────────────────────────────────────┤
│  Cache Layer (in-memory, TTL-based)                     │
│  ├─ Response caching (5min default TTL)                │
│  ├─ ETag storage for conditional requests              │
│  └─ Inflight request collapsing                        │
└─────────────────────────────────────────────────────────┘
```

## Usage

### Basic Setup

```typescript
import { GitHubClient, GitLabClient } from "@/lib/overlays";

// GitHub overlay
const githubClient = new GitHubClient({
  provider: "github",
  baseUrl: "https://api.github.com",
  token: "ghp_...", // In-memory only
  owner: "octocat",
  repo: "Hello-World",
  enabled: true,
});

// Get pull requests
const prs = await githubClient.getPullRequests("open");

// Get CI status for commit
const checks = await githubClient.getCommitStatus("abc123");

// GitLab overlay
const gitlabClient = new GitLabClient({
  provider: "gitlab",
  baseUrl: "https://gitlab.com/api/v4",
  token: "glpat-...",
  owner: "group",
  repo: "project",
  enabled: true,
});

// Get merge requests
const mrs = await gitlabClient.getMergeRequests("opened");

// Get pipeline status
const pipelines = await gitlabClient.getCommitPipelines("abc123");
```

### Conditional Requests & Caching

The HTTP client automatically uses ETags for conditional requests:

```typescript
// First request: full response (200 OK)
const response1 = await client.get("/endpoint", "cache-key");
// Cache stores: { data, etag: "abc123", timestamp }

// Second request: conditional (304 Not Modified if unchanged)
// Sends: If-None-Match: "abc123"
// Returns cached data with updated rate limit info
const response2 = await client.get("/endpoint", "cache-key");

// Force refresh (bypass cache)
const response3 = await client.get("/endpoint", "cache-key", {
  forceRefresh: true,
});
```

### Rate Limit Handling

Rate limits are parsed from response headers and tracked automatically:

```typescript
// GitHub headers: X-RateLimit-Remaining, X-RateLimit-Limit, X-RateLimit-Reset
// GitLab headers: RateLimit-Remaining, RateLimit-Limit, RateLimit-Reset

const response = await client.get("/endpoint", "cache-key");

if (response.rateLimit) {
  console.log(`Remaining: ${response.rateLimit.remaining}/${response.rateLimit.limit}`);
  console.log(`Resets at: ${new Date(response.rateLimit.reset * 1000)}`);
}

// 429 Too Many Requests → automatic exponential backoff
// Respects Retry-After header if present
```

### UI Status Panel

Display overlay status to users:

```tsx
import { OverlayStatusPanel } from "@/components/overlays";

function MyComponent() {
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  return (
    <OverlayStatusPanel
      provider="github"
      rateLimit={rateLimit}
      lastRefresh={lastRefresh}
    />
  );
}
```

## Rate Limit Guidelines

### GitHub

- **REST API**: 5,000 requests/hour (authenticated)
- **GraphQL**: ~2,000 points/minute, max 100 concurrent requests
- **Secondary limits**: Respect `X-RateLimit-*` headers over `/rate_limit` polling

Reference: https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api

### GitLab

- **Default**: 600 requests/minute per user (configurable per instance)
- **Headers**: `RateLimit-Remaining`, `RateLimit-Limit`, `RateLimit-Reset`
- Always respect instance-specific limits

Reference: https://docs.gitlab.com/ee/security/rate_limits.html

## Cache Configuration

```typescript
import { overlayCache, DEFAULT_CACHE_TTL } from "@/lib/overlays";

// Default TTL: 5 minutes
const customTTL = 10 * 60 * 1000; // 10 minutes

// Manual cache management
overlayCache.set("key", response, customTTL);
overlayCache.get("key"); // Returns null if expired
overlayCache.delete("key");
overlayCache.clear(); // Clear all entries

// Cache stats
const stats = overlayCache.getStats();
console.log(`Total: ${stats.totalEntries}, Expired: ${stats.expiredEntries}`);

// Cleanup
const cleared = overlayCache.clearExpired();
```

## Backoff Configuration

```typescript
import { retryWithBackoff, DEFAULT_BACKOFF_CONFIG } from "@/lib/overlays";

const customConfig = {
  initialDelay: 1000, // 1 second
  maxDelay: 60000, // 60 seconds
  multiplier: 2,
  maxAttempts: 5,
  jitter: true, // Add randomness (0.5x to 1.5x)
};

await retryWithBackoff(
  async () => {
    // Your async operation
  },
  customConfig,
  (error) => isRetryableHttpError(error)
);
```

## Security Considerations

1. **Tokens**: Store in memory only, never persist to disk
2. **Scopes**: Use minimal read-only scopes
   - GitHub: `repo:status`, `public_repo` (read-only)
   - GitLab: `read_api`
3. **User consent**: Explicit opt-in per repository
4. **No data exfiltration**: Local repo contents never uploaded

## Testing

```bash
# Run overlay tests
pnpm test -- src/lib/overlays

# Test scenarios covered:
# - Cache key generation and TTL
# - Backoff calculation and retry logic
# - HTTP 200 (success), 304 (not modified), 403 (forbidden), 429 (rate limited)
# - Conditional requests with ETags
# - Rate limit header parsing
# - Inflight request collapsing
```

## Error Handling

```typescript
import { HttpError, RateLimitError } from "@/lib/overlays";

try {
  const response = await client.get("/endpoint", "key");
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}ms`);
    console.error(`Remaining: ${error.rateLimit?.remaining}`);
  } else if (error instanceof HttpError) {
    console.error(`HTTP ${error.status}: ${error.statusText}`);
  }
}
```

## Performance

- **Conditional requests**: 304 responses consume minimal quota
- **Inflight collapsing**: Duplicate requests share single HTTP call
- **TTL caching**: Default 5min reduces API calls by ~90%
- **Target**: Normal browsing never hits secondary rate limits

## Future Enhancements

- [ ] IndexedDB cache for persistence across sessions
- [ ] GraphQL batching for commit → PR associations
- [ ] WebSocket support for real-time CI updates
- [ ] Offline mode with cached data only

## References

- ADR-0006: Auth & overlays with minimal scopes (`docs/adr/0006-auth-and-overlays.md`)
- Area instructions: `.github/instructions/overlays.instructions.md`
- GitHub REST docs: https://docs.github.com/en/rest
- GitHub GraphQL docs: https://docs.github.com/en/graphql
- GitLab API docs: https://docs.gitlab.com/ee/api/

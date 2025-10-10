# Git Visualizer API Documentation

## Overview

This document describes the public APIs, interfaces, and integration points for Git Visualizer. The application follows a privacy-first architecture with clearly defined boundaries between local operations and optional external integrations.

## Core Data Models

### Git DAG Types

```typescript
/**
 * Core representation of a Git commit in the DAG
 */
export interface DagNode {
  /** Commit SHA (full 40-character hash) */
  id: string;
  /** Truncated commit message (first line, max 60 chars) */
  title: string;
  /** Commit timestamp (Unix timestamp in seconds) */
  ts: number;
  /** Array of parent commit SHAs */
  parents: string[];
  /** Git refs pointing to this commit (branches, tags) */
  refs?: string[];
  /** Pull/Merge request information (from overlays) */
  pr?: PullRequestInfo | null;
  /** CI/CD status information (from overlays) */
  ci?: CIStatus | null;
}

/**
 * Graph edge representing parent-child relationship
 */
export interface DagEdge {
  /** Unique edge identifier */
  id: string;
  /** Source commit SHA (parent) */
  source: string;
  /** Target commit SHA (child) */
  target: string;
  /** Edge type for styling (normal, merge, etc.) */
  type?: 'normal' | 'merge' | 'branch';
}

/**
 * Layout result with positioned nodes
 */
export interface LayoutResult {
  /** Positioned nodes with coordinates */
  nodes: LayoutNode[];
  /** Positioned edges with routing */
  edges: LayoutEdge[];
  /** Overall graph dimensions */
  bounds: { width: number; height: number };
}

export interface LayoutNode extends DagNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutEdge extends DagEdge {
  /** Optional routing points for curved edges */
  points?: Array<{ x: number; y: number }>;
}
```

### Overlay Data Types

```typescript
/**
 * Pull/Merge request information from GitHub/GitLab
 */
export interface PullRequestInfo {
  /** PR/MR number */
  id: string;
  /** Direct URL to the PR/MR */
  url: string;
  /** PR title */
  title?: string;
  /** PR state */
  state?: 'open' | 'closed' | 'merged';
  /** Author information */
  author?: {
    username: string;
    avatarUrl?: string;
  };
}

/**
 * CI/CD status from external systems
 */
export interface CIStatus {
  /** Overall status */
  status: 'success' | 'failed' | 'pending' | 'unknown';
  /** Link to CI build */
  url?: string;
  /** Status check details */
  checks?: Array<{
    name: string;
    status: 'success' | 'failed' | 'pending';
    url?: string;
  }>;
}
```

## Local Git Operations API

### Repository Ingestion

```typescript
/**
 * Local repository access via File System Access API
 */
export interface LocalGitAPI {
  /**
   * Open a local repository directory
   * @param directoryHandle - File System Access API directory handle
   * @returns Repository metadata and commit graph
   */
  openLocalRepository(directoryHandle: FileSystemDirectoryHandle): Promise<GitRepository>;
  
  /**
   * Check if a directory contains a valid Git repository
   * @param directoryHandle - Directory to check
   * @returns Promise resolving to true if valid Git repo
   */
  isValidRepository(directoryHandle: FileSystemDirectoryHandle): Promise<boolean>;
  
  /**
   * Disconnect from local repository and clear cached data
   * @param repositoryId - Repository identifier
   */
  disconnectRepository(repositoryId: string): Promise<void>;
}

/**
 * Remote repository cloning via isomorphic-git
 */
export interface RemoteGitAPI {
  /**
   * Clone a remote repository into browser storage
   * @param url - Git repository URL
   * @param options - Clone options
   * @returns Promise with clone progress and final repository
   */
  cloneRepository(
    url: string, 
    options: CloneOptions
  ): Promise<AsyncGenerator<CloneProgress, GitRepository>>;
  
  /**
   * Check if URL is a valid Git repository
   * @param url - Repository URL to validate
   * @returns Promise resolving to repository metadata
   */
  validateRepositoryUrl(url: string): Promise<RepositoryMetadata>;
}

export interface CloneOptions {
  /** Shallow clone depth (default: 50) */
  depth?: number;
  /** Clone single branch only */
  singleBranch?: boolean;
  /** Specific branch to clone */
  branch?: string;
  /** CORS proxy URL for private repositories */
  corsProxy?: string;
}

export interface CloneProgress {
  phase: 'init' | 'fetch' | 'checkout' | 'complete';
  loaded: number;
  total: number;
  message: string;
}

export interface GitRepository {
  /** Unique repository identifier */
  id: string;
  /** Repository name */
  name: string;
  /** Repository path or URL */
  path: string;
  /** Current branch */
  currentBranch: string;
  /** Available branches */
  branches: string[];
  /** Available tags */
  tags: string[];
  /** Commit graph data */
  graph: {
    nodes: DagNode[];
    edges: DagEdge[];
  };
  /** Repository statistics */
  stats: {
    commitCount: number;
    branchCount: number;
    authorCount: number;
    firstCommit: Date;
    lastCommit: Date;
  };
}
```

## Layout Engine API

### ELK.js Integration

```typescript
/**
 * Graph layout computation using ELK.js
 */
export interface LayoutAPI {
  /**
   * Compute layout for a Git DAG
   * @param graph - Input graph data
   * @param options - Layout configuration
   * @returns Promise with positioned graph elements
   */
  computeLayout(
    graph: { nodes: DagNode[]; edges: DagEdge[] },
    options?: LayoutOptions
  ): Promise<LayoutResult>;
  
  /**
   * Update layout for incremental changes
   * @param previousLayout - Previous layout result
   * @param changes - Graph changes since last layout
   * @returns Promise with updated layout
   */
  updateLayout(
    previousLayout: LayoutResult,
    changes: GraphChanges
  ): Promise<LayoutResult>;
  
  /**
   * Get available layout algorithms
   * @returns Array of supported layout algorithm names
   */
  getAvailableAlgorithms(): string[];
}

export interface LayoutOptions {
  /** Layout algorithm ('layered' is default and recommended) */
  algorithm?: 'layered' | 'force' | 'mrtree';
  /** Layout direction */
  direction?: 'RIGHT' | 'LEFT' | 'UP' | 'DOWN';
  /** Node spacing configuration */
  spacing?: {
    /** Space between nodes in same layer */
    nodeNode?: number;
    /** Space between layers */
    layerLayer?: number;
  };
  /** Whether to use Web Worker for computation */
  useWorker?: boolean;
  /** Cache layout results */
  enableCaching?: boolean;
}

export interface GraphChanges {
  /** Added nodes */
  addedNodes: DagNode[];
  /** Removed node IDs */
  removedNodes: string[];
  /** Added edges */
  addedEdges: DagEdge[];
  /** Removed edge IDs */
  removedEdges: string[];
}
```

## Overlay System API

### GitHub Integration

```typescript
/**
 * GitHub API integration for repository overlays
 */
export interface GitHubOverlayAPI {
  /**
   * Authenticate with GitHub using OAuth PKCE
   * @param scopes - Requested OAuth scopes (read-only)
   * @returns Promise with authentication result
   */
  authenticate(scopes?: string[]): Promise<AuthResult>;
  
  /**
   * Get pull request information for commits
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param commits - Array of commit SHAs
   * @returns Promise with PR associations
   */
  getPullRequestsForCommits(
    owner: string,
    repo: string,
    commits: string[]
  ): Promise<Map<string, PullRequestInfo>>;
  
  /**
   * Get CI status for commits
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param commits - Array of commit SHAs
   * @returns Promise with CI status information
   */
  getCIStatusForCommits(
    owner: string,
    repo: string,
    commits: string[]
  ): Promise<Map<string, CIStatus>>;
  
  /**
   * Get rate limit status
   * @returns Current rate limit information
   */
  getRateLimit(): Promise<RateLimitInfo>;
}

export interface AuthResult {
  /** Whether authentication was successful */
  success: boolean;
  /** OAuth access token (stored in memory only) */
  token?: string;
  /** Granted scopes */
  scopes?: string[];
  /** Error message if authentication failed */
  error?: string;
}

export interface RateLimitInfo {
  /** Remaining requests in current window */
  remaining: number;
  /** Total requests allowed per window */
  limit: number;
  /** Unix timestamp when rate limit resets */
  resetTime: number;
  /** Rate limit type ('primary' | 'secondary') */
  type: string;
}
```

### GitLab Integration

```typescript
/**
 * GitLab API integration for repository overlays
 */
export interface GitLabOverlayAPI {
  /**
   * Authenticate with GitLab instance
   * @param instanceUrl - GitLab instance URL (default: gitlab.com)
   * @param scopes - Requested OAuth scopes
   * @returns Promise with authentication result
   */
  authenticate(instanceUrl?: string, scopes?: string[]): Promise<AuthResult>;
  
  /**
   * Get merge request information for commits
   * @param projectId - GitLab project ID
   * @param commits - Array of commit SHAs
   * @returns Promise with MR associations
   */
  getMergeRequestsForCommits(
    projectId: string,
    commits: string[]
  ): Promise<Map<string, PullRequestInfo>>;
  
  /**
   * Get pipeline status for commits
   * @param projectId - GitLab project ID
   * @param commits - Array of commit SHAs
   * @returns Promise with pipeline status
   */
  getPipelineStatusForCommits(
    projectId: string,
    commits: string[]
  ): Promise<Map<string, CIStatus>>;
}
```

## Visualization Component API

### React Components

```typescript
/**
 * Main graph visualization component
 */
export interface GraphVisualizationProps {
  /** Repository data to visualize */
  repository: GitRepository;
  /** Layout options */
  layoutOptions?: LayoutOptions;
  /** Whether overlays are enabled */
  overlaysEnabled?: boolean;
  /** Callback for node selection */
  onNodeSelect?: (node: DagNode) => void;
  /** Callback for node focus (keyboard navigation) */
  onNodeFocus?: (node: DagNode) => void;
  /** Custom node renderer */
  nodeRenderer?: (node: LayoutNode) => React.ReactNode;
  /** Custom edge renderer */
  edgeRenderer?: (edge: LayoutEdge) => React.ReactNode;
  /** Accessibility options */
  a11yOptions?: A11yOptions;
}

export interface A11yOptions {
  /** Whether to announce graph updates to screen readers */
  announceChanges?: boolean;
  /** Custom ARIA labels for nodes */
  nodeAriaLabel?: (node: DagNode) => string;
  /** Whether to provide graph summary */
  provideSummary?: boolean;
  /** Keyboard navigation mode */
  keyboardNavMode?: 'tab' | 'arrow' | 'both';
}

/**
 * Graph controls component for zoom, pan, and accessibility
 */
export interface GraphControlsProps {
  /** Reference to graph container for zoom/pan operations */
  graphRef: React.RefObject<HTMLElement>;
  /** Current zoom level */
  zoomLevel: number;
  /** Zoom change callback */
  onZoomChange?: (zoom: number) => void;
  /** Reset view callback */
  onResetView?: () => void;
  /** Accessibility shortcuts */
  a11yShortcuts?: boolean;
}
```

## Storage and Caching API

### Browser Storage

```typescript
/**
 * Repository data storage interface
 */
export interface StorageAPI {
  /**
   * Store repository data in OPFS
   * @param repository - Repository data to store
   * @returns Promise with storage result
   */
  storeRepository(repository: GitRepository): Promise<StorageResult>;
  
  /**
   * Retrieve repository data from OPFS
   * @param repositoryId - Repository identifier
   * @returns Promise with repository data
   */
  getRepository(repositoryId: string): Promise<GitRepository | null>;
  
  /**
   * List all stored repositories
   * @returns Promise with array of repository metadata
   */
  listRepositories(): Promise<RepositoryMetadata[]>;
  
  /**
   * Remove repository data from storage
   * @param repositoryId - Repository identifier
   * @returns Promise with removal result
   */
  removeRepository(repositoryId: string): Promise<boolean>;
  
  /**
   * Get storage usage information
   * @returns Promise with storage quota and usage
   */
  getStorageInfo(): Promise<StorageInfo>;
}

export interface StorageResult {
  success: boolean;
  repositoryId?: string;
  error?: string;
}

export interface StorageInfo {
  /** Used storage in bytes */
  used: number;
  /** Available storage quota in bytes */
  quota: number;
  /** Storage type ('persistent' | 'temporary') */
  type: string;
}

/**
 * Layout and overlay cache interface
 */
export interface CacheAPI {
  /**
   * Cache layout result
   * @param key - Cache key (includes layout options hash)
   * @param layout - Layout result to cache
   * @param ttl - Time to live in milliseconds
   */
  cacheLayout(key: string, layout: LayoutResult, ttl?: number): Promise<void>;
  
  /**
   * Retrieve cached layout
   * @param key - Cache key
   * @returns Promise with cached layout or null
   */
  getCachedLayout(key: string): Promise<LayoutResult | null>;
  
  /**
   * Cache overlay response
   * @param key - Cache key (includes repo and API endpoint)
   * @param data - Overlay data to cache
   * @param ttl - Time to live in milliseconds
   */
  cacheOverlayData(key: string, data: any, ttl?: number): Promise<void>;
  
  /**
   * Retrieve cached overlay data
   * @param key - Cache key
   * @returns Promise with cached data or null
   */
  getCachedOverlayData(key: string): Promise<any>;
  
  /**
   * Clear expired cache entries
   * @returns Promise with number of entries cleared
   */
  clearExpiredCache(): Promise<number>;
}
```

## Configuration and Settings API

```typescript
/**
 * Application configuration and user preferences
 */
export interface ConfigAPI {
  /**
   * Get current application configuration
   * @returns Promise with configuration object
   */
  getConfig(): Promise<AppConfig>;
  
  /**
   * Update application configuration
   * @param updates - Partial configuration updates
   * @returns Promise with updated configuration
   */
  updateConfig(updates: Partial<AppConfig>): Promise<AppConfig>;
  
  /**
   * Reset configuration to defaults
   * @returns Promise with default configuration
   */
  resetConfig(): Promise<AppConfig>;
}

export interface AppConfig {
  /** Privacy and security settings */
  privacy: {
    /** Whether to allow network operations */
    allowNetworkAccess: boolean;
    /** Whether overlays are globally enabled */
    overlaysEnabled: boolean;
    /** Which overlay providers are allowed */
    allowedOverlayProviders: ('github' | 'gitlab')[];
  };
  
  /** User interface preferences */
  ui: {
    /** Theme preference */
    theme: 'light' | 'dark' | 'system';
    /** Whether to respect reduced motion preferences */
    respectReducedMotion: boolean;
    /** Default zoom level */
    defaultZoom: number;
    /** Font size multiplier for accessibility */
    fontSizeMultiplier: number;
  };
  
  /** Visualization settings */
  visualization: {
    /** Default layout algorithm */
    defaultLayout: string;
    /** Layout direction preference */
    layoutDirection: 'RIGHT' | 'LEFT' | 'UP' | 'DOWN';
    /** Node spacing preferences */
    nodeSpacing: number;
    /** Layer spacing preferences */
    layerSpacing: number;
    /** Maximum nodes to render with SVG before Canvas fallback */
    svgNodeLimit: number;
  };
  
  /** Performance settings */
  performance: {
    /** Whether to use Web Workers for layout */
    useWebWorkers: boolean;
    /** Whether to enable layout caching */
    enableLayoutCaching: boolean;
    /** Cache TTL for overlay data in milliseconds */
    overlayCacheTTL: number;
  };
}
```

## Error Handling

### Error Types

```typescript
/**
 * Standard error types used throughout the application
 */
export class GitVizError extends Error {
  constructor(
    message: string,
    public code: string,
    public category: 'git' | 'layout' | 'overlay' | 'storage' | 'auth',
    public details?: any
  ) {
    super(message);
    this.name = 'GitVizError';
  }
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Git operation errors
  INVALID_REPOSITORY: 'GIT_INVALID_REPOSITORY',
  CLONE_FAILED: 'GIT_CLONE_FAILED',
  PARSE_ERROR: 'GIT_PARSE_ERROR',
  
  // Layout errors
  LAYOUT_FAILED: 'LAYOUT_FAILED',
  LAYOUT_TIMEOUT: 'LAYOUT_TIMEOUT',
  
  // Overlay errors
  AUTH_FAILED: 'OVERLAY_AUTH_FAILED',
  RATE_LIMITED: 'OVERLAY_RATE_LIMITED',
  API_ERROR: 'OVERLAY_API_ERROR',
  
  // Storage errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED: 'STORAGE_ACCESS_DENIED',
  
  // Browser compatibility
  UNSUPPORTED_BROWSER: 'UNSUPPORTED_BROWSER',
  MISSING_API: 'MISSING_API',
} as const;
```

## Integration Guidelines

### Custom Overlay Providers

To add support for additional Git hosting providers:

1. Implement the `OverlayAPI` interface
2. Register the provider with the overlay system
3. Add OAuth configuration for the provider
4. Implement rate limiting and caching strategies

### Custom Layout Algorithms

To add alternative layout algorithms:

1. Implement ELK.js algorithm registration
2. Add algorithm-specific options to `LayoutOptions`
3. Update the layout worker to support new algorithms
4. Add algorithm selection to the UI

### Custom Node/Edge Renderers

For specialized visualization needs:

1. Implement custom React components following the renderer interface
2. Ensure accessibility compliance (ARIA labels, keyboard navigation)
3. Handle high-DPI displays and various zoom levels
4. Provide fallbacks for performance constraints

## Privacy and Security Considerations

### Data Boundaries
- **Local Operations**: All Git parsing and DAG construction happens locally
- **Optional Overlays**: External API calls only with explicit user consent
- **No Persistence**: OAuth tokens and sensitive data stored in memory only
- **Clear Purging**: Users can disconnect and purge all local data

### API Usage
- **Read-Only Scopes**: All external API integrations use minimal read-only scopes
- **Rate Limiting**: Automatic backoff and user quota display
- **Error Handling**: Graceful degradation when external services are unavailable
- **Transparency**: Clear indication when external API calls are made

### Browser Security
- **CSP Headers**: Content Security Policy prevents unauthorized script execution
- **CORS Handling**: Proper CORS configuration for Git clone operations
- **Feature Detection**: Graceful fallbacks for unsupported browser APIs
- **Input Validation**: All user inputs validated and sanitized
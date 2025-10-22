/**
 * GitHub Repository Processor
 * 
 * Convert GitHub API data to internal DAG visualization format.
 * Provides progress feedback and handles pagination for large repositories.
 */

import type { GitCommit, GitBranch, GitTag } from '@/cli/types';
import type { DagNode } from '@/viz/elk/layout';
import type { ProcessProgress, ProcessedRepository, RepositoryMetadata, PerformanceMetrics, RepositoryWarning } from '../git/processor';
import { GitHubApiClient, type GitHubRepository, type GitHubCommit, GitHubApiError } from './api-client';

/**
 * Options for processing a GitHub repository
 */
export interface GitHubProcessorOptions {
  /** Maximum number of commits to fetch (performance guard) */
  maxCommits?: number;
  /** Progress callback */
  onProgress?: (progress: ProcessProgress) => void;
  /** GitHub personal access token (optional, for private repos) */
  token?: string;
  /** Cancel signal */
  signal?: AbortSignal;
}

/**
 * Convert GitHub commit to internal GitCommit format
 */
function convertGitHubCommit(ghCommit: GitHubCommit): GitCommit {
  return {
    id: ghCommit.oid,
    parents: ghCommit.parents.nodes.map(p => p.oid),
    message: ghCommit.message,
    author: ghCommit.author.name,
    timestamp: new Date(ghCommit.author.date).getTime(),
    tree: ghCommit.oid, // Use commit SHA as tree reference for GitHub repos
  };
}

/**
 * Process a GitHub repository from API data
 * 
 * @param owner Repository owner (username or organization)
 * @param name Repository name
 * @param options Processing options
 * @returns Processed repository data with DAG model
 * @throws Error if processing fails
 */
export async function processGitHubRepository(
  owner: string,
  name: string,
  options: GitHubProcessorOptions = {}
): Promise<ProcessedRepository> {
  const startTime = performance.now();
  const { maxCommits = 1000, onProgress, token, signal } = options;

  const warnings: RepositoryWarning[] = [];

  // Report loading phase
  onProgress?.({
    phase: "loading",
    percentage: 5,
    message: "Connecting to GitHub API...",
  });

  const client = new GitHubApiClient(token);

  try {
    // Check for cancellation
    if (signal?.aborted) {
      throw new Error("Processing cancelled");
    }

    // Report parsing phase
    onProgress?.({
      phase: "parsing",
      percentage: 10,
      message: `Fetching repository: ${owner}/${name}...`,
    });

    const parseStart = performance.now();

    // Fetch repository data
    let repoData: GitHubRepository;
    try {
      repoData = await client.getRepository(owner, name, { maxCommits });
    } catch (error) {
      if (error instanceof GitHubApiError) {
        if (error.statusCode === 404) {
          throw new Error(
            'Repository not found. Please check the owner and repository name, ' +
            'or provide an access token if the repository is private.'
          );
        }
        if (error.statusCode === 401) {
          throw new Error(
            'Authentication failed. Please check your access token.'
          );
        }
        if (error.rateLimit && error.rateLimit.remaining === 0) {
          const resetDate = new Date(error.rateLimit.reset * 1000);
          throw new Error(
            `GitHub API rate limit exceeded. Rate limit resets at ${resetDate.toLocaleTimeString()}. ` +
            'Consider providing an access token for higher limits (5000/hour vs 60/hour).'
          );
        }
        throw new Error(`GitHub API error: ${error.message}`);
      }
      throw error;
    }

    // Check for cancellation
    if (signal?.aborted) {
      throw new Error("Processing cancelled");
    }

    onProgress?.({
      phase: "parsing",
      percentage: 40,
      message: "Processing commits and branches...",
    });

    // Convert commits
    const commits: GitCommit[] = repoData.defaultBranchRef.target.history.nodes.map(
      convertGitHubCommit
    );

    // Check if there are more commits than we fetched
    const totalCommits = repoData.defaultBranchRef.target.history.totalCount;
    if (totalCommits > commits.length) {
      warnings.push({
        severity: "info",
        type: "large-repo",
        message: `Repository has ${totalCommits} commits, but only ${commits.length} were fetched for performance.`,
        details: {
          totalCommits,
          fetchedCommits: commits.length,
          hasNextPage: repoData.defaultBranchRef.target.history.pageInfo.hasNextPage,
        },
      });
    }

    // Convert branches
    const branches: GitBranch[] = repoData.refs.nodes.map(ref => ({
      name: ref.name,
      target: ref.target.oid,
    }));

    // Make sure default branch is first
    const defaultBranchIndex = branches.findIndex(
      b => b.name === repoData.defaultBranchRef.name
    );
    if (defaultBranchIndex > 0) {
      const defaultBranch = branches.splice(defaultBranchIndex, 1)[0];
      branches.unshift(defaultBranch);
    }

    // Convert tags
    const tags: GitTag[] = repoData.tags.nodes.map(tag => ({
      name: tag.name,
      target: tag.target.oid,
    }));

    // Check for cancellation
    if (signal?.aborted) {
      throw new Error("Processing cancelled");
    }

    onProgress?.({
      phase: "building",
      percentage: 70,
      message: "Building DAG model...",
    });

    const buildStart = performance.now();

    // Build DAG nodes
    const dagNodes: DagNode[] = commits.map(commit => ({
      id: commit.id,
      title: commit.message.split('\n')[0].substring(0, 72), // First line, max 72 chars
      ts: commit.timestamp,
      parents: commit.parents,
    }));

    const parseMs = buildStart - parseStart;
    const buildMs = Date.now() - buildStart;

    // Repository metadata
    const metadata: RepositoryMetadata = {
      name: `${owner}/${name}`,
      commitCount: commits.length,
      branchCount: branches.length,
      tagCount: tags.length,
      processedAt: new Date(),
      defaultBranch: repoData.defaultBranchRef.name,
    };

    // Performance metrics
    const performanceMetrics: PerformanceMetrics = {
      totalMs: Date.now() - startTime,
      parseMs,
      buildMs,
    };

    // Check for cancellation
    if (signal?.aborted) {
      throw new Error("Processing cancelled");
    }

    onProgress?.({
      phase: "complete",
      percentage: 100,
      message: `Successfully loaded ${commits.length} commits from ${owner}/${name}`,
    });

    return {
      metadata,
      dag: {
        nodes: dagNodes,
        commits,
        branches,
        tags,
      },
      performance: performanceMetrics,
      warnings,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to process GitHub repository: ${error.message}`);
    }
    throw new Error('Failed to process GitHub repository: Unknown error');
  }
}

/**
 * Fetch additional commits for pagination
 * 
 * @param owner Repository owner
 * @param name Repository name
 * @param after Cursor for pagination
 * @param options Processing options
 * @returns Additional commits
 */
export async function fetchMoreCommits(
  owner: string,
  name: string,
  after: string,
  options: GitHubProcessorOptions = {}
): Promise<GitCommit[]> {
  const { maxCommits = 100, token } = options;
  
  const client = new GitHubApiClient(token);
  const repoData = await client.getRepository(owner, name, { maxCommits, after });
  
  return repoData.defaultBranchRef.target.history.nodes.map(convertGitHubCommit);
}

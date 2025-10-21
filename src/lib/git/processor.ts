/**
 * Git Repository Processor - Convert Git repositories to DAG visualization data.
 * 
 * This module provides the core functionality to:
 * - Parse Git repositories using isomorphic-git
 * - Convert Git objects (commits, branches, tags) to DAG format
 * - Monitor performance and provide warnings
 * - Handle merge commits and complex histories
 * 
 * Privacy-first: All processing happens in-browser, no data leaves the device.
 */

import * as git from "isomorphic-git";
import type { DagNode } from "@/viz/elk/layout";
import type { GitCommit, GitBranch, GitTag } from "@/cli/types";

/**
 * Repository metadata extracted during processing
 */
export interface RepositoryMetadata {
  /** Repository name (from directory or config) */
  name: string;
  /** Number of commits processed */
  commitCount: number;
  /** Number of branches */
  branchCount: number;
  /** Number of tags */
  tagCount: number;
  /** Processing timestamp */
  processedAt: Date;
  /** Default branch name (usually 'main' or 'master') */
  defaultBranch?: string;
}

/**
 * Performance metrics collected during processing
 */
export interface PerformanceMetrics {
  /** Total processing time in milliseconds */
  totalMs: number;
  /** Time spent parsing Git objects */
  parseMs: number;
  /** Time spent building DAG model */
  buildMs: number;
  /** Memory usage estimate in bytes */
  memoryBytes?: number;
}

/**
 * Warning generated during repository analysis
 */
export interface RepositoryWarning {
  /** Warning severity */
  severity: "info" | "warning" | "error";
  /** Warning type */
  type: "lfs-detected" | "large-repo" | "shallow-clone" | "missing-refs" | "performance";
  /** Human-readable message */
  message: string;
  /** Additional details */
  details?: Record<string, unknown>;
}

/**
 * Progress callback information
 */
export interface ProcessProgress {
  /** Current phase of processing */
  phase: "loading" | "parsing" | "building" | "complete";
  /** Progress percentage (0-100) */
  percentage: number;
  /** Current operation description */
  message: string;
  /** Items processed so far */
  processed?: number;
  /** Total items to process */
  total?: number;
}

/**
 * Options for processing a repository
 */
export interface ProcessorOptions {
  /** Maximum number of commits to process (performance guard) */
  maxCommits?: number;
  /** Progress callback */
  onProgress?: (progress: ProcessProgress) => void;
  /** Enable LFS detection */
  detectLFS?: boolean;
  /** Cancel signal */
  signal?: AbortSignal;
}

/**
 * Complete processed repository data
 */
export interface ProcessedRepository {
  /** Repository metadata */
  metadata: RepositoryMetadata;
  /** DAG model for visualization */
  dag: {
    nodes: DagNode[];
    commits: GitCommit[];
    branches: GitBranch[];
    tags: GitTag[];
  };
  /** Performance metrics */
  performance: PerformanceMetrics;
  /** Warnings generated during processing */
  warnings: RepositoryWarning[];
}

/**
 * Convert isomorphic-git commit to internal GitCommit format
 */
function convertCommit(readCommitResult: git.ReadCommitResult, oid: string): GitCommit {
  const { commit } = readCommitResult;
  return {
    id: oid,
    parents: commit.parent,
    message: commit.message,
    author: commit.author.name,
    timestamp: commit.author.timestamp * 1000, // Convert to milliseconds
    tree: commit.tree,
  };
}

/**
 * Process a local Git repository from FileSystemDirectoryHandle
 * 
 * @param handle Directory handle pointing to repository root
 * @param options Processing options
 * @returns Processed repository data with DAG model
 */
export async function processLocalRepository(
  handle: FileSystemDirectoryHandle,
  options: ProcessorOptions = {}
): Promise<ProcessedRepository> {
  const startTime = performance.now();
  const { maxCommits = 10000, onProgress, detectLFS = true, signal } = options;

  const warnings: RepositoryWarning[] = [];

  // Report loading phase
  onProgress?.({
    phase: "loading",
    percentage: 5,
    message: "Initializing repository access...",
  });

  // Create a filesystem interface for isomorphic-git
  const fs = await createFSFromHandle(handle);
  const dir = "/";

  try {
    // Report parsing phase
    onProgress?.({
      phase: "parsing",
      percentage: 10,
      message: "Reading repository structure...",
    });

    const parseStart = performance.now();

    // Get all branches
    const branches = await git.listBranches({ fs, dir });
    const gitBranches: GitBranch[] = [];

    for (const branchName of branches) {
      try {
        const resolveResult = await git.resolveRef({ fs, dir, ref: `refs/heads/${branchName}` });
        gitBranches.push({
          name: branchName,
          target: resolveResult,
        });
      } catch (error) {
        warnings.push({
          severity: "warning",
          type: "missing-refs",
          message: `Could not resolve branch: ${branchName}`,
          details: { branch: branchName, error },
        });
      }
    }

    // Get all tags
    const tags = await git.listTags({ fs, dir });
    const gitTags: GitTag[] = [];

    for (const tagName of tags) {
      try {
        const resolveResult = await git.resolveRef({ fs, dir, ref: `refs/tags/${tagName}` });
        // Try to read annotated tag message
        try {
          const tagObject = await git.readTag({ fs, dir, oid: resolveResult });
          gitTags.push({
            name: tagName,
            target: tagObject.tag.object,
            message: tagObject.tag.message,
          });
        } catch {
          // Not an annotated tag, just use the commit reference
          gitTags.push({
            name: tagName,
            target: resolveResult,
          });
        }
      } catch (error) {
        warnings.push({
          severity: "warning",
          type: "missing-refs",
          message: `Could not resolve tag: ${tagName}`,
          details: { tag: tagName, error },
        });
      }
    }

    // Determine default branch
    let defaultBranch: string | undefined;
    try {
      const headRef = await git.resolveRef({ fs, dir, ref: "HEAD", depth: 2 });
      defaultBranch = headRef.replace("refs/heads/", "");
    } catch {
      // Fall back to common defaults
      defaultBranch = branches.find(b => b === "main" || b === "master");
    }

    onProgress?.({
      phase: "parsing",
      percentage: 30,
      message: "Walking commit history...",
    });

    // Walk commit history from all branch heads
    const commitMap = new Map<string, GitCommit>();
    const visitedOids = new Set<string>();

    // Collect all branch heads
    const heads = gitBranches.map(b => b.target);

    // Walk commits from all heads
    let processedCount = 0;
    for (const head of heads) {
      if (signal?.aborted) {
        throw new Error("Processing cancelled");
      }

      const commits = await git.log({
        fs,
        dir,
        ref: head,
      });

      for (const commitInfo of commits) {
        if (signal?.aborted) {
          throw new Error("Processing cancelled");
        }

        const oid = commitInfo.oid;
        
        // Skip if already processed
        if (visitedOids.has(oid)) {
          continue;
        }

        // Check max commits limit
        if (processedCount >= maxCommits) {
          warnings.push({
            severity: "warning",
            type: "large-repo",
            message: `Repository has more than ${maxCommits} commits. Only the first ${maxCommits} were processed.`,
            details: { maxCommits, processedCount },
          });
          break;
        }

        visitedOids.add(oid);
        processedCount++;

        // Read full commit data
        const readCommitResult = await git.readCommit({ fs, dir, oid });
        const gitCommit = convertCommit(readCommitResult, oid);
        commitMap.set(oid, gitCommit);

        // Report progress periodically
        if (processedCount % 100 === 0) {
          onProgress?.({
            phase: "parsing",
            percentage: 30 + Math.min(40, (processedCount / Math.min(maxCommits, 1000)) * 40),
            message: `Parsed ${processedCount} commits...`,
            processed: processedCount,
          });
        }
      }
    }

    const parseMs = performance.now() - parseStart;

    // Check for shallow clone
    try {
      const shallowFile = await fs.promises.readFile("/.git/shallow", "utf8");
      if (shallowFile) {
        warnings.push({
          severity: "info",
          type: "shallow-clone",
          message: "Repository is a shallow clone. Full history may not be available.",
        });
      }
    } catch {
      // Not a shallow clone, or error reading - ignore
    }

    // LFS detection (if enabled)
    if (detectLFS) {
      try {
        const lfsConfig = await fs.promises.readFile("/.git/config", "utf8");
        if (typeof lfsConfig === "string" && (lfsConfig.includes("[lfs]") || lfsConfig.includes("git-lfs"))) {
          warnings.push({
            severity: "info",
            type: "lfs-detected",
            message: "Git LFS is enabled in this repository. Large files may not be fully available.",
          });
        }
      } catch {
        // No config or error reading - ignore
      }
    }

    onProgress?.({
      phase: "building",
      percentage: 75,
      message: "Building DAG model...",
    });

    const buildStart = performance.now();

    // Build DAG model
    const commits = Array.from(commitMap.values());
    const dagNodes = buildDagModel(commits, gitBranches, gitTags);

    const buildMs = performance.now() - buildStart;
    const totalMs = performance.now() - startTime;

    onProgress?.({
      phase: "complete",
      percentage: 100,
      message: "Processing complete",
    });

    // Check performance thresholds
    if (totalMs > 5000) {
      warnings.push({
        severity: "warning",
        type: "performance",
        message: `Processing took ${Math.round(totalMs)}ms. Consider using a smaller repository or reducing history depth.`,
        details: { totalMs, commitCount: commits.length },
      });
    }

    return {
      metadata: {
        name: handle.name,
        commitCount: commits.length,
        branchCount: gitBranches.length,
        tagCount: gitTags.length,
        processedAt: new Date(),
        defaultBranch,
      },
      dag: {
        nodes: dagNodes,
        commits,
        branches: gitBranches,
        tags: gitTags,
      },
      performance: {
        totalMs,
        parseMs,
        buildMs,
      },
      warnings,
    };
  } catch (error) {
    // Re-throw with more context
    if (signal?.aborted) {
      throw new Error("Repository processing was cancelled");
    }
    throw new Error(
      `Failed to process repository: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Build DAG model from Git commits, branches, and tags
 * 
 * @param commits Array of Git commits
 * @param branches Array of Git branches
 * @param tags Array of Git tags
 * @returns Array of DAG nodes for visualization
 */
export function buildDagModel(
  commits: GitCommit[],
  branches: GitBranch[],
  tags: GitTag[]
): DagNode[] {
  // Build ref map (commit ID -> array of ref names)
  const refMap = new Map<string, string[]>();

  // Add branches
  for (const branch of branches) {
    const refs = refMap.get(branch.target) ?? [];
    refs.push(branch.name);
    refMap.set(branch.target, refs);
  }

  // Add tags
  for (const tag of tags) {
    const refs = refMap.get(tag.target) ?? [];
    refs.push(`tag: ${tag.name}`);
    refMap.set(tag.target, refs);
  }

  // Convert commits to DAG nodes
  const dagNodes: DagNode[] = commits.map(commit => {
    const refs = refMap.get(commit.id);
    
    // Truncate commit message to first line and limit length
    const firstLine = commit.message.split("\n")[0];
    const title = firstLine.length > 50 ? firstLine.substring(0, 47) + "..." : firstLine;

    return {
      id: commit.id,
      title,
      ts: commit.timestamp,
      parents: commit.parents,
      refs,
      // Overlay fields (null by default, can be enriched later)
      pr: null,
      ci: null,
    };
  });

  return dagNodes;
}

/**
 * Create a filesystem interface for isomorphic-git from FileSystemDirectoryHandle
 * 
 * This adapts the File System Access API to the interface expected by isomorphic-git.
 */
async function createFSFromHandle(handle: FileSystemDirectoryHandle): Promise<{
  promises: {
    readFile(path: string, encoding?: string): Promise<string | Uint8Array>;
    writeFile(path: string, data: string | Uint8Array): Promise<void>;
    readdir(path: string): Promise<string[]>;
    mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
    rmdir(path: string): Promise<void>;
    unlink(path: string): Promise<void>;
    stat(path: string): Promise<{ type: "file" | "dir"; size: number; mode: number }>;
    lstat(path: string): Promise<{ type: "file" | "dir"; size: number; mode: number }>;
    readlink(path: string): Promise<string>;
    symlink(target: string, path: string): Promise<void>;
  };
}> {
  // Cache for directory handles
  const handleCache = new Map<string, FileSystemDirectoryHandle>();
  handleCache.set("/", handle);

  /**
   * Get a directory handle for a given path
   */
  async function getDirHandle(path: string): Promise<FileSystemDirectoryHandle> {
    if (handleCache.has(path)) {
      return handleCache.get(path)!;
    }

    const parts = path.split("/").filter(p => p);
    let current = handle;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const currentPath = "/" + parts.slice(0, i + 1).join("/");

      if (handleCache.has(currentPath)) {
        current = handleCache.get(currentPath)!;
        continue;
      }

      try {
        current = await current.getDirectoryHandle(part);
        handleCache.set(currentPath, current);
      } catch (error) {
        throw new Error(`Directory not found: ${currentPath}`);
      }
    }

    return current;
  }

  /**
   * Get a file handle for a given path
   */
  async function getFileHandle(path: string): Promise<FileSystemFileHandle> {
    const parts = path.split("/").filter(p => p);
    const fileName = parts.pop();
    
    if (!fileName) {
      throw new Error(`Invalid file path: ${path}`);
    }

    const dirPath = "/" + parts.join("/");
    const dirHandle = await getDirHandle(dirPath);

    try {
      return await dirHandle.getFileHandle(fileName);
    } catch (error) {
      throw new Error(`File not found: ${path}`);
    }
  }

  return {
    promises: {
      async readFile(path: string, encoding?: string): Promise<string | Uint8Array> {
        const fileHandle = await getFileHandle(path);
        const file = await fileHandle.getFile();
        
        if (encoding === "utf8" || encoding === "utf-8") {
          return await file.text();
        }
        
        const buffer = await file.arrayBuffer();
        return new Uint8Array(buffer);
      },

      async writeFile(path: string, data: string | Uint8Array): Promise<void> {
        const parts = path.split("/").filter(p => p);
        const fileName = parts.pop();
        
        if (!fileName) {
          throw new Error(`Invalid file path: ${path}`);
        }

        const dirPath = "/" + parts.join("/");
        const dirHandle = await getDirHandle(dirPath);

        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        // Write the data - handle both string and Uint8Array
        if (typeof data === "string") {
          await writable.write(data);
        } else {
          // Create new Uint8Array to ensure proper type
          await writable.write(new Blob([new Uint8Array(data)]));
        }
        await writable.close();
      },

      async readdir(path: string): Promise<string[]> {
        const dirHandle = await getDirHandle(path);
        const entries: string[] = [];

        for await (const [name] of dirHandle.entries()) {
          entries.push(name);
        }

        return entries;
      },

      async mkdir(path: string, _options?: { recursive?: boolean }): Promise<void> {
        const parts = path.split("/").filter(p => p);
        let current = handle;

        for (const part of parts) {
          current = await current.getDirectoryHandle(part, { create: true });
        }
      },

      async rmdir(path: string): Promise<void> {
        const parts = path.split("/").filter(p => p);
        const dirName = parts.pop();
        
        if (!dirName) {
          throw new Error(`Invalid directory path: ${path}`);
        }

        const parentPath = "/" + parts.join("/");
        const parentHandle = await getDirHandle(parentPath);

        await parentHandle.removeEntry(dirName, { recursive: true });
      },

      async unlink(path: string): Promise<void> {
        const parts = path.split("/").filter(p => p);
        const fileName = parts.pop();
        
        if (!fileName) {
          throw new Error(`Invalid file path: ${path}`);
        }

        const dirPath = "/" + parts.join("/");
        const dirHandle = await getDirHandle(dirPath);

        await dirHandle.removeEntry(fileName);
      },

      async stat(path: string): Promise<{ type: "file" | "dir"; size: number; mode: number }> {
        try {
          await getDirHandle(path);
          return { type: "dir", size: 0, mode: 0o755 };
        } catch {
          const fileHandle = await getFileHandle(path);
          const file = await fileHandle.getFile();
          return { type: "file", size: file.size, mode: 0o644 };
        }
      },

      async lstat(path: string): Promise<{ type: "file" | "dir"; size: number; mode: number }> {
        // For simplicity, lstat behaves the same as stat
        return this.stat(path);
      },

      async readlink(_path: string): Promise<string> {
        // Symlinks are not supported in File System Access API
        throw new Error("Symlinks are not supported");
      },

      async symlink(_target: string, _path: string): Promise<void> {
        // Symlinks are not supported in File System Access API
        throw new Error("Symlinks are not supported");
      },
    },
  };
}

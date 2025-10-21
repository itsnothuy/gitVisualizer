/**
 * Unit tests for Git repository processor.
 * 
 * These tests verify:
 * - Local repository processing with mocked File System Access API
 * - DAG model building from Git commits, branches, and tags
 * - Performance monitoring and metrics
 * - Warning generation for edge cases
 * - Progress callback functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  processLocalRepository,
  buildDagModel,
  type ProcessProgress,
} from "../processor";
import type { GitCommit, GitBranch, GitTag } from "@/cli/types";

// Mock isomorphic-git
vi.mock("isomorphic-git", () => ({
  listBranches: vi.fn(),
  listTags: vi.fn(),
  resolveRef: vi.fn(),
  readTag: vi.fn(),
  log: vi.fn(),
  readCommit: vi.fn(),
}));

describe("buildDagModel", () => {
  it("should convert commits to DAG nodes", () => {
    const commits: GitCommit[] = [
      {
        id: "abc123",
        parents: ["def456"],
        message: "Initial commit",
        author: "Test User",
        timestamp: 1234567890000,
      },
      {
        id: "def456",
        parents: [],
        message: "Root commit",
        author: "Test User",
        timestamp: 1234567880000,
      },
    ];

    const branches: GitBranch[] = [];
    const tags: GitTag[] = [];

    const dagNodes = buildDagModel(commits, branches, tags);

    expect(dagNodes).toHaveLength(2);
    expect(dagNodes[0]).toMatchObject({
      id: "abc123",
      title: "Initial commit",
      ts: 1234567890000,
      parents: ["def456"],
      pr: null,
      ci: null,
    });
    expect(dagNodes[1]).toMatchObject({
      id: "def456",
      title: "Root commit",
      ts: 1234567880000,
      parents: [],
      pr: null,
      ci: null,
    });
  });

  it("should truncate long commit messages", () => {
    const commits: GitCommit[] = [
      {
        id: "abc123",
        parents: [],
        message: "This is a very long commit message that exceeds the maximum length allowed for display",
        author: "Test User",
        timestamp: 1234567890000,
      },
    ];

    const dagNodes = buildDagModel(commits, [], []);

    expect(dagNodes[0].title).toHaveLength(50);
    expect(dagNodes[0].title).toContain("...");
  });

  it("should use first line of multi-line commit messages", () => {
    const commits: GitCommit[] = [
      {
        id: "abc123",
        parents: [],
        message: "First line\n\nDetailed description on multiple lines",
        author: "Test User",
        timestamp: 1234567890000,
      },
    ];

    const dagNodes = buildDagModel(commits, [], []);

    expect(dagNodes[0].title).toBe("First line");
  });

  it("should attach branch refs to commits", () => {
    const commits: GitCommit[] = [
      {
        id: "abc123",
        parents: [],
        message: "Commit",
        author: "Test User",
        timestamp: 1234567890000,
      },
    ];

    const branches: GitBranch[] = [
      { name: "main", target: "abc123" },
      { name: "develop", target: "abc123" },
    ];

    const dagNodes = buildDagModel(commits, branches, []);

    expect(dagNodes[0].refs).toEqual(expect.arrayContaining(["main", "develop"]));
  });

  it("should attach tag refs to commits", () => {
    const commits: GitCommit[] = [
      {
        id: "abc123",
        parents: [],
        message: "Release commit",
        author: "Test User",
        timestamp: 1234567890000,
      },
    ];

    const tags: GitTag[] = [
      { name: "v1.0.0", target: "abc123", message: "Version 1.0.0" },
      { name: "v1.0.1", target: "abc123" },
    ];

    const dagNodes = buildDagModel(commits, [], tags);

    expect(dagNodes[0].refs).toEqual(
      expect.arrayContaining(["tag: v1.0.0", "tag: v1.0.1"])
    );
  });

  it("should handle commits with multiple parents (merge commits)", () => {
    const commits: GitCommit[] = [
      {
        id: "merge123",
        parents: ["abc123", "def456"],
        message: "Merge branch 'feature'",
        author: "Test User",
        timestamp: 1234567890000,
      },
      {
        id: "abc123",
        parents: [],
        message: "Main commit",
        author: "Test User",
        timestamp: 1234567880000,
      },
      {
        id: "def456",
        parents: [],
        message: "Feature commit",
        author: "Test User",
        timestamp: 1234567885000,
      },
    ];

    const dagNodes = buildDagModel(commits, [], []);

    expect(dagNodes[0].parents).toEqual(["abc123", "def456"]);
    expect(dagNodes[0].id).toBe("merge123");
  });

  it("should handle empty repository", () => {
    const dagNodes = buildDagModel([], [], []);
    expect(dagNodes).toEqual([]);
  });

  it("should not set refs when there are no branches or tags", () => {
    const commits: GitCommit[] = [
      {
        id: "abc123",
        parents: [],
        message: "Commit",
        author: "Test User",
        timestamp: 1234567890000,
      },
    ];

    const dagNodes = buildDagModel(commits, [], []);

    expect(dagNodes[0].refs).toBeUndefined();
  });
});

describe("processLocalRepository", () => {
  let mockHandle: FileSystemDirectoryHandle;
  let git: typeof import("isomorphic-git");

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Import mocked git
    git = await import("isomorphic-git");

    // Create mock handle
    mockHandle = {
      kind: "directory" as const,
      name: "test-repo",
      getDirectoryHandle: vi.fn(),
      getFileHandle: vi.fn(),
      removeEntry: vi.fn(),
      resolve: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      entries: vi.fn(),
      [Symbol.asyncIterator]: vi.fn(),
      isSameEntry: vi.fn(),
      queryPermission: vi.fn(),
      requestPermission: vi.fn(),
    };

    // Setup default mock implementations
    vi.mocked(git.listBranches).mockResolvedValue(["main"]);
    vi.mocked(git.listTags).mockResolvedValue([]);
    vi.mocked(git.resolveRef).mockImplementation(async ({ ref }) => {
      if (ref === "refs/heads/main") return "abc123";
      if (ref === "HEAD") return "refs/heads/main";
      throw new Error("Reference not found");
    });
    vi.mocked(git.log).mockResolvedValue([
      {
        oid: "abc123",
        commit: {
          message: "Test commit",
          tree: "tree123",
          parent: [],
          author: {
            name: "Test User",
            email: "test@example.com",
            timestamp: 1234567890,
            timezoneOffset: 0,
          },
          committer: {
            name: "Test User",
            email: "test@example.com",
            timestamp: 1234567890,
            timezoneOffset: 0,
          },
        },
        payload: "",
      },
    ]);
    vi.mocked(git.readCommit).mockImplementation(async ({ oid }) => ({
      oid,
      commit: {
        message: "Test commit",
        tree: "tree123",
        parent: [],
        author: {
          name: "Test User",
          email: "test@example.com",
          timestamp: 1234567890,
          timezoneOffset: 0,
        },
        committer: {
          name: "Test User",
          email: "test@example.com",
          timestamp: 1234567890,
          timezoneOffset: 0,
        },
      },
      payload: "",
    }));

    // Mock File System Access API
    const gitDirHandle = {
      kind: "directory" as const,
      name: ".git",
      getDirectoryHandle: vi.fn(),
      getFileHandle: vi.fn().mockImplementation(async (name: string) => {
        if (name === "config" || name === "shallow") {
          throw new Error("File not found");
        }
        return {
          kind: "file" as const,
          name,
          getFile: vi.fn().mockResolvedValue({
            text: vi.fn().mockResolvedValue(""),
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
          }),
        };
      }),
      removeEntry: vi.fn(),
      resolve: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      entries: vi.fn(function* () {
        yield ["config", {} as FileSystemHandle] as [string, FileSystemHandle];
      }) as unknown as FileSystemDirectoryHandle["entries"],
      [Symbol.asyncIterator]: vi.fn(async function* () {
        yield ["config", {} as FileSystemHandle] as [string, FileSystemHandle];
      }) as unknown as FileSystemDirectoryHandle[typeof Symbol.asyncIterator],
      isSameEntry: vi.fn(),
      queryPermission: vi.fn(),
      requestPermission: vi.fn(),
    };

    vi.mocked(mockHandle.getDirectoryHandle).mockImplementation(async (name: string) => {
      if (name === ".git") {
        return gitDirHandle as FileSystemDirectoryHandle;
      }
      throw new Error("Directory not found");
    });

    vi.mocked(mockHandle.entries).mockImplementation(async function* () {
      yield [".git", gitDirHandle as FileSystemHandle] as [string, FileSystemHandle];
    });
  });

  it("should process a simple repository", async () => {
    const result = await processLocalRepository(mockHandle);

    expect(result.metadata.name).toBe("test-repo");
    expect(result.metadata.commitCount).toBe(1);
    expect(result.metadata.branchCount).toBe(1);
    expect(result.metadata.tagCount).toBe(0);
    expect(result.dag.nodes).toHaveLength(1);
    expect(result.dag.commits).toHaveLength(1);
    expect(result.dag.branches).toHaveLength(1);
    expect(result.performance.totalMs).toBeGreaterThan(0);
  });

  it("should call progress callback during processing", async () => {
    const onProgress = vi.fn();

    await processLocalRepository(mockHandle, { onProgress });

    expect(onProgress).toHaveBeenCalled();
    
    // Check for different phases
    const calls = onProgress.mock.calls.map((call: unknown[]) => (call[0] as ProcessProgress).phase);
    expect(calls).toContain("loading");
    expect(calls).toContain("parsing");
    expect(calls).toContain("building");
    expect(calls).toContain("complete");
  });

  it("should respect maxCommits limit", async () => {
    // Mock a repository with many commits
    const manyCommits = Array.from({ length: 150 }, (_, i) => ({
      oid: `commit${i}`,
      commit: {
        message: `Commit ${i}`,
        tree: "tree123",
        parent: i > 0 ? [`commit${i - 1}`] : [],
        author: {
          name: "Test User",
          email: "test@example.com",
          timestamp: 1234567890 + i,
          timezoneOffset: 0,
        },
        committer: {
          name: "Test User",
          email: "test@example.com",
          timestamp: 1234567890 + i,
          timezoneOffset: 0,
        },
      },
      payload: "",
    }));

    vi.mocked(git.log).mockResolvedValue(manyCommits);
    vi.mocked(git.readCommit).mockImplementation(async ({ oid }) => {
      const commit = manyCommits.find(c => c.oid === oid);
      if (!commit) throw new Error("Commit not found");
      return commit;
    });

    const result = await processLocalRepository(mockHandle, { maxCommits: 100 });

    expect(result.metadata.commitCount).toBe(100);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        type: "large-repo",
        severity: "warning",
      })
    );
  });

  it("should detect shallow clone", async () => {
    // Mock shallow file
    const shallowFileHandle = {
      kind: "file" as const,
      name: "shallow",
      getFile: vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue("abc123\n"),
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(7)),
      }),
    };

    const gitDirHandle = {
      kind: "directory" as const,
      name: ".git",
      getDirectoryHandle: vi.fn(),
      getFileHandle: vi.fn().mockImplementation(async (name: string) => {
        if (name === "shallow") return shallowFileHandle;
        if (name === "config") {
          return {
            kind: "file" as const,
            name: "config",
            getFile: vi.fn().mockResolvedValue({
              text: vi.fn().mockResolvedValue(""),
            }),
          };
        }
        throw new Error("File not found");
      }),
      removeEntry: vi.fn(),
      resolve: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      entries: vi.fn(),
      [Symbol.asyncIterator]: vi.fn(),
      isSameEntry: vi.fn(),
      queryPermission: vi.fn(),
      requestPermission: vi.fn(),
    };

    vi.mocked(mockHandle.getDirectoryHandle).mockImplementation(async (name: string) => {
      if (name === ".git") return gitDirHandle as FileSystemDirectoryHandle;
      throw new Error("Directory not found");
    });

    const result = await processLocalRepository(mockHandle);

    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        type: "shallow-clone",
        severity: "info",
      })
    );
  });

  it("should detect LFS configuration", async () => {
    const configFileHandle = {
      kind: "file" as const,
      name: "config",
      getFile: vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue("[lfs]\n\trepositoryformatversion = 0"),
        arrayBuffer: vi.fn(),
      }),
    };

    const gitDirHandle = {
      kind: "directory" as const,
      name: ".git",
      getDirectoryHandle: vi.fn(),
      getFileHandle: vi.fn().mockImplementation(async (name: string) => {
        if (name === "config") return configFileHandle;
        throw new Error("File not found");
      }),
      removeEntry: vi.fn(),
      resolve: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      entries: vi.fn(),
      [Symbol.asyncIterator]: vi.fn(),
      isSameEntry: vi.fn(),
      queryPermission: vi.fn(),
      requestPermission: vi.fn(),
    };

    vi.mocked(mockHandle.getDirectoryHandle).mockImplementation(async (name: string) => {
      if (name === ".git") return gitDirHandle as FileSystemDirectoryHandle;
      throw new Error("Directory not found");
    });

    const result = await processLocalRepository(mockHandle, { detectLFS: true });

    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        type: "lfs-detected",
        severity: "info",
      })
    );
  });

  it("should handle cancellation via AbortSignal", async () => {
    const controller = new AbortController();
    
    // Abort immediately
    controller.abort();

    await expect(
      processLocalRepository(mockHandle, { signal: controller.signal })
    ).rejects.toThrow("cancelled");
  });

  it("should generate performance warning for slow processing", async () => {
    // We can't reliably test slow processing in unit tests without timeouts
    // Instead, we'll verify that the warning logic works by mocking performance.now()
    const originalNow = performance.now;
    let callCount = 0;
    
    // Mock performance.now to simulate slow processing
    vi.spyOn(performance, "now").mockImplementation(() => {
      callCount++;
      // Start time
      if (callCount === 1) return 0;
      // End time (6000ms later to trigger warning)
      return 6000;
    });

    try {
      const result = await processLocalRepository(mockHandle, { maxCommits: 10 });

      // Check if performance warning was generated (processing > 5000ms)
      const perfWarning = result.warnings.find(w => w.type === "performance");
      expect(perfWarning).toBeDefined();
      expect(perfWarning?.message).toContain("6000ms");
    } finally {
      // Restore original performance.now
      vi.restoreAllMocks();
      performance.now = originalNow;
    }
  }, 10000);

  it("should handle repositories with multiple branches", async () => {
    vi.mocked(git.listBranches).mockResolvedValue(["main", "develop", "feature"]);
    vi.mocked(git.resolveRef).mockImplementation(async ({ ref }) => {
      if (ref === "refs/heads/main") return "abc123";
      if (ref === "refs/heads/develop") return "def456";
      if (ref === "refs/heads/feature") return "ghi789";
      if (ref === "HEAD") return "refs/heads/main";
      throw new Error("Reference not found");
    });

    const result = await processLocalRepository(mockHandle);

    expect(result.metadata.branchCount).toBe(3);
    expect(result.dag.branches).toHaveLength(3);
    expect(result.dag.branches).toContainEqual({ name: "main", target: "abc123" });
    expect(result.dag.branches).toContainEqual({ name: "develop", target: "def456" });
    expect(result.dag.branches).toContainEqual({ name: "feature", target: "ghi789" });
  });

  it("should handle repositories with tags", async () => {
    vi.mocked(git.listTags).mockResolvedValue(["v1.0.0", "v1.1.0"]);
    vi.mocked(git.resolveRef).mockImplementation(async ({ ref }) => {
      if (ref === "refs/heads/main") return "abc123";
      if (ref === "refs/tags/v1.0.0") return "abc123";
      if (ref === "refs/tags/v1.1.0") return "def456";
      if (ref === "HEAD") return "refs/heads/main";
      throw new Error("Reference not found");
    });
    vi.mocked(git.readTag).mockRejectedValue(new Error("Not an annotated tag"));

    const result = await processLocalRepository(mockHandle);

    expect(result.metadata.tagCount).toBe(2);
    expect(result.dag.tags).toHaveLength(2);
  });

  it("should handle annotated tags with messages", async () => {
    vi.mocked(git.listTags).mockResolvedValue(["v1.0.0"]);
    vi.mocked(git.resolveRef).mockImplementation(async ({ ref }) => {
      if (ref === "refs/heads/main") return "abc123";
      if (ref === "refs/tags/v1.0.0") return "abc123";
      if (ref === "HEAD") return "refs/heads/main";
      throw new Error("Reference not found");
    });
    vi.mocked(git.readTag).mockResolvedValue({
      oid: "abc123",
      tag: {
        object: "abc123",
        type: "commit",
        tag: "v1.0.0",
        tagger: {
          name: "Test User",
          email: "test@example.com",
          timestamp: 1234567890,
          timezoneOffset: 0,
        },
        message: "Release version 1.0.0",
      },
      payload: "",
    });

    const result = await processLocalRepository(mockHandle);

    expect(result.dag.tags).toContainEqual({
      name: "v1.0.0",
      target: "abc123",
      message: "Release version 1.0.0",
    });
  });

  it("should handle errors in branch resolution gracefully", async () => {
    vi.mocked(git.listBranches).mockResolvedValue(["main", "broken"]);
    vi.mocked(git.resolveRef).mockImplementation(async ({ ref }) => {
      if (ref === "refs/heads/main") return "abc123";
      if (ref === "refs/heads/broken") throw new Error("Branch corrupted");
      if (ref === "HEAD") return "refs/heads/main";
      throw new Error("Reference not found");
    });

    const result = await processLocalRepository(mockHandle);

    expect(result.metadata.branchCount).toBe(1);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        type: "missing-refs",
        severity: "warning",
        message: expect.stringContaining("broken"),
      })
    );
  });

  it("should determine default branch correctly", async () => {
    vi.mocked(git.listBranches).mockResolvedValue(["main", "develop"]);
    vi.mocked(git.resolveRef).mockImplementation(async (options) => {
      const { ref } = options;
      if (ref === "refs/heads/main") return "abc123";
      if (ref === "refs/heads/develop") return "def456";
      if (ref === "HEAD" && "depth" in options && options.depth === 2) return "refs/heads/main";
      if (ref === "HEAD") return "abc123";
      throw new Error("Reference not found");
    });

    const result = await processLocalRepository(mockHandle);

    expect(result.metadata.defaultBranch).toBe("main");
  });
});

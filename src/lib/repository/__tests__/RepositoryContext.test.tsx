/**
 * Unit tests for Repository Context Provider
 * 
 * These tests verify:
 * - Context creation and usage
 * - Repository loading functionality
 * - Error handling
 * - State management
 * - Hook validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { RepositoryProvider, useRepository } from "../RepositoryContext";
import type { ReactNode } from "react";

// Mock the processor module
vi.mock("../../git/processor", () => ({
  processLocalRepository: vi.fn(),
}));

describe("RepositoryContext", () => {
  let mockHandle: FileSystemDirectoryHandle;
  let processLocalRepository: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import mocked processor
    const processor = await import("../../git/processor");
    processLocalRepository = vi.mocked(processor.processLocalRepository);

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

    // Setup default mock implementation
    processLocalRepository.mockResolvedValue({
      metadata: {
        name: "test-repo",
        commitCount: 10,
        branchCount: 2,
        tagCount: 1,
        processedAt: new Date(),
        defaultBranch: "main",
      },
      dag: {
        nodes: [],
        commits: [],
        branches: [],
        tags: [],
      },
      performance: {
        totalMs: 100,
        parseMs: 50,
        buildMs: 50,
      },
      warnings: [],
    });
  });

  describe("useRepository hook", () => {
    it("should throw error when used outside of RepositoryProvider", () => {
      // Suppress console.error for this test
      const consoleError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useRepository());
      }).toThrow("useRepository must be used within a RepositoryProvider");

      // Restore console.error
      console.error = consoleError;
    });

    it("should return context value when used within RepositoryProvider", () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.currentRepository).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBeNull();
      expect(result.current.handle).toBeNull();
      expect(result.current.recentRepositories).toEqual([]);
      expect(typeof result.current.loadRepository).toBe("function");
      expect(typeof result.current.clearRepository).toBe("function");
      expect(typeof result.current.clearError).toBe("function");
      expect(typeof result.current.switchToRecent).toBe("function");
    });
  });

  describe("loadRepository", () => {
    it("should load repository successfully", async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      // Initially, no repository is loaded
      expect(result.current.currentRepository).toBeNull();
      expect(result.current.isLoading).toBe(false);

      // Start loading
      await act(async () => {
        await result.current.loadRepository(mockHandle);
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Repository should be loaded
      expect(result.current.currentRepository).toBeDefined();
      expect(result.current.currentRepository?.metadata.name).toBe("test-repo");
      expect(result.current.error).toBeNull();
      expect(processLocalRepository).toHaveBeenCalledWith(
        mockHandle,
        expect.objectContaining({
          detectLFS: true,
        })
      );
    });

    it("should set isLoading to true during loading", async () => {
      let resolveProcessing: () => void;
      const processingPromise = new Promise<void>((resolve) => {
        resolveProcessing = resolve;
      });

      processLocalRepository.mockImplementation(async () => {
        await processingPromise;
        return {
          metadata: {
            name: "test-repo",
            commitCount: 10,
            branchCount: 2,
            tagCount: 1,
            processedAt: new Date(),
            defaultBranch: "main",
          },
          dag: {
            nodes: [],
            commits: [],
            branches: [],
            tags: [],
          },
          performance: {
            totalMs: 100,
            parseMs: 50,
            buildMs: 50,
          },
          warnings: [],
        };
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      // Start loading (don't await yet)
      act(() => {
        void result.current.loadRepository(mockHandle);
      });

      // Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Complete processing
      act(() => {
        resolveProcessing!();
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle errors during loading", async () => {
      processLocalRepository.mockRejectedValue(new Error("Failed to process"));

      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      await act(async () => {
        await result.current.loadRepository(mockHandle);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Failed to process");
      expect(result.current.currentRepository).toBeNull();
    });

    it("should call onProgress callback during processing", async () => {
      processLocalRepository.mockImplementation(async (_handle, options) => {
        // Simulate progress callbacks
        if (options?.onProgress) {
          options.onProgress({
            phase: "loading",
            percentage: 10,
            message: "Loading...",
          });
          options.onProgress({
            phase: "parsing",
            percentage: 50,
            message: "Parsing...",
          });
          options.onProgress({
            phase: "building",
            percentage: 80,
            message: "Building...",
          });
        }

        return {
          metadata: {
            name: "test-repo",
            commitCount: 10,
            branchCount: 2,
            tagCount: 1,
            processedAt: new Date(),
            defaultBranch: "main",
          },
          dag: {
            nodes: [],
            commits: [],
            branches: [],
            tags: [],
          },
          performance: {
            totalMs: 100,
            parseMs: 50,
            buildMs: 50,
          },
          warnings: [],
        };
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      await act(async () => {
        await result.current.loadRepository(mockHandle);
      });

      await waitFor(() => {
        expect(result.current.progress).toBeDefined();
      });

      // Progress should have been updated
      expect(result.current.progress?.phase).toBe("complete");
      expect(result.current.progress?.percentage).toBe(100);
    });

    it("should pass options to processLocalRepository", async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      await act(async () => {
        await result.current.loadRepository(mockHandle, {
          maxCommits: 500,
          detectLFS: false,
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(processLocalRepository).toHaveBeenCalledWith(
        mockHandle,
        expect.objectContaining({
          maxCommits: 500,
          detectLFS: false,
        })
      );
    });

    it("should clear previous state when loading a new repository", async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      // Load first repository
      await act(async () => {
        await result.current.loadRepository(mockHandle);
      });

      await waitFor(() => {
        expect(result.current.currentRepository).toBeDefined();
      });

      // Set an error manually (simulating a previous error)
      processLocalRepository.mockRejectedValueOnce(new Error("First error"));
      
      await act(async () => {
        await result.current.loadRepository(mockHandle);
      });

      await waitFor(() => {
        expect(result.current.error).toBe("First error");
      });

      // Load another repository (should clear previous error)
      processLocalRepository.mockResolvedValueOnce({
        metadata: {
          name: "new-repo",
          commitCount: 5,
          branchCount: 1,
          tagCount: 0,
          processedAt: new Date(),
        },
        dag: {
          nodes: [],
          commits: [],
          branches: [],
          tags: [],
        },
        performance: {
          totalMs: 50,
          parseMs: 25,
          buildMs: 25,
        },
        warnings: [],
      });

      await act(async () => {
        await result.current.loadRepository(mockHandle);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.currentRepository?.metadata.name).toBe("new-repo");
      });
    });
  });

  describe("clearRepository", () => {
    it("should clear repository state", async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      // Load repository first
      await act(async () => {
        await result.current.loadRepository(mockHandle);
      });

      await waitFor(() => {
        expect(result.current.currentRepository).toBeDefined();
      });

      // Clear repository
      act(() => {
        result.current.clearRepository();
      });

      expect(result.current.currentRepository).toBeNull();
      expect(result.current.handle).toBeNull();
      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("clearError", () => {
    it("should clear error state", async () => {
      processLocalRepository.mockRejectedValue(new Error("Test error"));

      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      // Trigger an error
      await act(async () => {
        await result.current.loadRepository(mockHandle);
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Test error");
      });

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("recent repositories", () => {
    it("should add repository to recent list after loading", async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      await act(async () => {
        await result.current.loadRepository(mockHandle);
      });

      await waitFor(() => {
        expect(result.current.recentRepositories.length).toBe(1);
      });

      expect(result.current.recentRepositories[0].name).toBe("test-repo");
      expect(result.current.recentRepositories[0].commitCount).toBe(10);
      expect(result.current.recentRepositories[0].branchCount).toBe(2);
    });

    it("should not duplicate repositories in recent list", async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      // Load same repository twice
      await act(async () => {
        await result.current.loadRepository(mockHandle);
      });

      await waitFor(() => {
        expect(result.current.recentRepositories.length).toBe(1);
      });

      await act(async () => {
        await result.current.loadRepository(mockHandle);
      });

      await waitFor(() => {
        expect(result.current.recentRepositories.length).toBe(1);
      });
    });

    it("should limit recent repositories to MAX_RECENT_REPOS", async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      // Create 6 different repository handles
      for (let i = 0; i < 6; i++) {
        const handle = {
          ...mockHandle,
          name: `repo-${i}`,
        } as FileSystemDirectoryHandle;

        processLocalRepository.mockResolvedValueOnce({
          metadata: {
            name: `repo-${i}`,
            commitCount: i + 1,
            branchCount: 1,
            tagCount: 0,
            processedAt: new Date(),
          },
          dag: {
            nodes: [],
            commits: [],
            branches: [],
            tags: [],
          },
          performance: {
            totalMs: 50,
            parseMs: 25,
            buildMs: 25,
          },
          warnings: [],
        });

        await act(async () => {
          await result.current.loadRepository(handle);
        });
      }

      await waitFor(() => {
        expect(result.current.recentRepositories.length).toBe(5);
      });
    });
  });

  describe("switchToRecent", () => {
    it("should switch to a recent repository", async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      // Load first repository
      await act(async () => {
        await result.current.loadRepository(mockHandle);
      });

      await waitFor(() => {
        expect(result.current.currentRepository?.metadata.name).toBe("test-repo");
      });

      // Load second repository
      const secondHandle = {
        ...mockHandle,
        name: "repo-2",
      } as FileSystemDirectoryHandle;

      processLocalRepository.mockResolvedValueOnce({
        metadata: {
          name: "repo-2",
          commitCount: 5,
          branchCount: 1,
          tagCount: 0,
          processedAt: new Date(),
        },
        dag: {
          nodes: [],
          commits: [],
          branches: [],
          tags: [],
        },
        performance: {
          totalMs: 50,
          parseMs: 25,
          buildMs: 25,
        },
        warnings: [],
      });

      await act(async () => {
        await result.current.loadRepository(secondHandle);
      });

      await waitFor(() => {
        expect(result.current.currentRepository?.metadata.name).toBe("repo-2");
        expect(result.current.recentRepositories.length).toBe(2);
      });

      // Switch back to first repository
      processLocalRepository.mockResolvedValueOnce({
        metadata: {
          name: "test-repo",
          commitCount: 10,
          branchCount: 2,
          tagCount: 1,
          processedAt: new Date(),
          defaultBranch: "main",
        },
        dag: {
          nodes: [],
          commits: [],
          branches: [],
          tags: [],
        },
        performance: {
          totalMs: 100,
          parseMs: 50,
          buildMs: 50,
        },
        warnings: [],
      });

      await act(async () => {
        await result.current.switchToRecent("test-repo");
      });

      await waitFor(() => {
        expect(result.current.currentRepository?.metadata.name).toBe("test-repo");
      });
    });

    it("should handle error when switching to non-existent repository", async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      await act(async () => {
        await result.current.switchToRecent("non-existent");
      });

      await waitFor(() => {
        expect(result.current.error).toContain("not found in cache");
      });
    });
  });
});

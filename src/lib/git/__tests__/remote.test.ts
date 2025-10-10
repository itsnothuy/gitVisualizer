/**
 * Unit tests for remote repository cloning with isomorphic-git.
 * 
 * These tests verify:
 * - Shallow clone functionality
 * - Error handling for network/CORS issues
 * - URL validation
 * - Progress callbacks
 * - OPFS availability detection
 */

import { describe, it, expect, vi } from "vitest";
import { shallowClone, isOPFSAvailable } from "../remote";

// Mock isomorphic-git
vi.mock("isomorphic-git", () => ({
  default: {
    clone: vi.fn(),
  },
  clone: vi.fn(),
}));

// Mock http module
vi.mock("isomorphic-git/http/web", () => ({
  default: {},
}));

// Mock LightningFS
vi.mock("@isomorphic-git/lightning-fs", () => {
  const mockPromises = {
    mkdir: vi.fn().mockResolvedValue(undefined),
  };

  return {
    default: vi.fn().mockImplementation(() => ({
      promises: mockPromises,
    })),
  };
});

describe("shallowClone", () => {
  it("should return error for invalid URL", async () => {
    const result = await shallowClone({
      url: "not-a-valid-url",
    });

    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe("invalid-url");
    expect(result.error?.message).toContain("Invalid repository URL");
  });

  it("should successfully clone a repository", async () => {
    const git = await import("isomorphic-git");
    vi.mocked(git.clone).mockResolvedValue(undefined);

    const result = await shallowClone({
      url: "https://github.com/user/repo",
      depth: 50,
    });

    if (result.error) {
      throw new Error(`Expected success but got error: ${result.error.message}`);
    }

    expect(result.fs).toBeDefined();
    expect(result.dir).toBe("/repo");
    expect(result.metadata.url).toBe("https://github.com/user/repo");
    expect(result.metadata.clonedAt).toBeInstanceOf(Date);
  });

  it("should use default depth of 50", async () => {
    const git = await import("isomorphic-git");
    const cloneMock = vi.mocked(git.clone).mockResolvedValue(undefined);

    await shallowClone({
      url: "https://github.com/user/repo",
    });

    expect(cloneMock).toHaveBeenCalledWith(
      expect.objectContaining({
        depth: 50,
        singleBranch: true,
      })
    );
  });

  it("should pass CORS proxy when provided", async () => {
    const git = await import("isomorphic-git");
    const cloneMock = vi.mocked(git.clone).mockResolvedValue(undefined);

    await shallowClone({
      url: "https://github.com/user/repo",
      corsProxy: "https://cors.isomorphic-git.org",
    });

    expect(cloneMock).toHaveBeenCalledWith(
      expect.objectContaining({
        corsProxy: "https://cors.isomorphic-git.org",
      })
    );
  });

  it("should call progress callback during clone", async () => {
    const git = await import("isomorphic-git");
    const progressCallback = vi.fn();

    // Mock clone to trigger progress callback
    vi.mocked(git.clone).mockImplementation(async (options: any) => {
      if (options.onProgress) {
        options.onProgress({
          phase: "Receiving",
          loaded: 50,
          total: 100,
        });
      }
    });

    await shallowClone({
      url: "https://github.com/user/repo",
      onProgress: progressCallback,
    });

    expect(progressCallback).toHaveBeenCalledWith({
      phase: "Receiving",
      loaded: 50,
      total: 100,
    });
  });

  it("should handle network errors", async () => {
    const git = await import("isomorphic-git");
    const networkError = new Error("fetch failed: network error");
    vi.mocked(git.clone).mockRejectedValue(networkError);

    const result = await shallowClone({
      url: "https://github.com/user/repo",
    });

    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe("network");
    expect(result.error?.message).toContain("Network error");
  });

  it("should handle CORS errors", async () => {
    const git = await import("isomorphic-git");
    const corsError = new Error("CORS error: cross-origin request blocked");
    vi.mocked(git.clone).mockRejectedValue(corsError);

    const result = await shallowClone({
      url: "https://github.com/user/repo",
    });

    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe("cors");
    expect(result.error?.message).toContain("CORS");
    expect(result.error?.message).toContain("proxy");
  });

  it("should handle unknown errors", async () => {
    const git = await import("isomorphic-git");
    const unknownError = new Error("Something went wrong");
    vi.mocked(git.clone).mockRejectedValue(unknownError);

    const result = await shallowClone({
      url: "https://github.com/user/repo",
    });

    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe("unknown");
    expect(result.error?.message).toBe("Something went wrong");
  });
});

describe("isOPFSAvailable", () => {
  it("should return true when OPFS is available", () => {
    // Mock navigator with OPFS support
    global.navigator = {
      storage: {
        getDirectory: vi.fn(),
      },
    } as unknown as Navigator;

    expect(isOPFSAvailable()).toBe(true);
  });

  it("should return false when navigator is not available", () => {
    // Save original navigator
    const originalNavigator = global.navigator;
    
    // Remove navigator
    // @ts-expect-error - Testing undefined navigator
    delete global.navigator;

    expect(isOPFSAvailable()).toBe(false);

    // Restore navigator
    global.navigator = originalNavigator;
  });

  it("should return false when storage API is not available", () => {
    global.navigator = {} as Navigator;

    expect(isOPFSAvailable()).toBe(false);
  });

  it("should return false when getDirectory is not available", () => {
    global.navigator = {
      storage: {},
    } as unknown as Navigator;

    expect(isOPFSAvailable()).toBe(false);
  });
});

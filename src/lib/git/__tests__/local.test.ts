/**
 * Unit tests for local repository ingestion via File System Access API.
 * 
 * These tests verify:
 * - Browser support detection
 * - Directory picker functionality
 * - Error handling for various scenarios
 * - Git repository validation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { isFileSystemAccessSupported, pickLocalRepoDir, isGitRepository } from "../local";

describe("isFileSystemAccessSupported", () => {
  it("should return true when showDirectoryPicker is available", () => {
    // Mock window.showDirectoryPicker
    global.window = {
      showDirectoryPicker: vi.fn(),
    } as unknown as Window & typeof globalThis;

    expect(isFileSystemAccessSupported()).toBe(true);
  });

  it("should return false when showDirectoryPicker is not available", () => {
    // Mock window without showDirectoryPicker
    global.window = {} as Window & typeof globalThis;

    expect(isFileSystemAccessSupported()).toBe(false);
  });

  it("should return false when window is not defined", () => {
    // Save original window
    const originalWindow = global.window;
    
    // Remove window
    // @ts-expect-error - Testing undefined window
    delete global.window;

    expect(isFileSystemAccessSupported()).toBe(false);

    // Restore window
    global.window = originalWindow;
  });
});

describe("pickLocalRepoDir", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should return error when File System Access API is not supported", async () => {
    // Mock unsupported browser
    global.window = {} as Window & typeof globalThis;

    const result = await pickLocalRepoDir();

    expect(result.handle).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe("unsupported");
    expect(result.error?.message).toContain("not supported");
  });

  it("should return handle when user selects a directory", async () => {
    const mockHandle = {
      kind: "directory",
      name: "test-repo",
    } as FileSystemDirectoryHandle;

    // Mock successful directory picker
    global.window = {
      showDirectoryPicker: vi.fn().mockResolvedValue(mockHandle),
    } as unknown as Window & typeof globalThis;

    const result = await pickLocalRepoDir();

    expect(result.handle).toBe(mockHandle);
    expect(result.error).toBeUndefined();
    expect(window.showDirectoryPicker).toHaveBeenCalledWith({
      mode: "read",
      startIn: "documents",
    });
  });

  it("should handle user cancellation gracefully", async () => {
    // Mock user cancelling the picker
    const abortError = new Error("User cancelled");
    abortError.name = "AbortError";

    global.window = {
      showDirectoryPicker: vi.fn().mockRejectedValue(abortError),
    } as unknown as Window & typeof globalThis;

    const result = await pickLocalRepoDir();

    expect(result.handle).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe("user-cancelled");
    expect(result.error?.message).toContain("cancelled");
  });

  it("should handle permission denial", async () => {
    // Mock permission denied
    const permissionError = new Error("Permission denied");
    permissionError.name = "NotAllowedError";

    global.window = {
      showDirectoryPicker: vi.fn().mockRejectedValue(permissionError),
    } as unknown as Window & typeof globalThis;

    const result = await pickLocalRepoDir();

    expect(result.handle).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe("permission-denied");
    expect(result.error?.message).toContain("Permission");
  });

  it("should handle security errors", async () => {
    // Mock security error
    const securityError = new Error("Security error");
    securityError.name = "SecurityError";

    global.window = {
      showDirectoryPicker: vi.fn().mockRejectedValue(securityError),
    } as unknown as Window & typeof globalThis;

    const result = await pickLocalRepoDir();

    expect(result.handle).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe("permission-denied");
  });

  it("should handle unknown errors", async () => {
    // Mock unknown error
    const unknownError = new Error("Unknown error");
    unknownError.name = "UnknownError";

    global.window = {
      showDirectoryPicker: vi.fn().mockRejectedValue(unknownError),
    } as unknown as Window & typeof globalThis;

    const result = await pickLocalRepoDir();

    expect(result.handle).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe("unknown");
    expect(result.error?.message).toContain("Unknown error");
  });
});

describe("isGitRepository", () => {
  it("should return true when .git directory exists", async () => {
    const mockGitHandle = {} as FileSystemDirectoryHandle;
    
    const mockHandle = {
      getDirectoryHandle: vi.fn().mockResolvedValue(mockGitHandle),
    } as unknown as FileSystemDirectoryHandle;

    const result = await isGitRepository(mockHandle);

    expect(result).toBe(true);
    expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith(".git");
  });

  it("should return false when .git directory does not exist", async () => {
    const mockHandle = {
      getDirectoryHandle: vi.fn().mockRejectedValue(new Error("Not found")),
    } as unknown as FileSystemDirectoryHandle;

    const result = await isGitRepository(mockHandle);

    expect(result).toBe(false);
  });

  it("should return false on any error accessing .git", async () => {
    const mockHandle = {
      getDirectoryHandle: vi.fn().mockRejectedValue(new DOMException("NotFoundError")),
    } as unknown as FileSystemDirectoryHandle;

    const result = await isGitRepository(mockHandle);

    expect(result).toBe(false);
  });
});

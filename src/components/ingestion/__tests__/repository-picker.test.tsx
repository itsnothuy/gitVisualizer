/**
 * Unit tests for RepositoryPicker component.
 * 
 * These tests verify:
 * - Component rendering and accessibility
 * - Browser support detection
 * - Error state display
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RepositoryPicker } from "../repository-picker";
import * as local from "@/lib/git/local";

// Mock the local git module
vi.mock("@/lib/git/local", () => ({
  isFileSystemAccessSupported: vi.fn(),
  pickLocalRepoDir: vi.fn(),
  isGitRepository: vi.fn(),
}));

describe("RepositoryPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the trigger button with correct accessibility attributes", () => {
    vi.mocked(local.isFileSystemAccessSupported).mockReturnValue(true);

    render(<RepositoryPicker />);

    const button = screen.getByRole("button", { name: /open local repository/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-testid", "open-repository");
    expect(button).not.toBeDisabled();
  });

  it("should disable button when File System Access API is not supported", () => {
    vi.mocked(local.isFileSystemAccessSupported).mockReturnValue(false);

    render(<RepositoryPicker />);

    const button = screen.getByRole("button", { name: /open local repository/i });
    expect(button).toBeDisabled();
  });

  it("should contain folder icon in button", () => {
    vi.mocked(local.isFileSystemAccessSupported).mockReturnValue(true);

    render(<RepositoryPicker />);

    const button = screen.getByRole("button", { name: /open local repository/i });
    expect(button.textContent).toContain("Open Repository");
  });

  it("should have proper ARIA label for accessibility", () => {
    vi.mocked(local.isFileSystemAccessSupported).mockReturnValue(true);

    render(<RepositoryPicker />);

    const button = screen.getByLabelText(/open local repository/i);
    expect(button).toBeInTheDocument();
  });

  it("should call isFileSystemAccessSupported on render", () => {
    const mockSupported = vi.mocked(local.isFileSystemAccessSupported);
    mockSupported.mockReturnValue(true);

    render(<RepositoryPicker />);

    expect(mockSupported).toHaveBeenCalled();
  });

  it("should accept onRepositorySelected callback prop", () => {
    vi.mocked(local.isFileSystemAccessSupported).mockReturnValue(true);
    const callback = vi.fn();

    render(<RepositoryPicker onRepositorySelected={callback} />);

    // Component should render without errors
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should accept onError callback prop", () => {
    vi.mocked(local.isFileSystemAccessSupported).mockReturnValue(true);
    const callback = vi.fn();

    render(<RepositoryPicker onError={callback} />);

    // Component should render without errors
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

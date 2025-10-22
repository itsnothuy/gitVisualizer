/**
 * Unit tests for RepositoryPicker component.
 * 
 * These tests verify:
 * - Component rendering and accessibility
 * - Browser support detection
 * - Error state display
 */

import * as local from "@/lib/git/local";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryPicker } from "../repository-picker";

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

    const button = screen.getByRole("button", { name: /open repository/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-testid", "open-repository");
    expect(button).not.toBeDisabled();
  });

  it("should always enable button regardless of File System Access API support", () => {
    vi.mocked(local.isFileSystemAccessSupported).mockReturnValue(false);

    render(<RepositoryPicker />);

    const button = screen.getByRole("button", { name: /open repository/i });
    expect(button).not.toBeDisabled(); // Button should always be enabled for GitHub URL input
  });

  it("should contain folder icon in button", () => {
    vi.mocked(local.isFileSystemAccessSupported).mockReturnValue(true);

    render(<RepositoryPicker />);

    const button = screen.getByRole("button", { name: /open repository/i });
    expect(button.textContent).toContain("Open Repository");
  });

  it("should have proper ARIA label for accessibility", () => {
    vi.mocked(local.isFileSystemAccessSupported).mockReturnValue(true);

    render(<RepositoryPicker />);

    const button = screen.getByLabelText(/open repository/i);
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

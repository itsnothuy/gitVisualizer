import type { ProcessedRepository } from "@/lib/git/processor";
import { RepositoryProvider } from "@/lib/repository/RepositoryContext";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { RepositoryHeader } from "../RepositoryHeader";

// Helper function to render with RepositoryProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<RepositoryProvider>{ui}</RepositoryProvider>);
};

// Mock repository data
const mockRepository: ProcessedRepository = {
  metadata: {
    name: "test-repo",
    commitCount: 42,
    branchCount: 3,
    tagCount: 2,
    processedAt: new Date("2025-10-21T00:00:00.000Z"),
    defaultBranch: "main",
  },
  dag: {
    nodes: [],
    commits: [],
    branches: [],
    tags: [],
  },
  performance: {
    totalMs: 150,
    parseMs: 100,
    buildMs: 50,
  },
  warnings: [],
};

describe("RepositoryHeader", () => {
  test("renders null state when no repository provided", () => {
    renderWithProvider(<RepositoryHeader repository={null} />);
    expect(screen.getByText("No Repository Loaded")).toBeInTheDocument();
    expect(screen.getByText(/Please select a repository/i)).toBeInTheDocument();
  });

  test("renders repository metadata correctly", () => {
    renderWithProvider(<RepositoryHeader repository={mockRepository} />);

    expect(screen.getByText("test-repo")).toBeInTheDocument();
    expect(screen.getByText(/42 commits/)).toBeInTheDocument();
    expect(screen.getByText(/3 branches/)).toBeInTheDocument();
    expect(screen.getByText(/2 tags/)).toBeInTheDocument();
    expect(screen.getByText(/Default: main/)).toBeInTheDocument();
  });

  test("renders refresh button when onRefresh provided", () => {
    const onRefresh = vi.fn();
    renderWithProvider(<RepositoryHeader repository={mockRepository} onRefresh={onRefresh} />);

    expect(screen.getByRole("button", { name: /refresh repository data/i })).toBeInTheDocument();
  });

  test("does not render refresh button when onRefresh not provided", () => {
    renderWithProvider(<RepositoryHeader repository={mockRepository} />);

    expect(screen.queryByRole("button", { name: /refresh repository data/i })).not.toBeInTheDocument();
  });

  test("calls onRefresh when refresh button clicked", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    renderWithProvider(<RepositoryHeader repository={mockRepository} onRefresh={onRefresh} />);

    const refreshButton = screen.getByRole("button", { name: /refresh repository data/i });
    await user.click(refreshButton);

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  test("disables refresh button while refreshing", async () => {
    const user = userEvent.setup();
    let resolveRefresh: () => void = () => { };
    const onRefresh = vi.fn(() => new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    }));

    renderWithProvider(<RepositoryHeader repository={mockRepository} onRefresh={onRefresh} />);

    const refreshButton = screen.getByRole("button", { name: /refresh repository data/i });

    // Click button to start refresh
    await user.click(refreshButton);

    // Button should be disabled and show refreshing text
    expect(refreshButton).toBeDisabled();
    expect(screen.getByText("Refreshing...")).toBeInTheDocument();

    // Resolve the refresh
    resolveRefresh();

    // Wait for button to be enabled again
    await vi.waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    });
  });

  test("shows default branch when provided", () => {
    renderWithProvider(<RepositoryHeader repository={mockRepository} />);
    expect(screen.getByText(/Default: main/)).toBeInTheDocument();
  });

  test("omits default branch when not provided", () => {
    const repoWithoutDefault = {
      ...mockRepository,
      metadata: {
        ...mockRepository.metadata,
        defaultBranch: undefined,
      },
    };

    renderWithProvider(<RepositoryHeader repository={repoWithoutDefault} />);
    expect(screen.queryByText(/Default:/)).not.toBeInTheDocument();
  });
});

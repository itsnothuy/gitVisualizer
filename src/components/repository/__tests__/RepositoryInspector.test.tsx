import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { RepositoryInspector } from "../RepositoryInspector";
import type { ProcessedRepository } from "@/lib/git/processor";
import type { GitCommit } from "@/cli/types";

// Mock repository data
const mockRepository: ProcessedRepository = {
  metadata: {
    name: "test-repo",
    commitCount: 10,
    branchCount: 2,
    tagCount: 1,
    processedAt: new Date("2025-10-21T00:00:00.000Z"),
    defaultBranch: "main",
  },
  dag: {
    nodes: [],
    commits: [],
    branches: [
      { name: "main", target: "abc123" },
      { name: "develop", target: "abc123" },
    ],
    tags: [
      { name: "v1.0.0", target: "abc123" },
    ],
  },
  performance: {
    totalMs: 150,
    parseMs: 100,
    buildMs: 50,
  },
  warnings: [],
};

const mockCommit: GitCommit = {
  id: "abc123",
  parents: ["def456", "ghi789"],
  message: "Add new feature\n\nThis is a detailed commit message",
  author: "Test User",
  timestamp: 1729468800000,
  tree: "tree123",
};

describe("RepositoryInspector", () => {
  test("renders nothing when no commit selected", () => {
    const { container } = render(
      <RepositoryInspector
        selectedCommit={null}
        repository={mockRepository}
        onClose={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders commit details when commit selected", () => {
    render(
      <RepositoryInspector
        selectedCommit={mockCommit}
        repository={mockRepository}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Commit Details")).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();
    expect(screen.getByText(/Add new feature/)).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  test("displays branches for the commit", () => {
    render(
      <RepositoryInspector
        selectedCommit={mockCommit}
        repository={mockRepository}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Branches")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByText("develop")).toBeInTheDocument();
  });

  test("displays tags for the commit", () => {
    render(
      <RepositoryInspector
        selectedCommit={mockCommit}
        repository={mockRepository}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Tags")).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
  });

  test("shows merge commit indicator for multiple parents", () => {
    render(
      <RepositoryInspector
        selectedCommit={mockCommit}
        repository={mockRepository}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Parents/)).toBeInTheDocument();
    expect(screen.getByText(/merge commit/i)).toBeInTheDocument();
  });

  test("calls onClose when close button clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <RepositoryInspector
        selectedCommit={mockCommit}
        repository={mockRepository}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole("button", { name: /close commit details/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("closes on Escape key press", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <RepositoryInspector
        selectedCommit={mockCommit}
        repository={mockRepository}
        onClose={onClose}
      />
    );

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("has proper ARIA role for accessibility", () => {
    render(
      <RepositoryInspector
        selectedCommit={mockCommit}
        repository={mockRepository}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("complementary", { name: /commit details/i })).toBeInTheDocument();
  });

  test("displays tree hash", () => {
    render(
      <RepositoryInspector
        selectedCommit={mockCommit}
        repository={mockRepository}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Tree")).toBeInTheDocument();
    expect(screen.getByText("tree123")).toBeInTheDocument();
  });

  test("handles commit with single parent", () => {
    const singleParentCommit = {
      ...mockCommit,
      parents: ["def456"],
    };

    render(
      <RepositoryInspector
        selectedCommit={singleParentCommit}
        repository={mockRepository}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Parent$/)).toBeInTheDocument(); // singular
    expect(screen.queryByText(/merge commit/i)).not.toBeInTheDocument();
  });
});

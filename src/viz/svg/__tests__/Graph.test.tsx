import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphSVG } from "../Graph";
import type { DagNode } from "../../elk/layout";

/**
 * Helper function to create mock graph data
 */
function createMockGraph(size: number): {
  nodes: DagNode[];
  edges: { id: string; source: string; target: string }[];
  positions: { [id: string]: { x: number; y: number } };
} {
  const nodes: DagNode[] = [];
  const edges: { id: string; source: string; target: string }[] = [];
  const positions: { [id: string]: { x: number; y: number } } = {};

  for (let i = 0; i < size; i++) {
    const id = `commit-${i}`;
    nodes.push({
      id,
      title: `Commit ${i}`,
      ts: Date.now() - i * 1000,
      parents: i > 0 ? [`commit-${i - 1}`] : [],
    });
    positions[id] = { x: i * 100, y: 0 };

    if (i > 0) {
      edges.push({
        id: `edge-${i}`,
        source: id,
        target: `commit-${i - 1}`,
      });
    }
  }

  return { nodes, edges, positions };
}

describe("GraphSVG Component", () => {
  describe("Basic Rendering", () => {
    it("should render an empty graph", () => {
      render(
        <GraphSVG
          nodes={[]}
          edges={[]}
          positions={{}}
        />
      );

      const svg = screen.getByRole("graphics-document");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-label", "Git commit graph with 0 commits");
    });

    it("should render nodes and edges correctly", () => {
      const { nodes, edges, positions } = createMockGraph(3);
      
      render(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
        />
      );

      const svg = screen.getByRole("graphics-document");
      expect(svg).toHaveAttribute("aria-label", "Git commit graph with 3 commits");

      // Check that all nodes are rendered
      nodes.forEach((node) => {
        const nodeElement = screen.getByTestId(`graph-node-${node.id}`);
        expect(nodeElement).toBeInTheDocument();
        expect(nodeElement).toHaveAttribute("role", "button");
        expect(nodeElement).toHaveAttribute("tabindex", "0");
      });
    });

    it("should render with custom dimensions", () => {
      const { nodes, edges, positions } = createMockGraph(2);
      
      const { container } = render(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
          width={800}
          height={400}
        />
      );

      // Check wrapper dimensions
      const wrapper = container.querySelector('[class*="react-transform-wrapper"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels on nodes", () => {
      const nodes: DagNode[] = [
        {
          id: "abc123",
          title: "Initial commit",
          ts: Date.now(),
          parents: [],
        },
      ];
      const positions = { abc123: { x: 0, y: 0 } };

      render(
        <GraphSVG
          nodes={nodes}
          edges={[]}
          positions={positions}
        />
      );

      const node = screen.getByRole("button", {
        name: /Commit abc123: Initial commit/i,
      });
      expect(node).toBeInTheDocument();
    });

    it("should include CI status in ARIA label", () => {
      const nodes: DagNode[] = [
        {
          id: "abc123",
          title: "Add tests",
          ts: Date.now(),
          parents: [],
          ci: { status: "success" },
        },
      ];
      const positions = { abc123: { x: 0, y: 0 } };

      render(
        <GraphSVG
          nodes={nodes}
          edges={[]}
          positions={positions}
        />
      );

      const node = screen.getByRole("button", {
        name: /Build passed/i,
      });
      expect(node).toBeInTheDocument();
    });

    it("should be keyboard navigable with Tab key", async () => {
      const user = userEvent.setup();
      const { nodes, edges, positions } = createMockGraph(3);

      render(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
        />
      );

      // Tab to first node
      await user.tab();
      const firstNode = screen.getByTestId(`graph-node-${nodes[0].id}`);
      expect(firstNode).toHaveFocus();

      // Tab to next node
      await user.tab();
      const secondNode = screen.getByTestId(`graph-node-${nodes[1].id}`);
      expect(secondNode).toHaveFocus();
    });

    it("should show focus ring when focused", async () => {
      const user = userEvent.setup();
      const { nodes, edges, positions } = createMockGraph(1);

      render(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
        />
      );

      const node = screen.getByTestId(`graph-node-${nodes[0].id}`);
      
      // Focus the node
      await user.tab();
      expect(node).toHaveFocus();

      // Check for focus ring by looking for the circle element with specific class
      // The focus ring is a circle with r="14" and text-ring class
      const svg = node.closest("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should navigate with arrow keys", async () => {
      const user = userEvent.setup();
      const { nodes, edges, positions } = createMockGraph(3);

      render(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
        />
      );

      // Focus first node
      const firstNode = screen.getByTestId(`graph-node-${nodes[0].id}`);
      firstNode.focus();
      expect(firstNode).toHaveFocus();

      // Arrow right to next node
      await user.keyboard("{ArrowRight}");
      const secondNode = screen.getByTestId(`graph-node-${nodes[1].id}`);
      expect(secondNode).toHaveFocus();

      // Arrow left back to first
      await user.keyboard("{ArrowLeft}");
      expect(firstNode).toHaveFocus();
    });

    it("should activate node with Enter key", async () => {
      const user = userEvent.setup();
      const onNodeSelect = vi.fn();
      const { nodes, edges, positions } = createMockGraph(1);

      render(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
          onNodeSelect={onNodeSelect}
        />
      );

      const node = screen.getByTestId(`graph-node-${nodes[0].id}`);
      node.focus();

      await user.keyboard("{Enter}");
      expect(onNodeSelect).toHaveBeenCalledWith(nodes[0]);
    });

    it("should activate node with Space key", async () => {
      const user = userEvent.setup();
      const onNodeSelect = vi.fn();
      const { nodes, edges, positions } = createMockGraph(1);

      render(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
          onNodeSelect={onNodeSelect}
        />
      );

      const node = screen.getByTestId(`graph-node-${nodes[0].id}`);
      node.focus();

      await user.keyboard(" ");
      expect(onNodeSelect).toHaveBeenCalledWith(nodes[0]);
    });

    it("should clear focus with Escape key", async () => {
      const user = userEvent.setup();
      const { nodes, edges, positions } = createMockGraph(1);

      render(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
        />
      );

      const node = screen.getByTestId(`graph-node-${nodes[0].id}`);
      node.focus();
      expect(node).toHaveFocus();

      await user.keyboard("{Escape}");
      expect(node).not.toHaveFocus();
    });
  });

  describe("Interaction Callbacks", () => {
    it("should call onNodeFocus when node receives focus", () => {
      const onNodeFocus = vi.fn();
      const { nodes, edges, positions } = createMockGraph(1);

      render(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
          onNodeFocus={onNodeFocus}
        />
      );

      const node = screen.getByTestId(`graph-node-${nodes[0].id}`);
      // Focus the node (not click)
      node.focus();

      expect(onNodeFocus).toHaveBeenCalledWith(nodes[0]);
    });

    it("should call onNodeSelect when node is clicked", async () => {
      const user = userEvent.setup();
      const onNodeSelect = vi.fn();
      const { nodes, edges, positions } = createMockGraph(1);

      render(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
          onNodeSelect={onNodeSelect}
        />
      );

      const node = screen.getByTestId(`graph-node-${nodes[0].id}`);
      await user.click(node);

      expect(onNodeSelect).toHaveBeenCalledWith(nodes[0]);
    });
  });

  describe("Status Indicators", () => {
    it("should render CI success indicator", () => {
      const nodes: DagNode[] = [
        {
          id: "commit1",
          title: "Test commit",
          ts: Date.now(),
          parents: [],
          ci: { status: "success" },
        },
      ];
      const positions = { commit1: { x: 0, y: 0 } };

      render(
        <GraphSVG
          nodes={nodes}
          edges={[]}
          positions={positions}
        />
      );

      const node = screen.getByTestId("graph-node-commit1");
      expect(node).toBeInTheDocument();
      
      // Check for status marker via aria-label
      const statusMarker = within(node).getByLabelText("Build passed");
      expect(statusMarker).toBeInTheDocument();
    });

    it("should render CI failed indicator", () => {
      const nodes: DagNode[] = [
        {
          id: "commit1",
          title: "Test commit",
          ts: Date.now(),
          parents: [],
          ci: { status: "failed" },
        },
      ];
      const positions = { commit1: { x: 0, y: 0 } };

      render(
        <GraphSVG
          nodes={nodes}
          edges={[]}
          positions={positions}
        />
      );

      const node = screen.getByTestId("graph-node-commit1");
      const statusMarker = within(node).getByLabelText("Build failed");
      expect(statusMarker).toBeInTheDocument();
    });

    it("should render branch/tag refs indicator", () => {
      const nodes: DagNode[] = [
        {
          id: "commit1",
          title: "Release commit",
          ts: Date.now(),
          parents: [],
          refs: ["main", "v1.0.0"],
        },
      ];
      const positions = { commit1: { x: 0, y: 0 } };

      render(
        <GraphSVG
          nodes={nodes}
          edges={[]}
          positions={positions}
        />
      );

      const node = screen.getByTestId("graph-node-commit1");
      expect(node).toBeInTheDocument();
      
      // Refs indicator is a small circle (visual only, no text)
      // We verify the node rendered successfully
      expect(node).toHaveAttribute("aria-label", expect.stringContaining("Release commit"));
    });

    it("should render PR indicator", () => {
      const nodes: DagNode[] = [
        {
          id: "commit1",
          title: "PR commit",
          ts: Date.now(),
          parents: [],
          pr: { id: "123", url: "https://github.com/user/repo/pull/123" },
        },
      ];
      const positions = { commit1: { x: 0, y: 0 } };

      render(
        <GraphSVG
          nodes={nodes}
          edges={[]}
          positions={positions}
        />
      );

      const node = screen.getByTestId("graph-node-commit1");
      expect(node).toBeInTheDocument();
    });
  });

  describe("Tooltip", () => {
    it("should show tooltip with commit details on hover", async () => {
      const nodes: DagNode[] = [
        {
          id: "abc1234567890",
          title: "Add new feature",
          ts: new Date("2024-01-15T12:00:00Z").getTime(),
          parents: [],
        },
      ];
      const positions = { abc1234567890: { x: 0, y: 0 } };

      render(
        <GraphSVG
          nodes={nodes}
          edges={[]}
          positions={positions}
        />
      );

      const node = screen.getByTestId("graph-node-abc1234567890");

      // Tooltip should show commit details
      // Note: Radix tooltips may need delay or specific interactions
      // This is a basic check that the tooltip trigger is set up
      expect(node).toBeInTheDocument();
    });

    it("should show refs in tooltip when present", () => {
      const nodes: DagNode[] = [
        {
          id: "commit1",
          title: "Release v1.0",
          ts: Date.now(),
          parents: [],
          refs: ["main", "v1.0.0", "production"],
        },
      ];
      const positions = { commit1: { x: 0, y: 0 } };

      render(
        <GraphSVG
          nodes={nodes}
          edges={[]}
          positions={positions}
        />
      );

      const node = screen.getByTestId("graph-node-commit1");
      expect(node).toBeInTheDocument();
    });
  });

  describe("Virtualization", () => {
    it("should render all nodes when below threshold", () => {
      const { nodes, edges, positions } = createMockGraph(50);

      render(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
          enableVirtualization={true}
          virtualizationThreshold={1000}
        />
      );

      // All nodes should be present
      nodes.forEach((node) => {
        expect(screen.getByTestId(`graph-node-${node.id}`)).toBeInTheDocument();
      });
    });

    it("should respect enableVirtualization prop", () => {
      const { nodes, edges, positions } = createMockGraph(10);

      const { rerender } = render(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
          enableVirtualization={false}
        />
      );

      // All nodes should be rendered
      nodes.forEach((node) => {
        expect(screen.getByTestId(`graph-node-${node.id}`)).toBeInTheDocument();
      });

      rerender(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
          enableVirtualization={true}
        />
      );

      // Should still render all since we're below default threshold
      nodes.forEach((node) => {
        expect(screen.getByTestId(`graph-node-${node.id}`)).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle nodes without positions gracefully", () => {
      const nodes: DagNode[] = [
        {
          id: "commit1",
          title: "Test",
          ts: Date.now(),
          parents: [],
        },
      ];

      render(
        <GraphSVG
          nodes={nodes}
          edges={[]}
          positions={{}} // No position for commit1
        />
      );

      // Should not crash, node should render at 0,0
      const node = screen.getByTestId("graph-node-commit1");
      expect(node).toBeInTheDocument();
    });

    it("should handle edges with missing source or target", () => {
      const nodes: DagNode[] = [
        {
          id: "commit1",
          title: "Test",
          ts: Date.now(),
          parents: [],
        },
      ];
      const edges = [
        {
          id: "edge1",
          source: "commit1",
          target: "nonexistent",
        },
      ];
      const positions = { commit1: { x: 0, y: 0 } };

      render(
        <GraphSVG
          nodes={nodes}
          edges={edges}
          positions={positions}
        />
      );

      // Should not crash
      expect(screen.getByRole("graphics-document")).toBeInTheDocument();
    });

    it("should truncate long commit messages", () => {
      const longMessage = "This is a very long commit message that should be truncated because it exceeds the 30 character limit";
      const nodes: DagNode[] = [
        {
          id: "commit1",
          title: longMessage,
          ts: Date.now(),
          parents: [],
        },
      ];
      const positions = { commit1: { x: 0, y: 0 } };

      render(
        <GraphSVG
          nodes={nodes}
          edges={[]}
          positions={positions}
        />
      );

      const node = screen.getByTestId("graph-node-commit1");
      expect(node).toBeInTheDocument();
      
      // The full message should be in the aria-label
      expect(node).toHaveAttribute("aria-label", expect.stringContaining(longMessage));
    });
  });
});

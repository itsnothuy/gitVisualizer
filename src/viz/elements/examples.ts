/**
 * Example demonstrating usage of the visual architecture system
 * 
 * This file shows how to use the class-based visual elements to render
 * a Git DAG. This is intended as a reference implementation and can be
 * used to gradually migrate from the current React-based rendering or
 * as an alternative rendering path.
 */

import { 
  VisNode, 
  VisEdge, 
  VisTag, 
  VisBranch,
  createEdgesForCommit,
  type CommitNode,
  type Visuals,
  type GridPosition
} from './index';

/**
 * Example: Create and render a simple Git DAG
 * 
 * This function demonstrates how to:
 * 1. Create visual elements from Git data
 * 2. Position them using the grid system
 * 3. Render them to an SVG container
 */
export function renderSimpleDAG(
  svgContainer: SVGElement,
  visuals: Visuals
): void {
  // Example commits
  const commits: CommitNode[] = [
    {
      id: 'abc123',
      title: 'Initial commit',
      ts: Date.now() - 3000,
      parents: [],
    },
    {
      id: 'def456',
      title: 'Add feature',
      ts: Date.now() - 2000,
      parents: ['abc123'],
    },
    {
      id: 'ghi789',
      title: 'Fix bug',
      ts: Date.now() - 1000,
      parents: ['def456'],
      ci: { status: 'success' },
    },
  ];

  // Grid positions for commits
  const positions: Map<string, GridPosition> = new Map([
    ['abc123', { branchIndex: 0, commitLevel: 2 }],
    ['def456', { branchIndex: 0, commitLevel: 1 }],
    ['ghi789', { branchIndex: 0, commitLevel: 0 }],
  ]);

  // Create visual nodes
  const nodes = commits.map(commit => {
    const position = positions.get(commit.id)!;
    return new VisNode(commit, position, visuals);
  });

  // Create edges
  const edges: VisEdge[] = [];
  commits.forEach(commit => {
    const position = positions.get(commit.id)!;
    const parents = commit.parents.map(parentId => ({
      id: parentId,
      position: positions.get(parentId)!,
    }));
    
    const commitEdges = createEdgesForCommit(
      commit.id,
      position,
      parents,
      visuals
    );
    
    edges.push(...commitEdges);
  });

  // Create a branch with tag
  // Note: VisBranch would be used when you have branch metadata
  
  // Render edges first (so they appear behind nodes)
  edges.forEach(edge => {
    const edgeElement = edge.render();
    svgContainer.appendChild(edgeElement);
  });

  // Render nodes
  nodes.forEach(node => {
    const nodeElement = node.render();
    svgContainer.appendChild(nodeElement);
  });
}

/**
 * Example: Update node positions dynamically
 * 
 * Demonstrates how to update element positions without re-rendering
 */
export function updateNodePosition(
  node: VisNode,
  newPosition: GridPosition
): void {
  node.setPosition(newPosition);
}

/**
 * Example: Add a branch label
 * 
 * Shows how to create and position a branch tag
 */
export function addBranchLabel(
  svgContainer: SVGElement,
  branchName: string,
  commitId: string,
  position: GridPosition,
  visuals: Visuals
): VisTag {
  const tag = new VisTag(
    {
      id: `tag-${branchName}`,
      label: branchName,
      type: 'branch',
      commitId,
    },
    position,
    'inline',
    visuals
  );

  const tagElement = tag.render();
  svgContainer.appendChild(tagElement);

  return tag;
}

/**
 * Example: Handle element removal
 * 
 * Clean up when elements are no longer needed
 */
export function removeElements(
  elements: Array<VisNode | VisEdge | VisTag | VisBranch>
): void {
  elements.forEach(element => {
    element.remove();
  });
}

/**
 * Example: Create a merge commit visualization
 * 
 * Shows how to handle commits with multiple parents
 */
export function renderMergeCommit(
  svgContainer: SVGElement,
  mergeCommit: CommitNode,
  mergePosition: GridPosition,
  parentPositions: Map<string, GridPosition>,
  visuals: Visuals
): { node: VisNode; edges: VisEdge[] } {
  // Create the merge node
  const node = new VisNode(mergeCommit, mergePosition, visuals);
  
  // Create edges to all parents
  const parents = mergeCommit.parents.map(parentId => ({
    id: parentId,
    position: parentPositions.get(parentId)!,
  }));
  
  const edges = createEdgesForCommit(
    mergeCommit.id,
    mergePosition,
    parents,
    visuals
  );

  // Render edges first
  edges.forEach(edge => {
    const edgeElement = edge.render();
    svgContainer.appendChild(edgeElement);
  });

  // Render node
  const nodeElement = node.render();
  svgContainer.appendChild(nodeElement);

  return { node, edges };
}

/**
 * Example: Element lifecycle management
 * 
 * Demonstrates how to manage a collection of visual elements
 */
export class VisualElementManager {
  private nodes: Map<string, VisNode> = new Map();
  private edges: Map<string, VisEdge> = new Map();
  private tags: Map<string, VisTag> = new Map();
  private branches: Map<string, VisBranch> = new Map();

  addNode(id: string, node: VisNode): void {
    this.nodes.set(id, node);
  }

  addEdge(id: string, edge: VisEdge): void {
    this.edges.set(id, edge);
  }

  addTag(id: string, tag: VisTag): void {
    this.tags.set(id, tag);
  }

  addBranch(id: string, branch: VisBranch): void {
    this.branches.set(id, branch);
  }

  getNode(id: string): VisNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): VisEdge | undefined {
    return this.edges.get(id);
  }

  getTag(id: string): VisTag | undefined {
    return this.tags.get(id);
  }

  getBranch(id: string): VisBranch | undefined {
    return this.branches.get(id);
  }

  removeNode(id: string): void {
    const node = this.nodes.get(id);
    if (node) {
      node.remove();
      this.nodes.delete(id);
    }
  }

  removeEdge(id: string): void {
    const edge = this.edges.get(id);
    if (edge) {
      edge.remove();
      this.edges.delete(id);
    }
  }

  removeTag(id: string): void {
    const tag = this.tags.get(id);
    if (tag) {
      tag.remove();
      this.tags.delete(id);
    }
  }

  removeBranch(id: string): void {
    const branch = this.branches.get(id);
    if (branch) {
      branch.remove();
      this.branches.delete(id);
    }
  }

  clear(): void {
    // Remove all elements
    this.nodes.forEach(node => node.remove());
    this.edges.forEach(edge => edge.remove());
    this.tags.forEach(tag => tag.remove());
    this.branches.forEach(branch => branch.remove());

    // Clear maps
    this.nodes.clear();
    this.edges.clear();
    this.tags.clear();
    this.branches.clear();
  }

  getAllNodes(): VisNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): VisEdge[] {
    return Array.from(this.edges.values());
  }

  getAllTags(): VisTag[] {
    return Array.from(this.tags.values());
  }

  getAllBranches(): VisBranch[] {
    return Array.from(this.branches.values());
  }
}

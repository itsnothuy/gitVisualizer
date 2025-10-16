/**
 * Animation mapper for Git operations
 * Maps Git state diffs to animation scenes
 */

import type { AnimScene } from './types';
import {
  sceneCommit,
  sceneBranchCreate,
  sceneBranchDelete,
  sceneCheckout,
  sceneFastForward,
  sceneMerge2P,
  sceneReset,
  sceneRevert,
} from './scenes/core';

/**
 * Git operation types that can be animated
 */
export type GitOperation =
  | 'commit'
  | 'branch-create'
  | 'branch-delete'
  | 'checkout'
  | 'fast-forward'
  | 'merge'
  | 'reset'
  | 'revert';

/**
 * Represents a Git commit node
 */
export interface GitNode {
  id: string;
  parents: string[];
  refs?: string[]; // Branch/tag names pointing to this commit
}

/**
 * Represents a branch/ref label
 */
export interface GitRef {
  name: string;
  target: string; // Commit ID
}

/**
 * Git repository state snapshot
 */
export interface GitState {
  nodes: GitNode[];
  refs: GitRef[];
  head: string; // Current HEAD (commit ID or ref name)
}

/**
 * Represents a diff between two Git states
 */
export interface GitDiff {
  operation: GitOperation;
  oldState: GitState;
  newState: GitState;
  // Additional metadata for specific operations
  metadata?: {
    branchName?: string;
    commitId?: string;
    parentIds?: string[];
    intermediateNodes?: string[];
    resetMode?: 'soft' | 'hard';
    labelPosition?: { x: number; y: number };
  };
}

/**
 * Map a Git diff to an animation scene
 * This is the main entry point for converting Git operations to animations
 */
export function mapDiffToScene(diff: GitDiff): AnimScene | null {
  switch (diff.operation) {
    case 'commit':
      return mapCommit(diff);
    case 'branch-create':
      return mapBranchCreate(diff);
    case 'branch-delete':
      return mapBranchDelete(diff);
    case 'checkout':
      return mapCheckout(diff);
    case 'fast-forward':
      return mapFastForward(diff);
    case 'merge':
      return mapMerge(diff);
    case 'reset':
      return mapReset(diff);
    case 'revert':
      return mapRevert(diff);
    default:
      return null;
  }
}

/**
 * Map a commit operation to a scene
 */
function mapCommit(diff: GitDiff): AnimScene {
  const newCommit = findNewCommit(diff.oldState, diff.newState);
  if (!newCommit) {
    throw new Error('No new commit found in diff');
  }

  return sceneCommit(newCommit.id);
}

/**
 * Map a branch create operation to a scene
 */
function mapBranchCreate(diff: GitDiff): AnimScene {
  const newRef = findNewRef(diff.oldState, diff.newState);
  if (!newRef) {
    throw new Error('No new branch found in diff');
  }

  const labelPos = diff.metadata?.labelPosition || { x: 0, y: 0 };
  return sceneBranchCreate(newRef.name, newRef.target, labelPos);
}

/**
 * Map a branch delete operation to a scene
 */
function mapBranchDelete(diff: GitDiff): AnimScene {
  const deletedRef = findDeletedRef(diff.oldState, diff.newState);
  if (!deletedRef) {
    throw new Error('No deleted branch found in diff');
  }

  return sceneBranchDelete(deletedRef.name);
}

/**
 * Map a checkout operation to a scene
 */
function mapCheckout(diff: GitDiff): AnimScene {
  const oldHead = resolveHead(diff.oldState);
  const newHead = resolveHead(diff.newState);

  if (!oldHead || !newHead) {
    throw new Error('Cannot resolve HEAD positions for checkout');
  }

  const labelPos = diff.metadata?.labelPosition || { x: 0, y: 0 };
  return sceneCheckout(oldHead, newHead, 'HEAD', labelPos);
}

/**
 * Map a fast-forward merge to a scene
 */
function mapFastForward(diff: GitDiff): AnimScene {
  const oldHead = resolveHead(diff.oldState);
  const newHead = resolveHead(diff.newState);

  if (!oldHead || !newHead) {
    throw new Error('Cannot resolve HEAD positions for fast-forward');
  }

  const branchName = diff.metadata?.branchName || 'HEAD';
  const intermediateNodes = diff.metadata?.intermediateNodes || [];
  const labelPos = diff.metadata?.labelPosition || { x: 0, y: 0 };

  return sceneFastForward(branchName, oldHead, newHead, intermediateNodes, labelPos);
}

/**
 * Map a merge operation to a scene
 */
function mapMerge(diff: GitDiff): AnimScene {
  const mergeCommit = findNewCommit(diff.oldState, diff.newState);
  if (!mergeCommit || mergeCommit.parents.length < 2) {
    throw new Error('No valid merge commit found in diff');
  }

  const parent1Id = mergeCommit.parents[0];
  const parent2Id = mergeCommit.parents[1];
  const secondParentEdgeId = `${mergeCommit.id}-${parent2Id}`;
  const branchName = diff.metadata?.branchName || 'HEAD';
  const labelPos = diff.metadata?.labelPosition || { x: 0, y: 0 };

  return sceneMerge2P(
    mergeCommit.id,
    parent1Id,
    parent2Id,
    secondParentEdgeId,
    branchName,
    labelPos
  );
}

/**
 * Map a reset operation to a scene
 */
function mapReset(diff: GitDiff): AnimScene {
  const oldHead = resolveHead(diff.oldState);
  const newHead = resolveHead(diff.newState);

  if (!oldHead || !newHead) {
    throw new Error('Cannot resolve HEAD positions for reset');
  }

  const mode = diff.metadata?.resetMode || 'soft';
  const labelPos = diff.metadata?.labelPosition || { x: 0, y: 0 };

  return sceneReset(oldHead, newHead, 'HEAD', labelPos, mode);
}

/**
 * Map a revert operation to a scene
 */
function mapRevert(diff: GitDiff): AnimScene {
  const revertCommit = findNewCommit(diff.oldState, diff.newState);
  if (!revertCommit) {
    throw new Error('No revert commit found in diff');
  }

  // Find the commit being reverted (typically mentioned in metadata or commit message)
  const originalCommitId = diff.metadata?.commitId || revertCommit.parents[0];
  const branchName = diff.metadata?.branchName || 'HEAD';
  const labelPos = diff.metadata?.labelPosition || { x: 0, y: 0 };

  return sceneRevert(revertCommit.id, originalCommitId, branchName, labelPos);
}

/**
 * Helper: Find a newly created commit in the diff
 */
function findNewCommit(oldState: GitState, newState: GitState): GitNode | null {
  const oldIds = new Set(oldState.nodes.map((n) => n.id));
  const newCommits = newState.nodes.filter((n) => !oldIds.has(n.id));
  return newCommits[0] || null;
}

/**
 * Helper: Find a newly created ref in the diff
 */
function findNewRef(oldState: GitState, newState: GitState): GitRef | null {
  const oldNames = new Set(oldState.refs.map((r) => r.name));
  const newRefs = newState.refs.filter((r) => !oldNames.has(r.name));
  return newRefs[0] || null;
}

/**
 * Helper: Find a deleted ref in the diff
 */
function findDeletedRef(oldState: GitState, newState: GitState): GitRef | null {
  const newNames = new Set(newState.refs.map((r) => r.name));
  const deletedRefs = oldState.refs.filter((r) => !newNames.has(r.name));
  return deletedRefs[0] || null;
}

/**
 * Helper: Resolve HEAD to a commit ID
 * Handles both direct commit references and symbolic refs
 */
function resolveHead(state: GitState): string | null {
  const { head, refs, nodes } = state;

  // Check if HEAD is a direct commit ID
  if (nodes.some((n) => n.id === head)) {
    return head;
  }

  // Check if HEAD is a symbolic ref
  const ref = refs.find((r) => r.name === head);
  if (ref) {
    return ref.target;
  }

  return null;
}

/**
 * Helper: Calculate intermediate commits between two nodes
 * Useful for fast-forward operations
 */
export function findIntermediateCommits(
  fromId: string,
  toId: string,
  nodes: GitNode[]
): string[] {
  // Simple BFS to find path from toId back to fromId
  const visited = new Set<string>();
  const queue: string[] = [toId];
  const path: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === fromId) break;
    if (visited.has(current)) continue;

    visited.add(current);
    const node = nodes.find((n) => n.id === current);
    if (node) {
      path.push(current);
      queue.push(...node.parents);
    }
  }

  // Remove the endpoints (fromId and toId)
  return path.filter((id) => id !== fromId && id !== toId);
}

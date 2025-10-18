/**
 * Tree comparison and diff computation for Git graphs
 * Computes differences between old and new graph states to generate animations
 */

import type { GitState, GitNode, GitRef } from '../anim/mapper';

/**
 * Types of changes that can occur in a Git graph
 */
export type ChangeType =
  | 'commitAdded'
  | 'commitRemoved'
  | 'branchAdded'
  | 'branchRemoved'
  | 'branchMoved'
  | 'headMoved'
  | 'merge'
  | 'rebase'
  | 'cherryPick';

/**
 * Base change object with common properties
 */
interface BaseChange {
  type: ChangeType;
}

/**
 * Commit added to the graph
 */
export interface CommitAddedChange extends BaseChange {
  type: 'commitAdded';
  nodeId: string;
  parents: string[];
  branchIndex?: number;
  level?: number;
}

/**
 * Commit removed from the graph (e.g., reset --hard)
 */
export interface CommitRemovedChange extends BaseChange {
  type: 'commitRemoved';
  nodeId: string;
}

/**
 * Branch added (new ref)
 */
export interface BranchAddedChange extends BaseChange {
  type: 'branchAdded';
  branchName: string;
  targetCommit: string;
}

/**
 * Branch removed (ref deleted)
 */
export interface BranchRemovedChange extends BaseChange {
  type: 'branchRemoved';
  branchName: string;
}

/**
 * Branch pointer moved (e.g., fast-forward, reset)
 */
export interface BranchMovedChange extends BaseChange {
  type: 'branchMoved';
  branchName: string;
  oldCommit: string;
  newCommit: string;
}

/**
 * HEAD moved (checkout, detached head)
 */
export interface HeadMovedChange extends BaseChange {
  type: 'headMoved';
  oldTarget: string;
  newTarget: string;
}

/**
 * Merge commit detected
 */
export interface MergeChange extends BaseChange {
  type: 'merge';
  mergeCommit: string;
  parents: string[];
}

/**
 * Rebase detected (multiple commits copied to new base)
 */
export interface RebaseChange extends BaseChange {
  type: 'rebase';
  oldCommits: string[];
  newCommits: string[];
  oldBase: string;
  newBase: string;
}

/**
 * Cherry-pick detected (single commit copied)
 */
export interface CherryPickChange extends BaseChange {
  type: 'cherryPick';
  sourceCommit: string;
  newCommit: string;
  targetBase: string;
}

/**
 * Union of all change types
 */
export type Change =
  | CommitAddedChange
  | CommitRemovedChange
  | BranchAddedChange
  | BranchRemovedChange
  | BranchMovedChange
  | HeadMovedChange
  | MergeChange
  | RebaseChange
  | CherryPickChange;

/**
 * Result of comparing two graph states
 */
export interface DiffResult {
  changes: Change[];
  oldState: GitState;
  newState: GitState;
}

/**
 * Compare two Git states and compute the differences
 */
export function compareStates(oldState: GitState, newState: GitState): DiffResult {
  const changes: Change[] = [];

  // Detect node changes (commits added/removed)
  const nodeChanges = detectNodeChanges(oldState.nodes, newState.nodes);
  changes.push(...nodeChanges);

  // Detect ref changes (branches added/removed/moved)
  const refChanges = detectRefChanges(oldState.refs, newState.refs);
  changes.push(...refChanges);

  // Detect HEAD changes
  if (oldState.head !== newState.head) {
    changes.push({
      type: 'headMoved',
      oldTarget: oldState.head,
      newTarget: newState.head,
    });
  }

  // Detect complex operations (merge, rebase, cherry-pick)
  const complexChanges = detectComplexOperations(oldState, newState, nodeChanges);
  changes.push(...complexChanges);

  return {
    changes,
    oldState,
    newState,
  };
}

/**
 * Detect node (commit) additions and removals
 */
function detectNodeChanges(oldNodes: GitNode[], newNodes: GitNode[]): Change[] {
  const changes: Change[] = [];
  const oldIds = new Set(oldNodes.map(n => n.id));
  const newIds = new Set(newNodes.map(n => n.id));

  // Detect added nodes
  for (const node of newNodes) {
    if (!oldIds.has(node.id)) {
      changes.push({
        type: 'commitAdded',
        nodeId: node.id,
        parents: node.parents,
      });
    }
  }

  // Detect removed nodes
  for (const node of oldNodes) {
    if (!newIds.has(node.id)) {
      changes.push({
        type: 'commitRemoved',
        nodeId: node.id,
      });
    }
  }

  return changes;
}

/**
 * Detect ref (branch/tag) additions, removals, and moves
 */
function detectRefChanges(oldRefs: GitRef[], newRefs: GitRef[]): Change[] {
  const changes: Change[] = [];
  const oldRefMap = new Map(oldRefs.map(r => [r.name, r.target]));
  const newRefMap = new Map(newRefs.map(r => [r.name, r.target]));

  // Detect added refs
  for (const ref of newRefs) {
    if (!oldRefMap.has(ref.name)) {
      changes.push({
        type: 'branchAdded',
        branchName: ref.name,
        targetCommit: ref.target,
      });
    }
  }

  // Detect removed refs
  for (const ref of oldRefs) {
    if (!newRefMap.has(ref.name)) {
      changes.push({
        type: 'branchRemoved',
        branchName: ref.name,
      });
    }
  }

  // Detect moved refs
  for (const ref of newRefs) {
    const oldTarget = oldRefMap.get(ref.name);
    if (oldTarget && oldTarget !== ref.target) {
      changes.push({
        type: 'branchMoved',
        branchName: ref.name,
        oldCommit: oldTarget,
        newCommit: ref.target,
      });
    }
  }

  return changes;
}

/**
 * Detect complex operations like merge, rebase, and cherry-pick
 */
function detectComplexOperations(
  oldState: GitState,
  newState: GitState,
  nodeChanges: Change[]
): Change[] {
  const changes: Change[] = [];
  const addedCommits = nodeChanges
    .filter((c): c is CommitAddedChange => c.type === 'commitAdded')
    .map(c => c.nodeId);

  // Detect merge commits (multiple parents)
  for (const commitId of addedCommits) {
    const node = newState.nodes.find(n => n.id === commitId);
    if (node && node.parents.length >= 2) {
      changes.push({
        type: 'merge',
        mergeCommit: commitId,
        parents: node.parents,
      });
    }
  }

  // Detect rebase (multiple new commits with similar structure to old commits)
  const rebaseChange = detectRebase(oldState, newState, addedCommits);
  if (rebaseChange) {
    changes.push(rebaseChange);
  }

  // Detect cherry-pick (single new commit similar to an existing commit)
  const cherryPickChange = detectCherryPick(oldState, newState, addedCommits);
  if (cherryPickChange) {
    changes.push(cherryPickChange);
  }

  return changes;
}

/**
 * Detect rebase operation
 * Heuristic: multiple new commits with same parent structure as removed commits
 */
function detectRebase(
  oldState: GitState,
  newState: GitState,
  addedCommits: string[]
): RebaseChange | null {
  // Simple heuristic: if we have multiple added commits in sequence,
  // and the old state had a similar chain, it might be a rebase
  if (addedCommits.length < 2) return null;

  // Find sequences of commits
  const oldChains = findCommitChains(oldState.nodes);
  const newChains = findCommitChains(newState.nodes);

  // Look for chains that were replaced
  for (const oldChain of oldChains) {
    for (const newChain of newChains) {
      // Check if the new chain has similar length and only contains added commits
      if (
        Math.abs(newChain.length - oldChain.length) <= 1 &&
        newChain.every(id => addedCommits.includes(id))
      ) {
        // Find base commits
        const oldBase = findBaseCommit(oldChain[oldChain.length - 1], oldState.nodes);
        const newBase = findBaseCommit(newChain[newChain.length - 1], newState.nodes);

        if (oldBase !== newBase) {
          return {
            type: 'rebase',
            oldCommits: oldChain,
            newCommits: newChain,
            oldBase: oldBase || '',
            newBase: newBase || '',
          };
        }
      }
    }
  }

  return null;
}

/**
 * Detect cherry-pick operation
 * Heuristic: single new commit that appears to be a copy of an existing commit
 * 
 * Note: Currently unimplemented - requires commit message/content comparison
 * to properly detect cherry-picks
 */
 
function detectCherryPick(
  _oldState: GitState,
  _newState: GitState,
  _addedCommits: string[]
): CherryPickChange | null {
  // For now, we can't easily detect cherry-picks without commit message/content comparison
  // This would require more metadata in the GitState
  // Return null for now; can be enhanced with additional data
  return null;
}

/**
 * Find chains of commits (linear sequences)
 */
function findCommitChains(nodes: GitNode[]): string[][] {
  const chains: string[][] = [];
  const visited = new Set<string>();

  for (const node of nodes) {
    if (visited.has(node.id)) continue;

    // Start a chain from this node
    const chain: string[] = [];
    let current: GitNode | undefined = node;

    while (current && !visited.has(current.id)) {
      chain.push(current.id);
      visited.add(current.id);

      // Follow the first parent (main line)
      if (current.parents.length === 1) {
        current = nodes.find(n => n.id === current!.parents[0]);
      } else {
        // Stop at merge commits or roots
        break;
      }
    }

    if (chain.length > 1) {
      chains.push(chain);
    }
  }

  return chains;
}

/**
 * Find the base commit (first parent) of a commit
 */
function findBaseCommit(commitId: string, nodes: GitNode[]): string | null {
  const node = nodes.find(n => n.id === commitId);
  if (!node || node.parents.length === 0) return null;
  return node.parents[0];
}

/**
 * Classify a single change for simpler handling
 */
export function classifyChange(change: Change): {
  category: 'simple' | 'complex';
  operation: string;
} {
  switch (change.type) {
    case 'commitAdded':
    case 'commitRemoved':
    case 'branchAdded':
    case 'branchRemoved':
    case 'branchMoved':
    case 'headMoved':
      return { category: 'simple', operation: change.type };
    case 'merge':
    case 'rebase':
    case 'cherryPick':
      return { category: 'complex', operation: change.type };
  }
}

/**
 * Helper to get all node IDs affected by a change
 */
export function getAffectedNodes(change: Change): string[] {
  switch (change.type) {
    case 'commitAdded':
      return [change.nodeId];
    case 'commitRemoved':
      return [change.nodeId];
    case 'branchAdded':
      return [change.targetCommit];
    case 'branchRemoved':
      return []; // No target commit for removed branches
    case 'branchMoved':
      return [change.oldCommit, change.newCommit];
    case 'headMoved':
      return [change.oldTarget, change.newTarget];
    case 'merge':
      return [change.mergeCommit, ...change.parents];
    case 'rebase':
      return [...change.oldCommits, ...change.newCommits];
    case 'cherryPick':
      return [change.sourceCommit, change.newCommit];
  }
}

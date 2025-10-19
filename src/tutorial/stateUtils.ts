/**
 * State conversion utilities
 * Convert between GitState and GitStateSnapshot formats
 */

import type { GitState, GitCommit, GitBranch, GitTag, HeadState } from '@/cli/types';
import type {
  GitStateSnapshot,
  SerializedCommit,
  SerializedBranch,
  SerializedTag,
  SerializedHead,
} from './types';

/**
 * Convert GitState to serializable snapshot
 */
export function stateToSnapshot(state: GitState): GitStateSnapshot {
  const commits: SerializedCommit[] = [];
  for (const [, commit] of state.commits) {
    commits.push({
      id: commit.id,
      parents: commit.parents,
      message: commit.message,
      author: commit.author,
      timestamp: commit.timestamp,
    });
  }

  const branches: SerializedBranch[] = [];
  for (const [, branch] of state.branches) {
    branches.push({
      name: branch.name,
      target: branch.target,
    });
  }

  const tags: SerializedTag[] = [];
  for (const [, tag] of state.tags) {
    tags.push({
      name: tag.name,
      target: tag.target,
      message: tag.message,
    });
  }

  const head: SerializedHead = state.head;

  return { commits, branches, tags, head };
}

/**
 * Convert serializable snapshot to GitState
 */
export function snapshotToState(snapshot: GitStateSnapshot): GitState {
  const commits = new Map<string, GitCommit>();
  for (const commit of snapshot.commits) {
    commits.set(commit.id, {
      id: commit.id,
      parents: commit.parents,
      message: commit.message,
      author: commit.author,
      timestamp: commit.timestamp,
    });
  }

  const branches = new Map<string, GitBranch>();
  for (const branch of snapshot.branches) {
    branches.set(branch.name, {
      name: branch.name,
      target: branch.target,
    });
  }

  const tags = new Map<string, GitTag>();
  for (const tag of snapshot.tags) {
    tags.set(tag.name, {
      name: tag.name,
      target: tag.target,
      message: tag.message,
    });
  }

  const head: HeadState = snapshot.head;

  return { commits, branches, tags, head };
}

/**
 * Clone a GitState for immutability
 */
export function cloneState(state: GitState): GitState {
  return {
    commits: new Map(state.commits),
    branches: new Map(state.branches),
    tags: new Map(state.tags),
    head: { ...state.head },
    staging: state.staging ? new Set(state.staging) : undefined,
    remotes: state.remotes ? new Map(state.remotes) : undefined,
  };
}

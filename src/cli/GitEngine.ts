/**
 * Git Engine - In-memory Git operations
 * Implements Git commands on an in-memory state for sandbox mode
 * Can also integrate with isomorphic-git for real repository operations
 */

import type {
  GitState,
  GitCommit,
  GitOperationResult,
  ParsedCommand,
} from './types';

/**
 * Generate a short SHA-like ID for commits
 */
function generateCommitId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Clone a GitState for immutability
 */
function cloneState(state: GitState): GitState {
  return {
    commits: new Map(state.commits),
    branches: new Map(state.branches),
    tags: new Map(state.tags),
    head: { ...state.head },
    staging: state.staging ? new Set(state.staging) : undefined,
    remotes: state.remotes
      ? new Map(Array.from(state.remotes).map(([k, v]) => [k, new Map(v)]))
      : undefined,
    remoteConfigs: state.remoteConfigs
      ? new Map(Array.from(state.remoteConfigs).map(([k, v]) => [k, { ...v, fetch: [...v.fetch] }]))
      : undefined,
    remoteTrackingBranches: state.remoteTrackingBranches
      ? new Map(state.remoteTrackingBranches)
      : undefined,
    conflict: state.conflict ? { ...state.conflict, files: [...state.conflict.files] } : undefined,
    rebaseState: state.rebaseState
      ? { ...state.rebaseState, todos: state.rebaseState.todos.map(t => ({ ...t })) }
      : undefined,
  };
}

/**
 * Get the commit ID that HEAD points to
 */
function resolveHead(state: GitState): string | null {
  if (state.head.type === 'detached') {
    return state.head.commit;
  }
  const branch = state.branches.get(state.head.name);
  return branch?.target ?? null;
}

/**
 * Get current branch name (null if detached)
 */
function getCurrentBranch(state: GitState): string | null {
  return state.head.type === 'branch' ? state.head.name : null;
}

/**
 * Resolve a reference (branch name, tag, or commit SHA) to a commit ID
 */
function resolveRef(state: GitState, ref: string): string | null {
  // Check if it's a branch
  const branch = state.branches.get(ref);
  if (branch) return branch.target;

  // Check if it's a remote tracking branch
  const trackingBranch = state.remoteTrackingBranches?.get(ref);
  if (trackingBranch) return trackingBranch.target;

  // Check if it's a tag
  const tag = state.tags.get(ref);
  if (tag) return tag.target;

  // Check if it's a commit SHA (exact or prefix)
  if (state.commits.has(ref)) return ref;

  // Try prefix match
  for (const commitId of state.commits.keys()) {
    if (commitId.startsWith(ref)) return commitId;
  }

  // Check for HEAD~n notation
  if (ref.startsWith('HEAD~') || ref.startsWith('HEAD^')) {
    const currentCommit = resolveHead(state);
    if (!currentCommit) return null;

    const steps = ref.startsWith('HEAD~')
      ? parseInt(ref.slice(5)) || 1
      : parseInt(ref.slice(5)) || 1;

    let commit = currentCommit;
    for (let i = 0; i < steps; i++) {
      const commitObj = state.commits.get(commit);
      if (!commitObj || commitObj.parents.length === 0) return null;
      commit = commitObj.parents[0];
    }
    return commit;
  }

  if (ref === 'HEAD') {
    return resolveHead(state);
  }

  return null;
}

/**
 * Git Engine for in-memory operations
 */
export class GitEngine {
  /**
   * Create initial Git state with a single commit
   */
  static createInitialState(): GitState {
    const initialCommit: GitCommit = {
      id: generateCommitId(),
      parents: [],
      message: 'Initial commit',
      timestamp: Date.now(),
    };

    const state: GitState = {
      commits: new Map([[initialCommit.id, initialCommit]]),
      branches: new Map([['main', { name: 'main', target: initialCommit.id }]]),
      tags: new Map(),
      head: { type: 'branch', name: 'main' },
    };

    return state;
  }

  /**
   * Execute a commit command
   */
  static commit(state: GitState, command: ParsedCommand): GitOperationResult {
    const newState = cloneState(state);
    const currentCommit = resolveHead(newState);

    if (!currentCommit) {
      return {
        success: false,
        error: 'No current commit (detached HEAD with no commit)',
      };
    }

    // Get message
    let message = '';
    if (command.options.amend) {
      // Amend previous commit
      const commit = newState.commits.get(currentCommit);
      if (!commit) {
        return { success: false, error: 'Cannot find current commit' };
      }
      message = commit.message;
      if (command.options.m || command.options.message) {
        message = (command.options.m || command.options.message) as string;
      }
      // Update commit message
      commit.message = message;
      return {
        success: true,
        message: `Amended commit: ${message}`,
        newState,
      };
    } else {
      message = (command.options.m || command.options.message) as string;
    }

    // Create new commit
    const newCommit: GitCommit = {
      id: generateCommitId(),
      parents: [currentCommit],
      message,
      timestamp: Date.now(),
    };

    newState.commits.set(newCommit.id, newCommit);

    // Move current branch or HEAD
    if (newState.head.type === 'branch') {
      const branch = newState.branches.get(newState.head.name);
      if (branch) {
        branch.target = newCommit.id;
      }
    } else {
      newState.head = { type: 'detached', commit: newCommit.id };
    }

    return {
      success: true,
      message: `[${newCommit.id.slice(0, 7)}] ${message}`,
      newState,
    };
  }

  /**
   * Execute a branch command
   */
  static branch(state: GitState, command: ParsedCommand): GitOperationResult {
    const newState = cloneState(state);

    // List branches
    if (command.args.length === 0 && !command.options.d && !command.options.D) {
      const branches = Array.from(newState.branches.keys());
      const currentBranch = getCurrentBranch(newState);
      const list = branches
        .map((b) => (b === currentBranch ? `* ${b}` : `  ${b}`))
        .join('\n');
      return { success: true, message: list, newState };
    }

    // Delete branch
    if (command.options.d || command.options.D) {
      const branchName = command.args[0];
      const currentBranch = getCurrentBranch(newState);

      if (branchName === currentBranch) {
        return {
          success: false,
          error: `Cannot delete branch '${branchName}' checked out at HEAD`,
        };
      }

      if (!newState.branches.has(branchName)) {
        return {
          success: false,
          error: `Branch '${branchName}' not found`,
        };
      }

      newState.branches.delete(branchName);
      return {
        success: true,
        message: `Deleted branch ${branchName}`,
        newState,
      };
    }

    // Create branch
    const branchName = command.args[0];
    if (newState.branches.has(branchName)) {
      return {
        success: false,
        error: `A branch named '${branchName}' already exists`,
      };
    }

    const currentCommit = resolveHead(newState);
    if (!currentCommit) {
      return { success: false, error: 'No current commit' };
    }

    newState.branches.set(branchName, {
      name: branchName,
      target: currentCommit,
    });

    return {
      success: true,
      message: `Created branch ${branchName}`,
      newState,
    };
  }

  /**
   * Execute a checkout command
   */
  static checkout(state: GitState, command: ParsedCommand): GitOperationResult {
    const newState = cloneState(state);

    // Create new branch and checkout
    if (command.options.b || command.options.B) {
      const branchName = command.args[0];
      const force = !!command.options.B;

      if (!force && newState.branches.has(branchName)) {
        return {
          success: false,
          error: `A branch named '${branchName}' already exists`,
        };
      }

      const currentCommit = resolveHead(newState);
      if (!currentCommit) {
        return { success: false, error: 'No current commit' };
      }

      // Create or update branch
      newState.branches.set(branchName, {
        name: branchName,
        target: currentCommit,
      });

      // Checkout the branch
      newState.head = { type: 'branch', name: branchName };

      return {
        success: true,
        message: `Switched to a new branch '${branchName}'`,
        newState,
      };
    }

    // Checkout existing branch or commit
    const target = command.args[0];
    const commitId = resolveRef(newState, target);

    if (!commitId) {
      return {
        success: false,
        error: `pathspec '${target}' did not match any file(s) known to git`,
      };
    }

    // Check if target is a branch
    if (newState.branches.has(target)) {
      newState.head = { type: 'branch', name: target };
      return {
        success: true,
        message: `Switched to branch '${target}'`,
        newState,
      };
    }

    // Detached HEAD
    newState.head = { type: 'detached', commit: commitId };
    return {
      success: true,
      message: `HEAD is now at ${commitId.slice(0, 7)}`,
      newState,
    };
  }

  /**
   * Execute a switch command (similar to checkout but only for branches)
   */
  static switch(state: GitState, command: ParsedCommand): GitOperationResult {
    const newState = cloneState(state);

    // Create new branch and switch
    if (command.options.c || command.options.C) {
      const branchName = command.args[0];
      const force = !!command.options.C;

      if (!force && newState.branches.has(branchName)) {
        return {
          success: false,
          error: `A branch named '${branchName}' already exists`,
        };
      }

      const currentCommit = resolveHead(newState);
      if (!currentCommit) {
        return { success: false, error: 'No current commit' };
      }

      newState.branches.set(branchName, {
        name: branchName,
        target: currentCommit,
      });

      newState.head = { type: 'branch', name: branchName };

      return {
        success: true,
        message: `Switched to a new branch '${branchName}'`,
        newState,
      };
    }

    // Switch to existing branch
    const branchName = command.args[0];
    if (!newState.branches.has(branchName)) {
      return {
        success: false,
        error: `fatal: invalid reference: ${branchName}`,
      };
    }

    newState.head = { type: 'branch', name: branchName };
    return {
      success: true,
      message: `Switched to branch '${branchName}'`,
      newState,
    };
  }

  /**
   * Execute a merge command
   */
  static merge(state: GitState, command: ParsedCommand): GitOperationResult {
    const newState = cloneState(state);
    const branchToMerge = command.args[0];

    const currentCommit = resolveHead(newState);
    if (!currentCommit) {
      return { success: false, error: 'No current commit' };
    }

    const mergeCommit = resolveRef(newState, branchToMerge);
    if (!mergeCommit) {
      return {
        success: false,
        error: `Branch '${branchToMerge}' not found`,
      };
    }

    // Check for fast-forward
    const canFastForward = this.isAncestor(newState, currentCommit, mergeCommit);
    const noFastForward = !!command.options['no-ff'];

    if (canFastForward && !noFastForward) {
      // Fast-forward merge
      if (newState.head.type === 'branch') {
        const branch = newState.branches.get(newState.head.name);
        if (branch) {
          branch.target = mergeCommit;
        }
      } else {
        newState.head = { type: 'detached', commit: mergeCommit };
      }

      return {
        success: true,
        message: `Fast-forward merge of ${branchToMerge}`,
        newState,
      };
    }

    // Create merge commit
    const mergeMessage = command.options.m
      ? (command.options.m as string)
      : `Merge branch '${branchToMerge}'`;

    const newCommit: GitCommit = {
      id: generateCommitId(),
      parents: [currentCommit, mergeCommit],
      message: mergeMessage,
      timestamp: Date.now(),
    };

    newState.commits.set(newCommit.id, newCommit);

    // Move current branch or HEAD
    if (newState.head.type === 'branch') {
      const branch = newState.branches.get(newState.head.name);
      if (branch) {
        branch.target = newCommit.id;
      }
    } else {
      newState.head = { type: 'detached', commit: newCommit.id };
    }

    return {
      success: true,
      message: `Merged ${branchToMerge} into ${getCurrentBranch(newState) ?? 'HEAD'}`,
      newState,
    };
  }

  /**
   * Check if commit A is an ancestor of commit B
   */
  private static isAncestor(
    state: GitState,
    ancestorId: string,
    descendantId: string
  ): boolean {
    if (ancestorId === descendantId) return true;

    const visited = new Set<string>();
    const queue = [descendantId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      if (currentId === ancestorId) return true;

      const commit = state.commits.get(currentId);
      if (commit) {
        queue.push(...commit.parents);
      }
    }

    return false;
  }

  /**
   * Execute a reset command
   */
  static reset(state: GitState, command: ParsedCommand): GitOperationResult {
    const newState = cloneState(state);
    const target = command.args[0];
    const targetCommit = resolveRef(newState, target);

    if (!targetCommit) {
      return {
        success: false,
        error: `fatal: ambiguous argument '${target}': unknown revision`,
      };
    }

    const mode = command.options.hard ? 'hard' : 'soft';

    // Move HEAD/branch to target
    if (newState.head.type === 'branch') {
      const branch = newState.branches.get(newState.head.name);
      if (branch) {
        branch.target = targetCommit;
      }
    } else {
      newState.head = { type: 'detached', commit: targetCommit };
    }

    return {
      success: true,
      message: `HEAD is now at ${targetCommit.slice(0, 7)} (${mode} reset)`,
      newState,
    };
  }

  /**
   * Execute a revert command
   */
  static revert(state: GitState, command: ParsedCommand): GitOperationResult {
    const newState = cloneState(state);
    const target = command.args[0];
    const targetCommit = resolveRef(newState, target);

    if (!targetCommit) {
      return {
        success: false,
        error: `fatal: bad revision '${target}'`,
      };
    }

    const commit = newState.commits.get(targetCommit);
    if (!commit) {
      return { success: false, error: 'Commit not found' };
    }

    const currentCommit = resolveHead(newState);
    if (!currentCommit) {
      return { success: false, error: 'No current commit' };
    }

    // Create revert commit
    const revertCommit: GitCommit = {
      id: generateCommitId(),
      parents: [currentCommit],
      message: `Revert "${commit.message}"`,
      timestamp: Date.now(),
    };

    newState.commits.set(revertCommit.id, revertCommit);

    // Move current branch or HEAD
    if (newState.head.type === 'branch') {
      const branch = newState.branches.get(newState.head.name);
      if (branch) {
        branch.target = revertCommit.id;
      }
    } else {
      newState.head = { type: 'detached', commit: revertCommit.id };
    }

    return {
      success: true,
      message: `Reverted ${targetCommit.slice(0, 7)}`,
      newState,
    };
  }

  /**
   * Execute a tag command
   */
  static tag(state: GitState, command: ParsedCommand): GitOperationResult {
    const newState = cloneState(state);

    // List tags
    if (command.args.length === 0) {
      const tags = Array.from(newState.tags.keys()).sort();
      return {
        success: true,
        message: tags.length > 0 ? tags.join('\n') : 'No tags',
        newState,
      };
    }

    // Create tag
    const tagName = command.args[0];
    const targetRef = command.args[1] || 'HEAD';
    const targetCommit = resolveRef(newState, targetRef);

    if (!targetCommit) {
      return {
        success: false,
        error: `fatal: not a valid object name: '${targetRef}'`,
      };
    }

    if (newState.tags.has(tagName)) {
      return {
        success: false,
        error: `fatal: tag '${tagName}' already exists`,
      };
    }

    newState.tags.set(tagName, {
      name: tagName,
      target: targetCommit,
      message: command.options.m ? (command.options.m as string) : undefined,
    });

    return {
      success: true,
      message: `Created tag ${tagName}`,
      newState,
    };
  }

  /**
   * Execute a status command
   */
  static status(state: GitState): GitOperationResult {
    const currentBranch = getCurrentBranch(state);
    const currentCommit = resolveHead(state);

    let message = '';
    if (currentBranch) {
      message = `On branch ${currentBranch}\n`;
    } else {
      message = `HEAD detached at ${currentCommit?.slice(0, 7)}\n`;
    }

    message += 'nothing to commit, working tree clean';

    return {
      success: true,
      message,
      newState: state,
    };
  }

  /**
   * Execute a log command
   */
  static log(state: GitState, command: ParsedCommand): GitOperationResult {
    const startRef = command.args[0] || 'HEAD';
    const startCommit = resolveRef(state, startRef);

    if (!startCommit) {
      return {
        success: false,
        error: `fatal: ambiguous argument '${startRef}'`,
      };
    }

    const commits: string[] = [];
    const visited = new Set<string>();
    const queue = [startCommit];

    while (queue.length > 0) {
      const commitId = queue.shift()!;
      if (visited.has(commitId)) continue;
      visited.add(commitId);

      const commit = state.commits.get(commitId);
      if (commit) {
        commits.push(
          `commit ${commitId}\n${commit.message}\n${new Date(commit.timestamp).toISOString()}\n`
        );
        queue.push(...commit.parents);
      }
    }

    return {
      success: true,
      message: commits.join('\n'),
      newState: state,
    };
  }

  /**
   * Start interactive rebase
   * Sets up rebase state for UI to handle
   */
  static rebaseInteractive(
    state: GitState,
    command: ParsedCommand
  ): GitOperationResult {
    const newState = cloneState(state);
    const onto = command.args[0];
    const ontoCommit = resolveRef(newState, onto);

    if (!ontoCommit) {
      return {
        success: false,
        error: `fatal: invalid upstream '${onto}'`,
      };
    }

    const currentCommit = resolveHead(newState);
    if (!currentCommit) {
      return { success: false, error: 'No current commit' };
    }

    // Find commits between onto and current
    const commitsToRebase: string[] = [];
    const visited = new Set<string>();
    const queue = [currentCommit];

    while (queue.length > 0) {
      const commitId = queue.shift()!;
      if (visited.has(commitId) || commitId === ontoCommit) continue;
      visited.add(commitId);

      commitsToRebase.push(commitId);
      const commit = newState.commits.get(commitId);
      if (commit) {
        queue.push(...commit.parents);
      }
    }

    // Create rebase state
    const todos = commitsToRebase.reverse().map((commitId, index) => {
      const commit = newState.commits.get(commitId)!;
      return {
        operation: 'pick' as const,
        commitId,
        message: commit.message,
        order: index,
      };
    });

    newState.rebaseState = {
      operation: 'rebase-interactive',
      branch: getCurrentBranch(newState) ?? 'HEAD',
      onto,
      todos,
      currentStep: 0,
      originalHead: currentCommit,
    };

    return {
      success: true,
      message: `Interactive rebase started. ${todos.length} commits to rebase.`,
      newState,
    };
  }

  /**
   * Execute rebase operations from interactive rebase
   */
  static executeRebase(state: GitState): GitOperationResult {
    if (!state.rebaseState) {
      return { success: false, error: 'No rebase in progress' };
    }

    const newState = cloneState(state);
    const { todos, onto } = newState.rebaseState;
    const ontoCommit = resolveRef(newState, onto);

    if (!ontoCommit) {
      return { success: false, error: 'Invalid rebase target' };
    }

    let currentBase = ontoCommit;
    const newCommitIds: string[] = [];

    // Process each todo
    for (const todo of todos) {
      if (todo.operation === 'drop') {
        // Skip this commit
        continue;
      }

      const originalCommit = newState.commits.get(todo.commitId);
      if (!originalCommit) continue;

      if (todo.operation === 'pick' || todo.operation === 'reword') {
        // Create new commit
        const newCommit: GitCommit = {
          id: generateCommitId(),
          parents: [currentBase],
          message: originalCommit.message,
          timestamp: Date.now(),
        };
        newState.commits.set(newCommit.id, newCommit);
        currentBase = newCommit.id;
        newCommitIds.push(newCommit.id);
      } else if (todo.operation === 'squash') {
        // Squash with previous commit
        if (newCommitIds.length > 0) {
          const prevCommitId = newCommitIds[newCommitIds.length - 1];
          const prevCommit = newState.commits.get(prevCommitId);
          if (prevCommit) {
            prevCommit.message += '\n\n' + originalCommit.message;
          }
        }
      }
      // 'edit' would pause rebase - for now we treat it as pick
    }

    // Update branch to point to new HEAD
    if (newState.head.type === 'branch') {
      const branch = newState.branches.get(newState.head.name);
      if (branch) {
        branch.target = currentBase;
      }
    } else {
      newState.head = { type: 'detached', commit: currentBase };
    }

    // Clear rebase state
    delete newState.rebaseState;

    return {
      success: true,
      message: `Rebase completed. ${newCommitIds.length} commits applied.`,
      newState,
    };
  }

  /**
   * Abort rebase
   */
  static abortRebase(state: GitState): GitOperationResult {
    if (!state.rebaseState) {
      return { success: false, error: 'No rebase in progress' };
    }

    const newState = cloneState(state);
    const originalHead = newState.rebaseState.originalHead;

    // Restore HEAD to original position
    if (newState.head.type === 'branch') {
      const branch = newState.branches.get(newState.head.name);
      if (branch) {
        branch.target = originalHead;
      }
    } else {
      newState.head = { type: 'detached', commit: originalHead };
    }

    delete newState.rebaseState;

    return {
      success: true,
      message: 'Rebase aborted',
      newState,
    };
  }

  /**
   * Simulate merge conflict detection
   */
  static detectConflicts(
    _state: GitState,
    _source: string,
    _target: string,
    _operation: 'merge' | 'rebase'
  ): string[] {
    // Simulate conflict detection by randomly choosing some "files"
    // In a real implementation, this would compare tree objects
    const conflictProbability = 0.3;
    
    if (Math.random() < conflictProbability) {
      // Simulate some common file conflicts
      const potentialFiles = [
        'src/index.ts',
        'package.json',
        'README.md',
        'src/components/App.tsx',
        'src/utils/helpers.ts',
      ];
      const numConflicts = Math.floor(Math.random() * 3) + 1;
      return potentialFiles.slice(0, numConflicts);
    }
    
    return [];
  }

  /**
   * Resolve conflicts
   */
  static resolveConflicts(
    state: GitState,
    resolution: 'ours' | 'theirs' | 'manual'
  ): GitOperationResult {
    if (!state.conflict) {
      return { success: false, error: 'No conflict in progress' };
    }

    const newState = cloneState(state);
    delete newState.conflict;

    return {
      success: true,
      message: `Conflicts resolved using '${resolution}' strategy`,
      newState,
    };
  }

  /**
   * Add remote
   */
  static remoteAdd(state: GitState, command: ParsedCommand): GitOperationResult {
    const newState = cloneState(state);
    const [name, url] = command.args;

    if (!name || !url) {
      return { success: false, error: 'Usage: git remote add <name> <url>' };
    }

    if (!newState.remoteConfigs) {
      newState.remoteConfigs = new Map();
    }

    if (newState.remoteConfigs.has(name)) {
      return { success: false, error: `remote ${name} already exists` };
    }

    newState.remoteConfigs.set(name, {
      name,
      url,
      fetch: [`+refs/heads/*:refs/remotes/${name}/*`],
    });

    return {
      success: true,
      message: `Added remote ${name}`,
      newState,
    };
  }

  /**
   * List remotes
   */
  static remoteList(state: GitState): GitOperationResult {
    const remotes = state.remoteConfigs
      ? Array.from(state.remoteConfigs.keys())
      : [];

    return {
      success: true,
      message: remotes.length > 0 ? remotes.join('\n') : 'No remotes configured',
      newState: state,
    };
  }

  /**
   * Simulate fetch from remote
   */
  static fetch(state: GitState, command: ParsedCommand): GitOperationResult {
    const newState = cloneState(state);
    const remoteName = command.args[0] || 'origin';

    if (!newState.remoteConfigs?.has(remoteName)) {
      return {
        success: false,
        error: `fatal: '${remoteName}' does not appear to be a git repository`,
      };
    }

    // Initialize remote tracking structures
    if (!newState.remotes) {
      newState.remotes = new Map();
    }
    if (!newState.remoteTrackingBranches) {
      newState.remoteTrackingBranches = new Map();
    }

    // Simulate fetching branches from remote
    const remoteBranches = new Map<string, string>();
    for (const [branchName, branch] of newState.branches) {
      remoteBranches.set(branchName, branch.target);

      // Create remote tracking branch
      const trackingName = `${remoteName}/${branchName}`;
      newState.remoteTrackingBranches.set(trackingName, {
        name: trackingName,
        remote: remoteName,
        localName: branchName,
        target: branch.target,
        ahead: 0,
        behind: 0,
      });
    }
    newState.remotes.set(remoteName, remoteBranches);

    return {
      success: true,
      message: `Fetched from ${remoteName}`,
      newState,
    };
  }

  /**
   * Simulate pull from remote
   */
  static pull(state: GitState, command: ParsedCommand): GitOperationResult {
    const remoteName = command.args[0] || 'origin';
    const branchName = command.args[1] || getCurrentBranch(state);

    if (!branchName) {
      return { success: false, error: 'No branch specified' };
    }

    // First fetch
    const fetchResult = this.fetch(state, { ...command, args: [remoteName] });
    if (!fetchResult.success) {
      return fetchResult;
    }

    // Then merge remote branch
    const trackingBranch = `${remoteName}/${branchName}`;
    const mergeCommand: ParsedCommand = {
      name: 'merge',
      args: [trackingBranch],
      options: {},
    };

    return this.merge(fetchResult.newState, mergeCommand);
  }

  /**
   * Simulate push to remote
   */
  static push(state: GitState, command: ParsedCommand): GitOperationResult {
    const newState = cloneState(state);
    const remoteName = command.args[0] || 'origin';
    const branchName = command.args[1] || getCurrentBranch(newState);

    if (!branchName) {
      return { success: false, error: 'No branch specified' };
    }

    if (!newState.remoteConfigs?.has(remoteName)) {
      return {
        success: false,
        error: `fatal: '${remoteName}' does not appear to be a git repository`,
      };
    }

    const branch = newState.branches.get(branchName);
    if (!branch) {
      return { success: false, error: `Branch '${branchName}' not found` };
    }

    // Initialize remote tracking structures
    if (!newState.remotes) {
      newState.remotes = new Map();
    }
    if (!newState.remoteTrackingBranches) {
      newState.remoteTrackingBranches = new Map();
    }

    // Update remote branch
    let remoteBranches = newState.remotes.get(remoteName);
    if (!remoteBranches) {
      remoteBranches = new Map();
      newState.remotes.set(remoteName, remoteBranches);
    }
    remoteBranches.set(branchName, branch.target);

    // Update remote tracking branch
    const trackingName = `${remoteName}/${branchName}`;
    newState.remoteTrackingBranches.set(trackingName, {
      name: trackingName,
      remote: remoteName,
      localName: branchName,
      target: branch.target,
      ahead: 0,
      behind: 0,
    });

    return {
      success: true,
      message: `Pushed to ${remoteName}/${branchName}`,
      newState,
    };
  }
}

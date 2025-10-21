/**
 * Advanced Git Operations
 * Handles complex Git operations like interactive rebase, cherry-pick, and merge strategies
 */

import type {
  GitState,
  ConflictInfo,
} from '@/cli/types';

/**
 * Rebase action types
 */
export type RebaseAction =
  | 'pick'
  | 'edit'
  | 'squash'
  | 'fixup'
  | 'drop'
  | 'reword';

/**
 * Rebase step
 */
export interface RebaseStep {
  /** Action to perform */
  action: RebaseAction;
  /** Commit being processed */
  commit: string;
  /** New commit message (for reword) */
  newMessage?: string;
  /** Order in sequence */
  order: number;
}

/**
 * Rebase plan
 */
export interface RebasePlan {
  /** Base commit to rebase onto */
  baseCommit: string;
  /** Steps to execute */
  steps: RebaseStep[];
  /** Original commits being rebased */
  originalCommits: string[];
}

/**
 * Rebase step result
 */
export interface RebaseStepResult {
  /** Whether the step succeeded */
  success: boolean;
  /** New commit created (if applicable) */
  newCommit?: string;
  /** Conflicts encountered */
  conflicts?: string[];
  /** Step that was executed */
  step: RebaseStep;
  /** Message */
  message: string;
}

/**
 * Interactive rebase session
 */
export class InteractiveRebaseSession {
  private _plan: RebasePlan;
  private _state: 'planning' | 'in-progress' | 'paused' | 'completed' | 'aborted' =
    'planning';
  private _currentStep = 0;

  constructor(
    public readonly id: string,
    public readonly baseCommit: string,
    public readonly commits: string[]
  ) {
    this._plan = {
      baseCommit,
      steps: [],
      originalCommits: [...commits],
    };
  }

  /**
   * Set the rebase plan
   */
  setPlan(plan: RebasePlan): void {
    this._plan = plan;
  }

  /**
   * Get the current plan
   */
  get plan(): RebasePlan {
    return this._plan;
  }

  /**
   * Get current step index
   */
  get currentStep(): number {
    return this._currentStep;
  }

  /**
   * Get current state
   */
  get state(): typeof this._state {
    return this._state;
  }

  /**
   * Pause the session
   */
  pause(): void {
    if (this._state === 'in-progress') {
      this._state = 'paused';
    }
  }

  /**
   * Resume the session
   */
  resume(): void {
    if (this._state === 'paused') {
      this._state = 'in-progress';
    }
  }

  /**
   * Abort the session
   */
  async abort(): Promise<void> {
    this._state = 'aborted';
  }

  /**
   * Continue to next step
   */
  async continue(): Promise<RebaseStepResult | null> {
    if (this._state !== 'in-progress') {
      return null;
    }

    if (this._currentStep >= this._plan.steps.length) {
      this._state = 'completed';
      return null;
    }

    const step = this._plan.steps[this._currentStep];
    if (!step) {
      return null;
    }

    this._currentStep++;

    return {
      success: true,
      step,
      message: `Executed ${step.action} for commit ${step.commit}`,
    };
  }

  /**
   * Start the rebase session
   */
  start(): void {
    this._state = 'in-progress';
    this._currentStep = 0;
  }

  /**
   * Reorder steps
   */
  reorderSteps(newOrder: number[]): void {
    const reordered: RebaseStep[] = [];
    for (const index of newOrder) {
      const step = this._plan.steps[index];
      if (step) {
        reordered.push({ ...step, order: reordered.length });
      }
    }
    this._plan.steps = reordered;
  }

  /**
   * Change step action
   */
  changeStepAction(stepIndex: number, newAction: RebaseAction): void {
    const step = this._plan.steps[stepIndex];
    if (step) {
      step.action = newAction;
    }
  }

  /**
   * Add a step
   */
  addStep(step: RebaseStep, index?: number): void {
    if (index !== undefined) {
      this._plan.steps.splice(index, 0, step);
    } else {
      this._plan.steps.push(step);
    }
    // Reorder all steps
    this._plan.steps.forEach((s, i) => {
      s.order = i;
    });
  }

  /**
   * Remove a step
   */
  removeStep(stepIndex: number): void {
    this._plan.steps.splice(stepIndex, 1);
    // Reorder remaining steps
    this._plan.steps.forEach((s, i) => {
      s.order = i;
    });
  }
}

/**
 * Cherry-pick options
 */
export interface CherryPickOptions {
  /** Whether to keep original commit message */
  keepMessage?: boolean;
  /** Whether to create empty commits */
  allowEmpty?: boolean;
  /** Custom commit message prefix */
  messagePrefix?: string;
}

/**
 * Cherry-pick result
 */
export interface CherryPickResult {
  /** Whether all picks succeeded */
  success: boolean;
  /** Successfully applied commits */
  appliedCommits: string[];
  /** Conflicts encountered */
  conflicts: Array<{
    commit: string;
    conflicts: string[];
    resolution?: ConflictResolution;
  }>;
  /** Skipped commits */
  skippedCommits: Array<{
    commit: string;
    reason: string;
  }>;
}

/**
 * Conflict resolution
 */
export interface ConflictResolution {
  /** Files in conflict */
  files: string[];
  /** Resolution strategy */
  strategy: 'ours' | 'theirs' | 'manual';
  /** Custom content for manual resolution */
  content?: Record<string, string>;
}

/**
 * Merge strategy type
 */
export type MergeStrategyType =
  | 'fast-forward'
  | 'three-way'
  | 'octopus'
  | 'ours'
  | 'subtree';

/**
 * Merge strategy
 */
export interface MergeStrategy {
  /** Strategy type */
  type: MergeStrategyType;
  /** Strategy options */
  options?: {
    /** Whether to create a merge commit even for fast-forward */
    noFf?: boolean;
    /** Subtree path (for subtree merges) */
    subtreePath?: string;
    /** Custom message */
    message?: string;
  };
}

/**
 * Merge result
 */
export interface MergeResult {
  /** Whether merge succeeded */
  success: boolean;
  /** New merge commit (if created) */
  mergeCommit?: string;
  /** Conflicts encountered */
  conflicts?: ConflictInfo;
  /** Message */
  message: string;
  /** Whether it was a fast-forward */
  fastForward?: boolean;
}

/**
 * Conflict resolver
 */
export interface ConflictResolver {
  /**
   * Resolve conflicts
   */
  resolveConflicts(conflicts: string[]): Promise<ConflictResolution>;
}

/**
 * Advanced Git Operations
 * Provides high-level operations for complex Git workflows
 */
export class AdvancedGitOperations {
  constructor(
    private state: GitState,
    private conflictResolver?: ConflictResolver
  ) {}

  /**
   * Start an interactive rebase session
   */
  async startInteractiveRebase(
    baseCommit: string,
    commits: string[]
  ): Promise<InteractiveRebaseSession> {
    const sessionId = `rebase-${Date.now()}`;
    const session = new InteractiveRebaseSession(sessionId, baseCommit, commits);

    // Create default plan with 'pick' for all commits
    const steps: RebaseStep[] = commits.map((commit, index) => ({
      action: 'pick',
      commit,
      order: index,
    }));

    session.setPlan({
      baseCommit,
      steps,
      originalCommits: commits,
    });

    return session;
  }

  /**
   * Execute a rebase step
   */
  async executeRebaseStep(
    session: InteractiveRebaseSession,
    step: RebaseStep
  ): Promise<RebaseStepResult> {
    switch (step.action) {
      case 'pick':
        return this.executePickStep(step);
      case 'edit':
        return this.executeEditStep(step);
      case 'squash':
        return this.executeSquashStep(step);
      case 'fixup':
        return this.executeFixupStep(step);
      case 'drop':
        return this.executeDropStep(step);
      case 'reword':
        return this.executeRewordStep(step);
      default:
        return {
          success: false,
          step,
          message: `Unknown rebase action: ${step.action}`,
        };
    }
  }

  /**
   * Execute pick step
   */
  private async executePickStep(step: RebaseStep): Promise<RebaseStepResult> {
    const commit = this.state.commits.get(step.commit);
    if (!commit) {
      return {
        success: false,
        step,
        message: `Commit ${step.commit} not found`,
      };
    }

    return {
      success: true,
      newCommit: step.commit,
      step,
      message: `Picked commit ${step.commit}`,
    };
  }

  /**
   * Execute edit step
   */
  private async executeEditStep(step: RebaseStep): Promise<RebaseStepResult> {
    return {
      success: true,
      step,
      message: `Paused for editing commit ${step.commit}`,
    };
  }

  /**
   * Execute squash step
   */
  private async executeSquashStep(step: RebaseStep): Promise<RebaseStepResult> {
    const commit = this.state.commits.get(step.commit);
    if (!commit) {
      return {
        success: false,
        step,
        message: `Commit ${step.commit} not found`,
      };
    }

    return {
      success: true,
      step,
      message: `Squashed commit ${step.commit}`,
    };
  }

  /**
   * Execute fixup step
   */
  private async executeFixupStep(step: RebaseStep): Promise<RebaseStepResult> {
    return {
      success: true,
      step,
      message: `Fixed up commit ${step.commit}`,
    };
  }

  /**
   * Execute drop step
   */
  private async executeDropStep(step: RebaseStep): Promise<RebaseStepResult> {
    return {
      success: true,
      step,
      message: `Dropped commit ${step.commit}`,
    };
  }

  /**
   * Execute reword step
   */
  private async executeRewordStep(step: RebaseStep): Promise<RebaseStepResult> {
    return {
      success: true,
      newCommit: step.commit,
      step,
      message: `Reworded commit ${step.commit}`,
    };
  }

  /**
   * Cherry-pick commits
   */
  async cherryPick(
    commits: string[],
    targetBranch: string,
    options: CherryPickOptions = {}
  ): Promise<CherryPickResult> {
    const result: CherryPickResult = {
      success: true,
      appliedCommits: [],
      conflicts: [],
      skippedCommits: [],
    };

    for (const commitSha of commits) {
      const commit = this.state.commits.get(commitSha);
      if (!commit) {
        result.skippedCommits.push({
          commit: commitSha,
          reason: 'Commit not found',
        });
        continue;
      }

      try {
        const pickResult = await this.cherryPickSingleCommit(
          commitSha,
          targetBranch,
          options
        );

        if (pickResult.conflicts && pickResult.conflicts.length > 0) {
          const resolution = this.conflictResolver
            ? await this.conflictResolver.resolveConflicts(pickResult.conflicts)
            : undefined;

          result.conflicts.push({
            commit: commitSha,
            conflicts: pickResult.conflicts,
            resolution,
          });
        } else if (pickResult.newCommit) {
          result.appliedCommits.push(pickResult.newCommit);
        }
      } catch (error) {
        result.skippedCommits.push({
          commit: commitSha,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    result.success = result.conflicts.length === 0;
    return result;
  }

  /**
   * Cherry-pick a single commit
   */
  private async cherryPickSingleCommit(
    commitSha: string,
    _targetBranch: string,
    _options: CherryPickOptions
  ): Promise<{
    newCommit?: string;
    conflicts?: string[];
  }> {
    const commit = this.state.commits.get(commitSha);
    if (!commit) {
      throw new Error(`Commit ${commitSha} not found`);
    }

    // Simplified implementation - in real usage this would detect conflicts
    return {
      newCommit: commitSha,
      conflicts: [],
    };
  }

  /**
   * Merge with strategy
   */
  async mergeWithStrategy(
    sourceBranch: string,
    targetBranch: string,
    strategy: MergeStrategy
  ): Promise<MergeResult> {
    switch (strategy.type) {
      case 'fast-forward':
        return this.fastForwardMerge(sourceBranch, targetBranch);
      case 'three-way':
        return this.threeWayMerge(sourceBranch, targetBranch, strategy.options);
      case 'octopus':
        return this.octopusMerge([sourceBranch], targetBranch);
      case 'ours':
        return this.oursMerge(sourceBranch, targetBranch);
      case 'subtree':
        return this.subtreeMerge(sourceBranch, targetBranch, strategy.options);
      default:
        return {
          success: false,
          message: `Unknown merge strategy: ${strategy.type}`,
        };
    }
  }

  /**
   * Fast-forward merge
   */
  private async fastForwardMerge(
    sourceBranch: string,
    targetBranch: string
  ): Promise<MergeResult> {
    const source = this.state.branches.get(sourceBranch);
    const target = this.state.branches.get(targetBranch);

    if (!source || !target) {
      return {
        success: false,
        message: 'Branch not found',
      };
    }

    // Check if fast-forward is possible
    const canFastForward = this.canFastForward(target.target, source.target);

    if (!canFastForward) {
      return {
        success: false,
        message: 'Cannot fast-forward',
      };
    }

    return {
      success: true,
      message: `Fast-forwarded ${targetBranch} to ${sourceBranch}`,
      fastForward: true,
    };
  }

  /**
   * Three-way merge
   */
  private async threeWayMerge(
    sourceBranch: string,
    targetBranch: string,
    _options?: MergeStrategy['options']
  ): Promise<MergeResult> {
    const source = this.state.branches.get(sourceBranch);
    const target = this.state.branches.get(targetBranch);

    if (!source || !target) {
      return {
        success: false,
        message: 'Branch not found',
      };
    }

    return {
      success: true,
      mergeCommit: `merge-${Date.now()}`,
      message: `Merged ${sourceBranch} into ${targetBranch}`,
    };
  }

  /**
   * Octopus merge
   */
  private async octopusMerge(
    sourceBranches: string[],
    targetBranch: string
  ): Promise<MergeResult> {
    const target = this.state.branches.get(targetBranch);

    if (!target) {
      return {
        success: false,
        message: 'Target branch not found',
      };
    }

    for (const branch of sourceBranches) {
      if (!this.state.branches.get(branch)) {
        return {
          success: false,
          message: `Source branch ${branch} not found`,
        };
      }
    }

    return {
      success: true,
      mergeCommit: `merge-${Date.now()}`,
      message: `Octopus merged ${sourceBranches.join(', ')} into ${targetBranch}`,
    };
  }

  /**
   * Ours merge strategy
   */
  private async oursMerge(
    sourceBranch: string,
    targetBranch: string
  ): Promise<MergeResult> {
    const source = this.state.branches.get(sourceBranch);
    const target = this.state.branches.get(targetBranch);

    if (!source || !target) {
      return {
        success: false,
        message: 'Branch not found',
      };
    }

    return {
      success: true,
      mergeCommit: `merge-${Date.now()}`,
      message: `Merged ${sourceBranch} into ${targetBranch} using 'ours' strategy`,
    };
  }

  /**
   * Subtree merge strategy
   */
  private async subtreeMerge(
    sourceBranch: string,
    targetBranch: string,
    _options?: MergeStrategy['options']
  ): Promise<MergeResult> {
    const source = this.state.branches.get(sourceBranch);
    const target = this.state.branches.get(targetBranch);

    if (!source || !target) {
      return {
        success: false,
        message: 'Branch not found',
      };
    }

    return {
      success: true,
      mergeCommit: `merge-${Date.now()}`,
      message: `Subtree merged ${sourceBranch} into ${targetBranch}`,
    };
  }

  /**
   * Check if fast-forward is possible
   */
  private canFastForward(from: string, to: string): boolean {
    // Simplified check - in real implementation would walk the commit graph
    const fromCommit = this.state.commits.get(from);
    const toCommit = this.state.commits.get(to);

    if (!fromCommit || !toCommit) {
      return false;
    }

    // Check if 'to' is an ancestor of 'from' or vice versa
    return this.isAncestor(from, to) || from === to;
  }

  /**
   * Check if commit A is an ancestor of commit B
   */
  private isAncestor(ancestorId: string, commitId: string): boolean {
    if (ancestorId === commitId) {
      return true;
    }

    const commit = this.state.commits.get(commitId);
    if (!commit || commit.parents.length === 0) {
      return false;
    }

    for (const parent of commit.parents) {
      if (this.isAncestor(ancestorId, parent)) {
        return true;
      }
    }

    return false;
  }
}

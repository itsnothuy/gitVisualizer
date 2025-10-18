/**
 * Animation factory for Git operations
 * Generates animation steps for various Git operations with proper timing and easing
 */

import type { AnimStep } from './types';
import { DURATIONS, EASING } from './types';
import {
  fadeInNode,
  fadeOutNode,
  highlightBranchTip,
  moveBranchLabel,
  tempDashedEdge,
  fade,
  move,
  classAdd,
  classRemove,
} from './primitives';

/**
 * Easing configuration for animations
 * Uses cubic-bezier for overshoot effects
 */
export const BOUNCE_EASING = 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'; // Overshoot
export const SMOOTH_EASING = EASING.easeInOut;

/**
 * Position in 2D space
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Options for commit birth animation
 */
export interface CommitBirthOptions {
  /** Position where the commit appears */
  position: Position;
  /** Branch label to highlight */
  branchLabel?: string;
  /** Start time offset */
  startTime?: number;
}

/**
 * Options for branch move animation
 */
export interface BranchMoveOptions {
  /** Old position of the branch label */
  oldPosition: Position;
  /** New position of the branch label */
  newPosition: Position;
  /** Start time offset */
  startTime?: number;
}

/**
 * Options for merge animation
 */
export interface MergeOptions {
  /** ID of the merge commit */
  mergeCommitId: string;
  /** ID of the first parent */
  parent1Id: string;
  /** ID of the second parent */
  parent2Id: string;
  /** Position of the merge commit */
  position: Position;
  /** Branch label to update */
  branchLabel?: string;
  /** Start time offset */
  startTime?: number;
}

/**
 * Options for rebase animation
 */
export interface RebaseOptions {
  /** Array of old commit IDs being rebased */
  oldCommits: string[];
  /** Array of new commit IDs after rebase */
  newCommits: string[];
  /** Old positions of commits */
  oldPositions: Position[];
  /** New positions of commits */
  newPositions: Position[];
  /** Branch label to update */
  branchLabel?: string;
  /** Final position for branch label */
  labelPosition?: Position;
  /** Start time offset */
  startTime?: number;
}

/**
 * Options for reset animation
 */
export interface ResetOptions {
  /** Commits to fade out (soft reset) or remove (hard reset) */
  affectedCommits: string[];
  /** Old position of HEAD/branch */
  oldPosition: Position;
  /** New position of HEAD/branch */
  newPosition: Position;
  /** Branch label to move */
  branchLabel: string;
  /** Reset mode */
  mode: 'soft' | 'hard';
  /** Start time offset */
  startTime?: number;
}

/**
 * Options for revert animation
 */
export interface RevertOptions {
  /** ID of the commit being reverted */
  revertedCommitId: string;
  /** ID of the new revert commit */
  revertCommitId: string;
  /** Position of the revert commit */
  position: Position;
  /** Branch label to update */
  branchLabel?: string;
  /** Start time offset */
  startTime?: number;
}

/**
 * Animation factory class
 * Provides methods to generate animation steps for Git operations
 */
export class AnimationFactory {
  /**
   * Generate animation steps for commit birth (new commit creation)
   */
  static commitBirth(
    commitId: string,
    options: CommitBirthOptions
  ): AnimStep[] {
    const { branchLabel, startTime = 0 } = options;
    // Position is used by the layout system for node placement
    const steps: AnimStep[] = [];

    // Fade in the new commit with bounce
    steps.push({
      t: startTime,
      sel: { nodes: [commitId] },
      op: 'fade',
      to: 1,
      dur: DURATIONS.short,
      easing: SMOOTH_EASING,
    });

    // Add a pulse effect for emphasis
    steps.push({
      t: startTime,
      sel: { nodes: [commitId] },
      op: 'pulse',
      to: 1.2,
      dur: DURATIONS.medium,
      easing: BOUNCE_EASING,
    });

    // If there's a branch label, highlight it
    if (branchLabel) {
      steps.push(
        ...highlightBranchTip(commitId, {
          t: startTime + DURATIONS.short,
          dur: DURATIONS.medium,
        })
      );
    }

    return steps;
  }

  /**
   * Generate animation steps for branch move (fast-forward, reset, etc.)
   */
  static branchMove(
    branchLabel: string,
    options: BranchMoveOptions
  ): AnimStep[] {
    const { newPosition, startTime = 0 } = options;
    const steps: AnimStep[] = [];

    // Move the branch label
    steps.push({
      t: startTime,
      sel: { labels: [branchLabel] },
      op: 'move',
      to: newPosition,
      dur: DURATIONS.medium,
      easing: SMOOTH_EASING,
    });

    // Fade out at old position
    steps.push({
      t: startTime,
      sel: { labels: [`${branchLabel}-old`] },
      op: 'fade',
      to: 0,
      dur: DURATIONS.short,
      easing: SMOOTH_EASING,
    });

    return steps;
  }

  /**
   * Generate animation steps for merge operation
   */
  static merge(options: MergeOptions): AnimStep[] {
    const {
      mergeCommitId,
      parent1Id,
      parent2Id,
      position, // Position for branch label updates
      branchLabel,
      startTime = 0,
    } = options;
    const steps: AnimStep[] = [];

    // Highlight parent commits
    steps.push(
      ...highlightBranchTip(parent1Id, {
        t: startTime,
        dur: DURATIONS.short,
      })
    );
    steps.push(
      ...highlightBranchTip(parent2Id, {
        t: startTime,
        dur: DURATIONS.short,
      })
    );

    // Show temporary dashed edge from parent2 to merge point
    const dashedEdgeId = `merge-arc-${mergeCommitId}`;
    steps.push(
      ...tempDashedEdge(dashedEdgeId, {
        t: startTime + DURATIONS.short,
        dur: DURATIONS.veryShort,
        lifetime: DURATIONS.medium,
      })
    );

    // Fade in the merge commit
    steps.push(
      ...fadeInNode(mergeCommitId, {
        t: startTime + DURATIONS.short + DURATIONS.medium,
        dur: DURATIONS.short,
      })
    );

    // Update branch label if provided
    if (branchLabel) {
      steps.push(
        ...moveBranchLabel(branchLabel, position, {
          t: startTime + DURATIONS.short + DURATIONS.medium,
          dur: DURATIONS.short,
        })
      );
    }

    return steps;
  }

  /**
   * Generate animation steps for rebase operation
   * Includes "flying commit" arcs along curved paths
   */
  static rebase(options: RebaseOptions): AnimStep[] {
    const {
      oldCommits,
      newCommits,
      oldPositions,
      newPositions,
      branchLabel,
      labelPosition,
      startTime = 0,
    } = options;
    const steps: AnimStep[] = [];
    let currentTime = startTime;

    // Validate input lengths
    if (oldCommits.length !== newCommits.length) {
      throw new Error('oldCommits and newCommits must have the same length');
    }
    if (oldPositions.length !== oldCommits.length) {
      throw new Error('oldPositions must match oldCommits length');
    }
    if (newPositions.length !== newCommits.length) {
      throw new Error('newPositions must match newCommits length');
    }

    // For each commit being rebased
    for (let i = 0; i < oldCommits.length; i++) {
      const oldCommitId = oldCommits[i];
      const newCommitId = newCommits[i];
      const newPos = newPositions[i];
      const ghostId = `${oldCommitId}-ghost`;
      const dashedEdgeId = `rebase-arc-${i}`;

      // Show dashed arc from old to new position
      steps.push(
        ...tempDashedEdge(dashedEdgeId, {
          t: currentTime,
          dur: DURATIONS.veryShort,
          lifetime: DURATIONS.medium,
        })
      );

      // Create ghost node at old position
      steps.push(
        classAdd({ nodes: [ghostId] }, 'ghost', { t: currentTime }),
        fade({ nodes: [ghostId] }, 0.5, {
          t: currentTime,
          dur: DURATIONS.veryShort,
        })
      );

      // Animate ghost along the arc to new position
      steps.push(
        move({ nodes: [ghostId] }, newPos, {
          t: currentTime + DURATIONS.veryShort,
          dur: DURATIONS.medium,
        })
      );

      // Fade in the new commit at target position
      steps.push(
        ...fadeInNode(newCommitId, {
          t: currentTime + DURATIONS.veryShort + DURATIONS.medium,
          dur: DURATIONS.short,
        })
      );

      // Fade out the ghost
      steps.push(
        fade({ nodes: [ghostId] }, 0, {
          t: currentTime + DURATIONS.veryShort + DURATIONS.medium,
          dur: DURATIONS.veryShort,
        }),
        classRemove({ nodes: [ghostId] }, 'ghost', {
          t: currentTime + DURATIONS.veryShort + DURATIONS.medium + DURATIONS.veryShort,
        })
      );

      // Advance time for next commit
      currentTime += DURATIONS.short + DURATIONS.medium;
    }

    // Move branch label to final position if provided
    if (branchLabel && labelPosition) {
      steps.push(
        ...moveBranchLabel(branchLabel, labelPosition, {
          t: currentTime,
          dur: DURATIONS.short,
        })
      );
    }

    return steps;
  }

  /**
   * Generate animation steps for reset operation
   */
  static reset(options: ResetOptions): AnimStep[] {
    const {
      affectedCommits,
      newPosition,
      branchLabel,
      mode,
      startTime = 0,
    } = options;
    const steps: AnimStep[] = [];

    // For hard reset, fade out and remove affected commits
    if (mode === 'hard') {
      for (const commitId of affectedCommits) {
        steps.push(
          ...fadeOutNode(commitId, {
            t: startTime,
            dur: DURATIONS.short,
          })
        );
      }
    }

    // For soft reset, just dim the affected commits
    if (mode === 'soft') {
      for (const commitId of affectedCommits) {
        steps.push(
          fade({ nodes: [commitId] }, 0.4, {
            t: startTime,
            dur: DURATIONS.short,
          })
        );
      }
    }

    // Move the branch label back
    steps.push(
      ...moveBranchLabel(branchLabel, newPosition, {
        t: startTime + DURATIONS.short,
        dur: DURATIONS.medium,
      })
    );

    // Highlight the target commit
    steps.push(
      ...highlightBranchTip(newPosition.x.toString(), {
        t: startTime + DURATIONS.short + DURATIONS.medium,
        dur: DURATIONS.short,
      })
    );

    return steps;
  }

  /**
   * Generate animation steps for revert operation
   */
  static revert(options: RevertOptions): AnimStep[] {
    const {
      revertedCommitId,
      revertCommitId,
      position,
      branchLabel,
      startTime = 0,
    } = options;
    const steps: AnimStep[] = [];

    // Highlight the commit being reverted
    steps.push(
      ...highlightBranchTip(revertedCommitId, {
        t: startTime,
        dur: DURATIONS.short,
      })
    );

    // Show a dashed arc from reverted commit to new position
    const dashedEdgeId = `revert-arc-${revertCommitId}`;
    steps.push(
      ...tempDashedEdge(dashedEdgeId, {
        t: startTime + DURATIONS.short,
        dur: DURATIONS.veryShort,
        lifetime: DURATIONS.medium,
      })
    );

    // Fade in the revert commit
    steps.push(
      ...fadeInNode(revertCommitId, {
        t: startTime + DURATIONS.short + DURATIONS.medium,
        dur: DURATIONS.short,
      })
    );

    // Add a special indicator (class) to show it's a revert
    steps.push(
      classAdd({ nodes: [revertCommitId] }, 'revert-commit', {
        t: startTime + DURATIONS.short + DURATIONS.medium + DURATIONS.short,
      })
    );

    // Update branch label if provided
    if (branchLabel) {
      steps.push(
        ...moveBranchLabel(branchLabel, position, {
          t: startTime + DURATIONS.short + DURATIONS.medium,
          dur: DURATIONS.short,
        })
      );
    }

    return steps;
  }

  /**
   * Compute curved SVG path for arc animations
   * Returns a path string for animating along a curved path
   */
  static computeArcPath(
    start: Position,
    end: Position,
    curvature: number = 0.3
  ): string {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Control point for quadratic Bezier curve
    // Positioned perpendicular to the line between start and end
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const controlX = midX + perpX * distance * curvature;
    const controlY = midY + perpY * distance * curvature;

    // Generate SVG path for quadratic Bezier curve
    return `M ${start.x},${start.y} Q ${controlX},${controlY} ${end.x},${end.y}`;
  }

  /**
   * Generate animation steps for arc path animation
   * Animates a node along a curved path
   */
  static arcPathAnimation(
    nodeId: string,
    path: string,
    options: {
      startTime?: number;
      duration?: number;
      dashArray?: string;
    } = {}
  ): AnimStep[] {
    const { startTime = 0, duration = DURATIONS.medium } = options;
    const steps: AnimStep[] = [];

    // Create a temporary path element for the animation
    // This would be handled by the rendering layer
    const pathId = `arc-path-${nodeId}`;

    // Show the dashed path
    steps.push({
      t: startTime,
      sel: { edges: [pathId] },
      op: 'fade',
      to: 1,
      dur: DURATIONS.veryShort,
      easing: SMOOTH_EASING,
    });

    // Animate the node along the path
    // This is a conceptual step; actual implementation would use SVG animateMotion
    steps.push({
      t: startTime + DURATIONS.veryShort,
      sel: { nodes: [nodeId] },
      op: 'classAdd',
      to: 'animating-along-path',
      dur: 0,
    });

    // Hide the path after animation
    steps.push({
      t: startTime + duration,
      sel: { edges: [pathId] },
      op: 'fade',
      to: 0,
      dur: DURATIONS.veryShort,
      easing: SMOOTH_EASING,
    });

    return steps;
  }
}

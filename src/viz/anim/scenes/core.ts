import { AnimScene } from '../types';
import { DURATIONS } from '../types';
import {
  fadeInNode,
  fadeOutNode,
  highlightBranchTip,
  moveBranchLabel,
  cascadeHighlight,
  tempDashedEdge,
  pulse,
  stroke,
} from '../primitives';

/**
 * Scene: New commit
 * Animates creating a new commit on the current branch
 */
export function sceneCommit(newId: string, atMs = 0): AnimScene {
  const steps = [
    ...fadeInNode(newId, { t: atMs, dur: DURATIONS.short }),
    ...highlightBranchTip(newId, { t: atMs + DURATIONS.short, dur: DURATIONS.medium }),
  ];

  return {
    name: 'commit',
    total: atMs + DURATIONS.short + DURATIONS.medium,
    steps,
    description: 'Creating new commit',
  };
}

/**
 * Scene: Create branch
 * Animates creating a new branch at the current HEAD
 */
export function sceneBranchCreate(
  branchLabel: string,
  nodeId: string,
  labelPos: { x: number; y: number },
  atMs = 0
): AnimScene {
  const steps = [
    ...highlightBranchTip(nodeId, { t: atMs, dur: DURATIONS.short }),
    ...moveBranchLabel(branchLabel, labelPos, { t: atMs + DURATIONS.short, dur: DURATIONS.short }),
  ];

  return {
    name: 'branch-create',
    total: atMs + DURATIONS.short * 2,
    steps,
    description: `Creating branch ${branchLabel}`,
  };
}

/**
 * Scene: Checkout branch
 * Animates switching to a different branch
 */
export function sceneCheckout(
  fromNodeId: string,
  toNodeId: string,
  headLabelId: string,
  newPos: { x: number; y: number },
  atMs = 0
): AnimScene {
  const steps = [
    // Unhighlight old position
    ...highlightBranchTip(fromNodeId, { t: atMs, dur: DURATIONS.veryShort }),
    // Move HEAD label
    ...moveBranchLabel(headLabelId, newPos, { t: atMs + DURATIONS.veryShort, dur: DURATIONS.short }),
    // Highlight new position
    ...highlightBranchTip(toNodeId, { t: atMs + DURATIONS.veryShort + DURATIONS.short, dur: DURATIONS.medium }),
  ];

  return {
    name: 'checkout',
    total: atMs + DURATIONS.veryShort + DURATIONS.short + DURATIONS.medium,
    steps,
    description: 'Switching branch',
  };
}

/**
 * Scene: Delete branch
 * Animates removing a branch label
 */
export function sceneBranchDelete(
  branchLabel: string,
  atMs = 0
): AnimScene {
  const steps = [
    ...fadeOutNode(branchLabel, { t: atMs, dur: DURATIONS.short }),
  ];

  return {
    name: 'branch-delete',
    total: atMs + DURATIONS.short,
    steps,
    description: `Deleting branch ${branchLabel}`,
  };
}

/**
 * Scene: Fast-forward merge
 * Animates moving a branch label along a path with intermediate nodes fading in
 */
export function sceneFastForward(
  branchLabel: string,
  fromNodeId: string,
  toNodeId: string,
  intermediateNodes: string[],
  labelPos: { x: number; y: number },
  atMs = 0
): AnimScene {
  const steps = [
    // Highlight the path from old to new tip
    ...cascadeHighlight([fromNodeId, ...intermediateNodes, toNodeId], {
      t: atMs,
      dur: DURATIONS.short,
      stagger: DURATIONS.veryShort,
    }),
    // Fade in intermediate nodes that might be newly visible
    ...intermediateNodes.flatMap((nodeId, index) =>
      fadeInNode(nodeId, {
        t: atMs + index * DURATIONS.veryShort,
        dur: DURATIONS.short,
      })
    ),
    // Move branch label to new position
    ...moveBranchLabel(branchLabel, labelPos, {
      t: atMs + DURATIONS.medium,
      dur: DURATIONS.short,
    }),
  ];

  const totalTime =
    atMs +
    DURATIONS.medium +
    DURATIONS.short +
    intermediateNodes.length * DURATIONS.veryShort;

  return {
    name: 'fast-forward',
    total: totalTime,
    steps,
    description: `Fast-forwarding ${branchLabel}`,
  };
}

/**
 * Scene: Merge (2-parent)
 * Animates creating a merge commit with two parent edges
 */
export function sceneMerge2P(
  mergeNodeId: string,
  parent1Id: string,
  parent2Id: string,
  secondParentEdgeId: string,
  branchLabel: string,
  labelPos: { x: number; y: number },
  atMs = 0
): AnimScene {
  const steps = [
    // Show temporary dashed edge to second parent
    ...tempDashedEdge(secondParentEdgeId, {
      t: atMs,
      dur: DURATIONS.short,
      lifetime: DURATIONS.medium,
    }),
    // Fade in merge node
    ...fadeInNode(mergeNodeId, {
      t: atMs + DURATIONS.short,
      dur: DURATIONS.short,
    }),
    // Highlight both parents briefly
    ...highlightBranchTip(parent1Id, {
      t: atMs + DURATIONS.short,
      dur: DURATIONS.veryShort,
    }),
    ...highlightBranchTip(parent2Id, {
      t: atMs + DURATIONS.short,
      dur: DURATIONS.veryShort,
    }),
    // Move branch label to merge node
    ...moveBranchLabel(branchLabel, labelPos, {
      t: atMs + DURATIONS.short + DURATIONS.short,
      dur: DURATIONS.short,
    }),
    // Final highlight on merge node
    ...highlightBranchTip(mergeNodeId, {
      t: atMs + DURATIONS.short + DURATIONS.short + DURATIONS.short,
      dur: DURATIONS.medium,
    }),
  ];

  const totalTime =
    atMs +
    DURATIONS.short +
    DURATIONS.short +
    DURATIONS.short +
    DURATIONS.medium +
    DURATIONS.medium; // Include temp edge lifetime

  return {
    name: 'merge-2p',
    total: totalTime,
    steps,
    description: `Merging branches (2-parent merge)`,
  };
}

/**
 * Scene: Reset
 * Animates resetting HEAD to a previous commit
 * Uses emphasis color to indicate danger/caution
 */
export function sceneReset(
  fromNodeId: string,
  toNodeId: string,
  headLabelId: string,
  newPos: { x: number; y: number },
  mode: 'soft' | 'hard' = 'soft',
  atMs = 0
): AnimScene {
  const emphasisColor = mode === 'hard' ? 'var(--lgb-danger)' : 'var(--lgb-accent)';

  const steps = [
    // Emphasize current position with danger color for hard reset
    stroke(
      { nodes: [fromNodeId] },
      { color: emphasisColor, width: 3 },
      { t: atMs, dur: DURATIONS.short }
    ),
    // Quick snap to target position
    ...moveBranchLabel(headLabelId, newPos, {
      t: atMs + DURATIONS.short,
      dur: DURATIONS.veryShort,
    }),
    // Highlight target node
    ...highlightBranchTip(toNodeId, {
      t: atMs + DURATIONS.short + DURATIONS.veryShort,
      dur: DURATIONS.medium,
    }),
  ];

  const totalTime = atMs + DURATIONS.short + DURATIONS.veryShort + DURATIONS.medium;

  return {
    name: 'reset',
    total: totalTime,
    steps,
    description: `Resetting HEAD to previous commit (${mode})`,
  };
}

/**
 * Scene: Revert
 * Animates creating a revert commit that undoes changes
 */
export function sceneRevert(
  revertNodeId: string,
  originalNodeId: string,
  branchLabel: string,
  labelPos: { x: number; y: number },
  atMs = 0
): AnimScene {
  const steps = [
    // Briefly highlight the commit being reverted
    ...highlightBranchTip(originalNodeId, {
      t: atMs,
      dur: DURATIONS.short,
    }),
    // Fade in the new revert commit with emphasis
    ...fadeInNode(revertNodeId, {
      t: atMs + DURATIONS.short,
      dur: DURATIONS.short,
    }),
    stroke(
      { nodes: [revertNodeId] },
      { color: 'var(--lgb-danger)', width: 2 },
      { t: atMs + DURATIONS.short, dur: DURATIONS.short }
    ),
    // Move branch label to revert commit
    ...moveBranchLabel(branchLabel, labelPos, {
      t: atMs + DURATIONS.short + DURATIONS.short,
      dur: DURATIONS.short,
    }),
    // Final pulse on revert commit
    pulse({ nodes: [revertNodeId] }, 1.2, {
      t: atMs + DURATIONS.short + DURATIONS.short + DURATIONS.short,
      dur: DURATIONS.medium,
    }),
  ];

  const totalTime =
    atMs + DURATIONS.short + DURATIONS.short + DURATIONS.short + DURATIONS.medium;

  return {
    name: 'revert',
    total: totalTime,
    steps,
    description: `Creating revert commit`,
  };
}
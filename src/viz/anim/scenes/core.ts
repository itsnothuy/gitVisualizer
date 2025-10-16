import { AnimScene } from '../types';
import { DURATIONS } from '../types';
import { fadeInNode, highlightBranchTip, moveBranchLabel } from '../primitives';

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

/* TODO: Add scenes for merge2P, reset, revert, cherry-pick, rebase */
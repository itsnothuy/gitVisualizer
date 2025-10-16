/**
 * Animation scenes for rebase and cherry-pick operations (LGB-style)
 * Implements ghost-copy animations with dashed arcs
 */

import { AnimScene, DURATIONS } from '../types';
import {
  fadeInNode,
  highlightBranchTip,
  moveBranchLabel,
  tempDashedEdge,
  fade,
  move,
  classAdd,
  classRemove,
} from '../primitives';

/**
 * Scene: Rebase
 * Animates rebasing commits onto a new base
 * Each commit is shown as a ghost copy moving along a dashed arc
 * 
 * @param pickedCommits - Array of commit IDs being rebased (in order)
 * @param oldBaseId - The old base commit ID
 * @param newBaseId - The new base commit ID
 * @param newCommitIds - Array of new commit IDs after rebase (in order)
 * @param branchLabel - Branch being rebased
 * @param newPositions - Positions for new commits
 * @param labelPos - Final position for branch label
 * @param atMs - Start time offset
 */
export function sceneRebase(
  pickedCommits: string[],
  oldBaseId: string,
  newBaseId: string,
  newCommitIds: string[],
  branchLabel: string,
  newPositions: Array<{ x: number; y: number }>,
  labelPos: { x: number; y: number },
  atMs = 0
): AnimScene {
  const steps = [];
  let currentTime = atMs;

  // Highlight the new base briefly
  steps.push(
    ...highlightBranchTip(newBaseId, {
      t: currentTime,
      dur: DURATIONS.short,
    })
  );
  currentTime += DURATIONS.short;

  // For each picked commit, animate the copy operation
  for (let i = 0; i < pickedCommits.length; i++) {
    const oldCommitId = pickedCommits[i];
    const newCommitId = newCommitIds[i];
    const newPos = newPositions[i];
    const ghostId = `${oldCommitId}-ghost`;
    const dashedEdgeId = `rebase-arc-${i}`;

    // Show dashed arc from old position to new position
    steps.push(
      ...tempDashedEdge(dashedEdgeId, {
        t: currentTime,
        dur: DURATIONS.veryShort,
        lifetime: DURATIONS.medium,
      })
    );

    // Create and animate ghost node
    steps.push(
      // Initialize ghost at old position with reduced opacity
      classAdd({ nodes: [ghostId] }, 'ghost', { t: currentTime }),
      fade({ nodes: [ghostId] }, 0.4, {
        t: currentTime,
        dur: DURATIONS.veryShort,
      }),
      // Move ghost to new position
      move({ nodes: [ghostId] }, newPos, {
        t: currentTime + DURATIONS.veryShort,
        dur: DURATIONS.medium,
      })
    );

    // Materialize the new commit
    steps.push(
      ...fadeInNode(newCommitId, {
        t: currentTime + DURATIONS.veryShort + DURATIONS.medium,
        dur: DURATIONS.short,
      })
    );

    // Fade out ghost
    steps.push(
      fade({ nodes: [ghostId] }, 0, {
        t: currentTime + DURATIONS.veryShort + DURATIONS.medium,
        dur: DURATIONS.veryShort,
      }),
      classRemove({ nodes: [ghostId] }, 'ghost', {
        t:
          currentTime +
          DURATIONS.veryShort +
          DURATIONS.medium +
          DURATIONS.veryShort,
      })
    );

    // Move to next commit (sequential animation)
    currentTime +=
      DURATIONS.veryShort + DURATIONS.medium + DURATIONS.short;
  }

  // Dim the original commits
  for (const oldCommitId of pickedCommits) {
    steps.push(
      fade({ nodes: [oldCommitId] }, 0.3, {
        t: currentTime,
        dur: DURATIONS.short,
      })
    );
  }

  currentTime += DURATIONS.short;

  // Slide branch label to final position
  steps.push(
    ...moveBranchLabel(branchLabel, labelPos, {
      t: currentTime,
      dur: DURATIONS.short,
    })
  );

  currentTime += DURATIONS.short;

  const totalTime = currentTime - atMs;

  return {
    name: 'rebase',
    total: totalTime,
    steps,
    description: `Rebased ${pickedCommits.length} commit${pickedCommits.length > 1 ? 's' : ''} onto ${newBaseId}`,
  };
}

/**
 * Scene: Interactive Rebase (with cue overlay)
 * Shows an overlay list of the ordered picks
 * 
 * @param pickedCommits - Array of commit IDs being rebased (in order)
 * @param oldBaseId - The old base commit ID
 * @param newBaseId - The new base commit ID
 * @param newCommitIds - Array of new commit IDs after rebase (in order)
 * @param branchLabel - Branch being rebased
 * @param newPositions - Positions for new commits
 * @param labelPos - Final position for branch label
 * @param atMs - Start time offset
 */
export function sceneInteractiveRebase(
  pickedCommits: string[],
  oldBaseId: string,
  newBaseId: string,
  newCommitIds: string[],
  branchLabel: string,
  newPositions: Array<{ x: number; y: number }>,
  labelPos: { x: number; y: number },
  atMs = 0
): AnimScene {
  // For reduced-motion, use outline flashes instead of movement
  const steps = [];
  let currentTime = atMs;

  // Show the cue overlay (conceptual - actual overlay would be handled by UI layer)
  steps.push(
    classAdd({ nodes: ['rebase-cue-overlay'] }, 'visible', {
      t: currentTime,
    })
  );

  // Highlight new base
  steps.push(
    ...highlightBranchTip(newBaseId, {
      t: currentTime,
      dur: DURATIONS.short,
    })
  );
  currentTime += DURATIONS.short;

  // For each commit, show outline flash (reduced-motion friendly)
  for (let i = 0; i < pickedCommits.length; i++) {
    const oldCommitId = pickedCommits[i];
    const newCommitId = newCommitIds[i];

    // Flash outline on old commit
    steps.push(
      classAdd({ nodes: [oldCommitId] }, 'outline-flash', {
        t: currentTime,
      }),
      classRemove({ nodes: [oldCommitId] }, 'outline-flash', {
        t: currentTime + 80,
      })
    );

    // Materialize new commit
    steps.push(
      ...fadeInNode(newCommitId, {
        t: currentTime + 80,
        dur: 80,
      })
    );

    // Dim original
    steps.push(
      fade({ nodes: [oldCommitId] }, 0.3, {
        t: currentTime + 160,
        dur: 80,
      })
    );

    currentTime += 240; // Total: 80ms per stage, staying under reduced-motion limit
  }

  // Hide cue overlay
  steps.push(
    classRemove({ nodes: ['rebase-cue-overlay'] }, 'visible', {
      t: currentTime,
    })
  );

  // Move branch label
  steps.push(
    ...moveBranchLabel(branchLabel, labelPos, {
      t: currentTime,
      dur: 80,
    })
  );

  currentTime += 80;

  const totalTime = currentTime - atMs;

  return {
    name: 'interactive-rebase',
    total: totalTime,
    steps,
    description: `Interactively rebased ${pickedCommits.length} commit${pickedCommits.length > 1 ? 's' : ''} onto ${newBaseId}`,
  };
}

/**
 * Scene: Cherry-pick
 * Animates cherry-picking a single commit
 * Shows ghost copy moving to new location with optional conflict badge
 * 
 * @param sourceCommitId - The commit being cherry-picked
 * @param newCommitId - The new commit ID after cherry-pick
 * @param targetBaseId - The commit onto which we're cherry-picking
 * @param branchLabel - Current branch label
 * @param newPosition - Position for the new commit
 * @param labelPos - Position for branch label after cherry-pick
 * @param hasConflict - Whether to show conflict badge stub
 * @param atMs - Start time offset
 */
export function sceneCherryPick(
  sourceCommitId: string,
  newCommitId: string,
  targetBaseId: string,
  branchLabel: string,
  newPosition: { x: number; y: number },
  labelPos: { x: number; y: number },
  hasConflict = false,
  atMs = 0
): AnimScene {
  const steps = [];
  let currentTime = atMs;
  const ghostId = `${sourceCommitId}-ghost`;
  const dashedEdgeId = `cherry-pick-arc`;

  // Briefly highlight source commit
  steps.push(
    ...highlightBranchTip(sourceCommitId, {
      t: currentTime,
      dur: DURATIONS.short,
    })
  );
  currentTime += DURATIONS.short;

  // Show dashed arc
  steps.push(
    ...tempDashedEdge(dashedEdgeId, {
      t: currentTime,
      dur: DURATIONS.veryShort,
      lifetime: DURATIONS.medium,
    })
  );

  // Create and animate ghost
  steps.push(
    classAdd({ nodes: [ghostId] }, 'ghost', { t: currentTime }),
    fade({ nodes: [ghostId] }, 0.4, {
      t: currentTime,
      dur: DURATIONS.veryShort,
    }),
    move({ nodes: [ghostId] }, newPosition, {
      t: currentTime + DURATIONS.veryShort,
      dur: DURATIONS.medium,
    })
  );

  // Materialize new commit
  steps.push(
    ...fadeInNode(newCommitId, {
      t: currentTime + DURATIONS.veryShort + DURATIONS.medium,
      dur: DURATIONS.short,
    })
  );

  // If conflict, show badge stub
  if (hasConflict) {
    steps.push(
      classAdd({ nodes: [newCommitId] }, 'conflict-badge', {
        t: currentTime + DURATIONS.veryShort + DURATIONS.medium,
      })
    );
  }

  // Fade out ghost
  steps.push(
    fade({ nodes: [ghostId] }, 0, {
      t: currentTime + DURATIONS.veryShort + DURATIONS.medium,
      dur: DURATIONS.veryShort,
    }),
    classRemove({ nodes: [ghostId] }, 'ghost', {
      t:
        currentTime +
        DURATIONS.veryShort +
        DURATIONS.medium +
        DURATIONS.veryShort,
    })
  );

  currentTime += DURATIONS.veryShort + DURATIONS.medium + DURATIONS.short;

  // Move branch label
  steps.push(
    ...moveBranchLabel(branchLabel, labelPos, {
      t: currentTime,
      dur: DURATIONS.short,
    })
  );

  // Final highlight
  steps.push(
    ...highlightBranchTip(newCommitId, {
      t: currentTime + DURATIONS.short,
      dur: DURATIONS.medium,
    })
  );

  currentTime += DURATIONS.short + DURATIONS.medium;

  const totalTime = currentTime - atMs;

  return {
    name: 'cherry-pick',
    total: totalTime,
    steps,
    description: `Cherry-picked ${sourceCommitId.substring(0, 7)}${hasConflict ? ' (conflict)' : ''}`,
  };
}

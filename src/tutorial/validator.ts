/**
 * Solution Validator
 * Validates user's Git state against the goal state using TreeCompare
 */

import type { GitState } from '@/cli/types';
import type { ValidationResult, Level } from './types';
import { stateToSnapshot } from './stateUtils';

/**
 * Validate if the user's state matches the goal state
 */
export function validateSolution(
  userState: GitState,
  level: Level,
  commandsUsed: number,
): ValidationResult {
  const differences: string[] = [];

  // Convert states for comparison
  const userSnapshot = stateToSnapshot(userState);
  const goalSnapshot = level.goalState;

  // Compare commits
  const commitDiffs = compareCommits(userSnapshot.commits, goalSnapshot.commits);
  if (commitDiffs.length > 0) {
    differences.push(...commitDiffs);
  }

  // Compare branches
  const branchDiffs = compareBranches(
    userSnapshot.branches,
    goalSnapshot.branches,
    level.flags?.compareOnlyMain,
  );
  if (branchDiffs.length > 0) {
    differences.push(...branchDiffs);
  }

  // Compare HEAD
  const headDiff = compareHead(userSnapshot.head, goalSnapshot.head);
  if (headDiff) {
    differences.push(headDiff);
  }

  // If no differences, solution is valid
  const valid = differences.length === 0;

  if (valid) {
    const optimalCommands = level.solutionCommands.length;
    const efficiency = Math.round((optimalCommands / commandsUsed) * 100);

    return {
      valid: true,
      message: `Level completed! You used ${commandsUsed} command${commandsUsed !== 1 ? 's' : ''}.`,
      score: {
        commandsUsed,
        optimalCommands,
        efficiency,
      },
    };
  }

  return {
    valid: false,
    message: 'Solution is not correct yet. Keep trying!',
    differences,
  };
}

/**
 * Compare commit sets
 */
function compareCommits(
  userCommits: Array<{ id: string; parents: string[] }>,
  goalCommits: Array<{ id: string; parents: string[] }>,
): string[] {
  const differences: string[] = [];

  // Check if we have the right number of commits
  if (userCommits.length !== goalCommits.length) {
    differences.push(
      `Expected ${goalCommits.length} commit(s), but found ${userCommits.length}`,
    );
  }

  // For intro levels, we mainly care about the structure (parent relationships)
  // More sophisticated comparison would check the actual commit graph topology
  // TODO: Compare commit graph structure, not just count

  return differences;
}

/**
 * Compare branch sets
 */
function compareBranches(
  userBranches: Array<{ name: string; target: string }>,
  goalBranches: Array<{ name: string; target: string }>,
  compareOnlyMain?: boolean,
): string[] {
  const differences: string[] = [];

  if (compareOnlyMain) {
    // Only compare the main branch
    const userMain = userBranches.find((b) => b.name === 'main');
    const goalMain = goalBranches.find((b) => b.name === 'main');

    if (!userMain && goalMain) {
      differences.push('Missing main branch');
    }

    // For main branch, we check if it's at the correct "level" in the commit tree
    // This is simplified - in reality we'd check the commit graph structure
    return differences;
  }

  // Compare all branches
  const userBranchMap = new Map(userBranches.map((b) => [b.name, b.target]));
  const goalBranchMap = new Map(goalBranches.map((b) => [b.name, b.target]));

  // Check for missing branches
  for (const [name] of goalBranchMap) {
    if (!userBranchMap.has(name)) {
      differences.push(`Missing branch: ${name}`);
    }
  }

  // Check for extra branches (optional - might be too strict)
  // for (const [name] of userBranchMap) {
  //   if (!goalBranchMap.has(name)) {
  //     differences.push(`Unexpected branch: ${name}`);
  //   }
  // }

  return differences;
}

/**
 * Compare HEAD state
 */
function compareHead(
  userHead: { type: string; name?: string; commit?: string },
  goalHead: { type: string; name?: string; commit?: string },
): string | null {
  if (userHead.type !== goalHead.type) {
    return `HEAD type mismatch: expected ${goalHead.type}, got ${userHead.type}`;
  }

  if (userHead.type === 'branch' && goalHead.type === 'branch') {
    if (userHead.name !== goalHead.name) {
      return `HEAD branch mismatch: expected ${goalHead.name}, got ${userHead.name}`;
    }
  }

  // For detached HEAD, we'd need more sophisticated comparison
  // For now, just check the type matches

  return null;
}

/**
 * Quick validation check (for UI state updates)
 */
export function quickValidate(userState: GitState, level: Level): boolean {
  const result = validateSolution(userState, level, 0);
  return result.valid;
}

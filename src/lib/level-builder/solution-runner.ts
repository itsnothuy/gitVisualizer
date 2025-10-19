/**
 * Solution Runner
 * Execute solution commands and verify goal state is achievable
 */

import { GitEngine } from '@/cli/GitEngine';
import type { GitState } from '@/cli/types';
import type { GitStateSnapshot } from '@/tutorial/types';
import { snapshotToState, stateToSnapshot } from '@/tutorial/stateUtils';

/**
 * Solution execution result
 */
export interface SolutionRunResult {
  success: boolean;
  finalState?: GitStateSnapshot;
  error?: string;
  commandResults: Array<{
    command: string;
    success: boolean;
    output?: string;
    error?: string;
  }>;
}

/**
 * Execute solution commands from initial state
 */
export async function runSolutionCommands(
  initialState: GitStateSnapshot,
  commands: string[],
): Promise<SolutionRunResult> {
  const commandResults: Array<{
    command: string;
    success: boolean;
    output?: string;
    error?: string;
  }> = [];

  try {
    // Convert snapshot to GitState
    let currentState: GitState = snapshotToState(initialState);

    // Execute each command
    for (const command of commands) {
      try {
        const result = GitEngine.executeCommand(command, currentState);
        
        if (result.success && result.state) {
          currentState = result.state;
          commandResults.push({
            command,
            success: true,
            output: result.output,
          });
        } else {
          commandResults.push({
            command,
            success: false,
            error: result.error || 'Command failed',
          });
          
          // Continue execution even if command fails
          // This allows us to report all failures
        }
      } catch (error) {
        commandResults.push({
          command,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Convert final state back to snapshot
    const finalState = stateToSnapshot(currentState);

    // Check if all commands succeeded
    const allSuccess = commandResults.every((r) => r.success);

    return {
      success: allSuccess,
      finalState,
      commandResults,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run solution',
      commandResults,
    };
  }
}

/**
 * Compare two Git states and return differences
 */
export interface StateDifference {
  type: 'commit' | 'branch' | 'tag' | 'head';
  description: string;
}

export function compareStates(
  actualState: GitStateSnapshot,
  expectedState: GitStateSnapshot,
): StateDifference[] {
  const differences: StateDifference[] = [];

  // Compare commits
  if (actualState.commits.length !== expectedState.commits.length) {
    differences.push({
      type: 'commit',
      description: `Expected ${expectedState.commits.length} commit(s), got ${actualState.commits.length}`,
    });
  }

  // Compare branches
  const actualBranchMap = new Map(actualState.branches.map((b) => [b.name, b.target]));
  const expectedBranchMap = new Map(expectedState.branches.map((b) => [b.name, b.target]));

  // Check for missing branches
  for (const [name, target] of expectedBranchMap) {
    const actualTarget = actualBranchMap.get(name);
    if (!actualTarget) {
      differences.push({
        type: 'branch',
        description: `Missing branch: ${name}`,
      });
    } else if (actualTarget !== target) {
      differences.push({
        type: 'branch',
        description: `Branch ${name}: expected to point to ${target.slice(0, 7)}, but points to ${actualTarget.slice(0, 7)}`,
      });
    }
  }

  // Check for extra branches
  for (const [name] of actualBranchMap) {
    if (!expectedBranchMap.has(name)) {
      differences.push({
        type: 'branch',
        description: `Unexpected branch: ${name}`,
      });
    }
  }

  // Compare HEAD
  if (actualState.head.type !== expectedState.head.type) {
    differences.push({
      type: 'head',
      description: `HEAD type mismatch: expected ${expectedState.head.type}, got ${actualState.head.type}`,
    });
  } else if (actualState.head.type === 'branch' && expectedState.head.type === 'branch') {
    if (actualState.head.name !== expectedState.head.name) {
      differences.push({
        type: 'head',
        description: `HEAD branch mismatch: expected ${expectedState.head.name}, got ${actualState.head.name}`,
      });
    }
  } else if (actualState.head.type === 'detached' && expectedState.head.type === 'detached') {
    if (actualState.head.commit !== expectedState.head.commit) {
      differences.push({
        type: 'head',
        description: `HEAD commit mismatch: expected ${expectedState.head.commit?.slice(0, 7)}, got ${actualState.head.commit?.slice(0, 7)}`,
      });
    }
  }

  // Compare tags (if any)
  const actualTagMap = new Map(actualState.tags.map((t) => [t.name, t.target]));
  const expectedTagMap = new Map(expectedState.tags.map((t) => [t.name, t.target]));

  for (const [name, target] of expectedTagMap) {
    const actualTarget = actualTagMap.get(name);
    if (!actualTarget) {
      differences.push({
        type: 'tag',
        description: `Missing tag: ${name}`,
      });
    } else if (actualTarget !== target) {
      differences.push({
        type: 'tag',
        description: `Tag ${name}: expected to point to ${target.slice(0, 7)}, but points to ${actualTarget.slice(0, 7)}`,
      });
    }
  }

  return differences;
}

/**
 * Verify that solution commands achieve the goal state
 */
export async function verifySolution(
  initialState: GitStateSnapshot,
  goalState: GitStateSnapshot,
  solutionCommands: string[],
): Promise<{ valid: boolean; differences: StateDifference[]; runResult: SolutionRunResult }> {
  const runResult = await runSolutionCommands(initialState, solutionCommands);

  if (!runResult.success || !runResult.finalState) {
    return {
      valid: false,
      differences: [{
        type: 'commit',
        description: 'Solution commands failed to execute successfully',
      }],
      runResult,
    };
  }

  const differences = compareStates(runResult.finalState, goalState);

  return {
    valid: differences.length === 0,
    differences,
    runResult,
  };
}

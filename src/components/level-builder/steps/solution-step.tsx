/**
 * Solution Step
 * Edit solution commands and verify they achieve the goal state
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Play, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import type { GitStateSnapshot } from '@/tutorial/types';
import { runSolutionCommands, compareStates } from '@/lib/level-builder/solution-runner';

interface SolutionStepProps {
  solutionCommands: string[];
  initialState?: GitStateSnapshot;
  goalState?: GitStateSnapshot;
  onChange: (commands: string[]) => void;
}

export function SolutionStep({
  solutionCommands,
  initialState,
  goalState,
  onChange,
}: SolutionStepProps) {
  const [testResult, setTestResult] = React.useState<Awaited<ReturnType<typeof runSolutionCommands>> | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);

  const handleAddCommand = () => {
    onChange([...solutionCommands, '']);
  };

  const handleRemoveCommand = (index: number) => {
    onChange(solutionCommands.filter((_, i) => i !== index));
  };

  const handleCommandChange = (index: number, value: string) => {
    const updated = [...solutionCommands];
    updated[index] = value;
    onChange(updated);
  };

  const handleTestSolution = async () => {
    if (!initialState || !goalState) {
      alert('Please configure initial and goal states first.');
      return;
    }

    setIsRunning(true);
    try {
      const result = await runSolutionCommands(initialState, solutionCommands);
      setTestResult(result);
    } catch (error) {
      alert(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const differences = React.useMemo(() => {
    if (!testResult?.finalState || !goalState) return [];
    return compareStates(testResult.finalState, goalState);
  }, [testResult, goalState]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solution Commands</CardTitle>
        <CardDescription>
          Define the optimal solution commands to achieve the goal state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Commands</Label>
            <Button onClick={handleAddCommand} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Command
            </Button>
          </div>

          {solutionCommands.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No commands added yet. Click &quot;Add Command&quot; to get started.
            </p>
          )}

          <div className="space-y-2">
            {solutionCommands.map((command, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground min-w-[30px]">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => handleCommandChange(index, e.target.value)}
                  placeholder="e.g., git commit"
                  className="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCommand(index)}
                  aria-label={`Remove command ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleTestSolution}
            disabled={solutionCommands.length === 0 || !initialState || !goalState || isRunning}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Running...' : 'Test Solution'}
          </Button>
        </div>

        {testResult && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-2 ${testResult.success ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'}`}>
              <div className="flex items-center gap-2 mb-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                )}
                <h3 className="font-semibold">
                  {testResult.success ? 'All Commands Executed' : 'Some Commands Failed'}
                </h3>
              </div>

              <div className="space-y-1 text-sm">
                {testResult.commandResults.map((result, index) => (
                  <div
                    key={index}
                    className={result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}
                  >
                    {index + 1}. {solutionCommands[index]}: {result.success ? '✓' : `✗ ${result.error}`}
                  </div>
                ))}
              </div>
            </div>

            {differences.length > 0 && (
              <div className="p-4 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950">
                <h3 className="font-semibold mb-2 text-red-700 dark:text-red-300">
                  State Differences
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                  The solution does not match the goal state:
                </p>
                <ul className="text-sm space-y-1">
                  {differences.map((diff, index) => (
                    <li key={index} className="text-red-700 dark:text-red-300">
                      • {diff.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {differences.length === 0 && testResult.success && (
              <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950">
                <h3 className="font-semibold text-green-700 dark:text-green-300">
                  ✓ Solution Verified
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  The solution commands successfully achieve the goal state!
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

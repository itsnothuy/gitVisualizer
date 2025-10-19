/**
 * Goal State Step  
 * Configure the target Git state for the level
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Copy } from 'lucide-react';
import type { GitStateSnapshot } from '@/tutorial/types';

interface GoalStateStepProps {
  goalState?: GitStateSnapshot;
  initialState?: GitStateSnapshot;
  onChange: (state: GitStateSnapshot) => void;
}

export function GoalStateStep({ goalState, initialState, onChange }: GoalStateStepProps) {
  const [jsonInput, setJsonInput] = React.useState('');

  const handleCopyFromInitial = () => {
    if (!initialState) {
      alert('Please configure the initial state first.');
      return;
    }
    onChange(JSON.parse(JSON.stringify(initialState)));
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      onChange(parsed as GitStateSnapshot);
      setJsonInput('');
    } catch (error) {
      alert(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLoadFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        onChange(parsed as GitStateSnapshot);
      } catch (error) {
        alert(`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goal State</CardTitle>
        <CardDescription>
          Configure the target Git state that users should achieve
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!goalState ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Choose how to create the goal state:
            </p>

            <div className="grid gap-4">
              <Button
                onClick={handleCopyFromInitial}
                variant="outline"
                disabled={!initialState}
                className="justify-start h-auto py-4"
              >
                <Copy className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Copy from Initial State</div>
                  <div className="text-sm text-muted-foreground">
                    Start with the initial state and modify it
                  </div>
                </div>
              </Button>

              <Button onClick={handleLoadFromFile} variant="outline" className="justify-start h-auto py-4">
                <Upload className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Import from File</div>
                  <div className="text-sm text-muted-foreground">
                    Load a saved state from JSON file
                  </div>
                </div>
              </Button>
            </div>

            <div className="pt-4 border-t">
              <label htmlFor="goal-json-input" className="block text-sm font-medium mb-2">
                Or paste JSON:
              </label>
              <textarea
                id="goal-json-input"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"commits": [...], "branches": [...], "tags": [], "head": {...}}'
                className="w-full px-3 py-2 border rounded-md font-mono text-sm min-h-[150px]"
              />
              <Button onClick={handleImportJson} disabled={!jsonInput.trim()} className="mt-2">
                Import JSON
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Goal State Configured</h3>
              <div className="text-sm space-y-1">
                <div>Commits: {goalState.commits.length}</div>
                <div>Branches: {goalState.branches.length}</div>
                <div>Tags: {goalState.tags.length}</div>
                <div>HEAD: {goalState.head.type === 'branch' ? `branch ${goalState.head.name}` : `detached at ${goalState.head.commit}`}</div>
              </div>
            </div>

            <div>
              <label htmlFor="goal-state-preview" className="block text-sm font-medium mb-2">
                Preview (JSON):
              </label>
              <textarea
                id="goal-state-preview"
                value={JSON.stringify(goalState, null, 2)}
                readOnly
                className="w-full px-3 py-2 border rounded-md font-mono text-xs min-h-[200px] bg-muted"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onChange(undefined as unknown as GitStateSnapshot)}>
                Change Goal State
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(goalState, null, 2));
                  alert('Copied to clipboard!');
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Copy JSON
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

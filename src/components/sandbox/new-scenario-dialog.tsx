/**
 * New Scenario Dialog
 * Allows users to create custom sandbox scenarios
 */

'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileJson } from 'lucide-react';
import type { GitStateSnapshot } from '@/tutorial/types';

interface NewScenarioDialogProps {
  onCreateScenario: (scenario: GitStateSnapshot, name: string) => void;
}

export function NewScenarioDialog({ onCreateScenario }: NewScenarioDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [scenarioType, setScenarioType] = React.useState<'blank' | 'custom'>('blank');
  const [name, setName] = React.useState('');
  const [jsonInput, setJsonInput] = React.useState('');
  const [error, setError] = React.useState('');

  const handleCreate = React.useCallback(() => {
    setError('');

    if (!name.trim()) {
      setError('Please enter a scenario name');
      return;
    }

    try {
      let scenario: GitStateSnapshot;

      if (scenarioType === 'blank') {
        // Create a blank scenario with one initial commit
        scenario = {
          commits: [
            {
              id: 'init',
              parents: [],
              message: 'Initial commit',
              timestamp: Date.now(),
            },
          ],
          branches: [{ name: 'main', target: 'init' }],
          tags: [],
          head: { type: 'branch', name: 'main' },
        };
      } else {
        // Parse custom JSON
        scenario = JSON.parse(jsonInput);

        // Basic validation
        if (!scenario.commits || !Array.isArray(scenario.commits)) {
          throw new Error('Invalid scenario: missing commits array');
        }
        if (!scenario.branches || !Array.isArray(scenario.branches)) {
          throw new Error('Invalid scenario: missing branches array');
        }
        if (!scenario.head) {
          throw new Error('Invalid scenario: missing head');
        }
      }

      onCreateScenario(scenario, name);
      setOpen(false);
      setName('');
      setJsonInput('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, [scenarioType, name, jsonInput, onCreateScenario]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Scenario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Scenario</DialogTitle>
          <DialogDescription>
            Start from a blank repository or create a custom scenario with pre-defined commits
            and branches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Scenario Name */}
          <div className="space-y-2">
            <Label htmlFor="scenario-name">Scenario Name</Label>
            <Input
              id="scenario-name"
              placeholder="e.g., Git Merge Practice"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Scenario Type */}
          <div className="space-y-2">
            <Label>Scenario Type</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={scenarioType === 'blank' ? 'default' : 'outline'}
                onClick={() => setScenarioType('blank')}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Blank Repository
              </Button>
              <Button
                type="button"
                variant={scenarioType === 'custom' ? 'default' : 'outline'}
                onClick={() => setScenarioType('custom')}
                className="flex-1"
              >
                <FileJson className="h-4 w-4 mr-2" />
                Custom JSON
              </Button>
            </div>
          </div>

          {/* Custom JSON Input */}
          {scenarioType === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="json-input">Scenario JSON</Label>
              <Textarea
                id="json-input"
                placeholder={`{
  "commits": [...],
  "branches": [...],
  "tags": [],
  "head": { "type": "branch", "name": "main" }
}`}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Paste a valid GitStateSnapshot JSON. See{' '}
                <a
                  href="/docs/SANDBOX.md#json-schema"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open JSON schema documentation in new tab"
                  className="underline"
                >
                  documentation
                </a>{' '}
                for schema details.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-md" role="alert">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Scenario</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

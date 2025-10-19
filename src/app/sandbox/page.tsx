/**
 * Sandbox Mode Page
 * Interactive sandbox with command execution, export/import, and sharing
 */

'use client';

import * as React from 'react';
import { GitEngine } from '@/cli/GitEngine';
import { CommandConsole, useCommandConsole } from '@/components/cli/CommandConsole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HistoryPanel } from '@/components/sandbox/history-panel';
import { NewScenarioDialog } from '@/components/sandbox/new-scenario-dialog';
import { SandboxSession } from '@/lib/sandbox/SandboxSession';
import { Download, Upload, Share2, RotateCcw, BookOpen } from 'lucide-react';
import { snapshotToState } from '@/tutorial/stateUtils';
import { generatePermalink, getStateFromCurrentURL } from '@/lib/sandbox/permalink';
import type { GitStateSnapshot } from '@/tutorial/types';

export default function SandboxPage() {
  // Initialize session
  const [session, setSession] = React.useState<SandboxSession | null>(null);
  const [showToast, setShowToast] = React.useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Initialize from URL or create new session
  React.useEffect(() => {
    const urlState = getStateFromCurrentURL();
    if (urlState) {
      const newSession = new SandboxSession({
        name: 'Imported from URL',
        initialState: snapshotToState(urlState),
      });
      setSession(newSession);
    } else {
      const newSession = new SandboxSession({
        name: 'New Sandbox Session',
      });
      setSession(newSession);
    }
  }, []);

  const initialState = React.useMemo(
    () => session?.getState() || GitEngine.createInitialState(),
    [session]
  );

  const { state, setState, context, locked } = useCommandConsole(initialState, true);

  // Sync state with session
  React.useEffect(() => {
    if (session) {
      session.setState(state);
    }
  }, [state, session]);

  // Export state as JSON file
  const handleExport = React.useCallback(() => {
    if (!session) return;

    try {
      const snapshot = session.exportState();
      const json = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sandbox-${session.getName()}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setShowToast({ message: 'State exported successfully!', type: 'success' });
    } catch (error) {
      setShowToast({
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    }
  }, [session]);

  // Import state from JSON file
  const handleImport = React.useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !session) return;

      try {
        const text = await file.text();
        const snapshot: GitStateSnapshot = JSON.parse(text);
        session.importState(snapshot);
        setState(session.getState());
        setShowToast({ message: 'State imported successfully!', type: 'success' });
      } catch (error) {
        setShowToast({
          message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error',
        });
      }
    };
    input.click();
  }, [session, setState]);

  // Generate shareable permalink
  const handleShare = React.useCallback(() => {
    if (!session) return;

    try {
      const snapshot = session.exportState({ stripMessages: false });
      const baseUrl = window.location.origin + window.location.pathname;
      const result = generatePermalink(snapshot, baseUrl);

      if (!result) {
        setShowToast({
          message: 'State too large for URL. Try exporting as JSON instead.',
          type: 'error',
        });
        return;
      }

      // Copy to clipboard
      navigator.clipboard.writeText(result.url);
      setShowToast({
        message: 'Share link copied to clipboard!',
        type: 'success',
      });
    } catch (error) {
      setShowToast({
        message: `Share failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    }
  }, [session]);

  // Handle new scenario creation
  const handleCreateScenario = React.useCallback(
    (scenario: GitStateSnapshot, name: string) => {
      if (!session) return;

      const newState = snapshotToState(scenario);
      session.setName(name);
      session.setState(newState);
      session.clearHistory(); // Clear history for fresh start
      setState(newState);
      setShowToast({ message: `Created scenario: ${name}`, type: 'success' });
    },
    [session, setState]
  );

  // Reset to initial state
  const handleReset = React.useCallback(() => {
    if (!session) return;

    if (confirm('Are you sure you want to reset the sandbox? This will clear all history.')) {
      session.reset();
      setState(session.getState());
      setShowToast({ message: 'Sandbox reset successfully!', type: 'success' });
    }
  }, [session, setState]);

  // Render branch info
  const renderBranches = () => {
    const branches = Array.from(state.branches.entries());
    const currentBranch = state.head.type === 'branch' ? state.head.name : null;

    return (
      <div className="space-y-1">
        {branches.map(([name, branch]) => (
          <div
            key={name}
            className={`text-sm font-mono ${
              name === currentBranch ? 'text-primary font-bold' : ''
            }`}
          >
            {name === currentBranch ? '* ' : '  '}
            {name} → {branch.target.slice(0, 7)}
          </div>
        ))}
      </div>
    );
  };

  // Render commit list
  const renderCommits = () => {
    const commits = Array.from(state.commits.values()).reverse();

    return (
      <div className="space-y-2">
        {commits.map((commit) => (
          <div key={commit.id} className="text-sm font-mono">
            <div className="text-primary font-semibold">{commit.id.slice(0, 7)}</div>
            <div className="text-foreground ml-2">{commit.message}</div>
            {commit.parents.length > 0 && (
              <div className="text-muted-foreground ml-2 text-xs">
                Parents: {commit.parents.map((p) => p.slice(0, 7)).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading sandbox...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sandbox Mode</h1>
          <p className="text-muted-foreground mt-2">
            Interactive Git sandbox with live command execution and state management
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <NewScenarioDialog onCreateScenario={handleCreateScenario} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const snapshot = session.exportState();
              const url = `/build-level?from=sandbox&state=${encodeURIComponent(JSON.stringify(snapshot))}`;
              window.location.href = url;
            }}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Create Level
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div
          className={`p-4 rounded-md ${
            showToast.type === 'success'
              ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200'
          }`}
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium">{showToast.message}</p>
          <button
            className="mt-2 text-xs underline"
            onClick={() => setShowToast(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Command Console + History */}
        <div className="lg:col-span-2 space-y-6">
          <CommandConsole
            onStateChange={setState}
            context={context}
            locked={locked}
          />

          <HistoryPanel session={session} />
        </div>

        {/* Right column: State visualization */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branches</CardTitle>
            </CardHeader>
            <CardContent>{renderBranches()}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commits ({state.commits.size})</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              {renderCommits()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>HEAD Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm">
                {state.head.type === 'branch' ? (
                  <div>
                    On branch{' '}
                    <span className="text-primary font-bold">{state.head.name}</span>
                  </div>
                ) : (
                  <div>
                    Detached HEAD at{' '}
                    <span className="text-primary font-bold">
                      {state.head.commit.slice(0, 7)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Command Console Demo Page
 * Demonstrates the interactive Git command system
 */

'use client';

import * as React from 'react';
import { CommandConsole, useCommandConsole } from '@/components/cli/CommandConsole';
import { GitEngine } from '@/cli/GitEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CommandDemoPage() {
  const initialState = React.useMemo(() => GitEngine.createInitialState(), []);
  const { state, setState, context, locked } = useCommandConsole(initialState, true);

  // Helper to render branch info
  const renderBranches = () => {
    const branches = Array.from(state.branches.entries());
    const currentBranch =
      state.head.type === 'branch' ? state.head.name : null;

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

  // Helper to render commit graph
  const renderCommits = () => {
    const commits = Array.from(state.commits.values()).reverse();

    return (
      <div className="space-y-2">
        {commits.map((commit) => (
          <div key={commit.id} className="text-sm font-mono">
            <div className="text-primary font-semibold">
              {commit.id.slice(0, 7)}
            </div>
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Command Console Demo</h1>
        <p className="text-muted-foreground">
          Interactive Git command system with full undo/redo support. Try
          commands like:
        </p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>
            <code className="text-sm bg-muted px-1 rounded">
              commit -m &ldquo;Your message&rdquo;
            </code>
          </li>
          <li>
            <code className="text-sm bg-muted px-1 rounded">
              branch feature
            </code>
          </li>
          <li>
            <code className="text-sm bg-muted px-1 rounded">
              checkout feature
            </code>
          </li>
          <li>
            <code className="text-sm bg-muted px-1 rounded">merge main</code>
          </li>
          <li>
            <code className="text-sm bg-muted px-1 rounded">undo</code> /{' '}
            <code className="text-sm bg-muted px-1 rounded">redo</code>
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Command Console */}
        <div className="lg:col-span-2">
          <CommandConsole
            onStateChange={setState}
            context={context}
            locked={locked}
          />
        </div>

        {/* State Visualization */}
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>HEAD Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm">
              {state.head.type === 'branch' ? (
                <div>
                  On branch{' '}
                  <span className="text-primary font-bold">
                    {state.head.name}
                  </span>
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
  );
}

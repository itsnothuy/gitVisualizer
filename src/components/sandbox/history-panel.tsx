/**
 * History Panel Component
 * Displays undo/redo history with step navigation
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2 } from 'lucide-react';
import type { SandboxSession } from '@/lib/sandbox/SandboxSession';

interface HistoryPanelProps {
  session: SandboxSession;
}

export function HistoryPanel({ session }: HistoryPanelProps) {
  const [historyInfo, setHistoryInfo] = React.useState(session.getHistoryInfo());

  // Update history info when session changes
  React.useEffect(() => {
    const interval = setInterval(() => {
      setHistoryInfo(session.getHistoryInfo());
    }, 100);

    return () => clearInterval(interval);
  }, [session]);

  const handleUndo = React.useCallback(() => {
    const result = session.undo();
    if (result.success) {
      setHistoryInfo(session.getHistoryInfo());
      // Trigger re-render of parent
      window.dispatchEvent(new CustomEvent('sandbox-state-change'));
    }
  }, [session]);

  const handleRedo = React.useCallback(() => {
    const result = session.redo();
    if (result.success) {
      setHistoryInfo(session.getHistoryInfo());
      // Trigger re-render of parent
      window.dispatchEvent(new CustomEvent('sandbox-state-change'));
    }
  }, [session]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>History</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!historyInfo.canUndo}
              aria-label="Undo last command"
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Undo ({historyInfo.undoCount})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!historyInfo.canRedo}
              aria-label="Redo last undone command"
            >
              <Redo2 className="h-4 w-4 mr-2" />
              Redo ({historyInfo.redoCount})
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {historyInfo.lastCommand && (
            <div className="text-sm">
              <span className="text-muted-foreground">Last command:</span>{' '}
              <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                {historyInfo.lastCommand}
              </code>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Undo available:</span>{' '}
              <span className="font-semibold">{historyInfo.undoCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Redo available:</span>{' '}
              <span className="font-semibold">{historyInfo.redoCount}</span>
            </div>
          </div>

          {!historyInfo.canUndo && !historyInfo.canRedo && (
            <p className="text-sm text-muted-foreground italic">
              No history available. Execute some commands to build history.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

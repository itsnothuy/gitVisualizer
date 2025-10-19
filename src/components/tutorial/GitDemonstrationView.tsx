/**
 * GitDemonstrationView Component
 * Shows a Git command demonstration with before/after visualization
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { DemonstrationTutorialStep } from '@/tutorial/types';

export interface GitDemonstrationViewProps {
  /** Demonstration step to display */
  step: DemonstrationTutorialStep;
  /** Current locale */
  locale?: string;
  /** Whether dialog is open */
  open: boolean;
  /** Callback when demonstration is complete */
  onComplete?: () => void;
  /** Callback when dialog is closed */
  onClose?: () => void;
}

/**
 * Render markdown-like text (simplified)
 */
function renderText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * GitDemonstrationView component
 */
export function GitDemonstrationView({
  step,
  locale = 'en_US',
  open,
  onComplete,
  onClose,
}: GitDemonstrationViewProps) {
  const [stage, setStage] = React.useState<'before' | 'demo' | 'after'>('before');

  const beforeText = step.beforeText[locale] || step.beforeText['en_US'] || [];
  const afterText = step.afterText[locale] || step.afterText['en_US'] || [];

  React.useEffect(() => {
    if (!open) {
      setStage('before');
    }
  }, [open]);

  const handleRunDemo = () => {
    setStage('demo');
    // Simulate running the command
    setTimeout(() => {
      setStage('after');
    }, 1000);
  };

  const handleComplete = () => {
    setStage('before');
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent
        className="sm:max-w-2xl"
        aria-describedby="demo-description"
      >
        <DialogHeader>
          <DialogTitle id="demo-title">Git Demonstration</DialogTitle>
          <DialogDescription id="demo-description" className="sr-only">
            Watch how a Git command works
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4" role="document">
          {stage === 'before' && (
            <>
              {beforeText.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed">
                  {renderText(paragraph)}
                </p>
              ))}
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="font-mono text-sm">
                  $ {step.demonstrationCommand}
                </p>
              </div>
            </>
          )}

          {stage === 'demo' && (
            <div className="flex items-center justify-center py-8">
              <div
                className="inline-block size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
                role="status"
                aria-label="Running command"
              />
            </div>
          )}

          {stage === 'after' && (
            <>
              <div className="rounded-lg border bg-success/10 p-4">
                <p className="font-mono text-sm text-success">
                  ✓ Command executed successfully
                </p>
              </div>
              {afterText.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed">
                  {renderText(paragraph)}
                </p>
              ))}
            </>
          )}
        </div>

        <DialogFooter>
          {stage === 'before' && (
            <Button onClick={handleRunDemo} aria-label="Run demonstration">
              Run Demo
            </Button>
          )}
          {stage === 'after' && (
            <Button onClick={handleComplete} aria-label="Continue">
              Continue
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

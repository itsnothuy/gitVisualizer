/**
 * TutorialDialog Component
 * Modal dialog for displaying tutorial content and instructions
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
import type { DialogTutorialStep } from '@/tutorial/types';

export interface TutorialDialogProps {
  /** Tutorial step to display */
  step: DialogTutorialStep;
  /** Current locale */
  locale?: string;
  /** Whether dialog is open */
  open: boolean;
  /** Callback when user wants to proceed */
  onNext?: () => void;
  /** Callback when user wants to go back */
  onPrev?: () => void;
  /** Whether there's a previous step */
  canGoPrev?: boolean;
  /** Whether there's a next step */
  canGoNext?: boolean;
  /** Callback when dialog is closed */
  onClose?: () => void;
}

/**
 * Render markdown-like text (simplified - just handles bold for now)
 */
function renderText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * TutorialDialog component
 */
export function TutorialDialog({
  step,
  locale = 'en_US',
  open,
  onNext,
  onPrev,
  canGoPrev = false,
  canGoNext = true,
  onClose,
}: TutorialDialogProps) {
  const title = step.title[locale] || step.title['en_US'] || 'Tutorial';
  const content = step.content[locale] || step.content['en_US'] || [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent
        className="sm:max-w-2xl"
        aria-describedby="tutorial-description"
      >
        <DialogHeader>
          <DialogTitle id="tutorial-title">{title}</DialogTitle>
          <DialogDescription id="tutorial-description" className="sr-only">
            Tutorial step instructions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4" role="document">
          {content.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {renderText(paragraph)}
            </p>
          ))}
        </div>

        <DialogFooter className="gap-2">
          {canGoPrev && (
            <Button
              variant="outline"
              onClick={onPrev}
              aria-label="Go to previous step"
            >
              Previous
            </Button>
          )}
          {canGoNext && (
            <Button onClick={onNext} aria-label="Go to next step">
              Next
            </Button>
          )}
          {!canGoNext && (
            <Button onClick={onClose} aria-label="Close tutorial">
              Got it!
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

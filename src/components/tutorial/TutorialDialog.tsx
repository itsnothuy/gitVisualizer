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
import { useTranslation, useLocalizedContent } from '@/lib/i18n';
import type { DialogTutorialStep } from '@/tutorial/types';

export interface TutorialDialogProps {
  /** Tutorial step to display */
  step: DialogTutorialStep;
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
  open,
  onNext,
  onPrev,
  canGoPrev = false,
  canGoNext = true,
  onClose,
}: TutorialDialogProps) {
  const { t } = useTranslation();
  const title = useLocalizedContent(step.title);
  const content = useLocalizedContent(step.content);

  // Ensure content is an array
  const contentArray = Array.isArray(content) ? content : [content];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent
        className="sm:max-w-2xl"
        aria-describedby="tutorial-description"
      >
        <DialogHeader>
          <DialogTitle id="tutorial-title">{title}</DialogTitle>
          <DialogDescription id="tutorial-description" className="sr-only">
            {t('tutorial.dialog.ariaDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4" role="document">
          {contentArray.map((paragraph, i) => (
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
              aria-label={t('tutorial.dialog.previousStep')}
            >
              {t('common.previous')}
            </Button>
          )}
          {canGoNext && (
            <Button onClick={onNext} aria-label={t('tutorial.dialog.nextStep')}>
              {t('common.next')}
            </Button>
          )}
          {!canGoNext && (
            <Button onClick={onClose} aria-label={t('tutorial.dialog.closeTutorial')}>
              {t('common.gotIt')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

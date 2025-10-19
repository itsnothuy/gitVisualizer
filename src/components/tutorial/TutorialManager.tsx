/**
 * TutorialManager Component
 * Main component that orchestrates the tutorial experience
 */

'use client';

import * as React from 'react';
import { TutorialDialog } from './TutorialDialog';
import { GitDemonstrationView } from './GitDemonstrationView';
import { TutorialEngine } from '@/tutorial/TutorialEngine';
import type {
  TutorialStep,
  DialogTutorialStep,
  DemonstrationTutorialStep,
  ChallengeTutorialStep,
} from '@/tutorial/types';
import type { GitState } from '@/cli/types';

export interface TutorialManagerProps {
  /** Tutorial engine instance */
  engine: TutorialEngine;
  /** Current locale */
  locale?: string;
  /** Callback when user state changes */
  onUserStateChange?: (state: GitState) => void;
}

/**
 * TutorialManager component
 */
export function TutorialManager({
  engine,
  locale = 'en_US',
  onUserStateChange,
}: TutorialManagerProps) {
  const [currentStep, setCurrentStep] = React.useState<TutorialStep | null>(null);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [totalSteps, setTotalSteps] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);

  // Subscribe to engine state changes
  React.useEffect(() => {
    const unsubscribe = engine.subscribe((state) => {
      if (state.active && state.currentLevel) {
        const step = engine.getCurrentStep();
        setCurrentStep(step);
        setStepIndex(state.currentStepIndex);
        setTotalSteps(state.currentLevel.tutorialSteps.length);
        setIsOpen(!!step);

        // Notify parent of state changes
        if (onUserStateChange) {
          onUserStateChange(state.userState);
        }
      } else {
        setIsOpen(false);
        setCurrentStep(null);
      }
    });

    return unsubscribe;
  }, [engine, onUserStateChange]);

  const handleNext = () => {
    const hasNext = engine.next();
    if (!hasNext) {
      // Last step completed
      setIsOpen(false);
    }
  };

  const handlePrev = () => {
    engine.prev();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const canGoPrev = stepIndex > 0;
  const canGoNext = stepIndex < totalSteps - 1;

  if (!currentStep) {
    return null;
  }

  // Render appropriate step component
  if (currentStep.type === 'dialog') {
    return (
      <TutorialDialog
        step={currentStep as DialogTutorialStep}
        open={isOpen}
        onNext={handleNext}
        onPrev={handlePrev}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onClose={handleClose}
      />
    );
  }

  if (currentStep.type === 'demonstration') {
    return (
      <GitDemonstrationView
        step={currentStep as DemonstrationTutorialStep}
        locale={locale}
        open={isOpen}
        onComplete={handleNext}
        onClose={handleClose}
      />
    );
  }

  if (currentStep.type === 'challenge') {
    // Challenge step - instructions shown, user works in console
    const challengeStep = currentStep as ChallengeTutorialStep;
    const instructions = challengeStep.instructions[locale] || challengeStep.instructions['en_US'] || [];

    return (
      <TutorialDialog
        step={{
          type: 'dialog',
          id: challengeStep.id,
          title: { [locale]: 'Your Turn!' },
          content: { [locale]: instructions },
        }}
        open={isOpen}
        onNext={handleClose}
        canGoPrev={canGoPrev}
        canGoNext={false}
        onClose={handleClose}
      />
    );
  }

  return null;
}

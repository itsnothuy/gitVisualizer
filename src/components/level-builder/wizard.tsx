/**
 * Level Builder Wizard
 * Multi-step wizard for creating tutorial levels
 */

'use client';

import * as React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import type { Level } from '@/tutorial/types';
import { validateLevel } from '@/lib/level-builder/validation';
import { downloadLevel, generateLevelShareURL } from '@/lib/level-builder/serialization';
import { verifySolution } from '@/lib/level-builder/solution-runner';
import { MetadataStep } from './steps/metadata-step';
import { InitialStateStep } from './steps/initial-state-step';
import { GoalStateStep } from './steps/goal-state-step';
import { SolutionStep } from './steps/solution-step';
import { TutorialStepsEditor } from './steps/tutorial-steps-step';
import { ValidationStep } from './steps/validation-step';

interface WizardProps {
  initialLevel?: Level | null;
  onClose?: () => void;
}

const STEPS = [
  { id: 'metadata', label: 'Metadata', description: 'Basic level information' },
  { id: 'initial', label: 'Initial State', description: 'Starting Git state' },
  { id: 'goal', label: 'Goal State', description: 'Target Git state' },
  { id: 'solution', label: 'Solution', description: 'Solution commands' },
  { id: 'tutorial', label: 'Tutorial', description: 'Tutorial steps and hints' },
  { id: 'validate', label: 'Validate', description: 'Review and test' },
] as const;

type StepId = typeof STEPS[number]['id'];

export function LevelBuilderWizard({ initialLevel, onClose }: WizardProps) {
  const [currentStep, setCurrentStep] = React.useState<StepId>('metadata');
  const [level, setLevel] = React.useState<Partial<Level>>(
    initialLevel || {
      id: '',
      name: { en_US: '' },
      description: { en_US: '' },
      difficulty: 'intro',
      order: 1,
      tutorialSteps: [],
      solutionCommands: [],
      hints: [],
    }
  );

  const [validationResult, setValidationResult] = React.useState<ReturnType<typeof validateLevel> | null>(null);
  const [solutionVerification, setSolutionVerification] = React.useState<Awaited<ReturnType<typeof verifySolution>> | null>(null);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleNext = React.useCallback(() => {
    if (!isLastStep) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  }, [currentStepIndex, isLastStep]);

  const handlePrevious = React.useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  }, [currentStepIndex, isFirstStep]);

  const handleStepClick = React.useCallback((stepId: StepId) => {
    setCurrentStep(stepId);
  }, []);

  const updateLevel = React.useCallback((updates: Partial<Level>) => {
    setLevel((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleExport = React.useCallback(() => {
    if (!level.id) {
      alert('Please complete at least the metadata step before exporting.');
      return;
    }
    downloadLevel(level as Level);
  }, [level]);

  const handleShare = React.useCallback(() => {
    if (!level.id) {
      alert('Please complete at least the metadata step before sharing.');
      return;
    }

    const baseUrl = `${window.location.origin}/build-level`;
    const url = generateLevelShareURL(level as Level, baseUrl);

    if (!url) {
      alert('Level is too large to share via URL. Please use the export feature instead.');
      return;
    }

    navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard!');
  }, [level]);

  const handleValidate = React.useCallback(async () => {
    const result = validateLevel(level);
    setValidationResult(result);

    if (result.valid && level.initialState && level.goalState && level.solutionCommands) {
      try {
        const verification = await verifySolution(
          level.initialState,
          level.goalState,
          level.solutionCommands
        );
        setSolutionVerification(verification);
      } catch (error) {
        console.error('Solution verification failed:', error);
      }
    }
  }, [level]);

  // Run validation when entering validation step
  React.useEffect(() => {
    if (currentStep === 'validate') {
      handleValidate();
    }
  }, [currentStep, handleValidate]);

  const renderStep = () => {
    switch (currentStep) {
      case 'metadata':
        return (
          <MetadataStep
            level={level}
            onChange={updateLevel}
          />
        );
      case 'initial':
        return (
          <InitialStateStep
            initialState={level.initialState}
            onChange={(state) => updateLevel({ initialState: state })}
          />
        );
      case 'goal':
        return (
          <GoalStateStep
            goalState={level.goalState}
            initialState={level.initialState}
            onChange={(state) => updateLevel({ goalState: state })}
          />
        );
      case 'solution':
        return (
          <SolutionStep
            solutionCommands={level.solutionCommands || []}
            initialState={level.initialState}
            goalState={level.goalState}
            onChange={(commands) => updateLevel({ solutionCommands: commands })}
          />
        );
      case 'tutorial':
        return (
          <TutorialStepsEditor
            tutorialSteps={level.tutorialSteps || []}
            hints={level.hints || []}
            onChange={(steps, hints) => updateLevel({ tutorialSteps: steps, hints })}
          />
        );
      case 'validate':
        return (
          <ValidationStep
            level={level}
            validationResult={validationResult}
            solutionVerification={solutionVerification}
            onRevalidate={handleValidate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Level Builder</CardTitle>
              <CardDescription>
                {level.name?.en_US || 'Create a new tutorial level'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step indicators */}
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => handleStepClick(step.id)}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                currentStep === step.id
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
              aria-label={`Step ${index + 1}: ${step.label}`}
              aria-current={currentStep === step.id ? 'step' : undefined}
            >
              <div className="text-xs font-medium text-muted-foreground">
                Step {index + 1}
              </div>
              <div className="text-sm font-semibold mt-1">{step.label}</div>
            </button>
            {index < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current step content */}
      <div className="min-h-[400px]">{renderStep()}</div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep}
          aria-label="Previous step"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLastStep}
          aria-label="Next step"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

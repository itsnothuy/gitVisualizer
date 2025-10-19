/**
 * Tutorial Steps Editor
 * Edit tutorial steps and hints
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, MessageSquare, Play as Demo, Target } from 'lucide-react';
import type { TutorialStep, LocalizedContentArray } from '@/tutorial/types';

interface TutorialStepsEditorProps {
  tutorialSteps: TutorialStep[];
  hints: LocalizedContentArray[];
  onChange: (steps: TutorialStep[], hints: LocalizedContentArray[]) => void;
}

export function TutorialStepsEditor({ tutorialSteps, hints, onChange }: TutorialStepsEditorProps) {
  const handleAddStep = (type: TutorialStep['type']) => {
    let newStep: TutorialStep;
    const stepId = `step-${Date.now()}`;

    switch (type) {
      case 'dialog':
        newStep = {
          type: 'dialog',
          id: stepId,
          title: { en_US: '' },
          content: { en_US: [''] },
        };
        break;
      case 'demonstration':
        newStep = {
          type: 'demonstration',
          id: stepId,
          beforeText: { en_US: [''] },
          setupCommands: [],
          demonstrationCommand: '',
          afterText: { en_US: [''] },
        };
        break;
      case 'challenge':
        newStep = {
          type: 'challenge',
          id: stepId,
          instructions: { en_US: [''] },
          hints: [],
        };
        break;
    }

    onChange([...tutorialSteps, newStep], hints);
  };

  const handleRemoveStep = (index: number) => {
    onChange(
      tutorialSteps.filter((_, i) => i !== index),
      hints
    );
  };

  const handleAddHint = () => {
    onChange(tutorialSteps, [...hints, { en_US: [''] }]);
  };

  const handleRemoveHint = (index: number) => {
    onChange(
      tutorialSteps,
      hints.filter((_, i) => i !== index)
    );
  };

  const handleHintChange = (index: number, value: string) => {
    const updated = [...hints];
    updated[index] = { en_US: [value] };
    onChange(tutorialSteps, updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tutorial Steps & Hints</CardTitle>
        <CardDescription>
          Guide users through the level with instructions and hints
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Tutorial Steps</Label>
            <div className="flex gap-2">
              <Button
                onClick={() => handleAddStep('dialog')}
                size="sm"
                variant="outline"
                title="Add Dialog Step"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Dialog
              </Button>
              <Button
                onClick={() => handleAddStep('demonstration')}
                size="sm"
                variant="outline"
                title="Add Demonstration Step"
              >
                <Demo className="h-4 w-4 mr-2" />
                Demo
              </Button>
              <Button
                onClick={() => handleAddStep('challenge')}
                size="sm"
                variant="outline"
                title="Add Challenge Step"
              >
                <Target className="h-4 w-4 mr-2" />
                Challenge
              </Button>
            </div>
          </div>

          {tutorialSteps.length === 0 && (
            <p className="text-sm text-muted-foreground p-4 border rounded-lg">
              No tutorial steps added yet. Add at least one challenge step to let users
              complete the level.
            </p>
          )}

          {tutorialSteps.map((step, index) => (
            <div key={step.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {step.type === 'dialog' && <MessageSquare className="h-4 w-4" />}
                  {step.type === 'demonstration' && <Demo className="h-4 w-4" />}
                  {step.type === 'challenge' && <Target className="h-4 w-4" />}
                  <span className="font-semibold capitalize">
                    {step.type} Step {index + 1}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveStep(index)}
                  aria-label={`Remove step ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm space-y-2">
                <div>
                  <Label htmlFor={`step-${index}-id`}>Step ID</Label>
                  <input
                    id={`step-${index}-id`}
                    type="text"
                    value={step.id}
                    readOnly
                    className="w-full px-2 py-1 border rounded text-xs font-mono bg-muted"
                  />
                </div>

                {step.type === 'dialog' && (
                  <>
                    <div>
                      <Label htmlFor={`step-${index}-title`}>Title (English)</Label>
                      <input
                        id={`step-${index}-title`}
                        type="text"
                        value={step.title.en_US}
                        readOnly
                        placeholder="Enter title..."
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`step-${index}-content`}>Content (English)</Label>
                      <textarea
                        id={`step-${index}-content`}
                        value={step.content.en_US.join('\n')}
                        readOnly
                        placeholder="Enter content..."
                        className="w-full px-2 py-1 border rounded text-sm min-h-[60px]"
                      />
                    </div>
                  </>
                )}

                {step.type === 'demonstration' && (
                  <>
                    <div>
                      <Label htmlFor={`step-${index}-command`}>Demo Command</Label>
                      <input
                        id={`step-${index}-command`}
                        type="text"
                        value={step.demonstrationCommand}
                        readOnly
                        placeholder="e.g., git commit"
                        className="w-full px-2 py-1 border rounded text-sm font-mono"
                      />
                    </div>
                  </>
                )}

                {step.type === 'challenge' && (
                  <div>
                    <Label htmlFor={`step-${index}-instructions`}>Instructions (English)</Label>
                    <textarea
                      id={`step-${index}-instructions`}
                      value={step.instructions.en_US.join('\n')}
                      readOnly
                      placeholder="Enter instructions..."
                      className="w-full px-2 py-1 border rounded text-sm min-h-[60px]"
                    />
                  </div>
                )}

                <p className="text-xs text-muted-foreground italic">
                  Note: Full editing of tutorial steps is coming soon. For now, you can add/remove steps
                  and edit them after export.
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center justify-between">
            <Label>Hints</Label>
            <Button onClick={handleAddHint} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Hint
            </Button>
          </div>

          {hints.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hints added yet. Hints help users when they get stuck.
            </p>
          )}

          <div className="space-y-2">
            {hints.map((hint, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-sm text-muted-foreground min-w-[30px] mt-2">
                  {index + 1}.
                </span>
                <textarea
                  value={hint.en_US[0] || ''}
                  onChange={(e) => handleHintChange(index, e.target.value)}
                  placeholder="Enter hint text..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm min-h-[60px]"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveHint(index)}
                  aria-label={`Remove hint ${index + 1}`}
                  className="mt-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

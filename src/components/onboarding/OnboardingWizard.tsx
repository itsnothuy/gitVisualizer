"use client";

/**
 * Onboarding Wizard Component
 * 
 * A 3-step guided first-run experience:
 * 1. Welcome + Choose ingestion method
 * 2. Privacy pledge and security guarantees
 * 3. Feature overview (graph navigation, time travel)
 * 
 * WCAG 2.2 AA compliant with keyboard navigation and screen reader support.
 */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  GitBranchIcon,
  ClockIcon,
  EyeIcon,
  BookOpenIcon,
} from "lucide-react";
import { BrowserSupportMatrix } from "./BrowserSupportMatrix";

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function OnboardingWizard({
  open,
  onOpenChange,
  onComplete,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps = [
    {
      title: "Welcome to Git Visualizer",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Git Visualizer helps you understand your repository history with
            an interactive, accessible commit graph. Let&apos;s get you started!
          </p>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Getting Started</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-md">
                <BookOpenIcon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Try a Sample</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Load a pre-built sample repository to explore features without
                    needing your own files
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted rounded-md">
                <GitBranchIcon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Open Your Repository</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Load a local Git repository from your computer using one of
                    three methods based on your browser
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-semibold mb-2">Browser Support</h3>
            <BrowserSupportMatrix />
          </div>
        </div>
      ),
    },
    {
      title: "Privacy & Security",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-md">
            <ShieldCheckIcon
              className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                Privacy-First by Design
              </p>
              <p className="text-sm text-green-800 dark:text-green-200">
                All repository processing happens entirely in your browser.
                Your data never leaves your device.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircleIcon
                className="h-5 w-5 text-primary shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">No Data Upload</p>
                <p className="text-xs text-muted-foreground">
                  Repository files are never sent to any server. All processing
                  is local to your browser.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircleIcon
                className="h-5 w-5 text-primary shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">Read-Only Access</p>
                <p className="text-xs text-muted-foreground">
                  We only read your repository. We never modify, delete, or
                  write to your files.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircleIcon
                className="h-5 w-5 text-primary shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">Disconnect Anytime</p>
                <p className="text-xs text-muted-foreground">
                  You can close or disconnect at any time. No persistent
                  connections or background processes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircleIcon
                className="h-5 w-5 text-primary shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">Secure by Default</p>
                <p className="text-xs text-muted-foreground">
                  HTTPS required, strict Content Security Policy, and OWASP
                  security headers protect your data.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs text-muted-foreground border-t">
            <p>
              For more details, see our{" "}
              <a
                href="https://github.com/itsnothuy/gitVisualizer#security"
                className="underline hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                Security Documentation
              </a>
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Key Features",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Here&apos;s what you can do with Git Visualizer:
          </p>

          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 border rounded-md">
              <GitBranchIcon
                className="h-5 w-5 shrink-0 mt-0.5 text-primary"
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Interactive Commit Graph</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Explore your repository&apos;s history as a visual DAG with
                  branches, merges, and tags clearly displayed.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-md">
              <ClockIcon
                className="h-5 w-5 shrink-0 mt-0.5 text-primary"
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Pan & Zoom Navigation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use your mouse or keyboard to navigate large graphs. Full
                  keyboard support with Tab and Arrow keys.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-md">
              <EyeIcon
                className="h-5 w-5 shrink-0 mt-0.5 text-primary"
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Commit Details</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click on any commit to view its details, changes, and
                  relationships to other commits.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-md">
              <CheckCircleIcon
                className="h-5 w-5 shrink-0 mt-0.5 text-primary"
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Fully Accessible</p>
                <p className="text-xs text-muted-foreground mt-1">
                  WCAG 2.2 AA compliant with screen reader support, keyboard
                  navigation, and color-independent design.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Ready to start?</p>
            <p className="text-xs text-muted-foreground">
              Click &quot;Get Started&quot; to begin exploring Git repositories
              visually!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{steps[currentStep].title}</DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {steps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4" role="region" aria-label="Onboarding content">
          {steps[currentStep].content}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 w-2 rounded-full transition-colors ${
                idx === currentStep
                  ? "bg-primary"
                  : idx < currentStep
                    ? "bg-primary/50"
                    : "bg-muted"
              }`}
              role="presentation"
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSkip}
            size="sm"
          >
            Skip Tutorial
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              size="sm"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              Previous
            </Button>

            <Button onClick={handleNext} size="sm">
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-1" aria-hidden="true" />
                </>
              ) : (
                <>
                  Get Started
                  <CheckCircleIcon className="h-4 w-4 ml-1" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

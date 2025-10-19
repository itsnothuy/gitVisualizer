/**
 * Level Builder Page
 * Create and edit custom tutorial levels
 */

'use client';

import * as React from 'react';
import { LevelBuilderWizard } from '@/components/level-builder/wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Upload, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Level } from '@/tutorial/types';
import { importLevelFromFile, parseLevelFromURL } from '@/lib/level-builder';

function BuildLevelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [importedLevel, setImportedLevel] = React.useState<Level | null>(null);
  const [showWizard, setShowWizard] = React.useState(false);

  // Check for level or state in URL
  React.useEffect(() => {
    const levelParam = searchParams.get('level');
    const stateParam = searchParams.get('state');
    const fromSandbox = searchParams.get('from') === 'sandbox';
    
    if (levelParam) {
      try {
        const level = parseLevelFromURL(window.location.href);
        if (level) {
          setImportedLevel(level);
          setShowWizard(true);
        }
      } catch (error) {
        console.error('Failed to parse level from URL:', error);
      }
    } else if (stateParam && fromSandbox) {
      // Start new level with initial state from sandbox
      setShowWizard(true);
    }
  }, [searchParams]);

  const handleImport = React.useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const { level } = await importLevelFromFile(file);
        setImportedLevel(level);
        setShowWizard(true);
      } catch (error) {
        alert(
          `Failed to import level: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    };
    input.click();
  }, []);

  const handleStartNew = React.useCallback(() => {
    setImportedLevel(null);
    setShowWizard(true);
  }, []);

  const handleBack = React.useCallback(() => {
    if (confirm('Are you sure you want to leave? Unsaved changes will be lost.')) {
      router.push('/sandbox');
    }
  }, [router]);

  if (showWizard) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sandbox
          </Button>
        </div>
        <LevelBuilderWizard
          initialLevel={importedLevel}
          onClose={() => setShowWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Level Builder</h1>
          <p className="text-lg text-muted-foreground">
            Create custom tutorial levels to teach Git concepts
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Start New Level
              </CardTitle>
              <CardDescription>
                Create a new tutorial level from scratch with a step-by-step wizard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleStartNew} className="w-full">
                Create New Level
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Level
              </CardTitle>
              <CardDescription>
                Load an existing level file to edit or customize
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleImport} variant="outline" className="w-full">
                Import from JSON
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Learn how to create effective tutorial levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Define Your Goal</h3>
              <p className="text-sm text-muted-foreground">
                What Git concept do you want to teach? Start with a clear learning objective.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Set Up States</h3>
              <p className="text-sm text-muted-foreground">
                Create an initial Git state and define the goal state the user should achieve.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Write Tutorial Steps</h3>
              <p className="text-sm text-muted-foreground">
                Guide users with dialog, demonstration, and challenge steps.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">4. Test Your Level</h3>
              <p className="text-sm text-muted-foreground">
                Verify that your solution commands work and achieve the goal state.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">5. Share</h3>
              <p className="text-sm text-muted-foreground">
                Export your level as JSON or generate a shareable URL.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push('/sandbox')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sandbox
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BuildLevelPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-96"><p className="text-muted-foreground">Loading...</p></div>}>
      <BuildLevelContent />
    </React.Suspense>
  );
}

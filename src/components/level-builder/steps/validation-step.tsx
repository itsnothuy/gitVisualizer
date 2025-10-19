/**
 * Validation Step
 * Review and test the complete level
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, AlertTriangle, Download, Share2 } from 'lucide-react';
import type { Level } from '@/tutorial/types';
import type { LevelValidationResult } from '@/lib/level-builder/validation';
import type { verifySolution } from '@/lib/level-builder/solution-runner';
import { downloadLevel, generateLevelShareURL } from '@/lib/level-builder/serialization';

interface ValidationStepProps {
  level: Partial<Level>;
  validationResult: LevelValidationResult | null;
  solutionVerification: Awaited<ReturnType<typeof verifySolution>> | null;
  onRevalidate: () => void;
}

export function ValidationStep({
  level,
  validationResult,
  solutionVerification,
  onRevalidate,
}: ValidationStepProps) {
  const handleExport = () => {
    if (!level.id) {
      alert('Cannot export: Level ID is missing');
      return;
    }
    downloadLevel(level as Level);
  };

  const handleShare = () => {
    if (!level.id) {
      alert('Cannot share: Level ID is missing');
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
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Validation Results</CardTitle>
          <CardDescription>Review the level for any issues before sharing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={onRevalidate} variant="outline" className="w-full">
            Re-run Validation
          </Button>

          {!validationResult && (
            <p className="text-muted-foreground text-center py-8">
              Click &quot;Re-run Validation&quot; to check your level
            </p>
          )}

          {validationResult && (
            <div className="space-y-4">
              {/* Overall Status */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  validationResult.valid
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-red-500 bg-red-50 dark:bg-red-950'
                }`}
              >
                <div className="flex items-center gap-2">
                  {validationResult.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                  <h3 className="font-semibold">
                    {validationResult.valid
                      ? 'Level is Valid ✓'
                      : `${validationResult.errors.length} Error(s) Found`}
                  </h3>
                </div>
              </div>

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-700 dark:text-red-300">Errors</h4>
                  <div className="space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="p-3 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-red-900 dark:text-red-100">
                              {error.field}
                            </div>
                            <div className="text-sm text-red-700 dark:text-red-300">
                              {error.message}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">
                    Warnings
                  </h4>
                  <div className="space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <div
                        key={index}
                        className="p-3 rounded bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800"
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                              {warning.field}
                            </div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">
                              {warning.message}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Solution Verification */}
          {solutionVerification && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3">Solution Verification</h4>
              <div
                className={`p-4 rounded-lg border-2 ${
                  solutionVerification.valid
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-red-500 bg-red-50 dark:bg-red-950'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {solutionVerification.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                  <h3 className="font-semibold">
                    {solutionVerification.valid
                      ? 'Solution Achieves Goal State ✓'
                      : 'Solution Does Not Match Goal State'}
                  </h3>
                </div>

                {solutionVerification.differences.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-medium">Differences:</p>
                    <ul className="text-sm space-y-1">
                      {solutionVerification.differences.map((diff, index) => (
                        <li key={index}>• {diff.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export/Share Actions */}
      {validationResult?.valid && (
        <Card>
          <CardHeader>
            <CardTitle>Export & Share</CardTitle>
            <CardDescription>Your level is ready to share!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Button onClick={handleExport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download as JSON
              </Button>
              <Button onClick={handleShare} variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Copy Share Link
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Level Summary</h4>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">ID:</span> {level.id}
                </div>
                <div>
                  <span className="font-medium">Name:</span> {level.name?.en_US}
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span> {level.difficulty}
                </div>
                <div>
                  <span className="font-medium">Tutorial Steps:</span>{' '}
                  {level.tutorialSteps?.length || 0}
                </div>
                <div>
                  <span className="font-medium">Solution Commands:</span>{' '}
                  {level.solutionCommands?.length || 0}
                </div>
                <div>
                  <span className="font-medium">Hints:</span> {level.hints?.length || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

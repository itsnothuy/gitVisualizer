"use client";

/**
 * LFS Warning Banner Component
 * 
 * Displays non-blocking warnings about large files detected in the repository.
 * Provides guidance on Git LFS setup and remediation.
 * 
 * Features:
 * - Collapsible panel with large file details
 * - Copy-to-clipboard for .gitattributes patterns and commands
 * - Links to official Git LFS documentation
 * - Privacy-first (all analysis is local, no data exfiltration)
 */

import * as React from "react";
import { AlertCircle, AlertTriangle, FileArchive, Copy, Check, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { LFSAnalysisResult } from "@/lib/git/lfs-hygiene";
import { formatBytes, generateLFSPatterns, generateLFSCommands } from "@/lib/git/lfs-hygiene";

interface LFSWarningBannerProps {
  /** Analysis result with large file information */
  analysis: LFSAnalysisResult;
  /** Callback when user dismisses the warning */
  onDismiss?: () => void;
  /** Whether the banner is initially expanded (default: true) */
  defaultExpanded?: boolean;
}

export function LFSWarningBanner({ 
  analysis, 
  onDismiss,
  defaultExpanded = true 
}: LFSWarningBannerProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const [copiedAttributes, setCopiedAttributes] = React.useState(false);
  const [copiedCommands, setCopiedCommands] = React.useState(false);

  // Count files by severity
  const warningCount = analysis.largeFiles.filter(f => f.severity === 'warning').length;
  const criticalCount = analysis.largeFiles.filter(f => f.severity === 'critical').length;
  const lfsCount = analysis.lfsFiles.length;
  
  // Early return if no large files
  if (analysis.largeFiles.length === 0) {
    return null;
  }

  // Generate patterns and commands for non-LFS files
  const nonLfsFiles = analysis.largeFiles.filter(f => !f.lfsPointer?.isValid);
  const extensions = Array.from(new Set(nonLfsFiles.map(f => f.extension).filter(Boolean)));
  const gitattributesPatterns = generateLFSPatterns(extensions);
  const lfsCommands = generateLFSCommands(extensions);

  // Handle copy to clipboard
  const handleCopyAttributes = async () => {
    try {
      await navigator.clipboard.writeText(gitattributesPatterns);
      setCopiedAttributes(true);
      setTimeout(() => setCopiedAttributes(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyCommands = async () => {
    try {
      await navigator.clipboard.writeText(lfsCommands);
      setCopiedCommands(true);
      setTimeout(() => setCopiedCommands(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Determine banner color based on severity
  const hasCritical = criticalCount > 0;
  const borderColor = hasCritical ? "border-red-500" : "border-amber-500";
  const iconColor = hasCritical ? "text-red-500" : "text-amber-500";
  const Icon = hasCritical ? AlertCircle : AlertTriangle;

  return (
    <Card className={`${borderColor} border-2`} role="alert" aria-live="polite">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Icon className={`${iconColor} h-5 w-5 flex-shrink-0 mt-0.5`} aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">
              Large Files Detected
            </CardTitle>
            <CardDescription className="mt-1">
              {criticalCount > 0 && (
                <span className="text-red-600 font-medium">
                  {criticalCount} critical {criticalCount === 1 ? 'file' : 'files'} (&gt; {formatBytes(analysis.criticalThreshold)})
                </span>
              )}
              {criticalCount > 0 && warningCount > 0 && ", "}
              {warningCount > 0 && (
                <span className="text-amber-600">
                  {warningCount} warning {warningCount === 1 ? 'file' : 'files'} (&gt; {formatBytes(analysis.warningThreshold)})
                </span>
              )}
              {lfsCount > 0 && (
                <span className="text-muted-foreground ml-2">
                  • {lfsCount} already tracked with LFS
                </span>
              )}
            </CardDescription>
          </div>
          <CardAction>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-label={expanded ? "Collapse details" : "Expand details"}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  aria-label="Dismiss warning"
                >
                  ×
                </Button>
              )}
            </div>
          </CardAction>
        </div>
      </CardHeader>

      {expanded && (
        <>
          <Separator />
          <CardContent className="space-y-4">
            {/* Large Files List */}
            <div>
              <h3 className="text-sm font-medium mb-2">Large Files ({nonLfsFiles.length})</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {nonLfsFiles.slice(0, 10).map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50"
                  >
                    <span className="truncate flex-1 font-mono text-xs" title={file.path}>
                      {file.path}
                    </span>
                    <span className={`ml-2 flex-shrink-0 font-medium ${file.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                      {formatBytes(file.size)}
                    </span>
                  </div>
                ))}
                {nonLfsFiles.length > 10 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    ... and {nonLfsFiles.length - 10} more
                  </p>
                )}
              </div>
            </div>

            {/* LFS Files (if any) */}
            {lfsCount > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileArchive className="h-4 w-4" aria-hidden="true" />
                  Already Tracked with LFS ({lfsCount})
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {analysis.lfsFiles.slice(0, 5).map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm py-1 px-2 rounded bg-green-50 dark:bg-green-950"
                    >
                      <span className="truncate flex-1 font-mono text-xs" title={file.path}>
                        {file.path}
                      </span>
                      <span className="ml-2 flex-shrink-0 text-xs text-muted-foreground">
                        {formatBytes(file.lfsPointer?.size ?? 0)} (pointer)
                      </span>
                    </div>
                  ))}
                  {lfsCount > 5 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      ... and {lfsCount - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Remediation Section */}
            {nonLfsFiles.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Convert to Git LFS</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Git LFS stores large files externally, keeping your repository fast. Follow these steps:
                    </p>
                  </div>

                  {/* .gitattributes patterns */}
                  {gitattributesPatterns && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Add to .gitattributes:
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyAttributes}
                          aria-label="Copy .gitattributes patterns"
                        >
                          {copiedAttributes ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        <code>{gitattributesPatterns}</code>
                      </pre>
                    </div>
                  )}

                  {/* Git LFS commands */}
                  {lfsCommands && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Or run these commands:
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyCommands}
                          aria-label="Copy git lfs commands"
                        >
                          {copiedCommands ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        <code>{lfsCommands}</code>
                      </pre>
                    </div>
                  )}

                  {/* Documentation Links */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <a
                      href="https://git-lfs.github.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Git LFS Website
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                    <span className="text-xs text-muted-foreground">•</span>
                    <a
                      href="https://docs.github.com/en/repositories/working-with-files/managing-large-files"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      GitHub LFS Docs
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                    <span className="text-xs text-muted-foreground">•</span>
                    <a
                      href="/docs/LFS_GUIDE.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Our LFS Guide
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>

                  {/* Important Note */}
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    <strong>Note:</strong> All analysis is performed locally. No data leaves your device.
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}

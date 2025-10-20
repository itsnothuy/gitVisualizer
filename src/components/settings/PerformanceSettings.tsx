"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";
import {
  type PerformanceMode,
  getPerformanceMode,
  setPerformanceMode,
} from "@/lib/perf-config";

export interface PerformanceSettingsProps {
  /** Current performance mode */
  mode?: PerformanceMode;
  /** Callback when mode changes */
  onModeChange?: (mode: PerformanceMode) => void;
  /** Show as a dialog (default) or inline */
  variant?: "dialog" | "inline";
}

/**
 * Performance Settings component
 * Allows users to choose between Auto, Quality, and Speed modes
 */
export function PerformanceSettings({
  mode: controlledMode,
  onModeChange,
  variant = "dialog",
}: PerformanceSettingsProps) {
  const [mode, setMode] = React.useState<PerformanceMode>(
    controlledMode || getPerformanceMode()
  );
  const [isOpen, setIsOpen] = React.useState(false);

  // Sync with controlled mode if provided
  React.useEffect(() => {
    if (controlledMode !== undefined) {
      setMode(controlledMode);
    }
  }, [controlledMode]);

  const handleModeChange = (newMode: PerformanceMode) => {
    setMode(newMode);
    setPerformanceMode(newMode);
    onModeChange?.(newMode);
  };

  const settingsContent = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="perf-mode">Performance Mode</Label>
          <Select value={mode} onValueChange={handleModeChange}>
            <SelectTrigger id="perf-mode" className="w-full">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Auto (Recommended)</span>
                  <span className="text-xs text-muted-foreground">
                    Automatically adjusts based on graph size
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="quality">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Quality</span>
                  <span className="text-xs text-muted-foreground">
                    Prioritize visual quality over performance
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="speed">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Speed</span>
                  <span className="text-xs text-muted-foreground">
                    Prioritize performance over visual quality
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4 text-sm">
          <h4 className="font-medium mb-2">Mode Details:</h4>
          <ul className="space-y-2 text-muted-foreground">
            {mode === "auto" && (
              <>
                <li>• Uses Web Worker for graphs ≥ 1,500 commits</li>
                <li>• Enables virtualization for graphs ≥ 2,500 commits</li>
                <li>• Reduces label density for graphs ≥ 5,000 commits</li>
                <li>• Monitors frame performance automatically</li>
              </>
            )}
            {mode === "quality" && (
              <>
                <li>• Always shows all labels and visual details</li>
                <li>• Uses Web Worker for large graphs only</li>
                <li>• Disables optimizations that affect quality</li>
                <li>• Best for small to medium graphs</li>
              </>
            )}
            {mode === "speed" && (
              <>
                <li>• Enables all performance optimizations</li>
                <li>• Uses virtualization and label reduction</li>
                <li>• Disables animations and heavy effects</li>
                <li>• Best for very large graphs (5,000+ commits)</li>
              </>
            )}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Your preference is saved locally and persists across sessions.
        </p>
      </div>
    </div>
  );

  if (variant === "inline") {
    return settingsContent;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Performance settings"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Performance</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Performance Settings</DialogTitle>
          <DialogDescription>
            Adjust performance settings to optimize for your use case.
          </DialogDescription>
        </DialogHeader>
        {settingsContent}
      </DialogContent>
    </Dialog>
  );
}

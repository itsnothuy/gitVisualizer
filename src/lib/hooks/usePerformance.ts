/**
 * React hook for managing performance settings and monitoring
 */

import * as React from "react";
import {
  type PerformanceMode,
  type PerformanceSettings,
  type PerformanceThresholds,
  DEFAULT_THRESHOLDS,
  getPerformanceMode,
  setPerformanceMode as savePerfMode,
  getPerformanceSettings,
} from "../perf-config";
import { FrameWatchdog, type FrameStats } from "../frame-watchdog";

export interface UsePerformanceOptions {
  /** Number of nodes in the graph */
  nodeCount: number;
  /** Number of edges in the graph */
  edgeCount: number;
  /** Custom thresholds (optional) */
  thresholds?: Partial<PerformanceThresholds>;
  /** Enable frame watchdog monitoring */
  enableWatchdog?: boolean;
}

export interface UsePerformanceResult {
  /** Current performance mode */
  mode: PerformanceMode;
  /** Active performance settings */
  settings: PerformanceSettings;
  /** Change performance mode */
  setMode: (mode: PerformanceMode) => void;
  /** Frame statistics (if watchdog enabled) */
  frameStats: FrameStats | null;
  /** Whether performance is currently good */
  isPerformanceGood: boolean;
}

/**
 * Hook for managing performance settings and monitoring
 */
export function usePerformance({
  nodeCount,
  edgeCount,
  thresholds: customThresholds,
  enableWatchdog = true,
}: UsePerformanceOptions): UsePerformanceResult {
  const [mode, setModeState] = React.useState<PerformanceMode>(() => getPerformanceMode());
  const [frameStats, setFrameStats] = React.useState<FrameStats | null>(null);
  const watchdogRef = React.useRef<FrameWatchdog | null>(null);

  // Merge custom thresholds with defaults
  const thresholds = React.useMemo(
    () => ({ ...DEFAULT_THRESHOLDS, ...customThresholds }),
    [customThresholds]
  );

  // Calculate performance settings based on mode and graph size
  const settings = React.useMemo(
    () => getPerformanceSettings(mode, nodeCount, edgeCount, thresholds),
    [mode, nodeCount, edgeCount, thresholds]
  );

  // Handle mode changes
  const setMode = React.useCallback((newMode: PerformanceMode) => {
    setModeState(newMode);
    savePerfMode(newMode);
  }, []);

  // Initialize and manage frame watchdog
  React.useEffect(() => {
    if (!enableWatchdog || !settings.enableFrameWatchdog) {
      return;
    }

    // Create watchdog
    watchdogRef.current = new FrameWatchdog({
      maxFrameTime: thresholds.maxFrameTime,
      threshold: thresholds.frameWatchdogThreshold,
      onSlowFrames: (stats) => {
        setFrameStats(stats);
      },
    });

    // Start monitoring
    watchdogRef.current.start();

    // Update stats periodically
    const interval = setInterval(() => {
      if (watchdogRef.current) {
        setFrameStats(watchdogRef.current.getStats());
      }
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(interval);
      if (watchdogRef.current) {
        watchdogRef.current.stop();
        watchdogRef.current = null;
      }
    };
  }, [enableWatchdog, settings.enableFrameWatchdog, thresholds]);

  // Check if performance is good
  const isPerformanceGood = React.useMemo(() => {
    if (!frameStats) return true;
    return frameStats.slowFramePercentage < 5; // < 5% slow frames is good
  }, [frameStats]);

  return {
    mode,
    settings,
    setMode,
    frameStats,
    isPerformanceGood,
  };
}

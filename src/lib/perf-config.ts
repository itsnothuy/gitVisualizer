/**
 * Performance Configuration and Thresholds
 * 
 * Auto-adjusts performance settings based on graph size and user preferences.
 * Implements guardrails to maintain 60 FPS target and responsive UI.
 */

/**
 * Performance mode settings
 */
export type PerformanceMode = 'auto' | 'quality' | 'speed';

/**
 * Performance thresholds for auto-switching features
 */
export interface PerformanceThresholds {
  /** Use Web Worker for layout when node count >= this value */
  workerThreshold: number;
  /** Enable virtualization when node count >= this value */
  virtualizationThreshold: number;
  /** Reduce label density when node count >= this value */
  reducedLabelsThreshold: number;
  /** Disable heavy adorners (animations, effects) when node count >= this value */
  disableAdornersThreshold: number;
  /** Maximum frame time in ms (60 FPS = ~16.7ms) */
  maxFrameTime: number;
  /** Frame watchdog warning threshold (consecutive frames over budget) */
  frameWatchdogThreshold: number;
}

/**
 * Default thresholds (configurable via environment variables)
 */
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  workerThreshold: parseInt(process.env.NEXT_PUBLIC_WORKER_THRESHOLD || '1500', 10),
  virtualizationThreshold: parseInt(process.env.NEXT_PUBLIC_VIRTUALIZATION_THRESHOLD || '2500', 10),
  reducedLabelsThreshold: parseInt(process.env.NEXT_PUBLIC_REDUCED_LABELS_THRESHOLD || '5000', 10),
  disableAdornersThreshold: parseInt(process.env.NEXT_PUBLIC_DISABLE_ADORNERS_THRESHOLD || '5000', 10),
  maxFrameTime: 16.7, // 60 FPS target
  frameWatchdogThreshold: 3, // Warn after 3 consecutive slow frames
};

/**
 * Performance settings determined by mode and graph size
 */
export interface PerformanceSettings {
  /** Use Web Worker for layout */
  useWorker: boolean;
  /** Enable viewport virtualization */
  enableVirtualization: boolean;
  /** Reduce label density (show fewer labels) */
  reduceLabelDensity: boolean;
  /** Disable animations and heavy effects */
  disableAdorners: boolean;
  /** Enable frame watchdog monitoring */
  enableFrameWatchdog: boolean;
  /** Use OffscreenCanvas for edge rendering (if supported) */
  useOffscreenCanvas: boolean;
}

/**
 * Get performance settings based on mode and graph size
 */
export function getPerformanceSettings(
  mode: PerformanceMode,
  nodeCount: number,
  edgeCount: number,
  thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS
): PerformanceSettings {
  // Quality mode: prioritize visual quality over performance
  if (mode === 'quality') {
    return {
      useWorker: nodeCount >= thresholds.workerThreshold,
      enableVirtualization: false,
      reduceLabelDensity: false,
      disableAdorners: false,
      enableFrameWatchdog: true,
      useOffscreenCanvas: false,
    };
  }

  // Speed mode: prioritize performance over visual quality
  if (mode === 'speed') {
    return {
      useWorker: nodeCount >= 500, // Lower threshold
      enableVirtualization: true,
      reduceLabelDensity: true,
      disableAdorners: true,
      enableFrameWatchdog: true,
      useOffscreenCanvas: isOffscreenCanvasSupported(),
    };
  }

  // Auto mode: balance based on graph size
  return {
    useWorker: nodeCount >= thresholds.workerThreshold,
    enableVirtualization: nodeCount >= thresholds.virtualizationThreshold,
    reduceLabelDensity: nodeCount >= thresholds.reducedLabelsThreshold,
    disableAdorners: nodeCount >= thresholds.disableAdornersThreshold,
    enableFrameWatchdog: true,
    useOffscreenCanvas: nodeCount >= thresholds.virtualizationThreshold && isOffscreenCanvasSupported(),
  };
}

/**
 * Check if OffscreenCanvas is supported in the current browser
 */
export function isOffscreenCanvasSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof OffscreenCanvas !== 'undefined';
}

/**
 * Get user's performance mode preference from localStorage
 */
export function getPerformanceMode(): PerformanceMode {
  if (typeof window === 'undefined') return 'auto';
  
  try {
    const stored = localStorage.getItem('perf-mode');
    if (stored === 'quality' || stored === 'speed' || stored === 'auto') {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read performance mode from localStorage:', error);
  }
  
  return 'auto';
}

/**
 * Save user's performance mode preference to localStorage
 */
export function setPerformanceMode(mode: PerformanceMode): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('perf-mode', mode);
  } catch (error) {
    console.warn('Failed to save performance mode to localStorage:', error);
  }
}

/**
 * Estimate graph complexity score (0-100)
 * Used for more granular performance adjustments
 */
export function getGraphComplexity(nodeCount: number, edgeCount: number): number {
  // Simple heuristic: nodes contribute 1 point, edges 0.5 points
  // Normalized to 0-100 scale
  const score = (nodeCount + edgeCount * 0.5) / 100;
  return Math.min(100, Math.max(0, score));
}

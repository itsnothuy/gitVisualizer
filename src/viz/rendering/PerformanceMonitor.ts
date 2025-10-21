/**
 * Performance Monitor
 * 
 * Monitors rendering performance, tracks frame rates, memory usage,
 * and triggers automatic mode degradation when performance issues are detected.
 */

import type {
  PerformanceMetrics,
  DegradationThresholds,
  PerformanceReport,
  PerformanceRecommendation,
  RenderingMode,
} from './types';
import { detectDeviceCapabilities, type RenderingModeEngine } from './RenderingModeEngine';

/**
 * Performance monitoring options
 */
export interface PerformanceMonitorOptions {
  /** Callback when performance degrades */
  onDegradation?: (mode: RenderingMode) => void;
  /** Callback when performance improves */
  onImprovement?: (mode: RenderingMode) => void;
  /** Custom degradation thresholds */
  thresholds?: Partial<DegradationThresholds>;
}

/**
 * Default degradation thresholds
 */
const DEFAULT_THRESHOLDS: DegradationThresholds = {
  maxFrameTime: 16.7, // 60fps
  maxMemoryUsage: 400, // 400MB
  maxFrameDropRate: 10, // 10% drops
  maxRenderTime: 33, // 30fps as fallback
};

/**
 * Performance Monitor
 * 
 * Tracks rendering performance and automatically suggests mode changes
 * when performance degrades or improves.
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private frameTimeHistory: number[] = [];
  private frameDrops: number = 0;
  private totalFrames: number = 0;
  private lastFrameTime: number = 0;
  private renderingModeEngine: RenderingModeEngine | null = null;
  private degradationThresholds: DegradationThresholds;
  private options: PerformanceMonitorOptions;
  private isTracking: boolean = false;
  private animationFrameId: number | null = null;

  constructor(options: PerformanceMonitorOptions = {}) {
    this.options = options;
    this.degradationThresholds = {
      ...DEFAULT_THRESHOLDS,
      ...options.thresholds,
    };

    this.metrics = {
      averageFrameTime: 0,
      frameDropCount: 0,
      memoryUsage: 0,
      renderingTime: 0,
      interactionLatency: 0,
      nodeCount: 0,
      edgeCount: 0,
    };
  }

  /**
   * Set the rendering mode engine for mode switching
   */
  setRenderingModeEngine(engine: RenderingModeEngine): void {
    this.renderingModeEngine = engine;
  }

  /**
   * Start frame tracking
   */
  startFrameTracking(): void {
    if (this.isTracking) return;
    this.isTracking = true;
    this.lastFrameTime = performance.now();
    this.trackFrame();
  }

  /**
   * Stop frame tracking
   */
  stopFrameTracking(): void {
    this.isTracking = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Track individual frame
   */
  private trackFrame = (): void => {
    if (!this.isTracking) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Record frame time
    this.recordFrameTime(frameTime);

    // Check if we need to degrade performance
    if (this.shouldDegradePerformance()) {
      this.triggerPerformanceDegradation();
    }

    this.animationFrameId = requestAnimationFrame(this.trackFrame);
  };

  /**
   * Record a frame time measurement
   */
  private recordFrameTime(frameTime: number): void {
    this.frameTimeHistory.push(frameTime);
    this.totalFrames++;

    // Track dropped frames (>16.7ms = dropped frame at 60fps)
    if (frameTime > 16.7) {
      this.frameDrops++;
    }

    // Keep only last 60 frames for rolling average
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }

    // Update metrics
    this.metrics.averageFrameTime = this.getAverageFrameTime();
    this.metrics.frameDropCount = this.frameDrops;
  }

  /**
   * Measure a rendering operation
   */
  measureRenderOperation<T>(operation: string, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();

    const duration = endTime - startTime;
    this.recordOperationTime(operation, duration);

    return result;
  }

  /**
   * Record operation time
   */
  private recordOperationTime(operation: string, duration: number): void {
    if (operation === 'render') {
      this.metrics.renderingTime = duration;
    }
  }

  /**
   * Update graph size metrics
   */
  updateGraphSize(nodeCount: number, edgeCount: number): void {
    this.metrics.nodeCount = nodeCount;
    this.metrics.edgeCount = edgeCount;
  }

  /**
   * Get average frame time
   */
  private getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 0;
    const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
    return sum / this.frameTimeHistory.length;
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
      return 0;
    }
    const memory = (performance as { memory?: { usedJSHeapSize?: number } }).memory;
    if (memory && memory.usedJSHeapSize) {
      return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return 0;
  }

  /**
   * Get frame drop rate
   */
  private getFrameDropRate(): number {
    if (this.totalFrames === 0) return 0;
    return (this.frameDrops / this.totalFrames) * 100;
  }

  /**
   * Check if performance should degrade
   */
  private shouldDegradePerformance(): boolean {
    const avgFrameTime = this.getAverageFrameTime();
    const memoryUsage = this.getCurrentMemoryUsage();
    const frameDropRate = this.getFrameDropRate();

    this.metrics.memoryUsage = memoryUsage;

    return (
      avgFrameTime > this.degradationThresholds.maxFrameTime ||
      memoryUsage > this.degradationThresholds.maxMemoryUsage ||
      frameDropRate > this.degradationThresholds.maxFrameDropRate
    );
  }

  /**
   * Trigger performance degradation
   */
  private triggerPerformanceDegradation(): void {
    if (!this.renderingModeEngine) return;

    const currentMode = this.renderingModeEngine.getCurrentMode();
    const suggestedMode = this.renderingModeEngine.suggestDegradedMode(
      currentMode,
      this.metrics
    );

    if (suggestedMode !== currentMode) {
      this.renderingModeEngine.switchToMode(suggestedMode);
      this.options.onDegradation?.(suggestedMode);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): PerformanceReport {
    const recommendations = this.generateRecommendations();
    const deviceCapabilities = detectDeviceCapabilities();

    return {
      timestamp: Date.now(),
      renderingMode: this.renderingModeEngine?.getCurrentMode() || 'svg',
      metrics: { ...this.metrics },
      recommendations,
      deviceCapabilities,
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // Check frame time
    if (this.metrics.averageFrameTime > this.degradationThresholds.maxFrameTime) {
      recommendations.push({
        type: 'mode-change',
        message: `Average frame time (${this.metrics.averageFrameTime.toFixed(1)}ms) exceeds target (${this.degradationThresholds.maxFrameTime}ms). Consider switching to a more performant rendering mode.`,
        suggestedMode: 'canvas',
        priority: 'high',
      });
    }

    // Check memory usage
    if (this.metrics.memoryUsage > this.degradationThresholds.maxMemoryUsage) {
      recommendations.push({
        type: 'warning',
        message: `Memory usage (${this.metrics.memoryUsage.toFixed(0)}MB) is high. Consider enabling virtualization or reducing graph size.`,
        priority: 'medium',
      });
    }

    // Check frame drops
    const dropRate = this.getFrameDropRate();
    if (dropRate > this.degradationThresholds.maxFrameDropRate) {
      recommendations.push({
        type: 'setting-change',
        message: `Frame drop rate (${dropRate.toFixed(1)}%) is high. Try reducing visual quality or enabling performance mode.`,
        priority: 'medium',
      });
    }

    return recommendations;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.frameTimeHistory = [];
    this.frameDrops = 0;
    this.totalFrames = 0;
    this.metrics = {
      averageFrameTime: 0,
      frameDropCount: 0,
      memoryUsage: 0,
      renderingTime: 0,
      interactionLatency: 0,
      nodeCount: 0,
      edgeCount: 0,
    };
  }
}

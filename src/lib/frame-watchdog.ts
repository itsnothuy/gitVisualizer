/**
 * Frame Watchdog
 * 
 * Monitors requestAnimationFrame performance and warns when frames exceed budget.
 * Helps identify performance regressions and provides actionable insights.
 */

export interface FrameWatchdogOptions {
  /** Maximum allowed frame time in ms (default: 16.7ms for 60 FPS) */
  maxFrameTime?: number;
  /** Number of consecutive slow frames before warning (default: 3) */
  threshold?: number;
  /** Minimum time between warnings in ms (default: 5000ms) */
  warningCooldown?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Callback when slow frames are detected */
  onSlowFrames?: (stats: FrameStats) => void;
}

export interface FrameStats {
  /** Average frame time over the measurement period */
  avgFrameTime: number;
  /** Maximum frame time observed */
  maxFrameTime: number;
  /** Number of frames that exceeded the budget */
  slowFrameCount: number;
  /** Total frames measured */
  totalFrames: number;
  /** Percentage of slow frames */
  slowFramePercentage: number;
}

/**
 * Frame watchdog class for monitoring rAF performance
 */
export class FrameWatchdog {
  private options: Required<FrameWatchdogOptions>;
  private isRunning = false;
  private rafId: number | null = null;
  private lastFrameTime: number | null = null;
  private consecutiveSlowFrames = 0;
  private lastWarningTime = 0;
  
  // Stats tracking
  private frameTimes: number[] = [];
  private slowFrames = 0;
  private totalFrames = 0;
  private maxFrameTimeObserved = 0;

  constructor(options: FrameWatchdogOptions = {}) {
    this.options = {
      maxFrameTime: options.maxFrameTime ?? 16.7,
      threshold: options.threshold ?? 3,
      warningCooldown: options.warningCooldown ?? 5000,
      debug: options.debug ?? false,
      onSlowFrames: options.onSlowFrames ?? (() => {}),
    };
  }

  /**
   * Start monitoring frame times
   */
  start(): void {
    if (this.isRunning || typeof window === 'undefined') return;
    
    this.isRunning = true;
    this.reset();
    this.lastFrameTime = performance.now();
    this.scheduleNextFrame();
    
    if (this.options.debug) {
      console.log('[FrameWatchdog] Started monitoring');
    }
  }

  /**
   * Stop monitoring frame times
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    if (this.options.debug) {
      console.log('[FrameWatchdog] Stopped monitoring', this.getStats());
    }
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.frameTimes = [];
    this.slowFrames = 0;
    this.totalFrames = 0;
    this.maxFrameTimeObserved = 0;
    this.consecutiveSlowFrames = 0;
  }

  /**
   * Get current frame statistics
   */
  getStats(): FrameStats {
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length
      : 0;

    return {
      avgFrameTime,
      maxFrameTime: this.maxFrameTimeObserved,
      slowFrameCount: this.slowFrames,
      totalFrames: this.totalFrames,
      slowFramePercentage: this.totalFrames > 0 ? (this.slowFrames / this.totalFrames) * 100 : 0,
    };
  }

  /**
   * Check if performance is currently good (< 5% slow frames)
   */
  isPerformanceGood(): boolean {
    const stats = this.getStats();
    return stats.slowFramePercentage < 5;
  }

  /**
   * Schedule the next frame measurement
   */
  private scheduleNextFrame(): void {
    if (!this.isRunning) return;

    this.rafId = requestAnimationFrame((timestamp) => {
      this.measureFrame(timestamp);
      this.scheduleNextFrame();
    });
  }

  /**
   * Measure a single frame's performance
   */
  private measureFrame(timestamp: number): void {
    if (this.lastFrameTime === null) {
      this.lastFrameTime = timestamp;
      return;
    }

    const frameTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // Track stats
    this.totalFrames++;
    this.frameTimes.push(frameTime);
    
    // Keep only last 60 frames for rolling average
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    // Update max frame time
    if (frameTime > this.maxFrameTimeObserved) {
      this.maxFrameTimeObserved = frameTime;
    }

    // Check if frame exceeded budget
    if (frameTime > this.options.maxFrameTime) {
      this.slowFrames++;
      this.consecutiveSlowFrames++;
      
      // Warn if threshold reached and cooldown expired
      if (this.consecutiveSlowFrames >= this.options.threshold) {
        const now = performance.now();
        if (now - this.lastWarningTime >= this.options.warningCooldown) {
          this.emitWarning(frameTime);
          this.lastWarningTime = now;
        }
      }
    } else {
      // Reset consecutive counter on good frame
      this.consecutiveSlowFrames = 0;
    }
  }

  /**
   * Emit warning about slow frames
   */
  private emitWarning(currentFrameTime: number): void {
    const stats = this.getStats();
    
    console.warn(
      `[FrameWatchdog] Performance warning: ${this.consecutiveSlowFrames} consecutive frames over budget. ` +
      `Current: ${currentFrameTime.toFixed(1)}ms, Budget: ${this.options.maxFrameTime}ms, ` +
      `Avg: ${stats.avgFrameTime.toFixed(1)}ms, Slow: ${stats.slowFramePercentage.toFixed(1)}%`
    );
    
    // Call user callback
    this.options.onSlowFrames(stats);
    
    // Reset consecutive counter after warning
    this.consecutiveSlowFrames = 0;
  }

  /**
   * Get a human-readable report
   */
  getReport(): string {
    const stats = this.getStats();
    return [
      '=== Frame Watchdog Report ===',
      `Total Frames: ${stats.totalFrames}`,
      `Slow Frames: ${stats.slowFrameCount} (${stats.slowFramePercentage.toFixed(1)}%)`,
      `Avg Frame Time: ${stats.avgFrameTime.toFixed(2)}ms`,
      `Max Frame Time: ${stats.maxFrameTime.toFixed(2)}ms`,
      `Budget: ${this.options.maxFrameTime}ms (${(1000 / this.options.maxFrameTime).toFixed(0)} FPS)`,
      `Status: ${this.isPerformanceGood() ? '✅ Good' : '⚠️ Needs attention'}`,
    ].join('\n');
  }
}

/**
 * Global singleton watchdog instance
 */
let globalWatchdog: FrameWatchdog | null = null;

/**
 * Get or create the global watchdog instance
 */
export function getFrameWatchdog(options?: FrameWatchdogOptions): FrameWatchdog {
  if (!globalWatchdog) {
    globalWatchdog = new FrameWatchdog(options);
  }
  return globalWatchdog;
}

/**
 * Start the global watchdog
 */
export function startFrameWatchdog(options?: FrameWatchdogOptions): FrameWatchdog {
  const watchdog = getFrameWatchdog(options);
  watchdog.start();
  return watchdog;
}

/**
 * Stop the global watchdog
 */
export function stopFrameWatchdog(): void {
  if (globalWatchdog) {
    globalWatchdog.stop();
  }
}

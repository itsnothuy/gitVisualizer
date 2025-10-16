/**
 * Animation engine for LGB mode
 * Handles scene building, queueing, playback, and input locking
 */

import type { AnimScene, AnimStep, AnimState } from './types';
import { DURATIONS, EASING } from './types';
import { getElements } from './selectors';

/**
 * Animation engine options
 */
export interface EngineOptions {
  /** SVG root element to animate */
  rootElement: SVGSVGElement | null;
  /** Callback when animation starts */
  onStart?: (scene: AnimScene) => void;
  /** Callback when animation completes */
  onComplete?: (scene: AnimScene) => void;
  /** Callback when animation is cancelled */
  onCancel?: (scene: AnimScene) => void;
  /** Callback for A11y announcements */
  onAnnounce?: (message: string) => void;
}

/**
 * Animation playback context
 */
interface PlaybackContext {
  scene: AnimScene;
  startTime: number;
  state: AnimState;
  rafId: number | null;
  cleanupFns: Array<() => void>;
}

/**
 * Detect if user prefers reduced motion
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Adjust duration for reduced motion
 * Shortens to ≤80ms as per WCAG guidelines
 */
function adjustDuration(duration: number): number {
  if (!prefersReducedMotion()) return duration;
  return Math.min(duration, 80);
}

/**
 * Build an animation scene from a diff or operation
 * For now, this is a placeholder that accepts pre-built scenes
 */
export function buildScene(
  name: string,
  steps: AnimStep[],
  description?: string
): AnimScene {
  // Calculate total duration
  const total = steps.reduce((max, step) => {
    const stepEnd = step.t + (step.dur || DURATIONS.short);
    return Math.max(max, stepEnd);
  }, 0);

  return {
    name,
    total: adjustDuration(total),
    steps: steps.map(step => ({
      ...step,
      dur: adjustDuration(step.dur || DURATIONS.short),
      easing: step.easing || EASING.easeInOut,
    })),
    description,
  };
}

/**
 * Animation engine class
 * Manages playback of animation scenes with input locking
 */
export class AnimationEngine {
  private options: EngineOptions;
  private context: PlaybackContext | null = null;
  private locked = false;

  constructor(options: EngineOptions) {
    this.options = options;
  }

  /**
   * Get current animation state
   */
  getState(): AnimState {
    return this.context?.state || 'idle';
  }

  /**
   * Check if input is locked during animation
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * Play an animation scene
   * Locks input during playback, cancels if already playing
   */
  async play(scene: AnimScene): Promise<void> {
    // Cancel any running animation
    if (this.context) {
      this.cancel();
    }

    // Lock input
    this.locked = true;

    // Announce scene for screen readers
    const message = scene.description || `Animating scene: ${scene.name}`;
    this.options.onAnnounce?.(message);

    // Create playback context
    this.context = {
      scene,
      startTime: performance.now(),
      state: 'playing',
      rafId: null,
      cleanupFns: [],
    };

    // Notify start
    this.options.onStart?.(scene);

    // Start playback loop
    return new Promise<void>((resolve) => {
      this.runPlaybackLoop(resolve);
    });
  }

  /**
   * Pause the current animation
   */
  pause(): void {
    if (!this.context || this.context.state !== 'playing') return;
    
    this.context.state = 'paused';
    if (this.context.rafId !== null) {
      cancelAnimationFrame(this.context.rafId);
      this.context.rafId = null;
    }
  }

  /**
   * Resume a paused animation
   */
  resume(): void {
    if (!this.context || this.context.state !== 'paused') return;
    
    this.context.state = 'playing';
    this.context.startTime = performance.now() - this.getElapsedTime();
    this.runPlaybackLoop(() => {
      // Resume completes through normal playback
    });
  }

  /**
   * Cancel the current animation and reset
   */
  cancel(): void {
    if (!this.context) return;

    // Cancel animation frame
    if (this.context.rafId !== null) {
      cancelAnimationFrame(this.context.rafId);
    }

    // Run cleanup functions
    this.context.cleanupFns.forEach(fn => fn());

    // Notify cancellation
    this.options.onCancel?.(this.context.scene);

    // Reset state
    this.context.state = 'cancelled';
    this.context = null;
    this.locked = false;
  }

  /**
   * Reset the engine to idle state
   */
  reset(): void {
    this.cancel();
  }

  /**
   * Update root element reference
   */
  setRootElement(element: SVGSVGElement | null): void {
    this.options.rootElement = element;
  }

  /**
   * Get elapsed time since animation start
   */
  private getElapsedTime(): number {
    if (!this.context) return 0;
    return performance.now() - this.context.startTime;
  }

  /**
   * Main playback loop using requestAnimationFrame
   */
  private runPlaybackLoop(onComplete: () => void): void {
    if (!this.context || this.context.state !== 'playing') {
      onComplete();
      return;
    }

    const elapsed = this.getElapsedTime();
    const { scene } = this.context;

    // Apply all steps that should be active at this time
    this.applySteps(elapsed);

    // Check if animation is complete
    if (elapsed >= scene.total) {
      this.completeAnimation();
      onComplete();
      return;
    }

    // Schedule next frame
    this.context.rafId = requestAnimationFrame(() => {
      this.runPlaybackLoop(onComplete);
    });
  }

  /**
   * Apply animation steps at the current timestamp
   */
  private applySteps(elapsed: number): void {
    if (!this.context || !this.options.rootElement) return;

    const { scene } = this.context;

    // Find and apply active steps
    for (const step of scene.steps) {
      const stepStart = step.t;
      const stepEnd = step.t + (step.dur || DURATIONS.short);

      // Skip if step hasn't started yet
      if (elapsed < stepStart) continue;

      // Skip if step is already complete
      if (elapsed > stepEnd) continue;

      // Calculate progress through this step (0 to 1)
      const progress = (elapsed - stepStart) / (stepEnd - stepStart);
      const easedProgress = this.applyEasing(progress, step.easing || EASING.easeInOut);

      // Apply the step
      this.applyStep(step, easedProgress);
    }
  }

  /**
   * Apply a single animation step with easing
   */
  private applyStep(step: AnimStep, progress: number): void {
    if (!this.options.rootElement) return;

    const elements = getElements(this.options.rootElement, step.sel);
    
    for (const element of elements) {
      switch (step.op) {
        case 'fade':
          this.applyFade(element, step, progress);
          break;
        case 'move':
          this.applyMove(element, step, progress);
          break;
        case 'pulse':
          this.applyPulse(element, step, progress);
          break;
        case 'stroke':
          this.applyStroke(element, step, progress);
          break;
        case 'classAdd':
          this.applyClassAdd(element, step);
          break;
        case 'classRemove':
          this.applyClassRemove(element, step);
          break;
      }
    }
  }

  /**
   * Apply fade operation (opacity change)
   */
  private applyFade(element: SVGElement, step: AnimStep, progress: number): void {
    if (typeof step.to === 'number') {
      element.style.opacity = String(progress * step.to);
    } else if (typeof step.to === 'object' && 'opacity' in step.to) {
      element.style.opacity = String(progress * (step.to as { opacity: number }).opacity);
    }
  }

  /**
   * Apply move operation (position change)
   */
  private applyMove(element: SVGElement, step: AnimStep, progress: number): void {
    if (typeof step.to === 'object' && ('x' in step.to || 'y' in step.to)) {
      const target = step.to as { x?: number; y?: number };
      const currentTransform = element.getAttribute('transform') || '';
      const translateMatch = currentTransform.match(/translate\(([^,]+),([^)]+)\)/);
      
      const currentX = translateMatch ? parseFloat(translateMatch[1]) : 0;
      const currentY = translateMatch ? parseFloat(translateMatch[2]) : 0;
      
      const newX = target.x !== undefined ? currentX + (target.x - currentX) * progress : currentX;
      const newY = target.y !== undefined ? currentY + (target.y - currentY) * progress : currentY;
      
      element.setAttribute('transform', `translate(${newX},${newY})`);
    }
  }

  /**
   * Apply pulse operation (scale animation)
   */
  private applyPulse(element: SVGElement, step: AnimStep, progress: number): void {
    const scale = typeof step.to === 'number' ? step.to : 1.2;
    // Pulse up and down
    const pulseProgress = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    const currentScale = 1 + (scale - 1) * pulseProgress;
    
    const currentTransform = element.getAttribute('transform') || '';
    const scaleTransform = `scale(${currentScale})`;
    
    if (currentTransform.includes('scale(')) {
      element.setAttribute('transform', currentTransform.replace(/scale\([^)]+\)/, scaleTransform));
    } else {
      element.setAttribute('transform', `${currentTransform} ${scaleTransform}`);
    }
  }

  /**
   * Apply stroke operation (stroke color/width change)
   */
  private applyStroke(element: SVGElement, step: AnimStep, progress: number): void {
    if (typeof step.to === 'object' && ('color' in step.to || 'width' in step.to)) {
      const target = step.to as { color?: string; width?: number };
      
      if (target.color) {
        element.style.stroke = target.color;
      }
      
      if (target.width) {
        element.style.strokeWidth = String(target.width * progress);
      }
    }
  }

  /**
   * Apply classAdd operation
   */
  private applyClassAdd(element: SVGElement, step: AnimStep): void {
    if (typeof step.to === 'string') {
      element.classList.add(step.to);
    }
  }

  /**
   * Apply classRemove operation
   */
  private applyClassRemove(element: SVGElement, step: AnimStep): void {
    if (typeof step.to === 'string') {
      element.classList.remove(step.to);
    }
  }

  /**
   * Apply easing function to linear progress
   */
  private applyEasing(progress: number, easing: string): number {
    // Simple easing implementations
    // For production, consider using a library like bezier-easing
    switch (easing) {
      case EASING.linear:
        return progress;
      case EASING.easeIn:
        return progress * progress;
      case EASING.easeOut:
        return 1 - (1 - progress) * (1 - progress);
      case EASING.easeInOut:
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      default:
        return progress;
    }
  }

  /**
   * Complete the animation and cleanup
   */
  private completeAnimation(): void {
    if (!this.context) return;

    const { scene } = this.context;

    // Run cleanup functions
    this.context.cleanupFns.forEach(fn => fn());

    // Notify completion
    this.options.onComplete?.(scene);

    // Reset state
    this.context = null;
    this.locked = false;
  }
}

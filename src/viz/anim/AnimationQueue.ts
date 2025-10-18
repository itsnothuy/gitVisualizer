/**
 * Animation queue system for sequential playback
 * Manages a queue of animation scenes and executes them in order
 * Blocks user input while animations are playing
 */

import type { AnimScene } from './types';
import { AnimationEngine, type EngineOptions } from './engine';

/**
 * Queue item containing a scene and optional metadata
 */
interface QueueItem {
  scene: AnimScene;
  id: string;
  priority?: number;
}

/**
 * Queue state
 */
export type QueueState = 'idle' | 'playing' | 'paused';

/**
 * Options for AnimationQueue
 */
export interface QueueOptions extends Omit<EngineOptions, 'onStart' | 'onComplete'> {
  /** Callback when queue starts */
  onQueueStart?: () => void;
  /** Callback when queue completes (all items played) */
  onQueueComplete?: () => void;
  /** Callback when a scene starts */
  onSceneStart?: (scene: AnimScene) => void;
  /** Callback when a scene completes */
  onSceneComplete?: (scene: AnimScene) => void;
  /** Auto-play mode: start playing as soon as items are enqueued */
  autoPlay?: boolean;
}

/**
 * Animation queue class
 * Manages sequential playback of animation scenes
 */
export class AnimationQueue {
  private queue: QueueItem[] = [];
  private engine: AnimationEngine;
  private state: QueueState = 'idle';
  private currentItem: QueueItem | null = null;
  private idCounter = 0;
  private options: QueueOptions;
  private playPromise: Promise<void> | null = null;
  private inputBlocked = false;

  constructor(options: QueueOptions) {
    this.options = options;
    this.engine = new AnimationEngine({
      ...options,
      onStart: (scene) => {
        this.options.onSceneStart?.(scene);
      },
      onComplete: (scene) => {
        this.options.onSceneComplete?.(scene);
        // After a scene completes, play the next one
        this.playNextInternal();
      },
    });
  }

  /**
   * Get current queue state
   */
  getState(): QueueState {
    return this.state;
  }

  /**
   * Check if input is currently blocked
   */
  isInputBlocked(): boolean {
    return this.inputBlocked;
  }

  /**
   * Get the number of items in the queue
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Check if the queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0 && this.currentItem === null;
  }

  /**
   * Enqueue an animation scene
   * @param scene - The animation scene to enqueue
   * @param priority - Optional priority (higher numbers play first)
   * @returns ID of the enqueued item
   */
  enqueue(scene: AnimScene, priority?: number): string {
    const id = `queue-item-${this.idCounter++}`;
    const item: QueueItem = { scene, id, priority };

    // Insert based on priority (higher priority first)
    if (priority !== undefined) {
      const insertIndex = this.queue.findIndex(
        (item) => (item.priority ?? 0) < priority
      );
      if (insertIndex === -1) {
        this.queue.push(item);
      } else {
        this.queue.splice(insertIndex, 0, item);
      }
    } else {
      this.queue.push(item);
    }

    // Auto-play if enabled and not already playing
    if (this.options.autoPlay && this.state === 'idle') {
      this.play();
    }

    return id;
  }

  /**
   * Remove an item from the queue by ID
   * @param id - ID of the item to remove
   * @returns true if item was found and removed
   */
  dequeue(id: string): boolean {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Start playing the queue
   * Returns a promise that resolves when the entire queue is finished
   */
  async play(): Promise<void> {
    if (this.state === 'playing') {
      // Already playing, return the existing promise
      return this.playPromise || Promise.resolve();
    }

    if (this.queue.length === 0) {
      // Nothing to play
      return Promise.resolve();
    }

    this.state = 'playing';
    this.inputBlocked = true;
    this.options.onQueueStart?.();

    // Create a promise that resolves when the queue is empty
    this.playPromise = new Promise<void>((resolve) => {
      this.playNextInternal(resolve);
    });

    return this.playPromise;
  }

  /**
   * Play the next item in the queue (internal)
   */
  private async playNextInternal(onComplete?: () => void): Promise<void> {
    // Check if there are more items
    if (this.queue.length === 0) {
      // Queue is empty, we're done
      this.currentItem = null;
      this.state = 'idle';
      this.inputBlocked = false;
      this.playPromise = null;
      this.options.onQueueComplete?.();
      onComplete?.();
      return;
    }

    // Get the next item
    const item = this.queue.shift()!;
    this.currentItem = item;

    // Play the scene
    try {
      await this.engine.play(item.scene);
    } catch (error) {
      console.error('Error playing animation scene:', error);
      // Continue to next item even if there's an error
      this.playNextInternal(onComplete);
    }
  }

  /**
   * Play the next item in the queue (public API)
   * Manually advance to the next animation
   */
  async playNext(): Promise<void> {
    if (this.state !== 'playing') {
      return Promise.resolve();
    }

    // Cancel current animation and move to next
    this.engine.cancel();
    return this.playNextInternal();
  }

  /**
   * Pause the queue
   * Pauses the current animation and stops processing
   */
  pause(): void {
    if (this.state !== 'playing') return;

    this.state = 'paused';
    this.engine.pause();
  }

  /**
   * Resume the queue
   * Resumes the current animation and continues processing
   */
  resume(): void {
    if (this.state !== 'paused') return;

    this.state = 'playing';
    this.engine.resume();
  }

  /**
   * Clear the queue
   * Removes all pending items and stops the current animation
   */
  clear(): void {
    this.queue = [];
    this.engine.cancel();
    this.currentItem = null;
    this.state = 'idle';
    this.inputBlocked = false;
    this.playPromise = null;
  }

  /**
   * Skip the current animation and move to the next
   */
  skip(): void {
    if (this.state === 'playing' && this.currentItem) {
      this.engine.cancel();
      this.playNextInternal();
    }
  }

  /**
   * Get the current playing scene
   */
  getCurrentScene(): AnimScene | null {
    return this.currentItem?.scene || null;
  }

  /**
   * Get all scenes in the queue (not including current)
   */
  getQueuedScenes(): AnimScene[] {
    return this.queue.map((item) => item.scene);
  }

  /**
   * Update the root SVG element for the engine
   */
  setRootElement(element: SVGSVGElement | null): void {
    this.engine.setRootElement(element);
  }

  /**
   * Check if a specific scene is in the queue
   */
  hasScene(sceneName: string): boolean {
    return (
      this.queue.some((item) => item.scene.name === sceneName) ||
      this.currentItem?.scene.name === sceneName
    );
  }

  /**
   * Get statistics about the queue
   */
  getStats(): {
    queueLength: number;
    totalDuration: number;
    state: QueueState;
    inputBlocked: boolean;
  } {
    const totalDuration = this.queue.reduce(
      (sum, item) => sum + item.scene.total,
      0
    );

    return {
      queueLength: this.queue.length,
      totalDuration,
      state: this.state,
      inputBlocked: this.inputBlocked,
    };
  }
}

/**
 * Create an animation queue with common defaults
 */
export function createAnimationQueue(
  rootElement: SVGSVGElement | null,
  options: Partial<QueueOptions> = {}
): AnimationQueue {
  return new AnimationQueue({
    rootElement,
    autoPlay: true,
    ...options,
  });
}

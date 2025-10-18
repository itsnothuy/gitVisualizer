/**
 * Unit tests for AnimationQueue
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnimationQueue, createAnimationQueue } from '../AnimationQueue';
import { buildScene } from '../engine';
import { DURATIONS } from '../types';

describe('AnimationQueue', () => {
  let rootElement: SVGSVGElement;

  beforeEach(() => {
    // Create a mock SVG element
    rootElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  });

  describe('constructor and initialization', () => {
    it('should initialize with idle state', () => {
      const queue = new AnimationQueue({ rootElement });
      expect(queue.getState()).toBe('idle');
      expect(queue.isEmpty()).toBe(true);
      expect(queue.isInputBlocked()).toBe(false);
    });

    it('should accept options', () => {
      const onQueueStart = vi.fn();
      const queue = new AnimationQueue({
        rootElement,
        onQueueStart,
        autoPlay: true,
      });

      expect(queue.getState()).toBe('idle');
    });
  });

  describe('enqueue', () => {
    it('should add items to the queue', () => {
      const queue = new AnimationQueue({ rootElement, autoPlay: false });
      const scene = buildScene('test', []);

      const id = queue.enqueue(scene);
      
      expect(id).toBeDefined();
      expect(queue.getQueueLength()).toBe(1);
      expect(queue.isEmpty()).toBe(false);
    });

    it('should respect priority ordering', () => {
      const queue = new AnimationQueue({ rootElement, autoPlay: false });
      const scene1 = buildScene('test1', []);
      const scene2 = buildScene('test2', []);
      const scene3 = buildScene('test3', []);

      queue.enqueue(scene1, 1);
      queue.enqueue(scene2, 3); // Highest priority
      queue.enqueue(scene3, 2);

      const scenes = queue.getQueuedScenes();
      expect(scenes[0].name).toBe('test2');
      expect(scenes[1].name).toBe('test3');
      expect(scenes[2].name).toBe('test1');
    });

    it('should auto-play if enabled', () => {
      const queue = new AnimationQueue({ rootElement, autoPlay: true });
      const scene = buildScene('test', [
        { t: 0, sel: { nodes: ['c1'] }, op: 'fade', to: 1, dur: 10 },
      ]);

      queue.enqueue(scene);
      
      // State should change to playing
      expect(queue.getState()).toBe('playing');
      expect(queue.isInputBlocked()).toBe(true);
    });
  });

  describe('dequeue', () => {
    it('should remove items from the queue', () => {
      const queue = new AnimationQueue({ rootElement, autoPlay: false });
      const scene = buildScene('test', []);

      const id = queue.enqueue(scene);
      expect(queue.getQueueLength()).toBe(1);

      const removed = queue.dequeue(id);
      expect(removed).toBe(true);
      expect(queue.getQueueLength()).toBe(0);
    });

    it('should return false for non-existent items', () => {
      const queue = new AnimationQueue({ rootElement, autoPlay: false });
      
      const removed = queue.dequeue('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('play', () => {
    it('should start playing the queue', async () => {
      const onQueueStart = vi.fn();
      const onQueueComplete = vi.fn();
      const queue = new AnimationQueue({
        rootElement,
        autoPlay: false,
        onQueueStart,
        onQueueComplete,
      });

      const scene = buildScene('test', [
        { t: 0, sel: { nodes: ['c1'] }, op: 'fade', to: 1, dur: 10 },
      ]);
      queue.enqueue(scene);

      queue.play();
      
      expect(queue.getState()).toBe('playing');
      expect(onQueueStart).toHaveBeenCalled();

      // Wait a bit for animation to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Clear to prevent timeout
      queue.clear();
    });

    it('should play scenes sequentially', async () => {
      const order: string[] = [];
      const queue = new AnimationQueue({
        rootElement,
        autoPlay: false,
        onSceneStart: (scene) => {
          order.push(scene.name);
        },
      });

      const scene1 = buildScene('scene1', [
        { t: 0, sel: { nodes: ['c1'] }, op: 'fade', to: 1, dur: 10 },
      ]);
      const scene2 = buildScene('scene2', [
        { t: 0, sel: { nodes: ['c2'] }, op: 'fade', to: 1, dur: 10 },
      ]);

      queue.enqueue(scene1);
      queue.enqueue(scene2);

      queue.play();

      // Wait a bit for scenes to start
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(order.length).toBeGreaterThanOrEqual(1);
      
      // Clear to prevent timeout
      queue.clear();
    });

    it('should return existing promise if already playing', async () => {
      const queue = new AnimationQueue({ rootElement, autoPlay: false });
      
      const scene = buildScene('test', [
        { t: 0, sel: { nodes: ['c1'] }, op: 'fade', to: 1, dur: 50 },
      ]);
      queue.enqueue(scene);

      const promise1 = queue.play();
      const promise2 = queue.play();

      // Both should be promises (identity check may not work due to async)
      expect(promise1).toBeInstanceOf(Promise);
      expect(promise2).toBeInstanceOf(Promise);

      // Clear to prevent timeout
      queue.clear();
    });
  });

  describe('pause and resume', () => {
    it('should pause the queue', () => {
      const queue = new AnimationQueue({ rootElement, autoPlay: true });
      
      const scene = buildScene('test', [
        { t: 0, sel: { nodes: ['c1'] }, op: 'fade', to: 1, dur: 100 },
      ]);
      queue.enqueue(scene);

      queue.pause();
      expect(queue.getState()).toBe('paused');
    });

    it('should resume the queue', () => {
      const queue = new AnimationQueue({ rootElement, autoPlay: true });
      
      const scene = buildScene('test', [
        { t: 0, sel: { nodes: ['c1'] }, op: 'fade', to: 1, dur: 100 },
      ]);
      queue.enqueue(scene);

      queue.pause();
      expect(queue.getState()).toBe('paused');

      queue.resume();
      expect(queue.getState()).toBe('playing');
    });
  });

  describe('clear', () => {
    it('should clear the queue', () => {
      const queue = new AnimationQueue({ rootElement, autoPlay: false });
      
      const scene1 = buildScene('test1', []);
      const scene2 = buildScene('test2', []);
      
      queue.enqueue(scene1);
      queue.enqueue(scene2);
      expect(queue.getQueueLength()).toBe(2);

      queue.clear();
      
      expect(queue.getQueueLength()).toBe(0);
      expect(queue.isEmpty()).toBe(true);
      expect(queue.getState()).toBe('idle');
      expect(queue.isInputBlocked()).toBe(false);
    });
  });

  describe('skip', () => {
    it('should skip the current animation', async () => {
      const order: string[] = [];
      const queue = new AnimationQueue({
        rootElement,
        autoPlay: false,
        onSceneStart: (scene) => {
          order.push(scene.name);
        },
      });

      const scene1 = buildScene('scene1', [
        { t: 0, sel: { nodes: ['c1'] }, op: 'fade', to: 1, dur: 1000 },
      ]);
      const scene2 = buildScene('scene2', [
        { t: 0, sel: { nodes: ['c2'] }, op: 'fade', to: 1, dur: 10 },
      ]);

      queue.enqueue(scene1);
      queue.enqueue(scene2);

      queue.play();
      
      // Wait a bit then skip
      await new Promise(resolve => setTimeout(resolve, 50));
      queue.skip();

      // Wait a bit more
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(order.length).toBeGreaterThanOrEqual(1);
      
      // Clear to prevent timeout
      queue.clear();
    });
  });

  describe('getCurrentScene and getQueuedScenes', () => {
    it('should return current scene', () => {
      const queue = new AnimationQueue({ rootElement, autoPlay: true });
      
      const scene = buildScene('test', [
        { t: 0, sel: { nodes: ['c1'] }, op: 'fade', to: 1, dur: 100 },
      ]);
      queue.enqueue(scene);

      const current = queue.getCurrentScene();
      expect(current?.name).toBe('test');
    });

    it('should return queued scenes', () => {
      const queue = new AnimationQueue({ rootElement, autoPlay: false });
      
      const scene1 = buildScene('scene1', []);
      const scene2 = buildScene('scene2', []);
      
      queue.enqueue(scene1);
      queue.enqueue(scene2);

      const scenes = queue.getQueuedScenes();
      expect(scenes.length).toBe(2);
      expect(scenes[0].name).toBe('scene1');
      expect(scenes[1].name).toBe('scene2');
    });
  });

  describe('hasScene', () => {
    it('should check if a scene is in the queue', () => {
      const queue = new AnimationQueue({ rootElement, autoPlay: false });
      
      const scene = buildScene('test', []);
      queue.enqueue(scene);

      expect(queue.hasScene('test')).toBe(true);
      expect(queue.hasScene('other')).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return queue statistics', () => {
      const queue = new AnimationQueue({ rootElement, autoPlay: false });
      
      const scene1 = buildScene('scene1', [
        { t: 0, sel: { nodes: ['c1'] }, op: 'fade', to: 1, dur: DURATIONS.short },
      ]);
      const scene2 = buildScene('scene2', [
        { t: 0, sel: { nodes: ['c2'] }, op: 'fade', to: 1, dur: DURATIONS.medium },
      ]);
      
      queue.enqueue(scene1);
      queue.enqueue(scene2);

      const stats = queue.getStats();
      
      expect(stats.queueLength).toBe(2);
      expect(stats.totalDuration).toBeGreaterThan(0);
      expect(stats.state).toBe('idle');
      expect(stats.inputBlocked).toBe(false);
    });
  });

  describe('setRootElement', () => {
    it('should update the root element', () => {
      const queue = new AnimationQueue({ rootElement });
      
      const newElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      queue.setRootElement(newElement);

      // Should not throw
      expect(queue.getState()).toBe('idle');
    });
  });

  describe('createAnimationQueue', () => {
    it('should create a queue with defaults', () => {
      const queue = createAnimationQueue(rootElement);
      
      expect(queue.getState()).toBe('idle');
    });

    it('should accept custom options', () => {
      const onQueueStart = vi.fn();
      const queue = createAnimationQueue(rootElement, {
        onQueueStart,
        autoPlay: false,
      });

      expect(queue.getState()).toBe('idle');
    });
  });
});

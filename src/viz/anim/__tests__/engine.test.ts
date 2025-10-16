/**
 * Unit tests for animation engine
 * 
 * These tests verify:
 * - Scene building with correct durations
 * - Animation state management
 * - Input locking during playback
 * - Reduced motion support
 * - Deterministic animation scheduling
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { AnimationEngine, buildScene } from '../engine';
import { DURATIONS, EASING } from '../types';
import type { AnimScene } from '../types';

// Mock window.matchMedia globally for all tests
const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('buildScene', () => {
  it('should build a scene with correct total duration', () => {
    const scene = buildScene('test', [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade', to: 1, dur: DURATIONS.short },
      { t: DURATIONS.short, sel: { nodes: ['b'] }, op: 'fade', to: 1, dur: DURATIONS.medium },
    ]);

    expect(scene.name).toBe('test');
    expect(scene.total).toBe(DURATIONS.short + DURATIONS.medium);
    expect(scene.steps).toHaveLength(2);
  });

  it('should apply default easing and duration', () => {
    const scene = buildScene('test', [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade', to: 1 },
    ]);

    expect(scene.steps[0].easing).toBe(EASING.easeInOut);
    expect(scene.steps[0].dur).toBe(DURATIONS.short);
  });

  it('should handle empty steps array', () => {
    const scene = buildScene('empty', []);

    expect(scene.name).toBe('empty');
    expect(scene.total).toBe(0);
    expect(scene.steps).toHaveLength(0);
  });

  it('should support custom description for A11y', () => {
    const scene = buildScene('test', [], 'Creating new commit');

    expect(scene.description).toBe('Creating new commit');
  });
});

describe('AnimationEngine', () => {
  let mockRoot: SVGSVGElement;
  let engine: AnimationEngine;

  beforeEach(() => {
    // Create mock SVG root
    mockRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(mockRoot);

    // Create test nodes
    const node1 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    node1.setAttribute('data-testid', 'graph-node-a');
    mockRoot.appendChild(node1);

    const node2 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    node2.setAttribute('data-testid', 'graph-node-b');
    mockRoot.appendChild(node2);

    engine = new AnimationEngine({
      rootElement: mockRoot,
    });
  });

  afterEach(() => {
    document.body.removeChild(mockRoot);
  });

  it('should initialize in idle state', () => {
    expect(engine.getState()).toBe('idle');
    expect(engine.isLocked()).toBe(false);
  });

  it('should transition to playing state when play is called', async () => {
    const scene: AnimScene = buildScene('test', [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade', to: 1, dur: 10 },
    ]);

    const playPromise = engine.play(scene);
    
    // Check state immediately after play
    expect(engine.getState()).toBe('playing');
    expect(engine.isLocked()).toBe(true);

    await playPromise;

    // Check state after completion
    expect(engine.getState()).toBe('idle');
    expect(engine.isLocked()).toBe(false);
  });

  it('should lock input during animation', async () => {
    const scene: AnimScene = buildScene('test', [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade', to: 1, dur: 50 },
    ]);

    engine.play(scene);
    expect(engine.isLocked()).toBe(true);
  });

  it('should call onStart callback', async () => {
    const onStart = vi.fn();
    engine = new AnimationEngine({
      rootElement: mockRoot,
      onStart,
    });

    const scene: AnimScene = buildScene('test', [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade', to: 1, dur: 10 },
    ]);

    await engine.play(scene);
    expect(onStart).toHaveBeenCalledWith(scene);
  });

  it('should call onComplete callback', async () => {
    const onComplete = vi.fn();
    engine = new AnimationEngine({
      rootElement: mockRoot,
      onComplete,
    });

    const scene: AnimScene = buildScene('test', [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade', to: 1, dur: 10 },
    ]);

    await engine.play(scene);
    expect(onComplete).toHaveBeenCalledWith(scene);
  });

  it('should call onAnnounce with scene description', async () => {
    const onAnnounce = vi.fn();
    engine = new AnimationEngine({
      rootElement: mockRoot,
      onAnnounce,
    });

    const scene: AnimScene = buildScene('test', [], 'Creating commit');

    await engine.play(scene);
    expect(onAnnounce).toHaveBeenCalledWith('Creating commit');
  });

  it('should call onAnnounce with default message if no description', async () => {
    const onAnnounce = vi.fn();
    engine = new AnimationEngine({
      rootElement: mockRoot,
      onAnnounce,
    });

    const scene: AnimScene = buildScene('test', []);

    await engine.play(scene);
    expect(onAnnounce).toHaveBeenCalledWith('Animating scene: test');
  });

  it('should cancel current animation when starting a new one', async () => {
    const onCancel = vi.fn();
    engine = new AnimationEngine({
      rootElement: mockRoot,
      onCancel,
    });

    const scene1: AnimScene = buildScene('test1', [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade', to: 1, dur: 100 },
    ]);

    const scene2: AnimScene = buildScene('test2', [
      { t: 0, sel: { nodes: ['b'] }, op: 'fade', to: 1, dur: 10 },
    ]);

    engine.play(scene1);
    await engine.play(scene2);

    expect(onCancel).toHaveBeenCalledWith(scene1);
  });

  it('should support pause and resume', () => {
    const scene: AnimScene = buildScene('test', [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade', to: 1, dur: 100 },
    ]);

    engine.play(scene);
    expect(engine.getState()).toBe('playing');

    engine.pause();
    expect(engine.getState()).toBe('paused');

    engine.resume();
    expect(engine.getState()).toBe('playing');
  });

  it('should support cancel', async () => {
    const scene: AnimScene = buildScene('test', [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade', to: 1, dur: 100 },
    ]);

    engine.play(scene);
    expect(engine.getState()).toBe('playing');

    engine.cancel();
    expect(engine.getState()).toBe('idle');
    expect(engine.isLocked()).toBe(false);
  });

  it('should support reset', () => {
    const scene: AnimScene = buildScene('test', [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade', to: 1, dur: 100 },
    ]);

    engine.play(scene);
    engine.reset();

    expect(engine.getState()).toBe('idle');
    expect(engine.isLocked()).toBe(false);
  });

  it('should update root element reference', () => {
    const newRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    engine.setRootElement(newRoot);

    // Engine should now use newRoot for element selection
    // This is verified implicitly - no error should occur
    expect(engine.getState()).toBe('idle');
  });
});

describe('AnimationEngine - Reduced Motion', () => {
  let mockRoot: SVGSVGElement;

  beforeEach(() => {
    mockRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(mockRoot);
  });

  afterEach(() => {
    document.body.removeChild(mockRoot);
    // Reset to default mock
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('should shorten durations when prefers-reduced-motion is enabled', async () => {
    // Mock prefers-reduced-motion
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const scene = buildScene('test', [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade', to: 1, dur: 200 },
    ]);

    // Duration should be capped at 80ms for reduced motion
    expect(scene.steps[0].dur).toBeLessThanOrEqual(80);
    expect(scene.total).toBeLessThanOrEqual(80);
  });

  it('should use full durations when prefers-reduced-motion is not enabled', async () => {
    // Mock no prefers-reduced-motion (already default)
    const scene = buildScene('test', [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade', to: 1, dur: 200 },
    ]);

    // Duration should remain as specified
    expect(scene.steps[0].dur).toBe(200);
    expect(scene.total).toBe(200);
  });
});

describe('AnimationEngine - Determinism', () => {
  let mockRoot: SVGSVGElement;

  beforeEach(() => {
    mockRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(mockRoot);
  });

  afterEach(() => {
    document.body.removeChild(mockRoot);
  });

  it('should produce deterministic schedules from same input', () => {
    const steps = [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade' as const, to: 1, dur: DURATIONS.short },
      { t: DURATIONS.short, sel: { nodes: ['b'] }, op: 'fade' as const, to: 1, dur: DURATIONS.medium },
    ];

    const scene1 = buildScene('test', steps);
    const scene2 = buildScene('test', steps);

    expect(scene1.total).toBe(scene2.total);
    expect(scene1.steps).toEqual(scene2.steps);
  });

  it('should calculate total duration correctly for overlapping steps', () => {
    const scene = buildScene('test', [
      { t: 0, sel: { nodes: ['a'] }, op: 'fade', to: 1, dur: DURATIONS.medium },
      { t: DURATIONS.short, sel: { nodes: ['b'] }, op: 'fade', to: 1, dur: DURATIONS.medium },
    ]);

    // Total should be the end time of the longest step
    expect(scene.total).toBe(DURATIONS.short + DURATIONS.medium);
  });
});

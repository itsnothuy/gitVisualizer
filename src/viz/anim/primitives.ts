/**
 * Animation primitives and helper utilities for LGB mode
 * Provides high-level animation building blocks for common Git operations
 */

import type { AnimStep, AnimSelector } from './types';
import { DURATIONS } from './types';

/**
 * Create a fade animation step
 */
export function fade(
  selector: AnimSelector,
  to: number,
  options: { t?: number; dur?: number } = {}
): AnimStep {
  return {
    t: options.t || 0,
    sel: selector,
    op: 'fade',
    to,
    dur: options.dur || DURATIONS.short,
  };
}

/**
 * Create a move animation step
 */
export function move(
  selector: AnimSelector,
  to: { x?: number; y?: number },
  options: { t?: number; dur?: number } = {}
): AnimStep {
  return {
    t: options.t || 0,
    sel: selector,
    op: 'move',
    to,
    dur: options.dur || DURATIONS.short,
  };
}

/**
 * Create a pulse animation step
 */
export function pulse(
  selector: AnimSelector,
  scale: number = 1.2,
  options: { t?: number; dur?: number } = {}
): AnimStep {
  return {
    t: options.t || 0,
    sel: selector,
    op: 'pulse',
    to: scale,
    dur: options.dur || DURATIONS.medium,
  };
}

/**
 * Create a stroke animation step
 */
export function stroke(
  selector: AnimSelector,
  to: { color?: string; width?: number },
  options: { t?: number; dur?: number } = {}
): AnimStep {
  return {
    t: options.t || 0,
    sel: selector,
    op: 'stroke',
    to,
    dur: options.dur || DURATIONS.short,
  };
}

/**
 * Create a classAdd animation step
 */
export function classAdd(
  selector: AnimSelector,
  className: string,
  options: { t?: number } = {}
): AnimStep {
  return {
    t: options.t || 0,
    sel: selector,
    op: 'classAdd',
    to: className,
    dur: 0, // Instant
  };
}

/**
 * Create a classRemove animation step
 */
export function classRemove(
  selector: AnimSelector,
  className: string,
  options: { t?: number } = {}
): AnimStep {
  return {
    t: options.t || 0,
    sel: selector,
    op: 'classRemove',
    to: className,
    dur: 0, // Instant
  };
}

/**
 * Highlight a branch tip (HEAD pointer)
 * Combines pulse and stroke effects
 */
export function highlightBranchTip(
  nodeId: string,
  options: { t?: number; dur?: number } = {}
): AnimStep[] {
  const t = options.t || 0;
  const dur = options.dur || DURATIONS.medium;

  return [
    pulse({ nodes: [nodeId] }, 1.3, { t, dur }),
    stroke({ nodes: [nodeId] }, { color: 'var(--lgb-accent)', width: 3 }, { t, dur }),
  ];
}

/**
 * Move a branch label to a new position
 * Animates label position with fade out/in
 */
export function moveBranchLabel(
  labelId: string,
  to: { x: number; y: number },
  options: { t?: number; dur?: number } = {}
): AnimStep[] {
  const t = options.t || 0;
  const dur = options.dur || DURATIONS.short;

  return [
    fade({ labels: [labelId] }, 0, { t, dur: dur / 2 }),
    move({ labels: [labelId] }, to, { t: t + dur / 2, dur: 0 }),
    fade({ labels: [labelId] }, 1, { t: t + dur / 2, dur: dur / 2 }),
  ];
}

/**
 * Create a ghost node for copy operations (e.g., cherry-pick, rebase)
 * Adds a semi-transparent duplicate
 */
export function ghostNode(
  nodeId: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
  options: { t?: number; dur?: number } = {}
): AnimStep[] {
  const t = options.t || 0;
  const dur = options.dur || DURATIONS.long;
  const ghostId = `${nodeId}-ghost`;

  return [
    // Create ghost with reduced opacity
    classAdd({ nodes: [ghostId] }, 'ghost', { t }),
    fade({ nodes: [ghostId] }, 0.4, { t, dur: DURATIONS.veryShort }),
    // Move ghost to target
    move({ nodes: [ghostId] }, to, { t: t + DURATIONS.veryShort, dur }),
    // Fade out ghost
    fade({ nodes: [ghostId] }, 0, { t: t + dur, dur: DURATIONS.veryShort }),
  ];
}

/**
 * Create a temporary dashed edge for showing relationships
 * Useful for showing merge sources or rebase operations
 */
export function tempDashedEdge(
  edgeId: string,
  options: { t?: number; dur?: number; lifetime?: number } = {}
): AnimStep[] {
  const t = options.t || 0;
  const dur = options.dur || DURATIONS.short;
  const lifetime = options.lifetime || DURATIONS.medium;

  return [
    // Fade in dashed edge
    classAdd({ edges: [edgeId] }, 'dashed', { t }),
    fade({ edges: [edgeId] }, 0, { t, dur: 0 }),
    fade({ edges: [edgeId] }, 1, { t, dur }),
    // Keep visible for lifetime
    // Fade out
    fade({ edges: [edgeId] }, 0, { t: t + lifetime, dur }),
    classRemove({ edges: [edgeId] }, 'dashed', { t: t + lifetime + dur }),
  ];
}

/**
 * Fade in a new commit node
 */
export function fadeInNode(
  nodeId: string,
  options: { t?: number; dur?: number } = {}
): AnimStep[] {
  const t = options.t || 0;
  const dur = options.dur || DURATIONS.short;

  return [
    fade({ nodes: [nodeId] }, 0, { t, dur: 0 }),
    fade({ nodes: [nodeId] }, 1, { t, dur }),
  ];
}

/**
 * Fade out a node (e.g., for reset operations)
 */
export function fadeOutNode(
  nodeId: string,
  options: { t?: number; dur?: number } = {}
): AnimStep[] {
  const t = options.t || 0;
  const dur = options.dur || DURATIONS.short;

  return [
    fade({ nodes: [nodeId] }, 0, { t, dur }),
  ];
}

/**
 * Highlight multiple nodes in sequence
 * Creates a cascading highlight effect
 */
export function cascadeHighlight(
  nodeIds: string[],
  options: { t?: number; dur?: number; stagger?: number } = {}
): AnimStep[] {
  const t = options.t || 0;
  const dur = options.dur || DURATIONS.short;
  const stagger = options.stagger || DURATIONS.veryShort;

  const steps: AnimStep[] = [];
  
  nodeIds.forEach((nodeId, index) => {
    const startTime = t + index * stagger;
    steps.push(...highlightBranchTip(nodeId, { t: startTime, dur }));
  });

  return steps;
}

/**
 * Emphasize an edge (e.g., showing parent relationship)
 */
export function emphasizeEdge(
  edgeId: string,
  options: { t?: number; dur?: number } = {}
): AnimStep[] {
  const t = options.t || 0;
  const dur = options.dur || DURATIONS.medium;

  return [
    stroke({ edges: [edgeId] }, { color: 'var(--lgb-accent)', width: 4 }, { t, dur: dur / 2 }),
    stroke({ edges: [edgeId] }, { color: 'var(--lgb-edge)', width: 2 }, { t: t + dur / 2, dur: dur / 2 }),
  ];
}

/**
 * Animation types and constants for LGB mode
 * Provides declarative animation primitives with A11y support
 */

/**
 * Standard duration presets (ms)
 * Respects prefers-reduced-motion via CSS variables
 */
export const DURATIONS = {
  veryShort: 120,
  short: 220,
  medium: 320,
  long: 480,
} as const;

/**
 * Easing functions for smooth animations
 * Standard CSS easing keywords
 */
export const EASING = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
} as const;

/**
 * Animation target selector
 * Can target nodes, edges, or labels by ID
 */
export type AnimSelector = {
  nodes?: string[];
  edges?: string[];
  labels?: string[];
};

/**
 * Animation operation types
 */
export type AnimOp = 
  | 'fade'           // opacity change
  | 'move'           // position change
  | 'pulse'          // scale pulse
  | 'stroke'         // stroke color/width change
  | 'classAdd'       // add CSS class
  | 'classRemove';   // remove CSS class

/**
 * Animation target values
 * Type depends on the operation
 */
export type AnimTarget = 
  | number                              // for opacity, scale
  | { x?: number; y?: number }          // for move
  | { color?: string; width?: number }  // for stroke
  | string;                             // for class names

/**
 * Single animation step
 * Defines what to animate, when, and how
 */
export type AnimStep = {
  /** Start time in ms from scene start */
  t: number;
  /** Elements to animate */
  sel: AnimSelector;
  /** Animation operation type */
  op: AnimOp;
  /** Target value(s) for the animation */
  to?: AnimTarget;
  /** Duration in ms (defaults to DURATIONS.short) */
  dur?: number;
  /** Easing function (defaults to EASING.easeInOut) */
  easing?: string;
};

/**
 * Complete animation scene
 * Represents a single Git operation (commit, merge, etc.)
 */
export type AnimScene = {
  /** Human-readable scene name for A11y announcements */
  name: string;
  /** Total duration in ms */
  total: number;
  /** Ordered list of animation steps */
  steps: AnimStep[];
  /** Optional description for screen readers */
  description?: string;
};

/**
 * Animation playback state
 */
export type AnimState = 
  | 'idle'      // not playing
  | 'playing'   // currently animating
  | 'paused'    // paused mid-animation
  | 'cancelled'; // cancelled and reset

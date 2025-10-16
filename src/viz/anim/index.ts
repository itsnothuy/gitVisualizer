/**
 * Animation core exports for LGB mode
 * Central export point for all animation functionality
 */

// Core types and constants
export {
  DURATIONS,
  EASING,
  type AnimSelector,
  type AnimOp,
  type AnimTarget,
  type AnimStep,
  type AnimScene,
  type AnimState,
} from './types';

// Animation engine
export {
  AnimationEngine,
  buildScene,
  type EngineOptions,
} from './engine';

// Selectors
export {
  selectNodes,
  selectEdges,
  selectLabels,
  selectMultiple,
  getElements,
  hasElements,
} from './selectors';

// Primitives
export {
  fade,
  move,
  pulse,
  stroke,
  classAdd,
  classRemove,
  highlightBranchTip,
  moveBranchLabel,
  ghostNode,
  tempDashedEdge,
  fadeInNode,
  fadeOutNode,
  cascadeHighlight,
  emphasizeEdge,
} from './primitives';

// Pre-built scenes
export {
  sceneCommit,
  sceneBranchCreate,
  sceneCheckout,
} from './scenes/core';

// React hook
export {
  useAnimation,
  type UseAnimationOptions,
  type UseAnimationReturn,
} from './useAnimation';

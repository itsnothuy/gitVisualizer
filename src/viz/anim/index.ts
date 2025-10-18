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
  sceneBranchDelete,
  sceneCheckout,
  sceneFastForward,
  sceneMerge2P,
  sceneReset,
  sceneRevert,
} from './scenes/core';

// React hook
export {
  useAnimation,
  type UseAnimationOptions,
  type UseAnimationReturn,
} from './useAnimation';

// Mapper for Git operations to scenes
export {
  mapDiffToScene,
  findIntermediateCommits,
  type GitOperation,
  type GitNode,
  type GitRef,
  type GitState,
  type GitDiff,
} from './mapper';

// Animation Factory
export {
  AnimationFactory,
  BOUNCE_EASING,
  SMOOTH_EASING,
  type Position,
  type CommitBirthOptions,
  type BranchMoveOptions,
  type MergeOptions,
  type RebaseOptions,
  type ResetOptions,
  type RevertOptions,
} from './AnimationFactory';

// Animation Queue
export {
  AnimationQueue,
  createAnimationQueue,
  type QueueOptions,
  type QueueState,
} from './AnimationQueue';

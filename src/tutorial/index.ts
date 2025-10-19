/**
 * Tutorial System - Main exports
 */

// Types
export type {
  Level,
  LevelSequence,
  TutorialStep,
  DialogTutorialStep,
  DemonstrationTutorialStep,
  ChallengeTutorialStep,
  TutorialState,
  UserProgress,
  LevelProgress,
  ValidationResult,
  LocalizedContent,
  LocalizedContentArray,
} from './types';

// Core functionality
export { TutorialEngine, getTutorialEngine, resetTutorialEngine } from './TutorialEngine';
export {
  loadLevel,
  loadSequence,
  getAllSequences,
  getLevelsForSequence,
  clearCache,
  preloadSequence,
} from './LevelStore';
export {
  loadProgress,
  saveProgress,
  createInitialProgress,
  updateLevelProgress,
  isLevelCompleted,
  isSequenceUnlocked,
  unlockSequence,
  getSequenceStats,
  clearProgress,
} from './ProgressTracker';
export { validateSolution, quickValidate } from './validator';
export { stateToSnapshot, snapshotToState, cloneState } from './stateUtils';

// Components
export { TutorialDialog } from '../components/tutorial/TutorialDialog';
export { GitDemonstrationView } from '../components/tutorial/GitDemonstrationView';
export { TutorialManager } from '../components/tutorial/TutorialManager';

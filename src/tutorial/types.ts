/**
 * Type definitions for the Tutorial System
 * Defines level structure, tutorial steps, and progress tracking
 */

import type { GitState } from '@/cli/types';

/**
 * Localized content structure
 * Keys are locale identifiers (e.g., 'en_US', 'de_DE')
 */
export type LocalizedContent = Record<string, string>;

/**
 * Localized array content (for multi-paragraph content)
 */
export type LocalizedContentArray = Record<string, string[]>;

/**
 * Tutorial step type
 */
export type TutorialStepType = 'dialog' | 'demonstration' | 'challenge';

/**
 * Base tutorial step interface
 */
interface BaseTutorialStep {
  type: TutorialStepType;
  /** Step identifier */
  id: string;
}

/**
 * Dialog tutorial step - shows instructional content
 */
export interface DialogTutorialStep extends BaseTutorialStep {
  type: 'dialog';
  /** Dialog title (localized) */
  title: LocalizedContent;
  /** Dialog content (localized, can be markdown) */
  content: LocalizedContentArray;
}

/**
 * Demonstration tutorial step - shows Git operation in action
 */
export interface DemonstrationTutorialStep extends BaseTutorialStep {
  type: 'demonstration';
  /** Text before demonstration (localized) */
  beforeText: LocalizedContentArray;
  /** Commands to set up the demo state */
  setupCommands: string[];
  /** Command to demonstrate */
  demonstrationCommand: string;
  /** Text after demonstration (localized) */
  afterText: LocalizedContentArray;
}

/**
 * Challenge tutorial step - user must complete a task
 */
export interface ChallengeTutorialStep extends BaseTutorialStep {
  type: 'challenge';
  /** Challenge instructions (localized) */
  instructions: LocalizedContentArray;
  /** Hints for the user (localized, multiple levels) */
  hints: LocalizedContentArray[];
}

/**
 * Union type for all tutorial steps
 */
export type TutorialStep =
  | DialogTutorialStep
  | DemonstrationTutorialStep
  | ChallengeTutorialStep;

/**
 * Level difficulty
 */
export type LevelDifficulty = 'intro' | 'beginner' | 'intermediate' | 'advanced';

/**
 * Level definition
 */
export interface Level {
  /** Unique level identifier */
  id: string;
  /** Level name (localized) */
  name: LocalizedContent;
  /** Level description (localized) */
  description: LocalizedContent;
  /** Difficulty level */
  difficulty: LevelDifficulty;
  /** Order within sequence */
  order: number;
  /** Initial Git state for the level */
  initialState: GitStateSnapshot;
  /** Goal Git state to achieve */
  goalState: GitStateSnapshot;
  /** Tutorial steps to guide the user */
  tutorialSteps: TutorialStep[];
  /** Optimal solution commands */
  solutionCommands: string[];
  /** Level-specific hints (localized) */
  hints: LocalizedContentArray[];
  /** Level flags/options */
  flags?: LevelFlags;
}

/**
 * Serialized Git state (JSON-serializable)
 */
export interface GitStateSnapshot {
  commits: SerializedCommit[];
  branches: SerializedBranch[];
  tags: SerializedTag[];
  head: SerializedHead;
}

/**
 * Serialized commit
 */
export interface SerializedCommit {
  id: string;
  parents: string[];
  message: string;
  author?: string;
  timestamp: number;
}

/**
 * Serialized branch
 */
export interface SerializedBranch {
  name: string;
  target: string;
}

/**
 * Serialized tag
 */
export interface SerializedTag {
  name: string;
  target: string;
  message?: string;
}

/**
 * Serialized HEAD state
 */
export type SerializedHead =
  | { type: 'branch'; name: string }
  | { type: 'detached'; commit: string };

/**
 * Level flags/options
 */
export interface LevelFlags {
  /** Only compare main branch (ignore other branches) */
  compareOnlyMain?: boolean;
  /** Allow any solution (for sandbox levels) */
  allowAnySolution?: boolean;
  /** Disable hints */
  disableHints?: boolean;
  /** Time limit in seconds (optional) */
  timeLimit?: number;
}

/**
 * Level sequence (collection of related levels)
 */
export interface LevelSequence {
  /** Sequence identifier */
  id: string;
  /** Sequence name (localized) */
  name: LocalizedContent;
  /** Sequence description (localized) */
  description: LocalizedContent;
  /** Level IDs in order */
  levelIds: string[];
  /** Whether sequence is locked by default */
  locked?: boolean;
}

/**
 * User progress for a level
 */
export interface LevelProgress {
  /** Level ID */
  levelId: string;
  /** Whether level is completed */
  completed: boolean;
  /** Number of commands used */
  commandsUsed?: number;
  /** Optimal number of commands */
  optimalCommands?: number;
  /** Best score (commands used) */
  bestScore?: number;
  /** Completion timestamp */
  completedAt?: number;
  /** Number of hints used */
  hintsUsed?: number;
}

/**
 * User progress across all levels
 */
export interface UserProgress {
  /** User identifier (can be anonymous) */
  userId: string;
  /** Current locale */
  locale: string;
  /** Current sequence ID */
  currentSequence?: string;
  /** Current level ID */
  currentLevel?: string;
  /** Progress per level */
  levels: Map<string, LevelProgress>;
  /** Unlocked sequences */
  unlockedSequences: Set<string>;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Tutorial engine state
 */
export interface TutorialState {
  /** Current level */
  currentLevel: Level | null;
  /** Current step index */
  currentStepIndex: number;
  /** Current user state */
  userState: GitState;
  /** Command history for current level */
  commandHistory: string[];
  /** Whether tutorial is active */
  active: boolean;
  /** Current hint index */
  currentHintIndex: number;
}

/**
 * Solution validation result
 */
export interface ValidationResult {
  /** Whether the solution is correct */
  valid: boolean;
  /** Validation message */
  message: string;
  /** Git golf score (commands used vs optimal) */
  score?: {
    commandsUsed: number;
    optimalCommands: number;
    efficiency: number; // percentage
  };
  /** Detailed differences (if not valid) */
  differences?: string[];
}

/**
 * Level load result
 */
export type LevelLoadResult =
  | { success: true; level: Level }
  | { success: false; error: string };

/**
 * Progress save result
 */
export type ProgressSaveResult =
  | { success: true }
  | { success: false; error: string };

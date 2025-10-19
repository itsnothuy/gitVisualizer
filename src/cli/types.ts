/**
 * Type definitions for the command system
 * Defines command structures, Git state, and operation types
 */

/**
 * Parsed command structure
 */
export interface ParsedCommand {
  /** Command name (e.g., 'commit', 'branch', 'checkout') */
  name: string;
  /** Positional arguments */
  args: string[];
  /** Named options/flags */
  options: Record<string, string | boolean>;
}

/**
 * Command parser result
 */
export type CommandParseResult =
  | { success: true; command: ParsedCommand }
  | { success: false; error: string };

/**
 * Git commit node
 */
export interface GitCommit {
  /** SHA hash */
  id: string;
  /** Parent commit IDs */
  parents: string[];
  /** Commit message */
  message: string;
  /** Author name */
  author?: string;
  /** Timestamp */
  timestamp: number;
  /** Tree SHA (for real repos) */
  tree?: string;
}

/**
 * Git branch reference
 */
export interface GitBranch {
  /** Branch name */
  name: string;
  /** Commit ID it points to */
  target: string;
}

/**
 * Git tag reference
 */
export interface GitTag {
  /** Tag name */
  name: string;
  /** Commit ID it points to */
  target: string;
  /** Tag message */
  message?: string;
}

/**
 * HEAD state
 */
export type HeadState =
  | { type: 'branch'; name: string }
  | { type: 'detached'; commit: string };

/**
 * Complete Git state snapshot
 * Used for both sandbox and real repo modes
 */
export interface GitState {
  /** Map of commit ID to commit */
  commits: Map<string, GitCommit>;
  /** Map of branch name to branch */
  branches: Map<string, GitBranch>;
  /** Map of tag name to tag */
  tags: Map<string, GitTag>;
  /** Current HEAD state */
  head: HeadState;
  /** Staging area (for real repos) */
  staging?: Set<string>;
  /** Remote tracking branches */
  remotes?: Map<string, Map<string, string>>;
}

/**
 * Git operation result
 */
export type GitOperationResult =
  | { success: true; message: string; newState: GitState }
  | { success: false; error: string };

/**
 * Command execution context
 */
export interface CommandContext {
  /** Current Git state */
  state: GitState;
  /** Whether we're in sandbox mode */
  sandboxMode: boolean;
  /** Optional repo directory for real repos */
  repoDir?: FileSystemDirectoryHandle;
}

/**
 * Command execution result
 */
export interface CommandResult {
  /** Whether the command succeeded */
  success: boolean;
  /** Output message or error */
  message: string;
  /** Updated Git state (if successful) */
  newState?: GitState;
  /** Whether this operation should trigger an animation */
  animate?: boolean;
  /** Animation type hint */
  animationType?: string;
}

/**
 * Undo/Redo stack entry
 */
export interface HistoryEntry {
  /** State before the operation */
  state: GitState;
  /** Command that was executed */
  command: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Command history for undo/redo
 */
export interface CommandHistory {
  /** Stack of previous states */
  undoStack: HistoryEntry[];
  /** Stack of undone states (for redo) */
  redoStack: HistoryEntry[];
  /** Maximum history size */
  maxSize: number;
}

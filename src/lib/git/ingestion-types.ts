/**
 * Shared types for cross-browser Git repository ingestion.
 * 
 * These types provide a unified interface for different ingestion methods:
 * - File System Access API (Chrome/Edge)
 * - Directory input fallback (Firefox/Safari)
 * - ZIP upload fallback (all browsers)
 */

/**
 * Normalized file representation for ingestion pipeline
 */
export interface IngestFile {
  /** Relative path within the repository (e.g., "src/index.ts", ".git/config") */
  path: string;
  /** File content as Blob or Uint8Array */
  content: Blob | Uint8Array;
}

/**
 * Progress information for ingestion operations
 */
export interface IngestProgress {
  /** Total number of files to process */
  total: number;
  /** Number of files processed so far */
  current: number;
  /** Current operation description */
  message: string;
  /** Progress percentage (0-100) */
  percentage: number;
}

/**
 * Result of an ingestion operation
 */
export interface IngestResult {
  /** List of files ingested */
  files: IngestFile[];
  /** Repository name (extracted from directory or ZIP) */
  name: string;
  /** Total size in bytes */
  totalSize: number;
  /** Error if ingestion failed */
  error?: IngestError;
  /** LFS analysis result (if enabled) */
  lfsAnalysis?: LFSAnalysisResult;
}

/**
 * LFS analysis result (imported from lfs-hygiene module)
 * Re-exported here for convenience
 */
export interface LFSAnalysisResult {
  largeFiles: Array<{
    path: string;
    size: number;
    extension: string;
    severity: 'warning' | 'critical';
    lfsPointer?: {
      version: string;
      oid: string;
      size: number;
      isValid: boolean;
    };
  }>;
  totalLargeFileSize: number;
  lfsFiles: Array<{
    path: string;
    size: number;
    extension: string;
    severity: 'warning' | 'critical';
    lfsPointer?: {
      version: string;
      oid: string;
      size: number;
      isValid: boolean;
    };
  }>;
  filesByExtension: Record<string, Array<{
    path: string;
    size: number;
    extension: string;
    severity: 'warning' | 'critical';
  }>>;
  warningThreshold: number;
  criticalThreshold: number;
}

/**
 * Error types for ingestion failures
 */
export type IngestErrorType =
  | 'unsupported-browser'
  | 'user-cancelled'
  | 'permission-denied'
  | 'invalid-git-repo'
  | 'file-too-large'
  | 'invalid-zip'
  | 'decompress-failed'
  | 'read-failed'
  | 'unknown';

/**
 * Detailed error information for ingestion failures
 */
export interface IngestError {
  type: IngestErrorType;
  message: string;
  details?: unknown;
}

/**
 * Capabilities supported by the current browser
 */
export interface BrowserCapabilities {
  /** File System Access API support (showDirectoryPicker) */
  fileSystemAccess: boolean;
  /** Directory input support (webkitdirectory) */
  directoryInput: boolean;
  /** File input support */
  fileInput: boolean;
  /** Web Workers support */
  webWorkers: boolean;
  /** IndexedDB support */
  indexedDB: boolean;
}

/**
 * Options for directory input ingestion
 */
export interface DirectoryInputOptions {
  /** Maximum total size in bytes (default: 500MB) */
  maxSize?: number;
  /** Maximum number of files (default: 50000) */
  maxFiles?: number;
  /** Progress callback */
  onProgress?: (progress: IngestProgress) => void;
  /** Cancellation signal */
  signal?: AbortSignal;
  /** Enable LFS hygiene analysis (default: true) */
  analyzeLFS?: boolean;
  /** LFS warning threshold in bytes (default: 50MB) */
  lfsWarningThreshold?: number;
  /** LFS critical threshold in bytes (default: 100MB) */
  lfsCriticalThreshold?: number;
}

/**
 * Options for ZIP upload ingestion
 */
export interface ZipInputOptions {
  /** Maximum ZIP size in bytes (default: 500MB) */
  maxSize?: number;
  /** Progress callback */
  onProgress?: (progress: IngestProgress) => void;
  /** Cancellation signal */
  signal?: AbortSignal;
  /** Enable LFS hygiene analysis (default: true) */
  analyzeLFS?: boolean;
  /** LFS warning threshold in bytes (default: 50MB) */
  lfsWarningThreshold?: number;
  /** LFS critical threshold in bytes (default: 100MB) */
  lfsCriticalThreshold?: number;
}

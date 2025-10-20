/**
 * Directory Input Fallback for Cross-Browser Ingestion
 * 
 * Provides directory ingestion using <input type="file" webkitdirectory>
 * for browsers that don't support File System Access API (Firefox, Safari).
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#webkitdirectory
 */

import type {
  IngestFile,
  IngestResult,
  IngestProgress,
  DirectoryInputOptions,
} from '../ingestion-types';
import { analyzeFiles, DEFAULT_WARNING_THRESHOLD, DEFAULT_CRITICAL_THRESHOLD } from '../lfs-hygiene';

/**
 * Default maximum size: 500MB
 */
const DEFAULT_MAX_SIZE = 500 * 1024 * 1024;

/**
 * Default maximum files: 50,000
 */
const DEFAULT_MAX_FILES = 50000;

/**
 * Prompt user to select a directory using input[webkitdirectory]
 * 
 * @param options Configuration options
 * @returns Promise resolving to ingestion result
 */
export async function selectDirectoryInput(
  options: DirectoryInputOptions = {}
): Promise<IngestResult> {
  const {
    maxSize = DEFAULT_MAX_SIZE,
    maxFiles = DEFAULT_MAX_FILES,
    onProgress,
    signal,
    analyzeLFS = true,
    lfsWarningThreshold = DEFAULT_WARNING_THRESHOLD,
    lfsCriticalThreshold = DEFAULT_CRITICAL_THRESHOLD,
  } = options;

  return new Promise((resolve, reject) => {
    // Create hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    
    // Set webkitdirectory attribute for directory selection
    (input as HTMLInputElement & { webkitdirectory: boolean }).webkitdirectory = true;
    (input as HTMLInputElement & { directory: boolean }).directory = true;
    input.multiple = true;

    // Handle cancellation
    if (signal) {
      signal.addEventListener('abort', () => {
        document.body.removeChild(input);
        reject({
          type: 'user-cancelled',
          message: 'Directory selection was cancelled.',
        });
      });
    }

    // Handle file selection
    input.addEventListener('change', async () => {
      try {
        if (!input.files || input.files.length === 0) {
          document.body.removeChild(input);
          reject({
            type: 'user-cancelled',
            message: 'No directory was selected.',
          });
          return;
        }

        const files = Array.from(input.files);
        document.body.removeChild(input);

        // Validate file count
        if (files.length > maxFiles) {
          reject({
            type: 'file-too-large',
            message: `Directory contains too many files (${files.length}). Maximum is ${maxFiles}.`,
          });
          return;
        }

        // Process files
        const result = await processDirectoryFiles(files, {
          maxSize,
          onProgress,
          signal,
          analyzeLFS,
          lfsWarningThreshold,
          lfsCriticalThreshold,
        });

        resolve(result);
      } catch (error) {
        document.body.removeChild(input);
        reject({
          type: 'read-failed',
          message: error instanceof Error ? error.message : 'Failed to read directory',
          details: error,
        });
      }
    });

    // Handle cancellation (user closes picker without selecting)
    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      reject({
        type: 'user-cancelled',
        message: 'Directory selection was cancelled.',
      });
    });

    // Add to DOM and trigger click
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Process files from directory input into ingestion result
 */
async function processDirectoryFiles(
  files: File[],
  options: {
    maxSize: number;
    onProgress?: (progress: IngestProgress) => void;
    signal?: AbortSignal;
    analyzeLFS?: boolean;
    lfsWarningThreshold?: number;
    lfsCriticalThreshold?: number;
  }
): Promise<IngestResult> {
  const { 
    maxSize, 
    onProgress, 
    signal,
    analyzeLFS = true,
    lfsWarningThreshold = DEFAULT_WARNING_THRESHOLD,
    lfsCriticalThreshold = DEFAULT_CRITICAL_THRESHOLD,
  } = options;

  // Extract repository name from first file's path
  const firstPath = files[0]?.webkitRelativePath || files[0]?.name || 'repository';
  const repoName = firstPath.split('/')[0] || 'repository';

  // Calculate total size
  let totalSize = 0;
  for (const file of files) {
    totalSize += file.size;
  }

  // Validate total size
  if (totalSize > maxSize) {
    throw {
      type: 'file-too-large',
      message: `Directory is too large (${formatBytes(totalSize)}). Maximum is ${formatBytes(maxSize)}.`,
    };
  }

  // Check if it's a valid Git repository
  const hasGitDir = files.some(
    (f) => f.webkitRelativePath?.includes('/.git/') || f.name === '.git'
  );

  if (!hasGitDir) {
    throw {
      type: 'invalid-git-repo',
      message: 'The selected directory does not appear to be a Git repository (no .git directory found).',
    };
  }

  // Process files
  const ingestFiles: IngestFile[] = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    // Check for cancellation
    if (signal?.aborted) {
      throw {
        type: 'user-cancelled',
        message: 'Processing was cancelled.',
      };
    }

    const file = files[i];
    
    // Get relative path (remove repository root directory)
    const fullPath = file.webkitRelativePath || file.name;
    const pathParts = fullPath.split('/');
    pathParts.shift(); // Remove repository root directory
    const relativePath = pathParts.join('/');

    // Read file content
    const content = await file.arrayBuffer().then((buf) => new Uint8Array(buf));

    ingestFiles.push({
      path: relativePath,
      content,
    });

    // Report progress
    if (onProgress && (i % 10 === 0 || i === total - 1)) {
      onProgress({
        total,
        current: i + 1,
        message: `Processing ${relativePath}...`,
        percentage: Math.round(((i + 1) / total) * 100),
      });
    }
  }

  // Perform LFS analysis if enabled
  let lfsAnalysis;
  if (analyzeLFS) {
    const filesForAnalysis = ingestFiles.map(f => ({
      path: f.path,
      size: f.content instanceof Uint8Array ? f.content.length : (f.content as Blob).size,
      content: f.content,
    }));

    lfsAnalysis = await analyzeFiles(filesForAnalysis, {
      warningThreshold: lfsWarningThreshold,
      criticalThreshold: lfsCriticalThreshold,
    });
  }

  return {
    files: ingestFiles,
    name: repoName,
    totalSize,
    lfsAnalysis,
  };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

/**
 * Validate that directory input is supported
 */
export function isDirectoryInputSupported(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  
  const input = document.createElement('input');
  return 'webkitdirectory' in input || 'directory' in input;
}

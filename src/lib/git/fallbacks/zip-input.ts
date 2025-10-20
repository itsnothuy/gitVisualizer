/**
 * ZIP Upload Fallback for Cross-Browser Ingestion
 * 
 * Provides ZIP file ingestion as a universal fallback for all browsers.
 * Uses a Web Worker for asynchronous decompression to prevent UI freezing.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker
 */

import type {
  IngestFile,
  IngestResult,
  IngestProgress,
  ZipInputOptions,
} from '../ingestion-types';

/**
 * Default maximum ZIP size: 500MB
 */
const DEFAULT_MAX_SIZE = 500 * 1024 * 1024;

/**
 * Worker message types
 */
interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  requestId: string;
  data?: {
    files: Array<{ path: string; content: Uint8Array }>;
    totalSize: number;
  };
  progress?: {
    current: number;
    total: number;
    message: string;
  };
  error?: {
    type: string;
    message: string;
  };
}

/**
 * Prompt user to select a ZIP file
 * 
 * @param options Configuration options
 * @returns Promise resolving to ingestion result
 */
export async function selectZipFile(
  options: ZipInputOptions = {}
): Promise<IngestResult> {
  const {
    maxSize = DEFAULT_MAX_SIZE,
    onProgress,
    signal,
  } = options;

  return new Promise((resolve, reject) => {
    // Create hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,application/zip,application/x-zip-compressed';
    input.style.display = 'none';

    // Handle cancellation
    if (signal) {
      signal.addEventListener('abort', () => {
        document.body.removeChild(input);
        reject({
          type: 'user-cancelled',
          message: 'ZIP file selection was cancelled.',
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
            message: 'No ZIP file was selected.',
          });
          return;
        }

        const file = input.files[0];
        document.body.removeChild(input);

        // Validate file size
        if (file.size > maxSize) {
          reject({
            type: 'file-too-large',
            message: `ZIP file is too large (${formatBytes(file.size)}). Maximum is ${formatBytes(maxSize)}.`,
          });
          return;
        }

        // Validate file type
        if (!file.name.endsWith('.zip') && file.type !== 'application/zip') {
          reject({
            type: 'invalid-zip',
            message: 'Selected file is not a valid ZIP file.',
          });
          return;
        }

        // Process ZIP file
        const result = await processZipFile(file, {
          onProgress,
          signal,
        });

        resolve(result);
      } catch (error) {
        document.body.removeChild(input);
        reject(error);
      }
    });

    // Handle cancellation (user closes picker without selecting)
    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      reject({
        type: 'user-cancelled',
        message: 'ZIP file selection was cancelled.',
      });
    });

    // Add to DOM and trigger click
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Process ZIP file using Web Worker
 */
async function processZipFile(
  file: File,
  options: {
    onProgress?: (progress: IngestProgress) => void;
    signal?: AbortSignal;
  }
): Promise<IngestResult> {
  const { onProgress, signal } = options;

  // Read file as ArrayBuffer
  onProgress?.({
    total: 100,
    current: 10,
    message: 'Reading ZIP file...',
    percentage: 10,
  });

  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // Create worker
  const worker = new Worker(new URL('../../workers/zip-worker.ts', import.meta.url), {
    type: 'module',
  });

  const requestId = Math.random().toString(36).substring(7);

  return new Promise((resolve, reject) => {
    // Handle cancellation
    const abortHandler = () => {
      worker.terminate();
      reject({
        type: 'user-cancelled',
        message: 'ZIP processing was cancelled.',
      });
    };

    if (signal) {
      signal.addEventListener('abort', abortHandler);
    }

    // Handle worker messages
    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;

      if (response.requestId !== requestId) {
        return;
      }

      if (response.type === 'progress' && response.progress) {
        onProgress?.({
          total: response.progress.total,
          current: response.progress.current,
          message: response.progress.message,
          percentage: Math.round((response.progress.current / response.progress.total) * 100),
        });
      } else if (response.type === 'complete' && response.data) {
        // Clean up
        worker.terminate();
        if (signal) {
          signal.removeEventListener('abort', abortHandler);
        }

        // Extract repository name from ZIP
        const files = response.data.files;
        const repoName = extractRepoName(files);

        // Check if it's a valid Git repository
        const hasGitDir = files.some((f) => f.path.includes('/.git/') || f.path === '.git');
        if (!hasGitDir) {
          reject({
            type: 'invalid-git-repo',
            message: 'The ZIP file does not appear to contain a Git repository (no .git directory found).',
          });
          return;
        }

        // Normalize paths (remove repository root directory)
        const normalizedFiles: IngestFile[] = files.map((f) => {
          const pathParts = f.path.split('/');
          if (pathParts.length > 1) {
            pathParts.shift(); // Remove repository root
          }
          return {
            path: pathParts.join('/'),
            content: f.content,
          };
        });

        resolve({
          files: normalizedFiles,
          name: repoName,
          totalSize: response.data.totalSize,
        });
      } else if (response.type === 'error' && response.error) {
        // Clean up
        worker.terminate();
        if (signal) {
          signal.removeEventListener('abort', abortHandler);
        }

        reject({
          type: response.error.type,
          message: response.error.message,
        });
      }
    });

    // Handle worker errors
    worker.addEventListener('error', (error) => {
      worker.terminate();
      if (signal) {
        signal.removeEventListener('abort', abortHandler);
      }

      reject({
        type: 'decompress-failed',
        message: error.message || 'Failed to decompress ZIP file',
        details: error,
      });
    });

    // Start decompression
    onProgress?.({
      total: 100,
      current: 30,
      message: 'Decompressing ZIP file...',
      percentage: 30,
    });

    worker.postMessage({
      type: 'decompress',
      data,
      requestId,
    });
  });
}

/**
 * Extract repository name from file paths
 */
function extractRepoName(files: Array<{ path: string; content: Uint8Array }>): string {
  if (files.length === 0) {
    return 'repository';
  }

  // Get first path component
  const firstPath = files[0].path;
  const firstComponent = firstPath.split('/')[0];
  return firstComponent || 'repository';
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
 * Check if Web Workers are supported
 */
export function isWebWorkersSupported(): boolean {
  return typeof window !== 'undefined' && 'Worker' in window;
}

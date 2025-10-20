/**
 * Web Worker for ZIP File Decompression
 * 
 * Performs asynchronous ZIP decompression off the main thread
 * to prevent UI freezing during large file processing.
 * 
 * Uses fflate for efficient streaming decompression.
 */

import { unzip, Unzipped } from 'fflate';

/**
 * Message types from main thread
 */
interface WorkerRequest {
  type: 'decompress';
  data: Uint8Array;
  requestId: string;
}

/**
 * Message types to main thread
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

// Handle messages from main thread
self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { type, data, requestId } = event.data;

  if (type === 'decompress') {
    try {
      await decompressZip(data, requestId);
    } catch (error) {
      const response: WorkerResponse = {
        type: 'error',
        requestId,
        error: {
          type: 'decompress-failed',
          message: error instanceof Error ? error.message : 'Failed to decompress ZIP file',
        },
      };
      self.postMessage(response);
    }
  }
});

/**
 * Decompress ZIP file and send results back to main thread
 */
async function decompressZip(data: Uint8Array, requestId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Use fflate's unzip function
    unzip(data, (error: Error | null, unzipped: Unzipped) => {
      if (error) {
        reject(error);
        return;
      }

      try {
        // Convert unzipped files to our format
        const files: Array<{ path: string; content: Uint8Array }> = [];
        let totalSize = 0;
        const entries = Object.entries(unzipped);

        for (const [path, content] of entries) {
          // Skip directories (they end with /)
          if (path.endsWith('/')) {
            continue;
          }

          // Type guard to ensure content is Uint8Array
          if (content instanceof Uint8Array) {
            files.push({ path, content });
            totalSize += content.length;
          }
        }

        // Send progress update
        const progressResponse: WorkerResponse = {
          type: 'progress',
          requestId,
          progress: {
            current: files.length,
            total: files.length,
            message: `Decompressed ${files.length} files`,
          },
        };
        self.postMessage(progressResponse);

        // Send complete message
        const completeResponse: WorkerResponse = {
          type: 'complete',
          requestId,
          data: {
            files,
            totalSize,
          },
        };
        self.postMessage(completeResponse);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

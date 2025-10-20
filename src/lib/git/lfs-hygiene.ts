/**
 * Git LFS Hygiene & Large Binary Detection
 * 
 * Provides local-first analysis of large files and Git LFS pointer detection.
 * No data leaves the device; all processing is client-side.
 * 
 * @see https://git-lfs.github.com/spec/v1
 * @see https://docs.github.com/en/repositories/working-with-files/managing-large-files
 */

/**
 * Default threshold for warning about large files: 50 MB
 */
export const DEFAULT_WARNING_THRESHOLD = 50 * 1024 * 1024;

/**
 * Default threshold for critical warning about large files: 100 MB
 */
export const DEFAULT_CRITICAL_THRESHOLD = 100 * 1024 * 1024;

/**
 * Git LFS pointer file specification
 * @see https://github.com/git-lfs/git-lfs/blob/main/docs/spec.md
 */
export interface LFSPointer {
  /** Always "https://git-lfs.github.com/spec/v1" */
  version: string;
  /** SHA256 OID of the actual file */
  oid: string;
  /** Size of the actual file in bytes */
  size: number;
  /** True if this is a valid LFS pointer */
  isValid: boolean;
}

/**
 * Information about a large file detected during ingestion
 */
export interface LargeFileInfo {
  /** Relative path within the repository */
  path: string;
  /** File size in bytes */
  size: number;
  /** File extension (e.g., ".png", ".zip") */
  extension: string;
  /** Severity level based on size thresholds */
  severity: 'warning' | 'critical';
  /** LFS pointer information if the file is an LFS pointer */
  lfsPointer?: LFSPointer;
}

/**
 * Analysis result for repository files
 */
export interface LFSAnalysisResult {
  /** List of large files found */
  largeFiles: LargeFileInfo[];
  /** Total size of large files */
  totalLargeFileSize: number;
  /** Files managed by Git LFS (valid pointers) */
  lfsFiles: LargeFileInfo[];
  /** Grouped by file extension for remediation suggestions */
  filesByExtension: Record<string, LargeFileInfo[]>;
  /** Warning threshold used */
  warningThreshold: number;
  /** Critical threshold used */
  criticalThreshold: number;
}

/**
 * Configuration for LFS analysis
 */
export interface LFSAnalysisOptions {
  /** Warning threshold in bytes (default: 50MB) */
  warningThreshold?: number;
  /** Critical threshold in bytes (default: 100MB) */
  criticalThreshold?: number;
  /** Paths to skip during analysis (e.g., ["node_modules/", ".git/"]) */
  skipPaths?: string[];
}

/**
 * Detect if file content is a Git LFS pointer.
 * 
 * LFS pointer files are small text files with specific format:
 * ```
 * version https://git-lfs.github.com/spec/v1
 * oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393
 * size 12345
 * ```
 * 
 * @param content File content as Blob, Uint8Array, or ArrayBuffer
 * @returns LFS pointer information if valid, undefined otherwise
 * 
 * @example
 * ```typescript
 * const content = new TextEncoder().encode(
 *   "version https://git-lfs.github.com/spec/v1\n" +
 *   "oid sha256:abc123...\n" +
 *   "size 1024\n"
 * );
 * const pointer = await detectLFSPointer(content);
 * if (pointer?.isValid) {
 *   console.log(`LFS file: ${pointer.oid}, ${pointer.size} bytes`);
 * }
 * ```
 */
export async function detectLFSPointer(
  content: Blob | Uint8Array | ArrayBuffer
): Promise<LFSPointer | undefined> {
  try {
    // Convert to text for parsing
    let text: string;
    
    if (content instanceof Blob) {
      // Small files only - LFS pointers are typically < 200 bytes
      if (content.size > 1024) {
        return undefined;
      }
      // Use FileReader for compatibility with test environments (jsdom)
      text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(content);
      });
    } else if (ArrayBuffer.isView(content)) {
      // Use ArrayBuffer.isView to handle Uint8Array and other typed arrays
      if (content.byteLength > 1024) {
        return undefined;
      }
      text = new TextDecoder().decode(content);
    } else if (content instanceof ArrayBuffer || content?.constructor?.name === 'ArrayBuffer') {
      // Check both instanceof and constructor name for cross-realm compatibility (jsdom)
      const buffer = content as ArrayBuffer;
      if (buffer.byteLength > 1024) {
        return undefined;
      }
      text = new TextDecoder().decode(new Uint8Array(buffer));
    } else {
      return undefined;
    }

    // Parse LFS pointer format
    const lines = text.trim().split('\n');
    
    // Must have at least 3 lines (version, oid, size)
    if (lines.length < 3) {
      return undefined;
    }

    // Parse version line
    const versionMatch = lines[0].match(/^version\s+(.+)$/);
    if (!versionMatch) {
      return undefined;
    }
    const version = versionMatch[1].trim();

    // Parse oid line
    const oidMatch = lines[1].match(/^oid\s+sha256:([a-f0-9]{64})$/);
    if (!oidMatch) {
      return undefined;
    }
    const oid = oidMatch[1];

    // Parse size line
    const sizeMatch = lines[2].match(/^size\s+(\d+)$/);
    if (!sizeMatch) {
      return undefined;
    }
    const size = parseInt(sizeMatch[1], 10);

    // Validate version
    const isValid = version === 'https://git-lfs.github.com/spec/v1';

    return {
      version,
      oid,
      size,
      isValid,
    };
  } catch {
    return undefined;
  }
}

/**
 * Analyze files for large binaries and LFS pointers.
 * 
 * @param files Array of files to analyze with path, size, and content
 * @param options Analysis configuration
 * @returns Analysis result with large files and LFS information
 * 
 * @example
 * ```typescript
 * const files = [
 *   { path: "video.mp4", size: 100_000_000, content: videoBlob },
 *   { path: "image.png", size: 60_000_000, content: imageBlob },
 * ];
 * const result = await analyzeFiles(files);
 * console.log(`Found ${result.largeFiles.length} large files`);
 * ```
 */
export async function analyzeFiles(
  files: Array<{ path: string; size: number; content: Blob | Uint8Array | ArrayBuffer }>,
  options: LFSAnalysisOptions = {}
): Promise<LFSAnalysisResult> {
  const {
    warningThreshold = DEFAULT_WARNING_THRESHOLD,
    criticalThreshold = DEFAULT_CRITICAL_THRESHOLD,
    skipPaths = ['.git/', 'node_modules/'],
  } = options;

  const largeFiles: LargeFileInfo[] = [];
  const lfsFiles: LargeFileInfo[] = [];
  const filesByExtension: Record<string, LargeFileInfo[]> = {};
  let totalLargeFileSize = 0;

  for (const file of files) {
    // Skip excluded paths
    if (skipPaths.some((skip) => file.path.startsWith(skip))) {
      continue;
    }

    // Check if file exceeds thresholds
    const isLarge = file.size >= warningThreshold;
    const isCritical = file.size >= criticalThreshold;

    if (!isLarge && !isCritical) {
      continue;
    }

    // Extract file extension
    const lastDot = file.path.lastIndexOf('.');
    const extension = lastDot !== -1 ? file.path.substring(lastDot) : '';

    // Check for LFS pointer
    const lfsPointer = await detectLFSPointer(file.content);

    const fileInfo: LargeFileInfo = {
      path: file.path,
      size: file.size,
      extension,
      severity: isCritical ? 'critical' : 'warning',
      lfsPointer,
    };

    largeFiles.push(fileInfo);
    totalLargeFileSize += file.size;

    // Group by extension
    if (!filesByExtension[extension]) {
      filesByExtension[extension] = [];
    }
    filesByExtension[extension].push(fileInfo);

    // Track LFS files separately
    if (lfsPointer?.isValid) {
      lfsFiles.push(fileInfo);
    }
  }

  return {
    largeFiles,
    totalLargeFileSize,
    lfsFiles,
    filesByExtension,
    warningThreshold,
    criticalThreshold,
  };
}

/**
 * Generate .gitattributes patterns for common large file types.
 * 
 * @param extensions Array of file extensions (with dots, e.g., [".png", ".mp4"])
 * @returns Suggested .gitattributes patterns
 * 
 * @example
 * ```typescript
 * const patterns = generateLFSPatterns([".png", ".mp4", ".zip"]);
 * console.log(patterns);
 * // Output:
 * // *.png filter=lfs diff=lfs merge=lfs -text
 * // *.mp4 filter=lfs diff=lfs merge=lfs -text
 * // *.zip filter=lfs diff=lfs merge=lfs -text
 * ```
 */
export function generateLFSPatterns(extensions: string[]): string {
  if (extensions.length === 0) {
    return '';
  }

  const uniqueExtensions = Array.from(new Set(extensions));
  return uniqueExtensions
    .filter((ext) => ext.length > 0)
    .map((ext) => {
      // Remove leading dot for pattern
      const pattern = ext.startsWith('.') ? ext.substring(1) : ext;
      return `*.${pattern} filter=lfs diff=lfs merge=lfs -text`;
    })
    .join('\n');
}

/**
 * Generate git lfs track commands for given extensions.
 * 
 * @param extensions Array of file extensions (with dots)
 * @returns Shell commands to track files with LFS
 * 
 * @example
 * ```typescript
 * const commands = generateLFSCommands([".png", ".mp4"]);
 * console.log(commands);
 * // Output:
 * // git lfs track "*.png"
 * // git lfs track "*.mp4"
 * ```
 */
export function generateLFSCommands(extensions: string[]): string {
  if (extensions.length === 0) {
    return '';
  }

  const uniqueExtensions = Array.from(new Set(extensions));
  return uniqueExtensions
    .filter((ext) => ext.length > 0)
    .map((ext) => {
      const pattern = ext.startsWith('.') ? ext.substring(1) : ext;
      return `git lfs track "*.${pattern}"`;
    })
    .join('\n');
}

/**
 * Format bytes to human-readable string.
 * 
 * @param bytes Number of bytes
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "12.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(decimals) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(decimals) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(decimals) + ' GB';
}

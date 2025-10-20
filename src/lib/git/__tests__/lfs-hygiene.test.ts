/**
 * Unit tests for Git LFS hygiene and large binary detection
 */

import { describe, it, expect } from 'vitest';
import {
  detectLFSPointer,
  analyzeFiles,
  generateLFSPatterns,
  generateLFSCommands,
  formatBytes,
  DEFAULT_WARNING_THRESHOLD,
  DEFAULT_CRITICAL_THRESHOLD,
} from '../lfs-hygiene';

describe('LFS Hygiene', () => {
  describe('detectLFSPointer', () => {
    it('should detect valid LFS pointer with v1 spec', async () => {
      const content = new TextEncoder().encode(
        'version https://git-lfs.github.com/spec/v1\n' +
        'oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393\n' +
        'size 12345\n'
      );

      const pointer = await detectLFSPointer(content);

      expect(pointer).toBeDefined();
      expect(pointer?.isValid).toBe(true);
      expect(pointer?.version).toBe('https://git-lfs.github.com/spec/v1');
      expect(pointer?.oid).toBe('4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393');
      expect(pointer?.size).toBe(12345);
    });

    it('should detect valid LFS pointer from Blob', async () => {
      const text =
        'version https://git-lfs.github.com/spec/v1\n' +
        'oid sha256:abc123def456abc123def456abc123def456abc123def456abc123def456abc1\n' +
        'size 999\n';
      const blob = new Blob([text], { type: 'text/plain' });

      const pointer = await detectLFSPointer(blob);

      expect(pointer).toBeDefined();
      expect(pointer?.isValid).toBe(true);
      expect(pointer?.oid).toBe('abc123def456abc123def456abc123def456abc123def456abc123def456abc1');
      expect(pointer?.size).toBe(999);
    });

    it('should detect valid LFS pointer from ArrayBuffer', async () => {
      const text =
        'version https://git-lfs.github.com/spec/v1\n' +
        'oid sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef\n' +
        'size 54321\n';
      const buffer = new TextEncoder().encode(text).buffer;

      const pointer = await detectLFSPointer(buffer);

      expect(pointer).toBeDefined();
      expect(pointer?.isValid).toBe(true);
      expect(pointer?.size).toBe(54321);
    });

    it('should handle LFS pointer with extra whitespace', async () => {
      const content = new TextEncoder().encode(
        'version https://git-lfs.github.com/spec/v1  \n' +
        'oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393\n' +
        'size 12345  \n'
      );

      const pointer = await detectLFSPointer(content);

      expect(pointer).toBeDefined();
      expect(pointer?.isValid).toBe(true);
    });

    it('should return undefined for non-LFS content', async () => {
      const content = new TextEncoder().encode('This is just regular file content');

      const pointer = await detectLFSPointer(content);

      expect(pointer).toBeUndefined();
    });

    it('should return undefined for content missing version', async () => {
      const content = new TextEncoder().encode(
        'oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393\n' +
        'size 12345\n'
      );

      const pointer = await detectLFSPointer(content);

      expect(pointer).toBeUndefined();
    });

    it('should return undefined for content missing oid', async () => {
      const content = new TextEncoder().encode(
        'version https://git-lfs.github.com/spec/v1\n' +
        'size 12345\n'
      );

      const pointer = await detectLFSPointer(content);

      expect(pointer).toBeUndefined();
    });

    it('should return undefined for content missing size', async () => {
      const content = new TextEncoder().encode(
        'version https://git-lfs.github.com/spec/v1\n' +
        'oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393\n'
      );

      const pointer = await detectLFSPointer(content);

      expect(pointer).toBeUndefined();
    });

    it('should return undefined for invalid OID format', async () => {
      const content = new TextEncoder().encode(
        'version https://git-lfs.github.com/spec/v1\n' +
        'oid sha256:invalid-oid-format\n' +
        'size 12345\n'
      );

      const pointer = await detectLFSPointer(content);

      expect(pointer).toBeUndefined();
    });

    it('should return undefined for invalid size format', async () => {
      const content = new TextEncoder().encode(
        'version https://git-lfs.github.com/spec/v1\n' +
        'oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393\n' +
        'size not-a-number\n'
      );

      const pointer = await detectLFSPointer(content);

      expect(pointer).toBeUndefined();
    });

    it('should return undefined for files larger than 1KB', async () => {
      const largeContent = new Uint8Array(2048).fill(65); // 2KB of 'A'

      const pointer = await detectLFSPointer(largeContent);

      expect(pointer).toBeUndefined();
    });

    it('should mark pointer as invalid for wrong version', async () => {
      const content = new TextEncoder().encode(
        'version https://git-lfs.github.com/spec/v2\n' +
        'oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393\n' +
        'size 12345\n'
      );

      const pointer = await detectLFSPointer(content);

      expect(pointer).toBeDefined();
      expect(pointer?.isValid).toBe(false);
      expect(pointer?.version).toBe('https://git-lfs.github.com/spec/v2');
    });
  });

  describe('analyzeFiles', () => {
    it('should detect large files above warning threshold', async () => {
      const files = [
        {
          path: 'video.mp4',
          size: 60 * 1024 * 1024, // 60 MB
          content: new Uint8Array(0),
        },
        {
          path: 'small.txt',
          size: 1024, // 1 KB
          content: new Uint8Array(0),
        },
      ];

      const result = await analyzeFiles(files);

      expect(result.largeFiles).toHaveLength(1);
      expect(result.largeFiles[0].path).toBe('video.mp4');
      expect(result.largeFiles[0].severity).toBe('warning');
      expect(result.totalLargeFileSize).toBe(60 * 1024 * 1024);
    });

    it('should detect critical files above critical threshold', async () => {
      const files = [
        {
          path: 'huge.zip',
          size: 150 * 1024 * 1024, // 150 MB
          content: new Uint8Array(0),
        },
      ];

      const result = await analyzeFiles(files);

      expect(result.largeFiles).toHaveLength(1);
      expect(result.largeFiles[0].severity).toBe('critical');
    });

    it('should group files by extension', async () => {
      const files = [
        {
          path: 'image1.png',
          size: 60 * 1024 * 1024,
          content: new Uint8Array(0),
        },
        {
          path: 'image2.png',
          size: 55 * 1024 * 1024,
          content: new Uint8Array(0),
        },
        {
          path: 'video.mp4',
          size: 70 * 1024 * 1024,
          content: new Uint8Array(0),
        },
      ];

      const result = await analyzeFiles(files);

      expect(result.filesByExtension['.png']).toHaveLength(2);
      expect(result.filesByExtension['.mp4']).toHaveLength(1);
    });

    it('should detect LFS pointer files', async () => {
      const lfsContent = new TextEncoder().encode(
        'version https://git-lfs.github.com/spec/v1\n' +
        'oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393\n' +
        'size 100000000\n'
      );

      const files = [
        {
          path: 'large-file.bin',
          size: 200, // Small pointer file
          content: lfsContent,
        },
      ];

      // Use lower threshold to detect the small pointer file
      const result = await analyzeFiles(files, {
        warningThreshold: 100,
      });

      expect(result.largeFiles).toHaveLength(1);
      expect(result.lfsFiles).toHaveLength(1);
      expect(result.lfsFiles[0].lfsPointer?.isValid).toBe(true);
      expect(result.lfsFiles[0].lfsPointer?.size).toBe(100000000);
    });

    it('should skip excluded paths', async () => {
      const files = [
        {
          path: '.git/objects/large',
          size: 60 * 1024 * 1024,
          content: new Uint8Array(0),
        },
        {
          path: 'node_modules/package/large.bin',
          size: 60 * 1024 * 1024,
          content: new Uint8Array(0),
        },
        {
          path: 'src/large.mp4',
          size: 60 * 1024 * 1024,
          content: new Uint8Array(0),
        },
      ];

      const result = await analyzeFiles(files);

      expect(result.largeFiles).toHaveLength(1);
      expect(result.largeFiles[0].path).toBe('src/large.mp4');
    });

    it('should use custom thresholds', async () => {
      const files = [
        {
          path: 'medium.bin',
          size: 30 * 1024 * 1024, // 30 MB
          content: new Uint8Array(0),
        },
      ];

      const result = await analyzeFiles(files, {
        warningThreshold: 20 * 1024 * 1024, // 20 MB
        criticalThreshold: 40 * 1024 * 1024, // 40 MB
      });

      expect(result.largeFiles).toHaveLength(1);
      expect(result.largeFiles[0].severity).toBe('warning');
    });

    it('should return empty result for no large files', async () => {
      const files = [
        {
          path: 'small1.txt',
          size: 1024,
          content: new Uint8Array(0),
        },
        {
          path: 'small2.txt',
          size: 2048,
          content: new Uint8Array(0),
        },
      ];

      const result = await analyzeFiles(files);

      expect(result.largeFiles).toHaveLength(0);
      expect(result.lfsFiles).toHaveLength(0);
      expect(result.totalLargeFileSize).toBe(0);
    });

    it('should handle files without extensions', async () => {
      const files = [
        {
          path: 'Makefile',
          size: 60 * 1024 * 1024,
          content: new Uint8Array(0),
        },
      ];

      const result = await analyzeFiles(files);

      expect(result.largeFiles).toHaveLength(1);
      expect(result.largeFiles[0].extension).toBe('');
      expect(result.filesByExtension['']).toHaveLength(1);
    });
  });

  describe('generateLFSPatterns', () => {
    it('should generate .gitattributes patterns', () => {
      const extensions = ['.png', '.mp4', '.zip'];

      const patterns = generateLFSPatterns(extensions);

      expect(patterns).toContain('*.png filter=lfs diff=lfs merge=lfs -text');
      expect(patterns).toContain('*.mp4 filter=lfs diff=lfs merge=lfs -text');
      expect(patterns).toContain('*.zip filter=lfs diff=lfs merge=lfs -text');
    });

    it('should handle extensions without dots', () => {
      const extensions = ['png', 'mp4'];

      const patterns = generateLFSPatterns(extensions);

      expect(patterns).toContain('*.png filter=lfs diff=lfs merge=lfs -text');
      expect(patterns).toContain('*.mp4 filter=lfs diff=lfs merge=lfs -text');
    });

    it('should deduplicate extensions', () => {
      const extensions = ['.png', '.png', '.mp4'];

      const patterns = generateLFSPatterns(extensions);
      const lines = patterns.split('\n');

      expect(lines).toHaveLength(2);
    });

    it('should return empty string for empty array', () => {
      const patterns = generateLFSPatterns([]);

      expect(patterns).toBe('');
    });

    it('should filter out empty extensions', () => {
      const extensions = ['.png', '', '.mp4'];

      const patterns = generateLFSPatterns(extensions);
      const lines = patterns.split('\n').filter(l => l.trim());

      expect(lines).toHaveLength(2);
    });
  });

  describe('generateLFSCommands', () => {
    it('should generate git lfs track commands', () => {
      const extensions = ['.png', '.mp4'];

      const commands = generateLFSCommands(extensions);

      expect(commands).toContain('git lfs track "*.png"');
      expect(commands).toContain('git lfs track "*.mp4"');
    });

    it('should handle extensions without dots', () => {
      const extensions = ['png'];

      const commands = generateLFSCommands(extensions);

      expect(commands).toContain('git lfs track "*.png"');
    });

    it('should deduplicate extensions', () => {
      const extensions = ['.png', '.png'];

      const commands = generateLFSCommands(extensions);
      const lines = commands.split('\n');

      expect(lines).toHaveLength(1);
    });

    it('should return empty string for empty array', () => {
      const commands = generateLFSCommands([]);

      expect(commands).toBe('');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(2048)).toBe('2.0 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
      expect(formatBytes(50 * 1024 * 1024)).toBe('50.0 MB');
      expect(formatBytes(100 * 1024 * 1024)).toBe('100.0 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1536, 2)).toBe('1.50 KB');
      expect(formatBytes(1536, 0)).toBe('2 KB');
    });
  });

  describe('Constants', () => {
    it('should have correct default thresholds', () => {
      expect(DEFAULT_WARNING_THRESHOLD).toBe(50 * 1024 * 1024); // 50 MB
      expect(DEFAULT_CRITICAL_THRESHOLD).toBe(100 * 1024 * 1024); // 100 MB
    });
  });
});

/**
 * Unit tests for browser capability detection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isFileSystemAccessSupported,
  isDirectoryInputSupported,
  isWebWorkersSupported,
  isIndexedDBSupported,
  getBrowserCapabilities,
  getRecommendedIngestionMethod,
  getBrowserName,
  getCapabilityMessage,
} from '../capabilities';

describe('Browser Capability Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isFileSystemAccessSupported', () => {
    it('should return true when showDirectoryPicker is available', () => {
      global.window = {
        showDirectoryPicker: vi.fn(),
      } as unknown as Window & typeof globalThis;

      expect(isFileSystemAccessSupported()).toBe(true);
    });

    it('should return false when showDirectoryPicker is not available', () => {
      global.window = {} as Window & typeof globalThis;

      expect(isFileSystemAccessSupported()).toBe(false);
    });
  });

  describe('isDirectoryInputSupported', () => {
    it('should return true when webkitdirectory is supported', () => {
      const mockInput = {
        webkitdirectory: true,
      };

      global.document = {
        createElement: vi.fn().mockReturnValue(mockInput),
      } as unknown as Document;

      expect(isDirectoryInputSupported()).toBe(true);
    });

    it('should return false when webkitdirectory is not supported', () => {
      const mockInput = {};

      global.document = {
        createElement: vi.fn().mockReturnValue(mockInput),
      } as unknown as Document;

      expect(isDirectoryInputSupported()).toBe(false);
    });

    it('should return false when document is not available', () => {
      // @ts-expect-error - Testing undefined document
      delete global.document;

      expect(isDirectoryInputSupported()).toBe(false);
    });
  });

  describe('isWebWorkersSupported', () => {
    it('should return true when Worker is available', () => {
      global.window = {
        Worker: vi.fn(),
      } as unknown as Window & typeof globalThis;

      expect(isWebWorkersSupported()).toBe(true);
    });

    it('should return false when Worker is not available', () => {
      global.window = {} as Window & typeof globalThis;

      expect(isWebWorkersSupported()).toBe(false);
    });
  });

  describe('isIndexedDBSupported', () => {
    it('should return true when indexedDB is available', () => {
      global.window = {
        indexedDB: {},
      } as unknown as Window & typeof globalThis;

      expect(isIndexedDBSupported()).toBe(true);
    });

    it('should return false when indexedDB is not available', () => {
      global.window = {} as Window & typeof globalThis;

      expect(isIndexedDBSupported()).toBe(false);
    });
  });

  describe('getBrowserCapabilities', () => {
    it('should return all capabilities', () => {
      global.window = {
        showDirectoryPicker: vi.fn(),
        Worker: vi.fn(),
        indexedDB: {},
      } as unknown as Window & typeof globalThis;

      const mockInput = {
        webkitdirectory: true,
      };

      global.document = {
        createElement: vi.fn().mockReturnValue(mockInput),
      } as unknown as Document;

      const caps = getBrowserCapabilities();

      expect(caps).toHaveProperty('fileSystemAccess');
      expect(caps).toHaveProperty('directoryInput');
      expect(caps).toHaveProperty('fileInput');
      expect(caps).toHaveProperty('webWorkers');
      expect(caps).toHaveProperty('indexedDB');
    });
  });

  describe('getRecommendedIngestionMethod', () => {
    it('should recommend FSA when available', () => {
      global.window = {
        showDirectoryPicker: vi.fn(),
      } as unknown as Window & typeof globalThis;

      const mockInput = {
        webkitdirectory: true,
      };

      global.document = {
        createElement: vi.fn().mockReturnValue(mockInput),
      } as unknown as Document;

      expect(getRecommendedIngestionMethod()).toBe('fsa');
    });

    it('should recommend directory when FSA is not available but directory input is', () => {
      global.window = {} as Window & typeof globalThis;

      const mockInput = {
        webkitdirectory: true,
      };

      global.document = {
        createElement: vi.fn().mockReturnValue(mockInput),
      } as unknown as Document;

      expect(getRecommendedIngestionMethod()).toBe('directory');
    });

    it('should recommend zip when only file input is available', () => {
      global.window = {} as Window & typeof globalThis;

      const mockInput = {};

      global.document = {
        createElement: vi.fn().mockReturnValue(mockInput),
      } as unknown as Document;

      expect(getRecommendedIngestionMethod()).toBe('zip');
    });

    it('should return none when nothing is available', () => {
      global.window = undefined as unknown as Window & typeof globalThis;
      // @ts-expect-error - Testing undefined document
      delete global.document;

      expect(getRecommendedIngestionMethod()).toBe('none');
    });
  });

  describe('getBrowserName', () => {
    it('should detect Firefox', () => {
      global.window = {} as Window & typeof globalThis;
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
        },
        writable: true,
        configurable: true,
      });

      expect(getBrowserName()).toBe('Firefox');
    });

    it('should detect Chrome', () => {
      global.window = {} as Window & typeof globalThis;
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        },
        writable: true,
        configurable: true,
      });

      expect(getBrowserName()).toBe('Chrome');
    });

    it('should detect Edge', () => {
      global.window = {} as Window & typeof globalThis;
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188',
        },
        writable: true,
        configurable: true,
      });

      expect(getBrowserName()).toBe('Edge');
    });

    it('should detect Safari', () => {
      global.window = {} as Window & typeof globalThis;
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
        },
        writable: true,
        configurable: true,
      });

      expect(getBrowserName()).toBe('Safari');
    });

    it('should return Unknown for unrecognized browsers', () => {
      global.window = {} as Window & typeof globalThis;
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Unknown Browser',
        },
        writable: true,
        configurable: true,
      });

      expect(getBrowserName()).toBe('Unknown');
    });
  });

  describe('getCapabilityMessage', () => {
    it('should return appropriate message based on capabilities', () => {
      global.window = {
        showDirectoryPicker: vi.fn(),
      } as unknown as Window & typeof globalThis;

      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 Chrome/115.0.0.0',
        },
        writable: true,
        configurable: true,
      });

      const message = getCapabilityMessage();
      expect(message).toContain('Chrome');
      expect(message).toContain('direct folder access');
    });
  });
});

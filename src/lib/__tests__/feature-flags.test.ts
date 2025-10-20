/**
 * Unit tests for feature flags configuration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getFeatureFlags, isFeatureEnabled } from '../feature-flags';

describe('Feature Flags', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  describe('getFeatureFlags', () => {
    it('should return default flags when no environment variables are set', () => {
      const flags = getFeatureFlags();
      
      expect(flags).toHaveProperty('enableIngestFallbacks');
      expect(flags.enableIngestFallbacks).toBe(true); // default is true
    });

    it('should respect environment variable when set to true', () => {
      process.env.NEXT_PUBLIC_ENABLE_INGEST_FALLBACKS = 'true';
      
      const flags = getFeatureFlags();
      expect(flags.enableIngestFallbacks).toBe(true);
    });

    it('should respect environment variable when set to false', () => {
      process.env.NEXT_PUBLIC_ENABLE_INGEST_FALLBACKS = 'false';
      
      const flags = getFeatureFlags();
      expect(flags.enableIngestFallbacks).toBe(false);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      process.env.NEXT_PUBLIC_ENABLE_INGEST_FALLBACKS = 'true';
      
      expect(isFeatureEnabled('enableIngestFallbacks')).toBe(true);
    });

    it('should return false for disabled features', () => {
      process.env.NEXT_PUBLIC_ENABLE_INGEST_FALLBACKS = 'false';
      
      expect(isFeatureEnabled('enableIngestFallbacks')).toBe(false);
    });

    it('should return default value when environment variable is not set', () => {
      delete process.env.NEXT_PUBLIC_ENABLE_INGEST_FALLBACKS;
      
      // Default is true for enableIngestFallbacks
      expect(isFeatureEnabled('enableIngestFallbacks')).toBe(true);
    });
  });
});

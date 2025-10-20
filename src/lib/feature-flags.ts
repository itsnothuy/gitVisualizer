/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for experimental and rollout features.
 * All flags default to environment variables with fallback defaults.
 */

/**
 * Feature flags available in the application
 */
export interface FeatureFlags {
  /**
   * Enable cross-browser ingestion fallbacks (directory input + ZIP upload)
   * for browsers that don't support File System Access API
   */
  enableIngestFallbacks: boolean;
}

/**
 * Get feature flag value from environment or default
 */
function getFlag(name: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') {
    // Server-side: use environment variable
    const envValue = process.env[`NEXT_PUBLIC_${name}`];
    if (envValue !== undefined) {
      return envValue === 'true';
    }
    return defaultValue;
  }
  
  // Client-side: use environment variable (injected at build time)
  const envValue = process.env[`NEXT_PUBLIC_${name}`];
  if (envValue !== undefined) {
    return envValue === 'true';
  }
  
  return defaultValue;
}

/**
 * Get all feature flags with current values
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    // Enable ingestion fallbacks by default for better cross-browser support
    enableIngestFallbacks: getFlag('ENABLE_INGEST_FALLBACKS', true),
  };
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

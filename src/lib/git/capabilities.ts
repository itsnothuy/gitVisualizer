/**
 * Browser Capability Detection for Ingestion
 * 
 * Detects which ingestion methods are supported in the current browser
 * and provides detailed capability information for UX decisions.
 */

import type { BrowserCapabilities } from './ingestion-types';

/**
 * Check if File System Access API is supported (showDirectoryPicker)
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Check if directory input is supported (webkitdirectory attribute)
 */
export function isDirectoryInputSupported(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  
  // Create a test input element
  const input = document.createElement('input');
  return 'webkitdirectory' in input || 'directory' in input;
}

/**
 * Check if Web Workers are supported
 */
export function isWebWorkersSupported(): boolean {
  return typeof window !== 'undefined' && 'Worker' in window;
}

/**
 * Check if IndexedDB is supported
 */
export function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Get all browser capabilities for ingestion
 */
export function getBrowserCapabilities(): BrowserCapabilities {
  return {
    fileSystemAccess: isFileSystemAccessSupported(),
    directoryInput: isDirectoryInputSupported(),
    fileInput: typeof window !== 'undefined',
    webWorkers: isWebWorkersSupported(),
    indexedDB: isIndexedDBSupported(),
  };
}

/**
 * Get recommended ingestion method based on capabilities
 */
export function getRecommendedIngestionMethod(): 'fsa' | 'directory' | 'zip' | 'none' {
  const caps = getBrowserCapabilities();
  
  if (caps.fileSystemAccess) {
    return 'fsa';
  }
  
  if (caps.directoryInput) {
    return 'directory';
  }
  
  if (caps.fileInput) {
    return 'zip';
  }
  
  return 'none';
}

/**
 * Get user-friendly browser name
 */
export function getBrowserName(): string {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'Unknown';
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('firefox')) {
    return 'Firefox';
  }
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return 'Safari';
  }
  if (userAgent.includes('edg/')) {
    return 'Edge';
  }
  if (userAgent.includes('chrome')) {
    return 'Chrome';
  }
  if (userAgent.includes('opera') || userAgent.includes('opr/')) {
    return 'Opera';
  }
  
  return 'Unknown';
}

/**
 * Get capability message for users
 */
export function getCapabilityMessage(): string {
  const method = getRecommendedIngestionMethod();
  const browser = getBrowserName();
  
  if (method === 'fsa') {
    return `${browser} supports direct folder access for the best experience.`;
  }
  
  if (method === 'directory') {
    return `${browser} doesn't support direct folder access, but you can upload a folder or ZIP file.`;
  }
  
  if (method === 'zip') {
    return `${browser} requires ZIP upload. Please compress your repository as a .zip file.`;
  }
  
  return `${browser} may not support repository ingestion. Please try a modern browser like Chrome, Edge, or Firefox.`;
}

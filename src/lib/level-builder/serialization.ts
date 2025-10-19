/**
 * Level Serialization
 * Import/export level data with metadata
 */

import type { Level } from '@/tutorial/types';

/**
 * Level export metadata
 */
export interface LevelExportMetadata {
  version: string;
  createdAt: number;
  creator?: string;
  toolVersion: string;
}

/**
 * Level export format (with metadata)
 */
export interface LevelExport {
  metadata: LevelExportMetadata;
  level: Level;
}

/**
 * Serialize level to JSON string
 */
export function serializeLevel(level: Level, creator?: string): string {
  const exportData: LevelExport = {
    metadata: {
      version: '1.0',
      createdAt: Date.now(),
      creator,
      toolVersion: '0.1.0', // TODO: Get from package.json
    },
    level,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Deserialize level from JSON string
 */
export function deserializeLevel(json: string): { level: Level; metadata: LevelExportMetadata } {
  const parsed = JSON.parse(json);

  // Check if it's the new format with metadata
  if (parsed.metadata && parsed.level) {
    return {
      level: parsed.level as Level,
      metadata: parsed.metadata as LevelExportMetadata,
    };
  }

  // Legacy format (direct level object)
  return {
    level: parsed as Level,
    metadata: {
      version: '1.0',
      createdAt: Date.now(),
      toolVersion: 'unknown',
    },
  };
}

/**
 * Export level as downloadable file
 */
export function downloadLevel(level: Level, creator?: string): void {
  const json = serializeLevel(level, creator);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `level-${level.id}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import level from file
 */
export async function importLevelFromFile(file: File): Promise<{
  level: Level;
  metadata: LevelExportMetadata;
}> {
  const text = await file.text();
  return deserializeLevel(text);
}

/**
 * Generate shareable URL for level (using URL encoding)
 */
export function generateLevelShareURL(level: Level, baseUrl: string): string | null {
  try {
    const json = JSON.stringify(level);
    const compressed = encodeURIComponent(json);
    
    // Check if URL would be too long (typical browser limit ~2000 chars)
    if (compressed.length > 1500) {
      return null; // Too large for URL, suggest using file export or gist
    }

    return `${baseUrl}?level=${compressed}`;
  } catch {
    return null;
  }
}

/**
 * Parse level from URL parameter
 */
export function parseLevelFromURL(url: string): Level | null {
  try {
    const urlObj = new URL(url);
    const levelParam = urlObj.searchParams.get('level');
    
    if (!levelParam) {
      return null;
    }

    const json = decodeURIComponent(levelParam);
    const parsed = JSON.parse(json);
    
    return parsed as Level;
  } catch {
    return null;
  }
}

/**
 * Generate a unique level ID based on name
 */
export function generateLevelId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * LevelStore - Manages loading and caching of tutorial levels
 * Loads levels from JSON files in the /levels directory
 */

import type { Level, LevelSequence, LevelLoadResult } from './types';

/**
 * Level cache to avoid repeated loads
 */
const levelCache = new Map<string, Level>();
const sequenceCache = new Map<string, LevelSequence>();

/**
 * Level metadata for quick lookups
 */
interface LevelMetadata {
  id: string;
  difficulty: string;
  order: number;
  sequenceId?: string;
}

const levelMetadata = new Map<string, LevelMetadata>();

/**
 * Load a level by ID
 */
export async function loadLevel(levelId: string): Promise<LevelLoadResult> {
  // Check cache first
  if (levelCache.has(levelId)) {
    return { success: true, level: levelCache.get(levelId)! };
  }

  try {
    // Dynamically import the level JSON
    const levelModule = await import(`../../levels/${levelId}.json`);
    const level: Level = levelModule.default || levelModule;

    // Validate level structure
    if (!validateLevel(level)) {
      return {
        success: false,
        error: `Invalid level structure for ${levelId}`,
      };
    }

    // Cache the level
    levelCache.set(levelId, level);

    // Update metadata
    levelMetadata.set(levelId, {
      id: level.id,
      difficulty: level.difficulty,
      order: level.order,
    });

    return { success: true, level };
  } catch (error) {
    return {
      success: false,
      error: `Failed to load level ${levelId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Load a level sequence
 */
export async function loadSequence(
  sequenceId: string,
): Promise<{ success: true; sequence: LevelSequence } | { success: false; error: string }> {
  // Check cache first
  if (sequenceCache.has(sequenceId)) {
    return { success: true, sequence: sequenceCache.get(sequenceId)! };
  }

  try {
    // Dynamically import the sequence JSON
    const sequenceModule = await import(`../../levels/sequences/${sequenceId}.json`);
    const sequence: LevelSequence = sequenceModule.default || sequenceModule;

    // Validate sequence
    if (!validateSequence(sequence)) {
      return {
        success: false,
        error: `Invalid sequence structure for ${sequenceId}`,
      };
    }

    // Cache the sequence
    sequenceCache.set(sequenceId, sequence);

    return { success: true, sequence };
  } catch (error) {
    return {
      success: false,
      error: `Failed to load sequence ${sequenceId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get all available sequences
 */
export async function getAllSequences(): Promise<LevelSequence[]> {
  // In a real implementation, this would scan the sequences directory
  // For now, return predefined sequences
  const sequenceIds = ['intro', 'rampup', 'advanced'];
  const sequences: LevelSequence[] = [];

  for (const id of sequenceIds) {
    const result = await loadSequence(id);
    if (result.success) {
      sequences.push(result.sequence);
    }
  }

  return sequences;
}

/**
 * Get levels for a sequence
 */
export async function getLevelsForSequence(sequenceId: string): Promise<Level[]> {
  const sequenceResult = await loadSequence(sequenceId);
  if (!sequenceResult.success) {
    return [];
  }

  const levels: Level[] = [];
  for (const levelId of sequenceResult.sequence.levelIds) {
    const levelResult = await loadLevel(levelId);
    if (levelResult.success) {
      levels.push(levelResult.level);
    }
  }

  return levels;
}

/**
 * Clear level cache (useful for testing)
 */
export function clearCache(): void {
  levelCache.clear();
  sequenceCache.clear();
  levelMetadata.clear();
}

/**
 * Validate level structure
 */
function validateLevel(level: unknown): level is Level {
  if (typeof level !== 'object' || level === null) return false;

  const l = level as Partial<Level>;

  return (
    typeof l.id === 'string' &&
    typeof l.name === 'object' &&
    typeof l.description === 'object' &&
    typeof l.difficulty === 'string' &&
    typeof l.order === 'number' &&
    typeof l.initialState === 'object' &&
    typeof l.goalState === 'object' &&
    Array.isArray(l.tutorialSteps) &&
    Array.isArray(l.solutionCommands) &&
    Array.isArray(l.hints)
  );
}

/**
 * Validate sequence structure
 */
function validateSequence(sequence: unknown): sequence is LevelSequence {
  if (typeof sequence !== 'object' || sequence === null) return false;

  const s = sequence as Partial<LevelSequence>;

  return (
    typeof s.id === 'string' &&
    typeof s.name === 'object' &&
    typeof s.description === 'object' &&
    Array.isArray(s.levelIds)
  );
}

/**
 * Preload levels for better UX
 */
export async function preloadSequence(sequenceId: string): Promise<void> {
  const levels = await getLevelsForSequence(sequenceId);
  // Levels are already cached by getLevelsForSequence
  console.log(`Preloaded ${levels.length} levels for sequence ${sequenceId}`);
}

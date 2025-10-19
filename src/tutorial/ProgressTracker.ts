/**
 * ProgressTracker - Manages user progress across levels
 * Stores progress in IndexedDB with localStorage fallback
 */

import type { UserProgress, LevelProgress, ProgressSaveResult } from './types';

const DB_NAME = 'GitVisualizerTutorial';
const DB_VERSION = 1;
const STORE_NAME = 'progress';
const STORAGE_KEY = 'gitvis_tutorial_progress';

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return null; // Server-side or unsupported
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
  });
}

/**
 * Load user progress from IndexedDB
 */
export async function loadProgress(userId: string): Promise<UserProgress | null> {
  try {
    const db = await initDB();
    if (!db) {
      return loadProgressFromLocalStorage(userId);
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          // Convert plain objects back to Maps and Sets
          resolve(deserializeProgress(data));
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('Failed to load from IndexedDB, falling back to localStorage:', error);
    return loadProgressFromLocalStorage(userId);
  }
}

/**
 * Save user progress to IndexedDB
 */
export async function saveProgress(progress: UserProgress): Promise<ProgressSaveResult> {
  try {
    const db = await initDB();
    if (!db) {
      return saveProgressToLocalStorage(progress);
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Serialize Maps and Sets for storage
      const serialized = serializeProgress(progress);
      const request = store.put(serialized);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Also save to localStorage as backup
        saveProgressToLocalStorage(progress);
        resolve({ success: true });
      };
    });
  } catch (error) {
    console.error('Failed to save to IndexedDB, falling back to localStorage:', error);
    return saveProgressToLocalStorage(progress);
  }
}

/**
 * Create initial progress for a new user
 */
export function createInitialProgress(
  userId: string,
  locale: string = 'en_US',
): UserProgress {
  return {
    userId,
    locale,
    levels: new Map(),
    unlockedSequences: new Set(['intro']), // Intro is unlocked by default
    lastUpdated: Date.now(),
  };
}

/**
 * Update progress for a completed level
 */
export function updateLevelProgress(
  progress: UserProgress,
  levelId: string,
  commandsUsed: number,
  optimalCommands: number,
  hintsUsed: number = 0,
): UserProgress {
  const existingProgress = progress.levels.get(levelId);
  const bestScore = existingProgress?.bestScore
    ? Math.min(existingProgress.bestScore, commandsUsed)
    : commandsUsed;

  const levelProgress: LevelProgress = {
    levelId,
    completed: true,
    commandsUsed,
    optimalCommands,
    bestScore,
    completedAt: Date.now(),
    hintsUsed: (existingProgress?.hintsUsed || 0) + hintsUsed,
  };

  const newLevels = new Map(progress.levels);
  newLevels.set(levelId, levelProgress);

  return {
    ...progress,
    levels: newLevels,
    lastUpdated: Date.now(),
  };
}

/**
 * Check if a level is completed
 */
export function isLevelCompleted(progress: UserProgress, levelId: string): boolean {
  return progress.levels.get(levelId)?.completed ?? false;
}

/**
 * Check if a sequence is unlocked
 */
export function isSequenceUnlocked(progress: UserProgress, sequenceId: string): boolean {
  return progress.unlockedSequences.has(sequenceId);
}

/**
 * Unlock a sequence
 */
export function unlockSequence(progress: UserProgress, sequenceId: string): UserProgress {
  const newUnlocked = new Set(progress.unlockedSequences);
  newUnlocked.add(sequenceId);

  return {
    ...progress,
    unlockedSequences: newUnlocked,
    lastUpdated: Date.now(),
  };
}

/**
 * Get completion stats for a sequence
 */
export function getSequenceStats(
  progress: UserProgress,
  levelIds: string[],
): { completed: number; total: number; percentage: number } {
  const completed = levelIds.filter((id) => isLevelCompleted(progress, id)).length;
  const total = levelIds.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

/**
 * Clear all progress (for testing or reset)
 */
export async function clearProgress(userId: string): Promise<void> {
  try {
    const db = await initDB();
    if (db) {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(userId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  } catch (error) {
    console.error('Failed to clear from IndexedDB:', error);
  }

  // Also clear from localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
  }
}

/**
 * Serialize progress for storage (convert Maps and Sets)
 */
function serializeProgress(progress: UserProgress): unknown {
  return {
    userId: progress.userId,
    locale: progress.locale,
    currentSequence: progress.currentSequence,
    currentLevel: progress.currentLevel,
    levels: Array.from(progress.levels.entries()),
    unlockedSequences: Array.from(progress.unlockedSequences),
    lastUpdated: progress.lastUpdated,
  };
}

/**
 * Deserialize progress from storage (convert back to Maps and Sets)
 */
function deserializeProgress(data: {
  userId: string;
  locale: string;
  currentSequence?: string;
  currentLevel?: string;
  levels: Array<[string, LevelProgress]>;
  unlockedSequences: string[];
  lastUpdated: number;
}): UserProgress {
  return {
    userId: data.userId,
    locale: data.locale,
    currentSequence: data.currentSequence,
    currentLevel: data.currentLevel,
    levels: new Map(data.levels),
    unlockedSequences: new Set(data.unlockedSequences),
    lastUpdated: data.lastUpdated,
  };
}

/**
 * LocalStorage fallback functions
 */
function loadProgressFromLocalStorage(userId: string): UserProgress | null {
  if (typeof localStorage === 'undefined') return null;

  const key = `${STORAGE_KEY}_${userId}`;
  const data = localStorage.getItem(key);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    return deserializeProgress(parsed);
  } catch (error) {
    console.error('Failed to parse progress from localStorage:', error);
    return null;
  }
}

function saveProgressToLocalStorage(progress: UserProgress): ProgressSaveResult {
  if (typeof localStorage === 'undefined') {
    return { success: false, error: 'localStorage not available' };
  }

  const key = `${STORAGE_KEY}_${progress.userId}`;
  const serialized = serializeProgress(progress);

  try {
    localStorage.setItem(key, JSON.stringify(serialized));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

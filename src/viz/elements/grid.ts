/**
 * Grid System for DAG Layout
 * 
 * Provides constants and utilities for translating DAG indices to screen coordinates.
 * Uses a simple grid-based positioning system where branches occupy columns and
 * commits occupy rows.
 */

/**
 * Horizontal spacing between branches (columns)
 */
export const ROW_WIDTH = 80;

/**
 * Vertical spacing between commits (rows)
 */
export const ROW_HEIGHT = 60;

/**
 * Grid position representing a location in the DAG grid
 */
export interface GridPosition {
  /** Branch index (column) */
  branchIndex: number;
  /** Commit level (row) */
  commitLevel: number;
}

/**
 * Screen coordinates in pixels
 */
export interface ScreenCoords {
  x: number;
  y: number;
}

/**
 * Convert grid position to screen coordinates
 * 
 * @param position - Grid position with branch index and commit level
 * @returns Screen coordinates in pixels
 */
export function gridToScreen(position: GridPosition): ScreenCoords {
  return {
    x: position.branchIndex * ROW_WIDTH,
    y: position.commitLevel * ROW_HEIGHT,
  };
}

/**
 * Convert screen coordinates to grid position
 * 
 * @param coords - Screen coordinates in pixels
 * @returns Grid position with branch index and commit level
 */
export function screenToGrid(coords: ScreenCoords): GridPosition {
  return {
    branchIndex: Math.round(coords.x / ROW_WIDTH),
    commitLevel: Math.round(coords.y / ROW_HEIGHT),
  };
}

/**
 * Calculate the distance between two grid positions
 * 
 * @param pos1 - First grid position
 * @param pos2 - Second grid position
 * @returns Manhattan distance between the positions
 */
export function gridDistance(pos1: GridPosition, pos2: GridPosition): number {
  return Math.abs(pos1.branchIndex - pos2.branchIndex) + 
         Math.abs(pos1.commitLevel - pos2.commitLevel);
}

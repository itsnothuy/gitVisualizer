/**
 * Unit tests for grid coordinate system
 */

import { describe, it, expect } from 'vitest';
import {
  ROW_WIDTH,
  ROW_HEIGHT,
  gridToScreen,
  screenToGrid,
  gridDistance,
  type GridPosition,
} from '../grid';

describe('Grid System', () => {
  describe('Constants', () => {
    it('should have correct ROW_WIDTH', () => {
      expect(ROW_WIDTH).toBe(80);
    });

    it('should have correct ROW_HEIGHT', () => {
      expect(ROW_HEIGHT).toBe(60);
    });
  });

  describe('gridToScreen', () => {
    it('should convert origin grid position to screen coords', () => {
      const position: GridPosition = { branchIndex: 0, commitLevel: 0 };
      const coords = gridToScreen(position);
      
      expect(coords.x).toBe(0);
      expect(coords.y).toBe(0);
    });

    it('should convert positive grid position to screen coords', () => {
      const position: GridPosition = { branchIndex: 2, commitLevel: 3 };
      const coords = gridToScreen(position);
      
      expect(coords.x).toBe(2 * ROW_WIDTH); // 160
      expect(coords.y).toBe(3 * ROW_HEIGHT); // 180
    });

    it('should handle negative grid positions', () => {
      const position: GridPosition = { branchIndex: -1, commitLevel: -2 };
      const coords = gridToScreen(position);
      
      expect(coords.x).toBe(-1 * ROW_WIDTH);
      expect(coords.y).toBe(-2 * ROW_HEIGHT);
    });

    it('should be consistent for multiple conversions', () => {
      const position: GridPosition = { branchIndex: 5, commitLevel: 7 };
      const coords1 = gridToScreen(position);
      const coords2 = gridToScreen(position);
      
      expect(coords1).toEqual(coords2);
    });
  });

  describe('screenToGrid', () => {
    it('should convert origin screen coords to grid position', () => {
      const coords = { x: 0, y: 0 };
      const position = screenToGrid(coords);
      
      expect(position.branchIndex).toBe(0);
      expect(position.commitLevel).toBe(0);
    });

    it('should convert positive screen coords to grid position', () => {
      const coords = { x: 160, y: 180 };
      const position = screenToGrid(coords);
      
      expect(position.branchIndex).toBe(2);
      expect(position.commitLevel).toBe(3);
    });

    it('should round to nearest grid position', () => {
      const coords = { x: 170, y: 190 };
      const position = screenToGrid(coords);
      
      // 170 / 80 = 2.125, rounds to 2
      expect(position.branchIndex).toBe(2);
      // 190 / 60 = 3.166, rounds to 3
      expect(position.commitLevel).toBe(3);
    });

    it('should be inverse of gridToScreen for exact coordinates', () => {
      const originalPosition: GridPosition = { branchIndex: 4, commitLevel: 6 };
      const coords = gridToScreen(originalPosition);
      const resultPosition = screenToGrid(coords);
      
      expect(resultPosition).toEqual(originalPosition);
    });
  });

  describe('gridDistance', () => {
    it('should return 0 for same position', () => {
      const pos1: GridPosition = { branchIndex: 2, commitLevel: 3 };
      const pos2: GridPosition = { branchIndex: 2, commitLevel: 3 };
      
      expect(gridDistance(pos1, pos2)).toBe(0);
    });

    it('should calculate Manhattan distance horizontally', () => {
      const pos1: GridPosition = { branchIndex: 0, commitLevel: 0 };
      const pos2: GridPosition = { branchIndex: 3, commitLevel: 0 };
      
      expect(gridDistance(pos1, pos2)).toBe(3);
    });

    it('should calculate Manhattan distance vertically', () => {
      const pos1: GridPosition = { branchIndex: 0, commitLevel: 0 };
      const pos2: GridPosition = { branchIndex: 0, commitLevel: 5 };
      
      expect(gridDistance(pos1, pos2)).toBe(5);
    });

    it('should calculate Manhattan distance diagonally', () => {
      const pos1: GridPosition = { branchIndex: 1, commitLevel: 2 };
      const pos2: GridPosition = { branchIndex: 4, commitLevel: 6 };
      
      // |4-1| + |6-2| = 3 + 4 = 7
      expect(gridDistance(pos1, pos2)).toBe(7);
    });

    it('should be symmetric', () => {
      const pos1: GridPosition = { branchIndex: 2, commitLevel: 3 };
      const pos2: GridPosition = { branchIndex: 5, commitLevel: 1 };
      
      expect(gridDistance(pos1, pos2)).toBe(gridDistance(pos2, pos1));
    });

    it('should handle negative positions', () => {
      const pos1: GridPosition = { branchIndex: -1, commitLevel: -2 };
      const pos2: GridPosition = { branchIndex: 2, commitLevel: 1 };
      
      // |2-(-1)| + |1-(-2)| = 3 + 3 = 6
      expect(gridDistance(pos1, pos2)).toBe(6);
    });
  });

  describe('Round-trip conversions', () => {
    it('should maintain accuracy in round-trip conversion', () => {
      const testPositions: GridPosition[] = [
        { branchIndex: 0, commitLevel: 0 },
        { branchIndex: 1, commitLevel: 2 },
        { branchIndex: 5, commitLevel: 10 },
        { branchIndex: -2, commitLevel: 3 },
      ];

      testPositions.forEach(originalPosition => {
        const coords = gridToScreen(originalPosition);
        const resultPosition = screenToGrid(coords);
        expect(resultPosition).toEqual(originalPosition);
      });
    });
  });
});

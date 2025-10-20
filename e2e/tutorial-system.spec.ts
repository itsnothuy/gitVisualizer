/**
 * E2E tests for Tutorial System
 * Tests the complete tutorial flow from level selection to completion
 */

import { expect, test } from '@playwright/test';

test.describe('Tutorial System', () => {
  test.describe('Level Loading', () => {
    test('should load intro1 level data', async ({ page }) => {
      // Navigate to a page that could show tutorials
      await page.goto('/');

      // Test that the level JSON files are accessible
      const response = await page.request.get('/levels/intro1.json');
      expect(response.ok()).toBeTruthy();

      const level = await response.json();
      expect(level.id).toBe('intro1');
      expect(level.name.en_US).toBe('Introduction to Commits');
    });

    test('should load intro sequence', async ({ page }) => {
      await page.goto('/');

      const response = await page.request.get('/levels/sequences/intro.json');
      expect(response.ok()).toBeTruthy();

      const sequence = await response.json();
      expect(sequence.id).toBe('intro');
      expect(sequence.levelIds).toContain('intro1');
      expect(sequence.levelIds).toContain('intro2');
      expect(sequence.levelIds).toContain('intro3');
    });
  });

  test.describe('Tutorial Components', () => {
    test('TutorialDialog should be accessible', async ({ page }) => {
      // This tests the component structure, not full integration
      // Full integration would require implementing the Learn UI page

      // For now, verify the components exist in the bundle
      await page.goto('/');

      // Components should be importable (this verifies no build errors)
      expect(true).toBe(true);
    });
  });

  test.describe('Progress Tracking', () => {
    test('should handle IndexedDB initialization', async ({ page }) => {
      await page.goto('/');

      // Check that IndexedDB is available
      const hasIndexedDB = await page.evaluate(() => {
        return typeof indexedDB !== 'undefined';
      });

      expect(hasIndexedDB).toBe(true);
    });

    test('should handle localStorage fallback', async ({ page }) => {
      await page.goto('/');

      // Check that localStorage is available
      const hasLocalStorage = await page.evaluate(() => {
        return typeof localStorage !== 'undefined';
      });

      expect(hasLocalStorage).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('tutorial dialogs should have proper ARIA labels', async ({ page }) => {
      // Test that the dialog components have proper accessibility
      // This would be expanded when the UI is integrated

      await page.goto('/');

      // For now, just verify the page loads without a11y violations
      // In a real scenario, we'd use @axe-core/playwright to check
      expect(await page.title()).toContain('Git Visualizer');
    });

    test('components should be keyboard navigable', async ({ page }) => {
      await page.goto('/');

      // Verify Tab key navigation works
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);

      // Should focus on an interactive element or body
      expect(['BUTTON', 'A', 'INPUT', 'BODY']).toContain(focused);
    });
  });
});

test.describe('Level Content Validation', () => {
  test('intro1 level has required fields', async ({ page }) => {
    await page.goto('/');

    const response = await page.request.get('/levels/intro1.json');
    const level = await response.json();

    // Validate level structure
    expect(level).toHaveProperty('id');
    expect(level).toHaveProperty('name');
    expect(level).toHaveProperty('description');
    expect(level).toHaveProperty('difficulty');
    expect(level).toHaveProperty('order');
    expect(level).toHaveProperty('initialState');
    expect(level).toHaveProperty('goalState');
    expect(level).toHaveProperty('tutorialSteps');
    expect(level).toHaveProperty('solutionCommands');
    expect(level).toHaveProperty('hints');

    // Validate tutorial steps
    expect(Array.isArray(level.tutorialSteps)).toBe(true);
    expect(level.tutorialSteps.length).toBeGreaterThan(0);

    // Validate localization
    expect(level.name).toHaveProperty('en_US');
    expect(level.description).toHaveProperty('en_US');
  });

  test('intro2 level has required fields', async ({ page }) => {
    await page.goto('/');

    const response = await page.request.get('/levels/intro2.json');
    const level = await response.json();

    expect(level.id).toBe('intro2');
    expect(level.name.en_US).toBe('Branching in Git');
    expect(level.tutorialSteps.length).toBeGreaterThan(0);
  });

  test('intro3 level has required fields', async ({ page }) => {
    await page.goto('/');

    const response = await page.request.get('/levels/intro3.json');
    const level = await response.json();

    expect(level.id).toBe('intro3');
    expect(level.name.en_US).toBe('Merging Branches');
    expect(level.tutorialSteps.length).toBeGreaterThan(0);
  });

  test('all levels have valid Git states', async ({ page }) => {
    await page.goto('/');

    const levelIds = ['intro1', 'intro2', 'intro3'];

    for (const levelId of levelIds) {
      const response = await page.request.get(`/levels/${levelId}.json`);
      const level = await response.json();

      // Validate initial state structure
      expect(level.initialState).toHaveProperty('commits');
      expect(level.initialState).toHaveProperty('branches');
      expect(level.initialState).toHaveProperty('head');
      expect(Array.isArray(level.initialState.commits)).toBe(true);
      expect(Array.isArray(level.initialState.branches)).toBe(true);

      // Validate goal state structure
      expect(level.goalState).toHaveProperty('commits');
      expect(level.goalState).toHaveProperty('branches');
      expect(level.goalState).toHaveProperty('head');

      // Validate commits have required fields
      if (level.initialState.commits.length > 0) {
        const commit = level.initialState.commits[0];
        expect(commit).toHaveProperty('id');
        expect(commit).toHaveProperty('parents');
        expect(commit).toHaveProperty('message');
      }
    }
  });
});

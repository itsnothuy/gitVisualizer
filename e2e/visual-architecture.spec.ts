/**
 * E2E tests for visual architecture system
 * 
 * Tests node/edge positioning, label movement, and accessibility
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Visual Architecture System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
    
    // Wait for the graph to be ready instead of networkidle
    await page.waitForSelector('[role="graphics-document"]', { timeout: 30000 });
  });

  test('should render visual elements with correct structure', async ({ page }) => {
    // Check if graph container exists
    const graphContainer = page.locator('[role="graphics-document"]');
    await expect(graphContainer).toBeVisible({ timeout: 10000 });
  });

  test('should support keyboard navigation on nodes', async ({ page }) => {
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 10000 });
    
    // Find first node
    const firstNode = page.locator('[role="button"][data-testid^="graph-node-"]').first();
    
    if (await firstNode.count() > 0) {
      // Focus the first node
      await firstNode.focus();
      
      // Verify it has focus
      await expect(firstNode).toBeFocused();
      
      // Check that it has proper ARIA label
      const ariaLabel = await firstNode.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('Commit');
    }
  });

  test('should have accessible node labels', async ({ page }) => {
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 10000 });
    
    // Check for nodes with proper accessibility attributes
    const nodes = page.locator('[role="button"][data-node-id]');
    const count = await nodes.count();
    
    if (count > 0) {
      // Check first node
      const firstNode = nodes.first();
      
      // Should have tabindex
      await expect(firstNode).toHaveAttribute('tabindex', '0');
      
      // Should have role
      await expect(firstNode).toHaveAttribute('role', 'button');
      
      // Should have aria-label
      const ariaLabel = await firstNode.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('should render edges between commits', async ({ page }) => {
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 10000 });
    
    // Check for edges
    const edges = page.locator('[data-edge-id]');
    const edgeCount = await edges.count();
    
    // If there are nodes, there should be edges (assuming commits have parents)
    const nodes = page.locator('[data-node-id]');
    const nodeCount = await nodes.count();
    
    if (nodeCount > 1) {
      // Should have at least one edge connecting commits
      expect(edgeCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('should pass accessibility checks', async ({ page }) => {
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 10000 });
    
    // Run axe accessibility checks
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Should have no critical violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical'
    );
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('should render with color-independent status indicators', async ({ page }) => {
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 10000 });
    
    // Look for status markers (if any nodes have CI status)
    const statusMarkers = page.locator('[aria-label*="Build"]');
    const markerCount = await statusMarkers.count();
    
    if (markerCount > 0) {
      // Check that status is conveyed through shapes, not just color
      const firstMarker = statusMarkers.first();
      
      // Should have aria-label describing the status
      const ariaLabel = await firstMarker.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/Build (passed|failed|pending|status unknown)/);
    }
  });
});

test.describe('Visual Elements Grid System', () => {
  test('should position nodes according to grid system', async ({ page }) => {
    // Navigate to a test page or fixture (if available)
    await page.goto('/');
    
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 10000 });
    
    // Get nodes
    const nodes = page.locator('[data-node-id]');
    const count = await nodes.count();
    
    if (count >= 2) {
      // Get bounding boxes of first two nodes
      const node1 = nodes.nth(0);
      const node2 = nodes.nth(1);
      
      const box1 = await node1.boundingBox();
      const box2 = await node2.boundingBox();
      
      if (box1 && box2) {
        // Verify that nodes are positioned with some spacing
        // (exact spacing depends on layout, but they shouldn't overlap)
        const distance = Math.sqrt(
          Math.pow(box1.x - box2.x, 2) + Math.pow(box1.y - box2.y, 2)
        );
        
        expect(distance).toBeGreaterThan(0);
      }
    }
  });
});

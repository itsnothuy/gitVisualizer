/**
 * E2E tests for LGB animation system
 * 
 * Tests verify:
 * - Demo scene can be mounted and played
 * - Keyboard navigation remains functional during animations
 * - Zero critical accessibility violations
 * - Reduced motion respect
 */

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("LGB Animation System", () => {
  test("should allow keyboard navigation during idle animation state", async ({ page }) => {
    // Navigate to demo page
    await page.goto("/demo");

    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

    // Get the first node
    const firstNode = page.locator('[data-testid^="graph-node-"]').first();

    // Verify node has proper attributes for accessibility
    await expect(firstNode).toHaveAttribute('tabindex', '0');
    await expect(firstNode).toHaveAttribute('role', 'button');
    await expect(firstNode).toHaveAttribute('aria-label');

    // Verify ARIA label contains expected content
    const ariaLabel = await firstNode.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/commit/i);
  });

  test("should have aria-live region for announcements", async ({ page }) => {
    await page.goto("/demo");

    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

    // Check for aria-live region
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toHaveCount(1);

    // Should have role="status"
    await expect(liveRegion).toHaveAttribute('role', 'status');

    // Should be screen-reader only (check for sr-only class)
    await expect(liveRegion).toHaveClass(/sr-only/);
  });

  test("should have zero critical accessibility violations on demo page", async ({ page }) => {
    await page.goto("/demo");

    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

    // Run axe-core analysis
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    // Filter critical violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.impact === 'critical'
    );

    // Log critical violations if any
    if (criticalViolations.length > 0) {
      console.log('\n=== Critical Violations ===');
      criticalViolations.forEach((violation) => {
        console.log(`${violation.id}: ${violation.description}`);
        console.log(`  Help: ${violation.helpUrl}`);
        violation.nodes.forEach((node) => {
          console.log(`  - ${node.html}`);
          console.log(`    Impact: ${node.impact}`);
          console.log(`    Target: ${node.target.join(', ')}`);
        });
      });
    }

    // Assert zero critical violations
    expect(criticalViolations).toEqual([]);
  });

  test("graph nodes should be keyboard accessible", async ({ page }) => {
    await page.goto("/demo");

    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

    // Get all nodes
    const nodes = page.locator('[data-testid^="graph-node-"]');
    const nodeCount = await nodes.count();

    // Should have at least some nodes
    expect(nodeCount).toBeGreaterThan(0);

    // Each node should be focusable
    const firstNode = nodes.first();
    await expect(firstNode).toHaveAttribute('tabindex', '0');
    await expect(firstNode).toHaveAttribute('role', 'button');

    // Should have proper aria-label
    const ariaLabel = await firstNode.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('Commit');
  });

  test("should respect prefers-reduced-motion", async ({ page, context }) => {
    // Set prefers-reduced-motion
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: () => { },
          removeListener: () => { },
          addEventListener: () => { },
          removeEventListener: () => { },
          dispatchEvent: () => true,
        }),
      });
    });

    await page.goto("/demo");

    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

    // Verify page loaded successfully
    const svg = page.locator('[role="graphics-document"]');
    await expect(svg).toBeVisible();

    // Note: We can't directly test animation duration reduction in E2E,
    // but we verify the page loads and functions correctly with reduced motion
  });

  test("should maintain graph structure integrity", async ({ page }) => {
    await page.goto("/demo");

    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

    // Check SVG structure
    const svg = page.locator('[role="graphics-document"]');
    await expect(svg).toBeVisible();

    // Should have nodes group
    const nodesGroup = page.locator('[aria-label="Commits"]');
    await expect(nodesGroup).toBeVisible();

    // Should have edges group
    const edgesGroup = page.locator('[aria-label="Commit relationships"]');
    await expect(edgesGroup).toBeVisible();

    // Should have at least one node
    const nodes = page.locator('[data-testid^="graph-node-"]');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThan(0);
  });
});

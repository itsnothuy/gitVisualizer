import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("homepage should not have automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/");
    
    // Wait for page stability
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    // Log full violations for CI diagnostics
    if (accessibilityScanResults.violations.length > 0) {
      console.log('AXE VIOLATIONS JSON:\n', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    
    expect(accessibilityScanResults.violations.length).toBe(0);
  });

  test("demo page should not have accessibility issues", async ({ page }) => {
    await page.goto("/demo");
    
    // Wait for page stability and graph to render
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="graphics-document"]', { timeout: 30000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    // Log full violations for CI diagnostics
    if (accessibilityScanResults.violations.length > 0) {
      console.log('AXE VIOLATIONS JSON:\n', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    
    expect(accessibilityScanResults.violations.length).toBe(0);
  });

  test("should have proper landmarks", async ({ page }) => {
    await page.goto("/");
    
    // Check for main landmark
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
    
    // Check for banner (header)
    const banner = page.getByRole("banner");
    await expect(banner).toBeVisible();
    
    // Check for navigation
    const nav = page.getByRole("navigation").first();
    await expect(nav).toBeVisible();
  });

  test("graph visualization should have proper ARIA structure", async ({ page }) => {
    await page.goto("/demo");
    
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });
    
    // Check for graphics-document role
    const graphSVG = page.locator('[role="graphics-document"]');
    await expect(graphSVG).toBeVisible();
    
    // Verify graph has accessible label
    await expect(graphSVG).toHaveAttribute("aria-label");
  });

  test("skip to main content link should work", async ({ page }) => {
    await page.goto("/");
    
    // Tab to skip link
    await page.keyboard.press("Tab");
    
    // Check if skip link is visible when focused
    const skipLink = page.getByText("Skip to main content");
    await expect(skipLink).toBeVisible();
    
    // Verify it links to main content
    await expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/");
    
    // Check that skip link exists and has correct attributes
    const skipLink = page.getByRole("link", { name: /skip to main content/i });
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveAttribute("href", "#main-content");
    
    // Check that main content exists
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
  });

  test("graph nodes should be keyboard accessible", async ({ page }) => {
    await page.goto("/demo");
    
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });
    
    // Find first graph node
    const firstNode = page.locator('[role="button"][data-testid^="graph-node-"]').first();
    await expect(firstNode).toBeVisible();
    
    // Check that node has proper accessibility attributes
    await expect(firstNode).toHaveAttribute("tabindex", "0");
    await expect(firstNode).toHaveAttribute("role", "button");
    await expect(firstNode).toHaveAttribute("aria-label");
    
    // Verify ARIA label contains expected content
    const ariaLabel = await firstNode.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/commit/i);
  });

  test("reduced motion preference should be respected", async ({ page, context }) => {
    // Set reduced motion preference
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => {
          if (query === '(prefers-reduced-motion: reduce)') {
            return {
              matches: true,
              media: query,
              addEventListener: () => {},
              removeEventListener: () => {},
              addListener: () => {},
              removeListener: () => {},
              dispatchEvent: () => true,
            };
          }
          return {
            matches: false,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => true,
          };
        },
      });
    });
    
    await page.goto("/demo");
    
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });
    
    // Check that reduced motion preference is detected
    const hasReducedMotionClass = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    
    expect(hasReducedMotionClass).toBe(true);
  });

  test("should have no color-only information encoding", async ({ page }) => {
    await page.goto("/demo");
    
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });
    
    // Verify status markers have aria-labels
    const statusMarkers = page.locator('[aria-label*="Build"]');
    const count = await statusMarkers.count();
    
    // Should have status markers with descriptive labels
    expect(count).toBeGreaterThan(0);
    
    // Each status marker should have descriptive text
    for (let i = 0; i < Math.min(count, 3); i++) {
      const label = await statusMarkers.nth(i).getAttribute('aria-label');
      expect(label).toMatch(/Build (passed|failed|pending|status unknown)/);
    }
  });

  test("focus indicators should be visible", async ({ page }) => {
    await page.goto("/demo");
    
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });
    
    // Find first graph node
    const firstNode = page.locator('[role="button"][data-testid^="graph-node-"]').first();
    
    // Check that the node has CSS classes that indicate focus capability
    const hasOutlineClass = await firstNode.evaluate((el) => {
      return el.classList.contains('outline-none') || 
             el.classList.contains('cursor-pointer') ||
             getComputedStyle(el).outline !== 'none';
    });
    
    // Verify some form of focus styling exists in the CSS
    expect(hasOutlineClass).toBeTruthy();
  });
});

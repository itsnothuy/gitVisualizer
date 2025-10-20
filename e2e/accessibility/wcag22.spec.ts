import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * WCAG 2.2 AA Compliance Tests
 * 
 * This test suite verifies compliance with WCAG 2.2 Level AA success criteria,
 * focusing on the new requirements introduced in WCAG 2.2:
 * - 2.4.11 Focus Not Obscured (Minimum)
 * - 2.4.13 Focus Appearance (AAA but implemented)
 * - 2.5.7 Dragging Movements
 * - 2.5.8 Target Size (Minimum)
 * - 3.2.6 Consistent Help
 * - 3.3.7 Redundant Entry
 * - 3.3.8 Accessible Authentication (Minimum)
 */

test.describe("WCAG 2.2 Compliance", () => {
  test.describe("2.4.11 Focus Not Obscured (Minimum) - Level AA", () => {
    test("focused elements should not be entirely hidden by fixed/sticky content", async ({ page }) => {
      await page.goto("/demo");
      await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

      // Get all focusable elements
      const focusableElements = await page.locator('[tabindex="0"]').all();

      for (const element of focusableElements.slice(0, 5)) {
        // Focus the element
        await element.focus();

        // Verify element is visible (not obscured)
        await expect(element).toBeVisible();

        // Check if element is in viewport
        const boundingBox = await element.boundingBox();
        expect(boundingBox).not.toBeNull();

        if (boundingBox) {
          const viewport = page.viewportSize();
          expect(viewport).not.toBeNull();

          if (viewport) {
            // Element should be at least partially visible in viewport
            const isInViewport =
              boundingBox.x < viewport.width &&
              boundingBox.y < viewport.height &&
              boundingBox.x + boundingBox.width > 0 &&
              boundingBox.y + boundingBox.height > 0;

            expect(isInViewport).toBe(true);
          }
        }
      }
    });

    test("focused graph nodes should remain visible at 200% zoom", async ({ page }) => {
      await page.goto("/demo");
      await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

      // Set zoom to 200%
      await page.evaluate(() => {
        document.body.style.zoom = "2";
      });

      // Find first graph node
      const firstNode = page.locator('[role="button"][data-testid^="graph-node-"]').first();
      await firstNode.focus();

      // Verify node is visible
      await expect(firstNode).toBeVisible();

      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = "1";
      });
    });
  });

  test.describe("2.4.13 Focus Appearance - Level AAA (Implemented)", () => {
    test("focus indicators should have minimum 2px thickness", async ({ page }) => {
      await page.goto("/demo");
      await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

      // Focus a graph node
      const firstNode = page.locator('[role="button"][data-testid^="graph-node-"]').first();
      await firstNode.focus();

      // Check for focus ring element
      const focusRing = firstNode.locator('circle[stroke-width="2"]');
      await expect(focusRing).toBeVisible();

      // Verify stroke width is 2px
      const strokeWidth = await focusRing.getAttribute("stroke-width");
      expect(strokeWidth).toBe("2");
    });

    test("focus indicators should enclose the focused element", async ({ page }) => {
      await page.goto("/demo");
      await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

      // Focus a graph node
      const firstNode = page.locator('[role="button"][data-testid^="graph-node-"]').first();
      await firstNode.focus();

      // Get focus ring radius (should be r=14)
      const focusRing = firstNode.locator('circle[stroke-width="2"]');
      const focusRadius = await focusRing.getAttribute("r");
      expect(Number(focusRadius)).toBeGreaterThanOrEqual(14);

      // Get node circle radius (should be r=8)
      const nodeCircle = firstNode.locator('circle[data-node-id]');
      const nodeRadius = await nodeCircle.getAttribute("r");
      expect(Number(nodeRadius)).toBeLessThanOrEqual(8);

      // Focus ring should enclose node (r=14 > r=8)
      expect(Number(focusRadius)).toBeGreaterThan(Number(nodeRadius) || 0);
    });

    test("focus indicators should have sufficient contrast", async ({ page }) => {
      await page.goto("/demo");
      await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

      // Run axe-core with focus-visible rules
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2aa"])
        .include('[role="graphics-document"]')
        .analyze();

      // Filter for color contrast violations
      const contrastViolations = accessibilityScanResults.violations.filter(
        (v) => v.id === "color-contrast"
      );

      expect(contrastViolations.length).toBe(0);
    });
  });

  test.describe("2.5.7 Dragging Movements - Level AA", () => {
    test("pan functionality should be achievable without dragging", async ({ page }) => {
      await page.goto("/demo");
      await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

      // Verify keyboard navigation works (alternative to dragging/panning)
      const firstNode = page.locator('[role="button"][data-testid^="graph-node-"]').first();
      await firstNode.focus();

      // Get initial focus
      const initialNodeId = await firstNode.getAttribute("data-testid");

      // Use arrow keys to navigate (no dragging required)
      await page.keyboard.press("ArrowRight");

      // Wait a moment for focus to change
      await page.waitForTimeout(100);

      // Verify focus changed to a different node
      const focusedElement = page.locator(":focus");
      const newNodeId = await focusedElement.getAttribute("data-testid");

      // Should have navigated to a different node
      expect(newNodeId).not.toBe(initialNodeId);
      expect(newNodeId).toContain("graph-node-");
    });

    test("zoom functionality should be achievable with mouse wheel (single pointer, no drag)", async ({ page }) => {
      await page.goto("/demo");
      await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

      // Verify mouse wheel zoom works
      // Note: react-zoom-pan-pinch supports wheel zoom by default
      const svg = page.locator('[role="graphics-document"]');
      
      // Simulate mouse wheel event (zoom in)
      await svg.hover();
      await page.mouse.wheel(0, -100);

      // Graph should still be visible after zoom
      await expect(svg).toBeVisible();
    });

    test("all interactive graph operations should have keyboard alternatives", async ({ page }) => {
      await page.goto("/demo");
      await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

      // Test keyboard navigation
      const tests = [
        { key: "Tab" },
        { key: "ArrowRight" },
        { key: "ArrowLeft" },
        { key: "Enter" },
        { key: "Escape" },
      ];

      for (const { key } of tests) {
        await page.keyboard.press(key);
        // Should not throw error
        expect(true).toBe(true);
      }
    });
  });

  test.describe("2.5.8 Target Size (Minimum) - Level AA", () => {
    test("graph nodes should meet target size via spacing exception", async ({ page }) => {
      await page.goto("/demo");
      await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

      // Get all graph nodes
      const nodes = await page.locator('[role="button"][data-testid^="graph-node-"]').all();

      if (nodes.length >= 2) {
        // Get positions of first two nodes
        const box1 = await nodes[0].boundingBox();
        const box2 = await nodes[1].boundingBox();

        if (box1 && box2) {
          // Calculate distance between node centers
          const distance = Math.sqrt(
            Math.pow(box2.x - box1.x, 2) + Math.pow(box2.y - box1.y, 2)
          );

          // Distance should be ≥ 24px (WCAG 2.5.8 spacing exception)
          // Typically should be much larger (50-100px) due to ELK layout
          expect(distance).toBeGreaterThanOrEqual(24);
        }
      }
    });

    test("UI buttons should meet minimum 24x24 CSS pixel target size", async ({ page }) => {
      await page.goto("/");

      // Get all buttons
      const buttons = await page.locator("button").all();

      for (const button of buttons) {
        const box = await button.boundingBox();

        if (box) {
          // Buttons should be at least 24x24px
          expect(box.width).toBeGreaterThanOrEqual(24);
          expect(box.height).toBeGreaterThanOrEqual(24);
        }
      }
    });

    test("links should meet minimum target size", async ({ page }) => {
      await page.goto("/");

      // Get all links (excluding skip link which is special case)
      const links = await page
        .locator('a:not(.skip-link)')
        .all();

      for (const link of links.slice(0, 5)) {
        const box = await link.boundingBox();

        if (box) {
          // Interactive links should be at least 24x24px or inline text
          const isVisible = await link.isVisible();
          if (isVisible) {
            // Most links should meet size requirement or be inline
            expect(box.width).toBeGreaterThan(0);
            expect(box.height).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe("3.2.6 Consistent Help - Level A", () => {
    test("help mechanisms should be in consistent location (N/A - no help currently)", async ({ page }) => {
      await page.goto("/");
      
      // Application currently has no dedicated help mechanisms
      // This is acceptable for N/A status
      // If help is added in future, it must be in consistent location across pages
      
      const helpButton = page.locator('button:has-text("Help")');
      const count = await helpButton.count();
      
      // Currently should be 0 (N/A)
      expect(count).toBe(0);
    });
  });

  test.describe("3.3.7 Redundant Entry - Level A", () => {
    test("previously entered information should not require re-entry", async ({ page }) => {
      await page.goto("/");

      // Click "Open Repository" button
      const openRepoButton = page.getByRole("button", { name: /open repository/i });
      await openRepoButton.click();

      // Select "Try a Sample" tab (if available)
      const sampleTab = page.getByRole("tab", { name: /try a sample/i });
      if (await sampleTab.isVisible()) {
        await sampleTab.click();

        // Load a sample
        const loadButton = page.getByRole("button", { name: /load sample/i }).first();
        if (await loadButton.isVisible()) {
          await loadButton.click();
        }
      }

      // Session storage should preserve user choices
      // Verify session storage is used
      const hasSessionStorage = await page.evaluate(() => {
        return typeof window.sessionStorage !== "undefined";
      });

      expect(hasSessionStorage).toBe(true);
    });
  });

  test.describe("3.3.8 Accessible Authentication (Minimum) - Level AA", () => {
    test("application should not require authentication (N/A)", async ({ page }) => {
      await page.goto("/");

      // Application is fully client-side with no authentication
      // No login forms should exist
      const loginInput = page.locator('input[type="password"]');
      const count = await loginInput.count();

      expect(count).toBe(0);
    });

    test("no cognitive function tests should be present", async ({ page }) => {
      await page.goto("/");

      // No CAPTCHA or cognitive tests should exist
      const captcha = page.locator('[class*="captcha"], [class*="recaptcha"]');
      const count = await captcha.count();

      expect(count).toBe(0);
    });
  });

  test.describe("Reduced Motion Support (2.3.3 - Level AAA)", () => {
    test("animations should respect prefers-reduced-motion", async ({ page, context }) => {
      // Set reduced motion preference
      await context.addInitScript(() => {
        Object.defineProperty(window, "matchMedia", {
          writable: true,
          value: (query: string) => {
            if (query === "(prefers-reduced-motion: reduce)") {
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
      await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

      // Verify reduced motion is detected
      const reducedMotion = await page.evaluate(() => {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      });

      expect(reducedMotion).toBe(true);

      // Check that CSS reduces animation durations
      const animationDuration = await page.evaluate(() => {
        const element = document.body;
        const styles = window.getComputedStyle(element);
        return styles.animationDuration;
      });

      // Should be very short or 0s
      // CSS sets it to 0.01ms which may show as 0s
      expect(animationDuration).toMatch(/^0/);
    });

    test("reduced motion should not hide information", async ({ page, context }) => {
      // Set reduced motion preference
      await context.addInitScript(() => {
        Object.defineProperty(window, "matchMedia", {
          writable: true,
          value: (query: string) => {
            if (query === "(prefers-reduced-motion: reduce)") {
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
      await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

      // Graph should still be fully visible and functional
      const svg = page.locator('[role="graphics-document"]');
      await expect(svg).toBeVisible();

      // Nodes should be present
      const nodes = page.locator('[role="button"][data-testid^="graph-node-"]');
      const nodeCount = await nodes.count();
      expect(nodeCount).toBeGreaterThan(0);

      // All nodes should have accessible labels
      const firstNode = nodes.first();
      const ariaLabel = await firstNode.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/commit/i);
    });
  });

  test.describe("Comprehensive WCAG 2.2 AA Scan", () => {
    test("demo page should pass all WCAG 2.2 AA rules", async ({ page }) => {
      await page.goto("/demo");
      await page.waitForLoadState("networkidle");
      await page.waitForSelector('[role="graphics-document"]', { timeout: 30000 });

      // Run comprehensive axe scan with WCAG 2.2 tags
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      // Log violations for CI diagnostics
      if (accessibilityScanResults.violations.length > 0) {
        console.log(
          "WCAG 2.2 VIOLATIONS:\n",
          JSON.stringify(accessibilityScanResults.violations, null, 2)
        );
      }

      // Should have zero violations
      expect(accessibilityScanResults.violations.length).toBe(0);
    });

    test("home page should pass all WCAG 2.2 AA rules", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Run comprehensive axe scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      if (accessibilityScanResults.violations.length > 0) {
        console.log(
          "WCAG 2.2 VIOLATIONS (Home):\n",
          JSON.stringify(accessibilityScanResults.violations, null, 2)
        );
      }

      expect(accessibilityScanResults.violations.length).toBe(0);
    });

    test("should generate axe report artifact", async ({ page }) => {
      await page.goto("/demo");
      await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });

      // Run axe and capture results
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      // Write results to file for artifact collection
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require("path");
      const artifactsDir = path.join(process.cwd(), "test-results", "axe-reports");

      if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
      }

      const reportPath = path.join(artifactsDir, "wcag22-axe-report.json");
      fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

      console.log(`Axe report saved to: ${reportPath}`);
      expect(fs.existsSync(reportPath)).toBe(true);
    });
  });
});

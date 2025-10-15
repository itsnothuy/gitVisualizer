import { test, expect } from "@playwright/test";

test.describe("LGB Skin Visual Tests", () => {
  test("demo page loads with default theme", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
    
    // Check that the demo page loaded
    const heading = page.getByRole("heading", { name: /graph renderer demo/i });
    await expect(heading).toBeVisible();
  });

  test("theme settings panel is visible", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
    
    // Check for theme settings card
    const appearanceHeading = page.getByRole("heading", { name: /appearance/i });
    await expect(appearanceHeading).toBeVisible();
    
    // Check for LGB mode toggle
    const lgbModeHeading = page.getByRole("heading", { name: /lgb mode/i });
    await expect(lgbModeHeading).toBeVisible();
    
    const toggleButton = page.getByRole("button", { name: /lgb mode/i });
    await expect(toggleButton).toBeVisible();
  });

  test("can toggle LGB mode on", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
    
    const toggleButton = page.getByRole("button", { name: /lgb mode/i });
    await expect(toggleButton).toHaveText("Off");
    
    // Click to enable LGB mode
    await toggleButton.click();
    
    await expect(toggleButton).toHaveText("On");
    await expect(toggleButton).toHaveAttribute("aria-pressed", "true");
  });

  test("LGB mode persists in session storage", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
    
    // Enable LGB mode
    const toggleButton = page.getByRole("button", { name: /lgb mode/i });
    await toggleButton.click();
    
    // Check session storage
    const lgbModeValue = await page.evaluate(() => sessionStorage.getItem("lgb-mode"));
    expect(lgbModeValue).toBe("true");
  });

  // TODO: Generate baseline snapshots by running locally with --update-snapshots
  // Visual regression test requires baseline images to compare against
  test.skip("visual snapshot of tiny graph with default skin", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
    
    // Wait for graph to render
    await page.waitForSelector('svg[role="graphics-document"]', { timeout: 10000 });
    
    // Take screenshot of the graph area
    const graphCard = page.locator("text=Sample Git History").locator("../..");
    await expect(graphCard).toBeVisible();
    
    // Visual regression test - compare screenshot
    await expect(graphCard).toHaveScreenshot("graph-default-skin.png", {
      maxDiffPixels: 100, // Allow small differences
    });
  });

  // TODO: Generate baseline snapshots by running locally with --update-snapshots
  // Visual regression test requires baseline images to compare against
  test.skip("visual snapshot of tiny graph with LGB skin", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
    
    // Enable LGB mode
    const toggleButton = page.getByRole("button", { name: /lgb mode/i });
    await toggleButton.click();
    await page.waitForTimeout(500); // Wait for any transitions
    
    // Wait for graph to render
    await page.waitForSelector('svg[role="graphics-document"]', { timeout: 10000 });
    
    // Take screenshot of the graph area
    const graphCard = page.locator("text=Sample Git History").locator("../..");
    await expect(graphCard).toBeVisible();
    
    // Visual regression test - compare screenshot
    await expect(graphCard).toHaveScreenshot("graph-lgb-skin.png", {
      maxDiffPixels: 100, // Allow small differences
    });
  });

  test("graph renders with lgb-skin class when LGB mode is on", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
    
    // Enable LGB mode
    const toggleButton = page.getByRole("button", { name: /lgb mode/i });
    await toggleButton.click();
    await page.waitForTimeout(500); // Wait for React re-render and transitions
    
    // Wait for graph to render with LGB skin
    const svg = page.locator('svg[role="graphics-document"]');
    await expect(svg).toBeVisible();
    
    // Check that the SVG has the lgb-skin class
    await expect(svg).toHaveClass(/lgb-skin/);
  });

  test("graph renders SVG defs with LGB markers when LGB mode is on", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
    
    // Enable LGB mode
    const toggleButton = page.getByRole("button", { name: /lgb mode/i });
    await toggleButton.click();
    await page.waitForTimeout(500); // Wait for React re-render and transitions
    
    // Wait for graph to render
    await page.waitForSelector('svg[role="graphics-document"]', { timeout: 10000 });
    
    // Check for LGB-specific SVG markers in defs
    const lgbArrowhead = page.locator('marker#lgb-arrowhead');
    await expect(lgbArrowhead).toBeAttached();
    
    const lgbArrowheadCopy = page.locator('marker#lgb-arrowhead-copy');
    await expect(lgbArrowheadCopy).toBeAttached();
  });

  test("reduced motion is respected", async ({ page }) => {
    // Set prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: "reduce" });
    
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
    
    // Enable LGB mode
    const toggleButton = page.getByRole("button", { name: /lgb mode/i });
    await toggleButton.click();
    
    // The graph should still render correctly
    const svg = page.locator('svg[role="graphics-document"]');
    await expect(svg).toBeVisible();
  });
});

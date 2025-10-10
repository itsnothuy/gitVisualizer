import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("homepage should not have automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/");
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
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
    
    // Start with the skip link (first focusable element)
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: /skip to main content/i });
    await expect(skipLink).toBeFocused();
    
    // Tab to next element (should be logo link)
    await page.keyboard.press("Tab");
    const logoLink = page.getByRole("link", { name: /git visualizer/i });
    await expect(logoLink).toBeFocused();
  });
});

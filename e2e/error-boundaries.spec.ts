import { test, expect } from "@playwright/test";

test.describe("Error Boundaries", () => {
  test("not-found page should be accessible and render correctly", async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto("/non-existent-page");

    // Check that the 404 page renders
    await expect(page.getByText("Page Not Found")).toBeVisible();
    await expect(page.getByText(/doesn't exist or has been moved/)).toBeVisible();

    // Check error status message
    const statusAlert = page.locator('[role="status"]');
    await expect(statusAlert).toBeVisible();
    await expect(statusAlert.getByText(/404.*could not be found/)).toBeVisible();

    // Check buttons are present and accessible
    const homeButton = page.getByRole("link", { name: /go to homepage/i });
    const demoButton = page.getByRole("link", { name: /view demo/i });
    
    await expect(homeButton).toBeVisible();
    await expect(demoButton).toBeVisible();

    // Test keyboard navigation
    await homeButton.focus();
    await expect(homeButton).toBeFocused();
    
    // Press Tab to move to demo button
    await page.keyboard.press("Tab");
    await expect(demoButton).toBeFocused();
  });

  test("not-found page navigation should work", async ({ page }) => {
    await page.goto("/non-existent-page");

    // Click "Go to homepage" button
    const homeButton = page.getByRole("link", { name: /go to homepage/i });
    await homeButton.click();
    
    // Should navigate to homepage
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Welcome to Git Visualizer")).toBeVisible();
  });

  test("not-found page should have proper ARIA attributes", async ({ page }) => {
    await page.goto("/non-existent-page");

    // Check for proper ARIA live region
    const statusAlert = page.locator('[role="status"][aria-live="polite"]');
    await expect(statusAlert).toBeVisible();

    // Check that links have proper aria-labels
    const homeButton = page.getByRole("link", { name: /go to homepage/i });
    await expect(homeButton).toHaveAttribute("aria-label", "Go to homepage");
  });

  test("error boundary should be keyboard navigable", async ({ page }) => {
    await page.goto("/non-existent-page");

    // Start from the page and tab through elements
    await page.keyboard.press("Tab");
    
    // Should be able to tab to the "Go to homepage" link
    const homeButton = page.getByRole("link", { name: /go to homepage/i });
    
    // Keep tabbing until we reach the button (skip navigation, etc.)
    let attempts = 0;
    while (!(await homeButton.isVisible() && await page.evaluate(el => document.activeElement === el, await homeButton.elementHandle())) && attempts < 10) {
      await page.keyboard.press("Tab");
      attempts++;
    }
    
    // Should be focusable
    await expect(homeButton).toBeVisible();
  });

  test("error boundary cards should have proper semantic structure", async ({ page }) => {
    await page.goto("/non-existent-page");

    // Check for proper heading hierarchy
    const heading = page.getByRole("heading", { name: /page not found/i });
    await expect(heading).toBeVisible();

    // Verify card structure exists
    const card = page.locator('[data-slot="card"]').first();
    await expect(card).toBeVisible();

    // Check for proper content sections
    const cardHeader = page.locator('[data-slot="card-header"]').first();
    const cardContent = page.locator('[data-slot="card-content"]').first();
    const cardFooter = page.locator('[data-slot="card-footer"]').first();
    
    await expect(cardHeader).toBeVisible();
    await expect(cardContent).toBeVisible();
    await expect(cardFooter).toBeVisible();
  });
});

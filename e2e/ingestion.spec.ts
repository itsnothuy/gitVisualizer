import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Ingestion Dialog", () => {
  test("displays IngestDialog with correct accessibility", async ({ page }) => {
    await page.goto("/");
    
    // Look for the Open Repository button
    const openButton = page.getByRole("button", { name: /open repository/i });
    await expect(openButton).toBeVisible();
    
    // Click to open dialog
    await openButton.click();
    
    // Verify dialog opens
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    
    // Verify dialog title
    const title = page.getByRole("heading", { name: /open git repository/i });
    await expect(title).toBeVisible();
    
    // Verify tabs are present
    const fsaTab = page.getByRole("tab", { name: /local folder/i });
    const directoryTab = page.getByRole("tab", { name: /upload folder/i });
    const zipTab = page.getByRole("tab", { name: /upload zip/i });
    
    await expect(fsaTab).toBeVisible();
    await expect(directoryTab).toBeVisible();
    await expect(zipTab).toBeVisible();
  });

  test("tabs navigation works correctly", async ({ page }) => {
    await page.goto("/");
    
    const openButton = page.getByRole("button", { name: /open repository/i });
    await openButton.click();
    
    // Click each tab and verify content changes
    const fsaTab = page.getByRole("tab", { name: /local folder/i });
    const directoryTab = page.getByRole("tab", { name: /upload folder/i });
    const zipTab = page.getByRole("tab", { name: /upload zip/i });
    
    // Click directory tab
    await directoryTab.click();
    await expect(directoryTab).toHaveAttribute("data-state", "active");
    
    // Verify directory-specific content
    const uploadFolderButton = page.getByRole("button", { name: /select folder to upload/i });
    await expect(uploadFolderButton).toBeVisible();
    
    // Click ZIP tab
    await zipTab.click();
    await expect(zipTab).toHaveAttribute("data-state", "active");
    
    // Verify ZIP-specific content
    const uploadZipButton = page.getByRole("button", { name: /select zip file/i });
    await expect(uploadZipButton).toBeVisible();
    
    // Verify ZIP instructions
    const zipInstructions = page.getByText(/to create a zip/i);
    await expect(zipInstructions).toBeVisible();
  });

  test("displays capability banner", async ({ page }) => {
    await page.goto("/");
    
    const openButton = page.getByRole("button", { name: /open repository/i });
    await openButton.click();
    
    // Verify capability banner is present
    const banner = page.getByText(/support/i);
    await expect(banner).toBeVisible();
  });

  test("displays privacy assurances", async ({ page }) => {
    await page.goto("/");
    
    const openButton = page.getByRole("button", { name: /open repository/i });
    await openButton.click();
    
    // Verify privacy messages
    const privacyMessage1 = page.getByText(/your repository data never leaves your device/i);
    const privacyMessage2 = page.getByText(/read-only access/i);
    const privacyMessage3 = page.getByText(/you can disconnect at any time/i);
    
    await expect(privacyMessage1).toBeVisible();
    await expect(privacyMessage2).toBeVisible();
    await expect(privacyMessage3).toBeVisible();
  });

  test("keyboard navigation works", async ({ page }) => {
    await page.goto("/");
    
    const openButton = page.getByRole("button", { name: /open repository/i });
    await openButton.click();
    
    // Tab through the tabs
    await page.keyboard.press("Tab");
    
    // Verify focus is on first tab
    const fsaTab = page.getByRole("tab", { name: /local folder/i });
    await expect(fsaTab).toBeFocused();
    
    // Arrow right to next tab
    await page.keyboard.press("ArrowRight");
    const directoryTab = page.getByRole("tab", { name: /upload folder/i });
    await expect(directoryTab).toBeFocused();
    
    // Arrow right to next tab
    await page.keyboard.press("ArrowRight");
    const zipTab = page.getByRole("tab", { name: /upload zip/i });
    await expect(zipTab).toBeFocused();
  });

  test("accessibility check - no critical violations", async ({ page }) => {
    await page.goto("/");
    
    const openButton = page.getByRole("button", { name: /open repository/i });
    await openButton.click();
    
    // Wait for dialog to be fully rendered
    await page.waitForTimeout(500);
    
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze();
    
    // Check for critical and serious violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    
    expect(criticalViolations).toHaveLength(0);
  });
});

import { expect, test } from "@playwright/test";

test.describe("Enhanced Ingestion Flow", () => {
  test("homepage displays repository picker", async ({ page }) => {
    await page.goto("/");
    
    // Look for the Open Repository button on homepage
    const openButton = page.getByRole("button", { name: /open repository/i });
    await expect(openButton).toBeVisible();
    
    // Verify the getting started section
    const gettingStartedTitle = page.getByRole("heading", { name: /getting started/i });
    await expect(gettingStartedTitle).toBeVisible();
  });

  test("repository page displays selection UI when no repo loaded", async ({ page }) => {
    await page.goto("/repo");
    
    // Should show repository selection card
    const card = page.getByRole("heading", { name: /repository visualization/i });
    await expect(card).toBeVisible();
    
    // Should show features list
    const features = page.getByText(/interactive commit graph/i);
    await expect(features).toBeVisible();
    
    // Should show repository picker
    const openButton = page.getByRole("button", { name: /open repository/i });
    await expect(openButton).toBeVisible();
    
    // Should show back to home button
    const backButton = page.getByRole("button", { name: /back to home/i });
    await expect(backButton).toBeVisible();
  });

  test("back to home button navigates correctly", async ({ page }) => {
    await page.goto("/repo");
    
    // Click back to home
    const backButton = page.getByRole("button", { name: /back to home/i });
    await backButton.click();
    
    // Should be on homepage
    await expect(page).toHaveURL("/");
    
    // Verify homepage content
    const gettingStarted = page.getByRole("heading", { name: /getting started/i });
    await expect(gettingStarted).toBeVisible();
  });

  test("repository header shows no repository state", async ({ page }) => {
    await page.goto("/repo");
    
    // Header should indicate no repository loaded
    const noRepoHeading = page.getByRole("heading", { name: /no repository loaded/i });
    await expect(noRepoHeading).toBeVisible();
    
    // Should show instruction text
    const instruction = page.getByText(/please select a repository/i);
    await expect(instruction).toBeVisible();
  });

  test("repository picker dialog opens and closes", async ({ page }) => {
    await page.goto("/");
    
    const openButton = page.getByRole("button", { name: /open repository/i });
    await openButton.click();
    
    // Dialog should be open
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    
    // Verify dialog has proper heading
    const dialogTitle = page.getByRole("heading", { name: /open local repository/i });
    await expect(dialogTitle).toBeVisible();
    
    // Close with Escape key
    await page.keyboard.press("Escape");
    
    // Dialog should be closed (with a small delay for animation)
    await page.waitForTimeout(500);
    await expect(dialog).not.toBeVisible();
  });
});

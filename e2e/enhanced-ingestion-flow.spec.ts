import { expect, test } from "@playwright/test";

test.describe("Enhanced Ingestion Flow", () => {
  test("homepage displays repository picker", async ({ page }) => {
    await page.goto("/");
    
    // Look for the select repository button on homepage
    const selectButton = page.getByRole("button", { name: /select repository folder/i });
    await expect(selectButton).toBeVisible();
    
    // Verify the getting started section
    const gettingStartedTitle = page.getByRole("heading", { name: /getting started/i });
    await expect(gettingStartedTitle).toBeVisible();
    
    // Verify the enhanced picker's Open Repository heading
    const openRepoHeading = page.getByRole("heading", { name: /^open repository$/i });
    await expect(openRepoHeading).toBeVisible();
  });

  test("repository page displays selection UI when no repo loaded", async ({ page }) => {
    await page.goto("/repo");
    
    // Should show repository selection card
    const card = page.getByRole("heading", { name: /repository visualization/i });
    await expect(card).toBeVisible();
    
    // Should show features list
    const features = page.getByText(/interactive commit graph/i);
    await expect(features).toBeVisible();
    
    // Should show repository picker button
    const selectButton = page.getByRole("button", { name: /select repository folder/i });
    await expect(selectButton).toBeVisible();
    
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

  test("enhanced repository picker displays privacy features", async ({ page }) => {
    await page.goto("/");
    
    // Verify privacy messaging is present
    const privacyMessage = page.getByText(/your repository data never leaves your device/i);
    await expect(privacyMessage).toBeVisible();
    
    const readOnlyMessage = page.getByText(/read-only access/i);
    await expect(readOnlyMessage).toBeVisible();
  });

  test("repository picker displays Open Repository card", async ({ page }) => {
    await page.goto("/");
    
    // Verify the card and its description
    const openRepoHeading = page.getByRole("heading", { name: /^open repository$/i });
    await expect(openRepoHeading).toBeVisible();
    
    const description = page.getByText(/select a local git repository from your file system/i);
    await expect(description).toBeVisible();
  });
});

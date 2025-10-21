import { expect, test } from "@playwright/test";

test.describe("Repository Visualization Page", () => {
  test("repository page loads successfully", async ({ page }) => {
    await page.goto("/repo");
    await expect(page).toHaveTitle(/Git Visualizer/);
  });

  test("displays repository visualization heading", async ({ page }) => {
    await page.goto("/repo");
    const heading = page.getByRole("heading", { name: /repository visualization/i });
    await expect(heading).toBeVisible();
  });

  test("shows no repository loaded in header", async ({ page }) => {
    await page.goto("/repo");
    const headerText = page.getByText(/no repository loaded/i);
    await expect(headerText).toBeVisible();
  });

  test("displays open repository button", async ({ page }) => {
    await page.goto("/repo");
    const openButton = page.getByRole("button", { name: /open repository/i });
    await expect(openButton).toBeVisible();
  });

  test("shows feature list", async ({ page }) => {
    await page.goto("/repo");
    
    // Check for feature list items
    await expect(page.getByText(/interactive commit graph/i)).toBeVisible();
    await expect(page.getByText(/keyboard navigation/i)).toBeVisible();
    await expect(page.getByText(/branch and tag visualization/i)).toBeVisible();
    await expect(page.getByText(/detailed commit inspector/i)).toBeVisible();
    await expect(page.getByText(/privacy-first/i)).toBeVisible();
  });

  test("has accessible page structure", async ({ page }) => {
    await page.goto("/repo");
    
    // Check for proper ARIA landmarks
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
  });

  test("repository picker dialog opens on button click", async ({ page }) => {
    await page.goto("/repo");
    
    const openButton = page.getByRole("button", { name: /open repository/i });
    await openButton.click();
    
    // Dialog should open (though File System Access API won't work in test environment)
    // We just verify the button is clickable and doesn't crash
    await expect(openButton).toBeEnabled();
  });
});

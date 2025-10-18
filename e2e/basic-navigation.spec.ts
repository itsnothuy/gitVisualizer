import { expect, test } from "@playwright/test";

test.describe("Basic Navigation", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Git Visualizer/);
  });

  test("displays welcome message", async ({ page }) => {
    await page.goto("/");
    const heading = page.getByRole("heading", { name: /welcome to git visualizer/i });
    await expect(heading).toBeVisible();
  });

  test("has main navigation", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: /main navigation/i });
    await expect(nav).toBeVisible();
  });

  test("displays getting started card", async ({ page }) => {
    await page.goto("/");
    // Wait for the specific element rather than global networkidle
    const card = page.getByRole("heading", { name: /getting started/i });
    await expect(card).toBeVisible({ timeout: 20000 });
  });
});

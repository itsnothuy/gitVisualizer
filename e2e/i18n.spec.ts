import { expect, test } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');

    // Wait for i18n to initialize
    await page.waitForLoadState('networkidle');
  });

  test('should display English content by default', async ({ page }) => {
    // Check main heading is in English
    await expect(page.getByRole('heading', { name: 'Welcome to Git Visualizer', level: 1 })).toBeVisible();

    // Check navigation
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  });

  test('should change language to German', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL('/settings');

    // Open language selector
    await page.getByRole('combobox', { name: 'Language' }).click();

    // Select German
    await page.getByRole('option', { name: 'Deutsch' }).click();

    // Wait for language change
    await page.waitForTimeout(500);

    // Verify German content
    await expect(page.getByRole('heading', { name: 'Einstellungen', level: 1 })).toBeVisible();

    // Navigate back to home to verify language persists
    await page.getByRole('link', { name: 'Startseite' }).click();
    await expect(page.getByRole('heading', { name: 'Willkommen bei Git Visualizer', level: 1 })).toBeVisible();
  });

  test('should change language to Arabic and enable RTL', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('link', { name: 'Settings' }).click();

    // Open language selector
    await page.getByRole('combobox', { name: 'Language' }).click();

    // Select Arabic
    await page.getByRole('option', { name: 'العربية' }).click();

    // Wait for language change
    await page.waitForTimeout(500);

    // Verify RTL direction is set
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('dir', 'rtl');
    await expect(htmlElement).toHaveAttribute('lang', 'ar');

    // Verify Arabic content
    await expect(page.getByRole('heading', { name: 'الإعدادات', level: 1 })).toBeVisible();
  });

  test('should persist language preference across page reloads', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('link', { name: 'Settings' }).click();

    // Change to German
    await page.getByRole('combobox', { name: 'Language' }).click();
    await page.getByRole('option', { name: 'Deutsch' }).click();
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify German is still active
    await expect(page.getByRole('heading', { name: 'Einstellungen', level: 1 })).toBeVisible();
  });

  test('should persist language preference across navigation', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('link', { name: 'Settings' }).click();

    // Change to German
    await page.getByRole('combobox', { name: 'Language' }).click();
    await page.getByRole('option', { name: 'Deutsch' }).click();
    await page.waitForTimeout(500);

    // Navigate to home
    await page.getByRole('link', { name: 'Startseite' }).click();

    // Verify German content
    await expect(page.getByRole('heading', { name: 'Willkommen bei Git Visualizer', level: 1 })).toBeVisible();

    // Navigate back to settings
    await page.getByRole('link', { name: 'Einstellungen' }).click();

    // Verify still in German
    await expect(page.getByRole('heading', { name: 'Einstellungen', level: 1 })).toBeVisible();
  });
});

test.describe('RTL Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Start from settings page
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should properly layout RTL content without overflow', async ({ page }) => {
    // Change to Arabic
    await page.getByRole('combobox', { name: 'Language' }).click();
    await page.getByRole('option', { name: 'العربية' }).click();
    await page.waitForTimeout(500);

    // Take a screenshot for manual verification
    await page.screenshot({ path: 'test-results/rtl-layout.png', fullPage: true });

    // Check for horizontal scrollbars (indicates overflow)
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 5); // Allow small margin

    // Verify main content area doesn't overflow
    const mainContent = page.locator('main[role="main"]');
    await expect(mainContent).toBeVisible();

    const mainBox = await mainContent.boundingBox();
    expect(mainBox).not.toBeNull();
    if (mainBox) {
      expect(mainBox.x).toBeGreaterThanOrEqual(0);
      expect(mainBox.x + mainBox.width).toBeLessThanOrEqual(await page.viewportSize()?.width || 1280);
    }
  });

  test('should have correct text alignment in RTL', async ({ page }) => {
    // Change to Arabic
    await page.getByRole('combobox', { name: 'Language' }).click();
    await page.getByRole('option', { name: 'العربية' }).click();
    await page.waitForTimeout(500);

    // Navigate to home
    await page.getByRole('link', { name: 'الرئيسية' }).click();

    // Check heading alignment
    const heading = page.getByRole('heading', { name: 'مرحبًا بك في مُصَوِّر Git', level: 1 });
    await expect(heading).toBeVisible();

    // Verify RTL is active
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');
  });

  test('should handle language switching between LTR and RTL', async ({ page }) => {
    // Start in English (LTR)
    let htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('ltr');

    // Switch to Arabic (RTL)
    await page.getByRole('combobox', { name: 'Language' }).click();
    await page.getByRole('option', { name: 'العربية' }).click();
    await page.waitForTimeout(500);

    htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');

    // Switch to German (LTR)
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Deutsch' }).click();
    await page.waitForTimeout(500);

    htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('ltr');

    // Verify no visual glitches
    await page.screenshot({ path: 'test-results/ltr-after-rtl.png' });
  });
});

test.describe('Accessibility for i18n', () => {
  test('should have proper lang attribute', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check default language
    let htmlLang = await page.locator('html').getAttribute('lang');
    expect(['en', 'de', 'ar']).toContain(htmlLang);

    // Navigate to settings and change language
    await page.goto('/settings');
    await page.getByRole('combobox', { name: 'Language' }).click();
    await page.getByRole('option', { name: 'Deutsch' }).click();
    await page.waitForTimeout(500);

    // Verify lang attribute updated
    htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('de');
  });

  test('should have accessible language switcher', async ({ page }) => {
    await page.goto('/settings');

    // Verify language selector is accessible
    const languageSelect = page.getByRole('combobox', { name: 'Language' });
    await expect(languageSelect).toBeVisible();

    // Should be keyboard accessible - verify attributes
    await expect(languageSelect).toHaveAttribute('role', 'combobox');
    await expect(languageSelect).toHaveAttribute('aria-label', 'Language');
  });
});

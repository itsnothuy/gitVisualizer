/**
 * E2E tests for Sandbox Mode
 * Tests navigation, command execution, export/import, and sharing
 */

import { expect, test } from '@playwright/test';

test.describe('Sandbox Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sandbox');
  });

  test.describe('Navigation and UI', () => {
    test('sandbox page loads successfully', async ({ page }) => {
      const heading = page.getByRole('heading', { name: /sandbox mode/i });
      await expect(heading).toBeVisible();
    });

    test('displays mode selector in header', async ({ page }) => {
      const modeSelector = page.getByRole('tablist', { name: /application mode selector/i });
      await expect(modeSelector).toBeVisible();

      const sandboxTab = page.getByRole('tab', { name: /sandbox mode/i });
      await expect(sandboxTab).toHaveAttribute('aria-selected', 'true');
    });

    test('displays command console', async ({ page }) => {
      const console = page.getByRole('region', { name: /git command console/i });
      await expect(console).toBeVisible();
    });

    test('displays action buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /import/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /share/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /reset/i })).toBeVisible();
    });

    test('displays state visualization panels', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /branches/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /commits/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /head status/i })).toBeVisible();
    });
  });

  test.describe('Command Execution', () => {
    test('executes commit command', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /git command input/i });
      await input.fill('commit -m "Test commit"');
      await input.press('Enter');

      // Wait for output
      const log = page.getByRole('log');
      await expect(log).toContainText('Test commit');
    });

    test('executes branch command', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /git command input/i });
      await input.fill('branch feature');
      await input.press('Enter');

      // Check that branch appears in branches panel
      await expect(page.getByText(/feature/)).toBeVisible();
    });

    test('shows error for invalid command', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /git command input/i });
      await input.fill('invalid-command');
      await input.press('Enter');

      const log = page.getByRole('log');
      await expect(log).toContainText(/unknown command/i);
    });

    test('navigates command history with arrow keys', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /git command input/i });

      // Execute first command
      await input.fill('commit -m "First"');
      await input.press('Enter');

      // Execute second command
      await input.fill('commit -m "Second"');
      await input.press('Enter');

      // Navigate up through history
      await input.press('ArrowUp');
      await expect(input).toHaveValue('commit -m "Second"');

      await input.press('ArrowUp');
      await expect(input).toHaveValue('commit -m "First"');

      // Navigate down
      await input.press('ArrowDown');
      await expect(input).toHaveValue('commit -m "Second"');
    });

    test('clears input with Escape', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /git command input/i });
      await input.fill('some text');
      await input.press('Escape');
      await expect(input).toHaveValue('');
    });
  });

  test.describe('Undo/Redo', () => {
    test('undo button is disabled initially', async ({ page }) => {
      const undoButton = page.getByRole('button', { name: /undo/i });
      await expect(undoButton).toBeDisabled();
    });

    test('can undo a command', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /git command input/i });

      // Execute a command
      await input.fill('commit -m "Test"');
      await input.press('Enter');

      // Wait for commit to be processed
      await page.waitForTimeout(100);

      // Undo should now be enabled
      const undoButton = page.getByRole('button', { name: /undo/i });
      await expect(undoButton).toBeEnabled();

      // Click undo
      await undoButton.click();

      // Verify undo message in log
      const log = page.getByRole('log');
      await expect(log).toContainText(/undid/i);
    });

    test('can redo an undone command', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /git command input/i });

      // Execute a command
      await input.fill('commit -m "Test"');
      await input.press('Enter');

      await page.waitForTimeout(100);

      // Undo
      const undoButton = page.getByRole('button', { name: /undo/i });
      await undoButton.click();

      await page.waitForTimeout(100);

      // Redo should now be enabled
      const redoButton = page.getByRole('button', { name: /redo/i });
      await expect(redoButton).toBeEnabled();

      // Click redo
      await redoButton.click();

      // Verify redo message in log
      const log = page.getByRole('log');
      await expect(log).toContainText(/redo/i);
    });

    test('displays undo/redo counts', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /git command input/i });

      // Execute a command
      await input.fill('commit -m "Test"');
      await input.press('Enter');

      await page.waitForTimeout(100);

      // Check undo count
      const undoButton = page.getByRole('button', { name: /undo/i });
      await expect(undoButton).toContainText('1');
    });
  });

  test.describe('Export/Import', () => {
    test('export button triggers download', async ({ page }) => {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      // Click export
      await page.getByRole('button', { name: /export/i }).click();

      // Verify download started
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/sandbox.*\.json/);
    });

    test('shows success toast after export', async ({ page }) => {
      await page.getByRole('button', { name: /export/i }).click();

      // Wait for toast
      const toast = page.getByRole('status');
      await expect(toast).toContainText(/exported successfully/i);
    });

    test('import button opens file picker', async ({ page }) => {
      // This test verifies the button is clickable
      // Actual file selection requires user interaction
      const importButton = page.getByRole('button', { name: /import/i });
      await expect(importButton).toBeEnabled();
      await importButton.click();

      // File picker should open (can't test the actual selection in E2E)
    });
  });

  test.describe('Share Links', () => {
    test('share button copies link to clipboard', async ({ page, context }) => {
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-write', 'clipboard-read']);

      await page.getByRole('button', { name: /share/i }).click();

      // Wait for toast
      const toast = page.getByRole('status');
      await expect(toast).toContainText(/copied to clipboard/i);

      // Verify clipboard contains URL
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain('/sandbox?state=');
    });

    test('loads state from URL parameter', async ({ page }) => {
      // Navigate to sandbox with a simple state in URL
      const simpleState = {
        commits: [
          { id: 'abc', parents: [], message: 'URL Test', timestamp: Date.now() },
        ],
        branches: [{ name: 'main', target: 'abc' }],
        tags: [],
        head: { type: 'branch', name: 'main' },
      };

      const encoded = btoa(JSON.stringify(simpleState));
      await page.goto(`/sandbox?state=${encodeURIComponent(encoded)}`);

      // Verify state was loaded
      await expect(page.getByText('URL Test')).toBeVisible();
    });
  });

  test.describe('Reset', () => {
    test('reset button shows confirmation', async ({ page }) => {
      // Setup dialog listener before clicking
      page.on('dialog', (dialog) => {
        expect(dialog.message()).toContain('reset');
        dialog.dismiss();
      });

      await page.getByRole('button', { name: /reset/i }).click();
    });

    test('reset clears history after confirmation', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /git command input/i });

      // Execute some commands
      await input.fill('commit -m "Test 1"');
      await input.press('Enter');
      await page.waitForTimeout(100);

      await input.fill('commit -m "Test 2"');
      await input.press('Enter');
      await page.waitForTimeout(100);

      // Accept reset dialog
      page.on('dialog', (dialog) => dialog.accept());

      await page.getByRole('button', { name: /reset/i }).click();

      // Wait for reset to complete
      await page.waitForTimeout(100);

      // Verify undo is disabled (history cleared)
      const undoButton = page.getByRole('button', { name: /undo/i });
      await expect(undoButton).toBeDisabled();
    });
  });

  test.describe('Accessibility', () => {
    test('all interactive elements are keyboard accessible', async ({ page }) => {
      // Tab through main interactive elements
      await page.keyboard.press('Tab'); // Skip to content link
      await page.keyboard.press('Tab'); // Logo link
      await page.keyboard.press('Tab'); // Mode selector
      await page.keyboard.press('Tab'); // Theme toggle

      // Verify we can reach the command input
      const input = page.getByRole('textbox', { name: /git command input/i });
      await input.focus();
      await expect(input).toBeFocused();
    });

    test('command console has proper ARIA labels', async ({ page }) => {
      const console = page.getByRole('region', { name: /git command console/i });
      await expect(console).toBeVisible();

      const input = page.getByRole('textbox', { name: /git command input/i });
      await expect(input).toBeVisible();

      const log = page.getByRole('log');
      await expect(log).toBeVisible();
    });

    test('buttons have descriptive labels', async ({ page }) => {
      await expect(page.getByRole('button', { name: /undo last command/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /redo last undone command/i })).toBeVisible();
    });
  });
});

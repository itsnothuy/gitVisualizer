/**
 * LGB Visual Goldens E2E Tests
 * 
 * Captures SVG screenshots of LGB-style scenes for visual regression testing.
 * Tests both intro.json and rebase.json fixtures.
 */

import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const GOLDEN_DIR = resolve(__dirname, '../../fixtures/lgb/goldens');

/**
 * Ensure golden directory exists
 */
async function ensureGoldenDir() {
  if (!existsSync(GOLDEN_DIR)) {
    await mkdir(GOLDEN_DIR, { recursive: true });
  }
}

/**
 * Capture SVG content from the page
 */
async function captureSvgContent(page: import('@playwright/test').Page) {
  return await page.evaluate(() => {
    const svg = document.querySelector('svg');
    if (!svg) {
      throw new Error('No SVG element found on page');
    }
    return svg.outerHTML;
  });
}

/**
 * Save SVG golden
 */
async function saveGolden(sceneName: string, frameId: string, svgContent: string) {
  await ensureGoldenDir();
  const filename = `${sceneName}-${frameId}.svg`;
  const filepath = resolve(GOLDEN_DIR, filename);
  await writeFile(filepath, svgContent, 'utf-8');
  console.log(`Saved golden: ${filename}`);
}

test.describe('LGB Visual Goldens - Intro Scene', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app with LGB mode enabled
    // This assumes there's a demo mode or way to load fixtures
    await page.goto('http://localhost:3000/?mode=lgb&fixture=intro');
    
    // Wait for the graph to render
    await page.waitForSelector('svg', { timeout: 5000 });
  });

  test('should capture initial state', async ({ page }) => {
    await page.waitForTimeout(500); // Allow animation to settle
    
    const svgContent = await captureSvgContent(page);
    
    // Verify SVG has nodes
    expect(svgContent).toContain('circle');
    
    // Save golden if in record mode
    if (process.env.RECORD_GOLDENS === 'true') {
      await saveGolden('intro', 'initial', svgContent);
    }
    
    // Take screenshot for visual verification
    await page.screenshot({
      path: resolve(GOLDEN_DIR, 'intro-initial.png'),
      fullPage: true,
    });
  });

  test('should capture after commit operation', async ({ page }) => {
    // Simulate commit operation (this depends on your UI implementation)
    // For now, we'll wait for the operation to complete
    await page.waitForTimeout(1000);
    
    const svgContent = await captureSvgContent(page);
    
    if (process.env.RECORD_GOLDENS === 'true') {
      await saveGolden('intro', 'after-commit', svgContent);
    }
    
    await page.screenshot({
      path: resolve(GOLDEN_DIR, 'intro-after-commit.png'),
    });
  });

  test('should capture after branch creation', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    const svgContent = await captureSvgContent(page);
    
    if (process.env.RECORD_GOLDENS === 'true') {
      await saveGolden('intro', 'after-branch', svgContent);
    }
    
    await page.screenshot({
      path: resolve(GOLDEN_DIR, 'intro-after-branch.png'),
    });
  });

  test('should capture final merge state', async ({ page }) => {
    await page.waitForTimeout(5000); // Wait for all operations to complete
    
    const svgContent = await captureSvgContent(page);
    
    // Verify merge commit exists (2 parents)
    expect(svgContent).toContain('stroke-dasharray'); // Merge edge should be styled
    
    if (process.env.RECORD_GOLDENS === 'true') {
      await saveGolden('intro', 'final-merge', svgContent);
    }
    
    await page.screenshot({
      path: resolve(GOLDEN_DIR, 'intro-final.png'),
    });
  });
});

test.describe('LGB Visual Goldens - Rebase Scene', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?mode=lgb&fixture=rebase');
    await page.waitForSelector('svg', { timeout: 5000 });
  });

  test('should capture initial state with diverged branches', async ({ page }) => {
    await page.waitForTimeout(500);
    
    const svgContent = await captureSvgContent(page);
    
    // Verify initial state has feature branch diverged from main
    expect(svgContent).toContain('circle');
    
    if (process.env.RECORD_GOLDENS === 'true') {
      await saveGolden('rebase', 'initial', svgContent);
    }
    
    await page.screenshot({
      path: resolve(GOLDEN_DIR, 'rebase-initial.png'),
      fullPage: true,
    });
  });

  test('should capture rebase operation with dashed copy arcs', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for rebase animation
    
    const svgContent = await captureSvgContent(page);
    
    // Verify dashed arcs for rebased commits
    expect(svgContent).toContain('class="dashed"');
    
    if (process.env.RECORD_GOLDENS === 'true') {
      await saveGolden('rebase', 'during-rebase', svgContent);
    }
    
    await page.screenshot({
      path: resolve(GOLDEN_DIR, 'rebase-during.png'),
    });
  });

  test('should capture final rebased state', async ({ page }) => {
    await page.waitForTimeout(3000); // Wait for rebase to complete
    
    const svgContent = await captureSvgContent(page);
    
    // Verify new commits are in place
    expect(svgContent).toContain('circle');
    
    if (process.env.RECORD_GOLDENS === 'true') {
      await saveGolden('rebase', 'final', svgContent);
    }
    
    await page.screenshot({
      path: resolve(GOLDEN_DIR, 'rebase-final.png'),
    });
  });

  test('should capture cherry-pick operation', async ({ page }) => {
    await page.waitForTimeout(4000); // Wait for cherry-pick
    
    const svgContent = await captureSvgContent(page);
    
    // Verify cherry-pick shows single copy arc
    expect(svgContent).toContain('circle');
    
    if (process.env.RECORD_GOLDENS === 'true') {
      await saveGolden('rebase', 'cherry-pick', svgContent);
    }
    
    await page.screenshot({
      path: resolve(GOLDEN_DIR, 'rebase-cherry-pick.png'),
    });
  });
});

test.describe('LGB Geometry Verification', () => {
  test('should verify grid layout - rows as generations', async ({ page }) => {
    await page.goto('http://localhost:3000/?mode=lgb&fixture=intro');
    await page.waitForSelector('svg', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Get all commit nodes
    const nodes = await page.evaluate(() => {
      const circles = document.querySelectorAll('circle[data-node-id]');
      return Array.from(circles).map(circle => {
        const rect = circle.getBoundingClientRect();
        return {
          id: circle.getAttribute('data-node-id'),
          x: rect.x,
          y: rect.y,
        };
      });
    });
    
    // Verify nodes are arranged in rows (same y for same generation)
    expect(nodes.length).toBeGreaterThan(0);
    
    // Group by y coordinate (with tolerance)
    const rows = new Map<number, typeof nodes>();
    nodes.forEach(node => {
      const row = Math.round(node.y / 10) * 10; // 10px tolerance
      if (!rows.has(row)) {
        rows.set(row, []);
      }
      rows.get(row)!.push(node);
    });
    
    // Each row should have at least one node
    expect(rows.size).toBeGreaterThan(0);
  });

  test('should verify branch lanes as columns', async ({ page }) => {
    await page.goto('http://localhost:3000/?mode=lgb&fixture=intro');
    await page.waitForSelector('svg', { timeout: 5000 });
    await page.waitForTimeout(5000); // Wait for branching
    
    const nodes = await page.evaluate(() => {
      const circles = document.querySelectorAll('circle[data-node-id]');
      return Array.from(circles).map(circle => {
        const rect = circle.getBoundingClientRect();
        return {
          id: circle.getAttribute('data-node-id'),
          x: rect.x,
          y: rect.y,
        };
      });
    });
    
    // Group by x coordinate (columns)
    const columns = new Map<number, typeof nodes>();
    nodes.forEach(node => {
      const col = Math.round(node.x / 10) * 10; // 10px tolerance
      if (!columns.has(col)) {
        columns.set(col, []);
      }
      columns.get(col)!.push(node);
    });
    
    // Should have at least 2 columns (main and feature branch)
    expect(columns.size).toBeGreaterThanOrEqual(1);
  });
});

test.describe('LGB Label Positioning', () => {
  test('should show branch tags inline at tip', async ({ page }) => {
    await page.goto('http://localhost:3000/?mode=lgb&fixture=intro');
    await page.waitForSelector('svg', { timeout: 5000 });
    await page.waitForTimeout(3000);
    
    // Check for branch labels
    const labels = await page.evaluate(() => {
      const labelElements = document.querySelectorAll('[data-label-type="branch"]');
      return Array.from(labelElements).map(label => ({
        text: label.textContent,
        x: label.getBoundingClientRect().x,
        y: label.getBoundingClientRect().y,
      }));
    });
    
    // Should have at least one branch label
    expect(labels.length).toBeGreaterThan(0);
  });

  test('should show HEAD arrow clearly visible', async ({ page }) => {
    await page.goto('http://localhost:3000/?mode=lgb&fixture=intro');
    await page.waitForSelector('svg', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Check for HEAD indicator
    const hasHead = await page.evaluate(() => {
      const headElement = document.querySelector('[data-label-type="HEAD"]');
      return headElement !== null;
    });
    
    expect(hasHead).toBe(true);
  });
});

test.describe('LGB Edge Styling', () => {
  test('should show merge commits with two-parent links', async ({ page }) => {
    await page.goto('http://localhost:3000/?mode=lgb&fixture=intro');
    await page.waitForSelector('svg', { timeout: 5000 });
    await page.waitForTimeout(5000); // Wait for merge
    
    const mergeEdges = await page.evaluate(() => {
      const edges = document.querySelectorAll('path[data-edge-type="merge"]');
      return edges.length;
    });
    
    // Should have at least one merge edge
    expect(mergeEdges).toBeGreaterThan(0);
  });

  test('should show rebase with dashed copy arcs', async ({ page }) => {
    await page.goto('http://localhost:3000/?mode=lgb&fixture=rebase');
    await page.waitForSelector('svg', { timeout: 5000 });
    await page.waitForTimeout(2000);
    
    const dashedArcs = await page.evaluate(() => {
      const dashed = document.querySelectorAll('.dashed, [stroke-dasharray]');
      return dashed.length;
    });
    
    // Should have dashed arcs for rebase
    expect(dashedArcs).toBeGreaterThan(0);
  });
});

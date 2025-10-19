import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Graph Page Accessibility - Critical Violations", () => {
  test("graph page should have zero critical accessibility violations", async ({ page }) => {
    await page.goto("/demo");
    
    // Wait for page stability and graph to render
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="graphics-document"]', { timeout: 30000 });
    
    // Run axe-core analysis
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    // Log full violations JSON for CI diagnostics
    if (accessibilityScanResults.violations.length > 0) {
      console.log('AXE VIOLATIONS JSON:\\n', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    
    // Filter critical violations (only critical impact)
    const criticalViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.impact === 'critical'
    );
    
    // Log critical violations specifically
    if (criticalViolations.length > 0) {
      console.log('\\n=== Critical Violations ===');
      criticalViolations.forEach((violation) => {
        console.log(`${violation.id}: ${violation.description}`);
        console.log(`  Help: ${violation.helpUrl}`);
        violation.nodes.forEach((node) => {
          console.log(`  - ${node.html}`);
          console.log(`    Impact: ${node.impact}`);
          console.log(`    Target: ${node.target.join(', ')}`);
        });
      });
    }
    
    // Assert zero critical violations
    expect(criticalViolations.length).toBe(0);
  });

  test("graph page should have zero serious accessibility violations", async ({ page }) => {
    await page.goto("/demo");
    
    // Wait for page stability and graph to render  
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="graphics-document"]', { timeout: 30000 });
    
    // Run axe-core analysis
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    // Filter serious violations
    const seriousViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.impact === 'serious'
    );
    
    // Log serious violations for debugging
    if (seriousViolations.length > 0) {
      console.log('\\n=== Serious Violations ===');
      console.log(JSON.stringify(seriousViolations, null, 2));
    }
    
    // Assert zero serious violations
    expect(seriousViolations.length).toBe(0);
  });

  test("graph page keyboard navigation should be fully accessible", async ({ page }) => {
    await page.goto("/demo");
    
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });
    
    // Check that all interactive elements are keyboard accessible
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    // Filter violations related to keyboard accessibility
    const keyboardViolations = accessibilityScanResults.violations.filter(
      (violation) => 
        violation.id.includes('keyboard') || 
        violation.id.includes('focus') ||
        violation.id === 'tabindex'
    );
    
    if (keyboardViolations.length > 0) {
      console.log('\n=== Keyboard Accessibility Violations ===');
      keyboardViolations.forEach((violation) => {
        console.log(`${violation.id}: ${violation.description}`);
      });
    }
    
    expect(keyboardViolations).toEqual([]);
  });

  test("graph page should have proper color contrast", async ({ page }) => {
    await page.goto("/demo");
    
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });
    
    // Run axe-core analysis focused on color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    
    // Filter color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id.includes('color-contrast')
    );
    
    if (colorContrastViolations.length > 0) {
      console.log('\n=== Color Contrast Violations ===');
      colorContrastViolations.forEach((violation) => {
        console.log(`${violation.id}: ${violation.description}`);
        violation.nodes.forEach((node) => {
          console.log(`  - ${node.html.substring(0, 100)}...`);
          console.log(`    Target: ${node.target.join(', ')}`);
        });
      });
    }
    
    expect(colorContrastViolations).toEqual([]);
  });

  test("graph page ARIA attributes should be valid", async ({ page }) => {
    await page.goto("/demo");
    
    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 20000 });
    
    // Run axe-core analysis focused on ARIA
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    // Filter ARIA-related violations
    const ariaViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id.includes('aria')
    );
    
    if (ariaViolations.length > 0) {
      console.log('\n=== ARIA Violations ===');
      ariaViolations.forEach((violation) => {
        console.log(`${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Affected nodes: ${violation.nodes.length}`);
      });
    }
    
    expect(ariaViolations).toEqual([]);
  });
});

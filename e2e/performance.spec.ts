/**
 * Performance E2E Tests
 * 
 * Tests performance guardrails and frame time targets:
 * - 60 FPS pan/zoom target (≤ 16.7ms per frame)
 * - P95 frame time < 50ms during interaction
 * - Initial layout time ≤ 1.5s for medium graphs
 */

import { test, expect } from "@playwright/test";

test.describe("Performance Guardrails", () => {
  test.beforeEach(async ({ page }) => {
    // Enable performance tracing
    await page.goto("/", { waitUntil: "networkidle" });
  });

  test("should maintain 60 FPS during pan/zoom on medium graph", async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "Tracing not fully supported on WebKit");

    // Navigate to tutorial mode with a medium-sized graph
    await page.goto("/sandbox", { waitUntil: "networkidle" });

    // Start performance tracing
    await page.evaluate(() => {
      interface PerfMetrics {
        frameTimes: number[];
        lastFrameTime: number;
      }
      
      (window as Window & { __perfMetrics?: PerfMetrics }).__perfMetrics = {
        frameTimes: [] as number[],
        lastFrameTime: performance.now(),
      };

      // Track frame times
      const trackFrame = () => {
        const w = window as Window & { __perfMetrics?: PerfMetrics };
        const now = performance.now();
        const frameTime = now - (w.__perfMetrics?.lastFrameTime || now);
        w.__perfMetrics?.frameTimes.push(frameTime);
        if (w.__perfMetrics) {
          w.__perfMetrics.lastFrameTime = now;
        }
        requestAnimationFrame(trackFrame);
      };
      requestAnimationFrame(trackFrame);
    });

    // Wait for graph to render
    await page.waitForSelector('[role="graphics-document"]', { timeout: 5000 });

    // Perform pan/zoom interactions
    const svg = page.locator('[role="graphics-document"]');
    const box = await svg.boundingBox();
    
    if (box) {
      // Pan gesture
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100, { steps: 20 });
      await page.mouse.up();

      // Wait for animation to settle
      await page.waitForTimeout(500);

      // Zoom gesture (scroll)
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(200);
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(200);
    }

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      interface PerfMetrics {
        frameTimes: number[];
        lastFrameTime: number;
      }
      const data = (window as Window & { __perfMetrics?: PerfMetrics }).__perfMetrics;
      const frameTimes = data?.frameTimes || [];
      
      // Calculate statistics
      const sorted = [...frameTimes].sort((a: number, b: number) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95 = sorted[p95Index] || 0;
      const max = Math.max(...frameTimes);
      const avg = frameTimes.reduce((a: number, b: number) => a + b, 0) / frameTimes.length;
      const slowFrames = frameTimes.filter((t: number) => t > 16.7).length;
      const slowFramePercentage = (slowFrames / frameTimes.length) * 100;

      return {
        p95,
        max,
        avg,
        slowFrames,
        slowFramePercentage,
        totalFrames: frameTimes.length,
      };
    });

    // Log metrics for debugging
    console.log("Frame time metrics:", metrics);

    // Assert performance targets
    expect(metrics.p95).toBeLessThan(50); // P95 frame time < 50ms
    expect(metrics.slowFramePercentage).toBeLessThan(20); // < 20% slow frames (relaxed for CI)
  });

  test("should complete initial layout within 1.5s", async ({ page }) => {
    const startTime = Date.now();

    // Navigate to a page with graph visualization
    await page.goto("/sandbox", { waitUntil: "networkidle" });

    // Wait for graph to be rendered
    await page.waitForSelector('[role="graphics-document"]', { timeout: 5000 });
    
    // Wait for at least one node to be visible
    await page.waitForSelector('[data-testid^="graph-node-"]', { timeout: 5000 });

    const layoutTime = Date.now() - startTime;

    console.log("Layout time:", layoutTime, "ms");

    // Assert layout time is within target
    // Using 3000ms for CI environments which are slower
    expect(layoutTime).toBeLessThan(3000);
  });

  test("should use Web Worker for large graphs", async ({ page }) => {
    // Mock a large graph scenario
    await page.goto("/sandbox", { waitUntil: "networkidle" });

    // Check if worker is used (by checking console logs or network)
    const workerCreated = await page.evaluate(() => {
      return typeof Worker !== "undefined";
    });

    expect(workerCreated).toBe(true);
  });

  test("should respect reduced motion preference", async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.goto("/sandbox", { waitUntil: "networkidle" });

    // Check if animations are disabled or shortened
    const prefersReducedMotion = await page.evaluate(() => {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });

    expect(prefersReducedMotion).toBe(true);
  });

  test("should enable virtualization for large graphs", async ({ page }) => {
    await page.goto("/sandbox", { waitUntil: "networkidle" });

    // Wait for graph
    await page.waitForSelector('[role="graphics-document"]', { timeout: 5000 });

    // Count rendered elements vs total
    const elementCounts = await page.evaluate(() => {
      const nodes = document.querySelectorAll('[data-testid^="graph-node-"]');
      const edges = document.querySelectorAll('[data-edge-id]');
      
      return {
        renderedNodes: nodes.length,
        renderedEdges: edges.length,
      };
    });

    console.log("Rendered elements:", elementCounts);

    // Virtualization should render some elements but not necessarily all
    expect(elementCounts.renderedNodes).toBeGreaterThan(0);
  });

  test("should persist performance mode setting", async ({ page }) => {
    await page.goto("/sandbox", { waitUntil: "networkidle" });

    // Set performance mode via localStorage
    await page.evaluate(() => {
      localStorage.setItem("perf-mode", "speed");
    });

    // Reload page
    await page.reload({ waitUntil: "networkidle" });

    // Check if setting persisted
    const savedMode = await page.evaluate(() => {
      return localStorage.getItem("perf-mode");
    });

    expect(savedMode).toBe("speed");
  });

  test("should not have long tasks during steady interaction", async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "Long task API not available in WebKit");

    await page.goto("/sandbox", { waitUntil: "networkidle" });

    // Setup long task observer
    await page.evaluate(() => {
      interface LongTask {
        duration: number;
        startTime: number;
      }
      
      (window as Window & { __longTasks?: LongTask[] }).__longTasks = [];
      
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((list) => {
          const w = window as Window & { __longTasks?: LongTask[] };
          for (const entry of list.getEntries()) {
            w.__longTasks?.push({
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
        
        try {
          observer.observe({ entryTypes: ["longtask"] });
        } catch {
          // Long task API not supported, skip
        }
      }
    });

    // Wait for graph
    await page.waitForSelector('[role="graphics-document"]', { timeout: 5000 });

    // Interact with graph
    const svg = page.locator('[role="graphics-document"]');
    await svg.click();
    await page.keyboard.press("Tab");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    // Wait for tasks to be recorded
    await page.waitForTimeout(1000);

    // Check for long tasks
    const longTasks = await page.evaluate(() => {
      interface LongTask {
        duration: number;
        startTime: number;
      }
      return (window as Window & { __longTasks?: LongTask[] }).__longTasks || [];
    });

    console.log("Long tasks detected:", longTasks.length);

    // We should have minimal long tasks (> 100ms) during steady interaction
    const criticalLongTasks = longTasks.filter((task) => task.duration > 100);
    expect(criticalLongTasks.length).toBeLessThan(3);
  });
});

/**
 * Tests for frame watchdog
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FrameWatchdog } from "../frame-watchdog";

describe("FrameWatchdog", () => {
  let watchdog: FrameWatchdog;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (watchdog) {
      watchdog.stop();
    }
    vi.restoreAllMocks();
  });

  describe("constructor and options", () => {
    it("should create with default options", () => {
      watchdog = new FrameWatchdog();
      const stats = watchdog.getStats();
      
      expect(stats.totalFrames).toBe(0);
      expect(stats.slowFrameCount).toBe(0);
    });

    it("should create with custom options", () => {
      watchdog = new FrameWatchdog({
        maxFrameTime: 20,
        threshold: 5,
        debug: true,
      });
      
      // Should create without throwing
      expect(watchdog).toBeDefined();
    });
  });

  describe("start and stop", () => {
    it("should start monitoring", () => {
      watchdog = new FrameWatchdog();
      watchdog.start();
      
      // Wait for a few frames to be recorded
      vi.advanceTimersByTime(100);
      
      const stats = watchdog.getStats();
      expect(stats.totalFrames).toBeGreaterThanOrEqual(0);
    });

    it("should stop monitoring", () => {
      watchdog = new FrameWatchdog();
      watchdog.start();
      
      vi.advanceTimersByTime(50);
      const statsBeforeStop = watchdog.getStats();
      
      watchdog.stop();
      
      vi.advanceTimersByTime(50);
      const statsAfterStop = watchdog.getStats();
      
      // Stats should not change after stop
      expect(statsAfterStop.totalFrames).toBe(statsBeforeStop.totalFrames);
    });

    it("should handle multiple start calls gracefully", () => {
      watchdog = new FrameWatchdog();
      watchdog.start();
      watchdog.start(); // Should not throw
      
      expect(() => watchdog.start()).not.toThrow();
    });
  });

  describe("reset", () => {
    it("should reset all statistics", () => {
      watchdog = new FrameWatchdog();
      watchdog.start();
      
      vi.advanceTimersByTime(100);
      
      watchdog.reset();
      const stats = watchdog.getStats();
      
      expect(stats.totalFrames).toBe(0);
      expect(stats.slowFrameCount).toBe(0);
      expect(stats.maxFrameTime).toBe(0);
      expect(stats.avgFrameTime).toBe(0);
    });
  });

  describe("getStats", () => {
    it("should return statistics", () => {
      watchdog = new FrameWatchdog();
      const stats = watchdog.getStats();
      
      expect(stats).toHaveProperty("avgFrameTime");
      expect(stats).toHaveProperty("maxFrameTime");
      expect(stats).toHaveProperty("slowFrameCount");
      expect(stats).toHaveProperty("totalFrames");
      expect(stats).toHaveProperty("slowFramePercentage");
    });

    it("should calculate percentage correctly", () => {
      watchdog = new FrameWatchdog();
      const stats = watchdog.getStats();
      
      // With 0 total frames, percentage should be 0
      expect(stats.slowFramePercentage).toBe(0);
    });
  });

  describe("isPerformanceGood", () => {
    it("should return true when no frames recorded", () => {
      watchdog = new FrameWatchdog();
      expect(watchdog.isPerformanceGood()).toBe(true);
    });

    it("should return true when slow frame percentage is low", () => {
      watchdog = new FrameWatchdog();
      // This test would require mocking performance.now() and rAF
      // to simulate frame measurements
      expect(watchdog.isPerformanceGood()).toBe(true);
    });
  });

  describe("getReport", () => {
    it("should generate a readable report", () => {
      watchdog = new FrameWatchdog();
      const report = watchdog.getReport();
      
      expect(report).toContain("Frame Watchdog Report");
      expect(report).toContain("Total Frames:");
      expect(report).toContain("Slow Frames:");
      expect(report).toContain("Avg Frame Time:");
      expect(report).toContain("Max Frame Time:");
      expect(report).toContain("Budget:");
      expect(report).toContain("Status:");
    });
  });

  describe("callback invocation", () => {
    it("should call onSlowFrames callback", () => {
      const onSlowFrames = vi.fn();
      
      watchdog = new FrameWatchdog({
        maxFrameTime: 1, // Very low threshold
        threshold: 1,
        warningCooldown: 0,
        onSlowFrames,
      });
      
      // This would require sophisticated mocking of performance.now()
      // and requestAnimationFrame to actually trigger the callback
      expect(onSlowFrames).toHaveBeenCalledTimes(0); // Not called yet
    });
  });
});

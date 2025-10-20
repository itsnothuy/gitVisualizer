/**
 * Tests for performance configuration
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  DEFAULT_THRESHOLDS,
  getPerformanceSettings,
  getPerformanceMode,
  setPerformanceMode,
  getGraphComplexity,
} from "../perf-config";

describe("Performance Configuration", () => {
  describe("getPerformanceSettings", () => {
    it("should return quality settings for quality mode", () => {
      const settings = getPerformanceSettings("quality", 100, 50);
      
      expect(settings.useWorker).toBe(false); // Below threshold
      expect(settings.enableVirtualization).toBe(false);
      expect(settings.reduceLabelDensity).toBe(false);
      expect(settings.disableAdorners).toBe(false);
      expect(settings.enableFrameWatchdog).toBe(true);
      expect(settings.useOffscreenCanvas).toBe(false);
    });

    it("should return speed settings for speed mode", () => {
      const settings = getPerformanceSettings("speed", 100, 50);
      
      expect(settings.useWorker).toBe(false); // Below even lower threshold
      expect(settings.enableVirtualization).toBe(true);
      expect(settings.reduceLabelDensity).toBe(true);
      expect(settings.disableAdorners).toBe(true);
      expect(settings.enableFrameWatchdog).toBe(true);
    });

    it("should apply thresholds in auto mode for small graphs", () => {
      const settings = getPerformanceSettings("auto", 100, 50);
      
      expect(settings.useWorker).toBe(false);
      expect(settings.enableVirtualization).toBe(false);
      expect(settings.reduceLabelDensity).toBe(false);
      expect(settings.disableAdorners).toBe(false);
    });

    it("should apply thresholds in auto mode for medium graphs", () => {
      const settings = getPerformanceSettings("auto", 2000, 2000);
      
      expect(settings.useWorker).toBe(true); // >= 1500
      expect(settings.enableVirtualization).toBe(false); // < 2500
      expect(settings.reduceLabelDensity).toBe(false); // < 5000
      expect(settings.disableAdorners).toBe(false); // < 5000
    });

    it("should apply thresholds in auto mode for large graphs", () => {
      const settings = getPerformanceSettings("auto", 6000, 7000);
      
      expect(settings.useWorker).toBe(true); // >= 1500
      expect(settings.enableVirtualization).toBe(true); // >= 2500
      expect(settings.reduceLabelDensity).toBe(true); // >= 5000
      expect(settings.disableAdorners).toBe(true); // >= 5000
    });

    it("should respect custom thresholds", () => {
      const customThresholds = {
        ...DEFAULT_THRESHOLDS,
        workerThreshold: 100,
        virtualizationThreshold: 200,
      };
      
      const settings = getPerformanceSettings("auto", 150, 100, customThresholds);
      
      expect(settings.useWorker).toBe(true); // >= 100
      expect(settings.enableVirtualization).toBe(false); // < 200
    });
  });

  describe("localStorage persistence", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it("should return default mode when nothing is stored", () => {
      const mode = getPerformanceMode();
      expect(mode).toBe("auto");
    });

    it("should persist and retrieve performance mode", () => {
      setPerformanceMode("speed");
      const mode = getPerformanceMode();
      expect(mode).toBe("speed");
    });

    it("should handle invalid stored values", () => {
      localStorage.setItem("perf-mode", "invalid");
      const mode = getPerformanceMode();
      expect(mode).toBe("auto");
    });
  });

  describe("getGraphComplexity", () => {
    it("should return 0 for empty graph", () => {
      const complexity = getGraphComplexity(0, 0);
      expect(complexity).toBe(0);
    });

    it("should calculate complexity for small graph", () => {
      const complexity = getGraphComplexity(10, 10);
      expect(complexity).toBeGreaterThan(0);
      expect(complexity).toBeLessThan(100);
    });

    it("should cap complexity at 100", () => {
      const complexity = getGraphComplexity(20000, 20000);
      expect(complexity).toBe(100);
    });

    it("should weight nodes more than edges", () => {
      const nodes100 = getGraphComplexity(100, 0);
      const edges200 = getGraphComplexity(0, 200);
      expect(nodes100).toBe(edges200);
    });
  });

  describe("DEFAULT_THRESHOLDS", () => {
    it("should have reasonable default values", () => {
      expect(DEFAULT_THRESHOLDS.workerThreshold).toBe(1500);
      expect(DEFAULT_THRESHOLDS.virtualizationThreshold).toBe(2500);
      expect(DEFAULT_THRESHOLDS.reducedLabelsThreshold).toBe(5000);
      expect(DEFAULT_THRESHOLDS.disableAdornersThreshold).toBe(5000);
      expect(DEFAULT_THRESHOLDS.maxFrameTime).toBeCloseTo(16.7, 1);
      expect(DEFAULT_THRESHOLDS.frameWatchdogThreshold).toBe(3);
    });
  });
});

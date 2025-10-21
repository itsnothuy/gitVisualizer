import { describe, it, expect, beforeEach } from 'vitest';
import { RenderingModeEngine, RENDERING_THRESHOLDS, detectDeviceCapabilities } from '../RenderingModeEngine';
import type { ProcessedDAG, PerformanceMetrics } from '../types';

describe('RenderingModeEngine', () => {
  let engine: RenderingModeEngine;

  beforeEach(() => {
    engine = new RenderingModeEngine();
  });

  describe('determineRenderingMode', () => {
    it('should select SVG for small graphs', () => {
      const graph: ProcessedDAG = {
        nodes: Array(100).fill(null).map((_, i) => ({
          id: `node-${i}`,
          title: `Node ${i}`,
          ts: Date.now(),
          parents: [],
        })),
        edges: Array(80).fill(null).map((_, i) => ({
          id: `edge-${i}`,
          source: `node-${i}`,
          target: `node-${i + 1}`,
        })),
        positions: {},
        bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
      };

      expect(engine.determineRenderingMode(graph)).toBe('svg');
    });

    it('should select Canvas for medium-large graphs', () => {
      const graph: ProcessedDAG = {
        nodes: Array(2000).fill(null).map((_, i) => ({
          id: `node-${i}`,
          title: `Node ${i}`,
          ts: Date.now(),
          parents: [],
        })),
        edges: Array(1800).fill(null).map((_, i) => ({
          id: `edge-${i}`,
          source: `node-${i}`,
          target: `node-${i + 1}`,
        })),
        positions: {},
        bounds: { minX: 0, minY: 0, maxX: 10000, maxY: 10000 },
      };

      expect(engine.determineRenderingMode(graph)).toBe('canvas');
    });

    it('should select WebGL for massive graphs when supported', () => {
      const graph: ProcessedDAG = {
        nodes: Array(40000).fill(null).map((_, i) => ({
          id: `node-${i}`,
          title: `Node ${i}`,
          ts: Date.now(),
          parents: [],
        })),
        edges: Array(35000).fill(null).map((_, i) => ({
          id: `edge-${i}`,
          source: `node-${i}`,
          target: `node-${i + 1}`,
        })),
        positions: {},
        bounds: { minX: 0, minY: 0, maxX: 50000, maxY: 50000 },
      };

      // Mock WebGL support
      engine.adaptToDeviceCapabilities({
        devicePixelRatio: 2,
        maxTextureSize: 4096,
        webglSupported: true,
        webgl2Supported: true,
        hardwareConcurrency: 8,
        memoryLimit: 8192,
        offscreenCanvasSupported: true,
      });

      expect(engine.determineRenderingMode(graph)).toBe('webgl');
    });

    it('should fall back to Canvas when WebGL not supported', () => {
      const graph: ProcessedDAG = {
        nodes: Array(40000).fill(null).map((_, i) => ({
          id: `node-${i}`,
          title: `Node ${i}`,
          ts: Date.now(),
          parents: [],
        })),
        edges: Array(35000).fill(null).map((_, i) => ({
          id: `edge-${i}`,
          source: `node-${i}`,
          target: `node-${i + 1}`,
        })),
        positions: {},
        bounds: { minX: 0, minY: 0, maxX: 50000, maxY: 50000 },
      };

      // Mock no WebGL support
      engine.adaptToDeviceCapabilities({
        devicePixelRatio: 1,
        maxTextureSize: 0,
        webglSupported: false,
        webgl2Supported: false,
        hardwareConcurrency: 2,
        memoryLimit: 2048,
        offscreenCanvasSupported: false,
      });

      expect(engine.determineRenderingMode(graph)).toBe('canvas');
    });
  });

  describe('canUpgradeMode', () => {
    it('should allow upgrade from Canvas to SVG for smaller graphs', () => {
      const smallGraph: ProcessedDAG = {
        nodes: Array(500).fill(null).map((_, i) => ({
          id: `node-${i}`,
          title: `Node ${i}`,
          ts: Date.now(),
          parents: [],
        })),
        edges: [],
        positions: {},
        bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
      };

      engine.switchToMode('canvas');
      expect(engine.canUpgradeMode('canvas', smallGraph)).toBe(true);
    });

    it('should not allow upgrade when already optimal', () => {
      const mediumGraph: ProcessedDAG = {
        nodes: Array(2000).fill(null).map((_, i) => ({
          id: `node-${i}`,
          title: `Node ${i}`,
          ts: Date.now(),
          parents: [],
        })),
        edges: [],
        positions: {},
        bounds: { minX: 0, minY: 0, maxX: 5000, maxY: 5000 },
      };

      expect(engine.canUpgradeMode('canvas', mediumGraph)).toBe(false);
    });
  });

  describe('shouldDegradeMode', () => {
    it('should degrade when frame time exceeds threshold', () => {
      const metrics: PerformanceMetrics = {
        averageFrameTime: 25, // >20ms threshold
        frameDropCount: 2,
        memoryUsage: 100,
        renderingTime: 20,
        interactionLatency: 10,
        nodeCount: 1000,
        edgeCount: 900,
      };

      expect(engine.shouldDegradeMode(metrics)).toBe(true);
    });

    it('should degrade when too many frames dropped', () => {
      const metrics: PerformanceMetrics = {
        averageFrameTime: 15,
        frameDropCount: 10, // >5 drops
        memoryUsage: 100,
        renderingTime: 15,
        interactionLatency: 10,
        nodeCount: 1000,
        edgeCount: 900,
      };

      expect(engine.shouldDegradeMode(metrics)).toBe(true);
    });

    it('should degrade when memory usage too high', () => {
      const metrics: PerformanceMetrics = {
        averageFrameTime: 15,
        frameDropCount: 2,
        memoryUsage: 450, // >400MB
        renderingTime: 15,
        interactionLatency: 10,
        nodeCount: 1000,
        edgeCount: 900,
      };

      expect(engine.shouldDegradeMode(metrics)).toBe(true);
    });

    it('should not degrade when performance is good', () => {
      const metrics: PerformanceMetrics = {
        averageFrameTime: 14,
        frameDropCount: 1,
        memoryUsage: 150,
        renderingTime: 12,
        interactionLatency: 8,
        nodeCount: 1000,
        edgeCount: 900,
      };

      expect(engine.shouldDegradeMode(metrics)).toBe(false);
    });
  });

  describe('suggestDegradedMode', () => {
    it('should suggest Canvas when degrading from WebGL', () => {
      const metrics: PerformanceMetrics = {
        averageFrameTime: 25,
        frameDropCount: 10,
        memoryUsage: 300,
        renderingTime: 20,
        interactionLatency: 15,
        nodeCount: 10000,
        edgeCount: 9000,
      };

      expect(engine.suggestDegradedMode('webgl', metrics)).toBe('canvas');
    });

    it('should suggest SVG when degrading from Canvas', () => {
      const metrics: PerformanceMetrics = {
        averageFrameTime: 25,
        frameDropCount: 10,
        memoryUsage: 300,
        renderingTime: 20,
        interactionLatency: 15,
        nodeCount: 2000,
        edgeCount: 1800,
      };

      expect(engine.suggestDegradedMode('canvas', metrics)).toBe('svg');
    });

    it('should stay at SVG when already degraded', () => {
      const metrics: PerformanceMetrics = {
        averageFrameTime: 25,
        frameDropCount: 10,
        memoryUsage: 300,
        renderingTime: 20,
        interactionLatency: 15,
        nodeCount: 1000,
        edgeCount: 900,
      };

      expect(engine.suggestDegradedMode('svg', metrics)).toBe('svg');
    });
  });

  describe('mode management', () => {
    it('should track current mode', () => {
      expect(engine.getCurrentMode()).toBe('svg');
      
      engine.switchToMode('canvas');
      expect(engine.getCurrentMode()).toBe('canvas');
      
      engine.switchToMode('webgl');
      expect(engine.getCurrentMode()).toBe('webgl');
    });
  });

  describe('THRESHOLDS', () => {
    it('should expose rendering thresholds', () => {
      expect(engine.THRESHOLDS).toEqual(RENDERING_THRESHOLDS);
      expect(engine.THRESHOLDS.SVG_MAX_NODES).toBe(1500);
      expect(engine.THRESHOLDS.CANVAS_MAX_NODES).toBe(10000);
      expect(engine.THRESHOLDS.WEBGL_THRESHOLD).toBe(50000);
    });
  });
});

describe('detectDeviceCapabilities', () => {
  it('should detect device capabilities in browser environment', () => {
    const capabilities = detectDeviceCapabilities();
    
    expect(capabilities).toHaveProperty('devicePixelRatio');
    expect(capabilities).toHaveProperty('webglSupported');
    expect(capabilities).toHaveProperty('webgl2Supported');
    expect(capabilities).toHaveProperty('hardwareConcurrency');
    expect(capabilities).toHaveProperty('offscreenCanvasSupported');
  });
});

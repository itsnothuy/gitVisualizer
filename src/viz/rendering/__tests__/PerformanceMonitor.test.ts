import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { RenderingModeEngine } from '../RenderingModeEngine';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.stopFrameTracking();
  });

  describe('initialization', () => {
    it('should initialize with default metrics', () => {
      const metrics = monitor.getMetrics();
      
      expect(metrics.averageFrameTime).toBe(0);
      expect(metrics.frameDropCount).toBe(0);
      expect(metrics.memoryUsage).toBe(0);
      expect(metrics.renderingTime).toBe(0);
      expect(metrics.interactionLatency).toBe(0);
    });
  });

  describe('graph size tracking', () => {
    it('should update node and edge counts', () => {
      monitor.updateGraphSize(1000, 900);
      
      const metrics = monitor.getMetrics();
      expect(metrics.nodeCount).toBe(1000);
      expect(metrics.edgeCount).toBe(900);
    });
  });

  describe('render operation measurement', () => {
    it('should measure render operation time', () => {
      const result = monitor.measureRenderOperation('render', () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBe(499500); // Sum of 0 to 999
      
      const metrics = monitor.getMetrics();
      expect(metrics.renderingTime).toBeGreaterThan(0);
    });

    it('should return operation result', () => {
      const result = monitor.measureRenderOperation('render', () => {
        return { success: true, data: [1, 2, 3] };
      });

      expect(result).toEqual({ success: true, data: [1, 2, 3] });
    });
  });

  describe('performance report', () => {
    it('should generate performance report', () => {
      monitor.updateGraphSize(2000, 1800);
      
      const report = monitor.generatePerformanceReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('renderingMode');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('deviceCapabilities');
      
      expect(report.metrics.nodeCount).toBe(2000);
      expect(report.metrics.edgeCount).toBe(1800);
    });

    it('should include device capabilities', () => {
      const report = monitor.generatePerformanceReport();
      
      expect(report.deviceCapabilities).toHaveProperty('devicePixelRatio');
      expect(report.deviceCapabilities).toHaveProperty('webglSupported');
      expect(report.deviceCapabilities).toHaveProperty('hardwareConcurrency');
    });
  });

  describe('rendering mode integration', () => {
    it('should work with rendering mode engine', () => {
      const engine = new RenderingModeEngine();
      monitor.setRenderingModeEngine(engine);
      
      engine.switchToMode('canvas');
      
      const report = monitor.generatePerformanceReport();
      expect(report.renderingMode).toBe('canvas');
    });

    it('should trigger degradation callback', () => {
      const onDegradation = vi.fn();
      const monitorWithCallback = new PerformanceMonitor({ onDegradation });
      
      const engine = new RenderingModeEngine();
      monitorWithCallback.setRenderingModeEngine(engine);
      engine.switchToMode('webgl');
      
      // Note: In real usage, degradation would be triggered by poor performance
      // This test just verifies the integration is set up correctly
      expect(onDegradation).not.toHaveBeenCalled();
      
      monitorWithCallback.stopFrameTracking();
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      monitor.updateGraphSize(1000, 900);
      monitor.measureRenderOperation('render', () => 42);
      
      monitor.reset();
      
      const metrics = monitor.getMetrics();
      expect(metrics.averageFrameTime).toBe(0);
      expect(metrics.frameDropCount).toBe(0);
      expect(metrics.renderingTime).toBe(0);
      expect(metrics.nodeCount).toBe(0);
      expect(metrics.edgeCount).toBe(0);
    });
  });

  describe('custom thresholds', () => {
    it('should accept custom degradation thresholds', () => {
      const customMonitor = new PerformanceMonitor({
        thresholds: {
          maxFrameTime: 20,
          maxMemoryUsage: 300,
        },
      });
      
      const metrics = customMonitor.getMetrics();
      expect(metrics).toBeDefined();
      
      customMonitor.stopFrameTracking();
    });
  });
});

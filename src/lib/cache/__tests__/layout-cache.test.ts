/**
 * Unit tests for layout cache module
 * 
 * These tests verify:
 * - Cache key generation (unit tests without IndexedDB)
 * - Cache module exports and types
 */

import { describe, it, expect } from "vitest";
import {
  generateCacheKey,
  type LayoutCacheKey,
} from "../layout-cache";

describe("generateCacheKey", () => {
  it("should generate consistent key from node IDs and options", () => {
    const key: LayoutCacheKey = {
      nodeIds: ["node1", "node2", "node3"],
      layoutOptions: JSON.stringify({ algorithm: "layered" }),
    };

    const result = generateCacheKey(key);
    expect(result).toBe('node1,node2,node3:{"algorithm":"layered"}');
  });

  it("should sort node IDs for consistent key generation", () => {
    const key1: LayoutCacheKey = {
      nodeIds: ["node3", "node1", "node2"],
      layoutOptions: JSON.stringify({ algorithm: "layered" }),
    };

    const key2: LayoutCacheKey = {
      nodeIds: ["node1", "node2", "node3"],
      layoutOptions: JSON.stringify({ algorithm: "layered" }),
    };

    expect(generateCacheKey(key1)).toBe(generateCacheKey(key2));
  });

  it("should generate different keys for different options", () => {
    const key1: LayoutCacheKey = {
      nodeIds: ["node1", "node2"],
      layoutOptions: JSON.stringify({ algorithm: "layered" }),
    };

    const key2: LayoutCacheKey = {
      nodeIds: ["node1", "node2"],
      layoutOptions: JSON.stringify({ algorithm: "force" }),
    };

    expect(generateCacheKey(key1)).not.toBe(generateCacheKey(key2));
  });

  it("should handle empty node list", () => {
    const key: LayoutCacheKey = {
      nodeIds: [],
      layoutOptions: JSON.stringify({ algorithm: "layered" }),
    };

    const result = generateCacheKey(key);
    expect(result).toBe(':{"algorithm":"layered"}');
  });

  it("should handle complex layout options", () => {
    const key: LayoutCacheKey = {
      nodeIds: ["node1"],
      layoutOptions: JSON.stringify({
        algorithm: "layered",
        direction: "RIGHT",
        spacing: { nodeNode: 24, layerLayer: 40 },
      }),
    };

    const result = generateCacheKey(key);
    expect(result).toContain("node1");
    expect(result).toContain("algorithm");
    expect(result).toContain("layered");
  });
});


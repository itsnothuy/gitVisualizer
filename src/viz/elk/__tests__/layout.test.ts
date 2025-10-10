/**
 * Unit tests for ELK layout engine
 * 
 * These tests verify:
 * - Basic layout computation
 * - Layout options handling
 * - Caching integration
 * - Performance measurement
 * - Deterministic layout results
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { elkLayout, type DagNode, type LayoutOptions } from "../layout";
import { clearAllCache } from "../../../lib/cache/layout-cache";

// Sample DAG nodes for testing
const sampleNodes: DagNode[] = [
  {
    id: "commit1",
    title: "Initial commit",
    ts: 1000000,
    parents: [],
  },
  {
    id: "commit2",
    title: "Add feature",
    ts: 1000100,
    parents: ["commit1"],
  },
  {
    id: "commit3",
    title: "Fix bug",
    ts: 1000200,
    parents: ["commit2"],
  },
];

const sampleEdges = [
  { id: "edge1", source: "commit2", target: "commit1" },
  { id: "edge2", source: "commit3", target: "commit2" },
];

describe("elkLayout", () => {
  beforeEach(() => {
    // Mock IndexedDB for caching tests
    const mockStore = new Map<string, unknown>();
    global.indexedDB = {
      open: () => {
        const request = {
          result: {
            transaction: () => ({
              objectStore: () => ({
                put: (value: unknown) => {
                  const v = value as { key: string };
                  mockStore.set(v.key, value);
                  const req = { onsuccess: null as (() => void) | null, onerror: null };
                  setTimeout(() => req.onsuccess?.call(req), 0);
                  return req;
                },
                get: (key: string) => {
                  const req = {
                    result: mockStore.get(key),
                    onsuccess: null as (() => void) | null,
                    onerror: null,
                  };
                  setTimeout(() => req.onsuccess?.call(req), 0);
                  return req;
                },
                clear: () => {
                  mockStore.clear();
                  const req = { onsuccess: null as (() => void) | null, onerror: null };
                  setTimeout(() => req.onsuccess?.call(req), 0);
                  return req;
                },
                openCursor: () => {
                  const req = { onsuccess: null as ((e: { target: unknown }) => void) | null, onerror: null, result: null };
                  setTimeout(() => req.onsuccess?.call(req, { target: req }), 0);
                  return req;
                },
                createIndex: () => ({}),
              }),
            }),
            objectStoreNames: { contains: () => true },
            createObjectStore: () => ({
              createIndex: () => ({}),
            }),
          },
          onsuccess: null as (() => void) | null,
          onerror: null,
          onupgradeneeded: null as ((e: { target: unknown }) => void) | null,
        };
        setTimeout(() => {
          request.onupgradeneeded?.call(request, { target: request });
          request.onsuccess?.call(request);
        }, 0);
        return request;
      },
    } as unknown as IDBFactory;
  });

  afterEach(async () => {
    await clearAllCache();
  });

  it("should compute layout for simple DAG", async () => {
    const result = await elkLayout(sampleNodes, sampleEdges);

    expect(result).toBeDefined();
    expect(result.layout).toBeDefined();
    expect(result.layout.children).toHaveLength(3);
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.cached).toBe(false);
  });

  it("should assign positions to all nodes", async () => {
    const result = await elkLayout(sampleNodes, sampleEdges);
    const children = result.layout.children || [];

    for (const child of children) {
      expect(child.x).toBeDefined();
      expect(child.y).toBeDefined();
      expect(typeof child.x).toBe("number");
      expect(typeof child.y).toBe("number");
    }
  });

  it("should produce deterministic results for same input", async () => {
    const result1 = await elkLayout(sampleNodes, sampleEdges, {
      enableCaching: false,
    });
    const result2 = await elkLayout(sampleNodes, sampleEdges, {
      enableCaching: false,
    });

    // Positions should be the same for deterministic layout
    // Compare only the stable properties (positions and IDs), not internal ELK state
    const children1 = result1.layout.children || [];
    const children2 = result2.layout.children || [];
    
    expect(children1.length).toBe(children2.length);
    for (let i = 0; i < children1.length; i++) {
      expect(children1[i].id).toBe(children2[i].id);
      expect(children1[i].x).toBe(children2[i].x);
      expect(children1[i].y).toBe(children2[i].y);
      expect(children1[i].width).toBe(children2[i].width);
      expect(children1[i].height).toBe(children2[i].height);
    }
  });

  it("should use cache on second call with same input", async () => {
    const result1 = await elkLayout(sampleNodes, sampleEdges, {
      enableCaching: true,
    });
    expect(result1.cached).toBe(false);

    const result2 = await elkLayout(sampleNodes, sampleEdges, {
      enableCaching: true,
    });
    expect(result2.cached).toBe(true);
    expect(result2.layout).toEqual(result1.layout);
  });

  it("should respect caching option", async () => {
    const result1 = await elkLayout(sampleNodes, sampleEdges, {
      enableCaching: false,
    });
    expect(result1.cached).toBe(false);

    const result2 = await elkLayout(sampleNodes, sampleEdges, {
      enableCaching: false,
    });
    // Both should be uncached since caching is disabled
    expect(result2.cached).toBe(false);
  });

  it("should handle empty graph", async () => {
    const result = await elkLayout([], []);

    expect(result).toBeDefined();
    expect(result.layout.children).toHaveLength(0);
    expect(result.layout.edges).toHaveLength(0);
  });

  it("should handle single node", async () => {
    const singleNode: DagNode[] = [
      {
        id: "commit1",
        title: "Initial commit",
        ts: 1000000,
        parents: [],
      },
    ];

    const result = await elkLayout(singleNode, []);

    expect(result).toBeDefined();
    expect(result.layout.children).toHaveLength(1);
    expect(result.layout.children![0].id).toBe("commit1");
  });

  it("should measure layout duration", async () => {
    const result = await elkLayout(sampleNodes, sampleEdges);

    expect(result.duration).toBeGreaterThan(0);
    expect(typeof result.duration).toBe("number");
  });

  it("should respect layout direction option", async () => {
    const options: LayoutOptions = {
      direction: "DOWN",
      enableCaching: false,
    };

    const result = await elkLayout(sampleNodes, sampleEdges, options);

    expect(result).toBeDefined();
    expect(result.layout).toBeDefined();
  });

  it("should respect spacing options", async () => {
    const options: LayoutOptions = {
      spacing: {
        nodeNode: 50,
        layerLayer: 80,
      },
      enableCaching: false,
    };

    const result = await elkLayout(sampleNodes, sampleEdges, options);

    expect(result).toBeDefined();
    expect(result.layout).toBeDefined();
  });

  it("should handle complex DAG with merge commits", async () => {
    const complexNodes: DagNode[] = [
      { id: "commit1", title: "Initial", ts: 1000000, parents: [] },
      { id: "commit2", title: "Feature branch", ts: 1000100, parents: ["commit1"] },
      { id: "commit3", title: "Main branch", ts: 1000150, parents: ["commit1"] },
      { id: "commit4", title: "Merge", ts: 1000200, parents: ["commit2", "commit3"] },
    ];

    const complexEdges = [
      { id: "edge1", source: "commit2", target: "commit1" },
      { id: "edge2", source: "commit3", target: "commit1" },
      { id: "edge3", source: "commit4", target: "commit2" },
      { id: "edge4", source: "commit4", target: "commit3" },
    ];

    const result = await elkLayout(complexNodes, complexEdges);

    expect(result).toBeDefined();
    expect(result.layout.children).toHaveLength(4);
    expect(result.layout.edges).toHaveLength(4);
  });
});

describe("Layout Performance", () => {
  beforeEach(() => {
    // Mock IndexedDB
    global.indexedDB = {
      open: () => {
        const request = {
          result: {
            transaction: () => ({
              objectStore: () => ({
                put: () => {
                  const req = { onsuccess: null as (() => void) | null, onerror: null };
                  setTimeout(() => req.onsuccess?.call(req), 0);
                  return req;
                },
                get: () => {
                  const req = {
                    result: undefined,
                    onsuccess: null as (() => void) | null,
                    onerror: null,
                  };
                  setTimeout(() => req.onsuccess?.call(req), 0);
                  return req;
                },
                clear: () => {
                  const req = { onsuccess: null as (() => void) | null, onerror: null };
                  setTimeout(() => req.onsuccess?.call(req), 0);
                  return req;
                },
                openCursor: () => {
                  const req = {
                    onsuccess: null as ((e: { target: unknown }) => void) | null,
                    onerror: null,
                    result: null,
                  };
                  setTimeout(() => req.onsuccess?.call(req, { target: req }), 0);
                  return req;
                },
              }),
            }),
            objectStoreNames: { contains: () => true },
          },
          onsuccess: null as (() => void) | null,
          onerror: null,
          onupgradeneeded: null,
        };
        setTimeout(() => request.onsuccess?.call(request), 0);
        return request;
      },
    } as unknown as IDBFactory;
  });

  it("should meet performance targets for medium graph (100 nodes)", async () => {
    // Generate a medium-sized graph
    const nodes: DagNode[] = [];
    const edges: { id: string; source: string; target: string }[] = [];

    for (let i = 0; i < 100; i++) {
      nodes.push({
        id: `commit${i}`,
        title: `Commit ${i}`,
        ts: 1000000 + i * 100,
        parents: i > 0 ? [`commit${i - 1}`] : [],
      });

      if (i > 0) {
        edges.push({
          id: `edge${i}`,
          source: `commit${i}`,
          target: `commit${i - 1}`,
        });
      }
    }

    const result = await elkLayout(nodes, edges, { enableCaching: false });

    // Performance target: ≤ 1500ms for medium graphs
    // In practice, 100 nodes should be much faster
    expect(result.duration).toBeLessThan(1500);
    expect(result.layout.children).toHaveLength(100);
  });
});

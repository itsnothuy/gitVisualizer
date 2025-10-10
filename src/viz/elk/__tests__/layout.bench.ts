/**
 * Performance benchmarking script for ELK layout
 * 
 * This script measures layout performance on sample graphs of varying sizes
 * to validate performance targets from docs/TESTING.md:
 * - Initial Layout: ≤ 1500ms (medium graphs ~100-1000 nodes)
 * - Pan/Zoom FPS: ≥ 60 FPS (≤ 16ms/frame)
 */

import { elkLayout, type DagNode } from "../layout";

/**
 * Generate a linear commit history (simplest DAG)
 */
function generateLinearGraph(size: number): {
  nodes: DagNode[];
  edges: { id: string; source: string; target: string }[];
} {
  const nodes: DagNode[] = [];
  const edges: { id: string; source: string; target: string }[] = [];

  for (let i = 0; i < size; i++) {
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

  return { nodes, edges };
}

/**
 * Generate a graph with branching (more realistic)
 */
function generateBranchingGraph(size: number): {
  nodes: DagNode[];
  edges: { id: string; source: string; target: string }[];
} {
  const nodes: DagNode[] = [];
  const edges: { id: string; source: string; target: string }[] = [];

  // Main branch
  for (let i = 0; i < size; i++) {
    const parents: string[] = [];
    
    if (i > 0) {
      parents.push(`commit${i - 1}`);
    }
    
    // Create merge commits every 10 commits
    if (i > 0 && i % 10 === 0 && i < size - 1) {
      const branchId = `branch${i}`;
      nodes.push({
        id: branchId,
        title: `Branch ${i}`,
        ts: 1000000 + i * 100 - 50,
        parents: [`commit${i - 1}`],
      });
      edges.push({
        id: `edge-branch${i}`,
        source: branchId,
        target: `commit${i - 1}`,
      });
      parents.push(branchId);
    }

    nodes.push({
      id: `commit${i}`,
      title: `Commit ${i}`,
      ts: 1000000 + i * 100,
      parents,
    });

    for (const parent of parents) {
      edges.push({
        id: `edge${i}-${parent}`,
        source: `commit${i}`,
        target: parent,
      });
    }
  }

  return { nodes, edges };
}

/**
 * Run benchmark for a specific graph size
 */
async function benchmark(
  name: string,
  size: number,
  generator: (size: number) => {
    nodes: DagNode[];
    edges: { id: string; source: string; target: string }[];
  }
): Promise<void> {
  const { nodes, edges } = generator(size);

  console.log(`\n🔄 ${name} (${size} nodes):`);

  // Warmup run (ignore results)
  await elkLayout(nodes, edges, { enableCaching: false });

  // Benchmark runs
  const runs = 3;
  const durations: number[] = [];

  for (let i = 0; i < runs; i++) {
    const result = await elkLayout(nodes, edges, { enableCaching: false });
    durations.push(result.duration);
  }

  const avgDuration = durations.reduce((a, b) => a + b, 0) / runs;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);

  console.log(`  ✓ Average: ${avgDuration.toFixed(2)}ms`);
  console.log(`  ✓ Min: ${minDuration.toFixed(2)}ms`);
  console.log(`  ✓ Max: ${maxDuration.toFixed(2)}ms`);
  console.log(`  ✓ Nodes: ${nodes.length}, Edges: ${edges.length}`);

  // Check against target
  const target = 1500; // ms
  if (avgDuration <= target) {
    console.log(`  ✅ PASS - Within target (≤${target}ms)`);
  } else {
    console.log(`  ⚠️  WARN - Exceeds target (>${target}ms)`);
  }

  // Test caching benefit
  const cachedResult = await elkLayout(nodes, edges, { enableCaching: true });
  console.log(`  ✓ First cached: ${cachedResult.duration.toFixed(2)}ms (cached: ${cachedResult.cached})`);
  
  const cachedResult2 = await elkLayout(nodes, edges, { enableCaching: true });
  console.log(`  ✓ Second cached: ${cachedResult2.duration.toFixed(2)}ms (cached: ${cachedResult2.cached})`);
  
  if (cachedResult2.cached && cachedResult2.duration < avgDuration) {
    console.log(`  ✅ Cache speedup: ${(avgDuration / cachedResult2.duration).toFixed(1)}x faster`);
  }
}

/**
 * Main benchmark suite
 */
async function runBenchmarks(): Promise<void> {
  console.log("=== ELK Layout Performance Benchmarks ===");
  console.log("Target: ≤ 1500ms for medium graphs");
  console.log("Running 3 iterations per size...\n");

  // Small graphs (10-50 nodes)
  await benchmark("Linear - Small", 10, generateLinearGraph);
  await benchmark("Linear - Medium-Small", 50, generateLinearGraph);

  // Medium graphs (100-500 nodes)
  await benchmark("Linear - Medium", 100, generateLinearGraph);
  await benchmark("Branching - Medium", 100, generateBranchingGraph);
  await benchmark("Linear - Large-Medium", 500, generateLinearGraph);
  await benchmark("Branching - Large-Medium", 500, generateBranchingGraph);

  // Large graphs (1000+ nodes)
  await benchmark("Linear - Large", 1000, generateLinearGraph);
  await benchmark("Branching - Large", 1000, generateBranchingGraph);

  console.log("\n=== Benchmark Complete ===");
}

// Run benchmarks if executed directly
if (require.main === module) {
  runBenchmarks().catch((error) => {
    console.error("Benchmark failed:", error);
    process.exit(1);
  });
}

export { runBenchmarks, benchmark, generateLinearGraph, generateBranchingGraph };

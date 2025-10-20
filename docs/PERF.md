# Performance Optimization Guide

## Overview

This document describes the performance optimizations implemented in the Git Visualizer, including bundle analysis, lazy loading, and Web Worker integration for large graphs.

## Bundle Analysis

### Running Bundle Analyzer

To analyze the production bundle and identify optimization opportunities:

```bash
pnpm build:analyze
```

This will:
1. Build the application with `ANALYZE=true` environment variable
2. Generate interactive HTML reports showing bundle composition
3. Open the reports in your browser automatically

The analyzer produces two reports:
- **Client bundle**: `.next/analyze/client.html` - Shows what gets sent to the browser
- **Server bundle**: `.next/analyze/server.html` - Shows server-side bundle composition

### Interpreting Results

**Key metrics to monitor:**
- **Total bundle size**: Should remain ≤ 500KB gzipped for main bundle
- **Largest dependencies**: Identify heavy libraries that could be lazy-loaded
- **Duplicate code**: Check for packages included multiple times
- **Unused code**: Look for imports that aren't actually used

**What to look for:**
- Large visualization libraries (ELK, d3-dag) should be code-split
- UI component libraries should be tree-shaken effectively
- Heavy dependencies should only load when needed

## Lazy Loading Strategy

### ELK.js Dynamic Import

The ELK layout library (~200KB) is lazy-loaded to avoid including it in the initial bundle for non-graph pages.

**Implementation:**
```typescript
// ❌ Old: Eager import (always included)
import ELK from "elkjs";

// ✅ New: Lazy import (loaded on demand)
async function getElk() {
  const ELK = await import("elkjs").then((m) => m.default);
  return new ELK();
}
```

**Benefits:**
- Reduces initial page load time for landing pages
- Only loads ELK when user navigates to graph visualization
- Enables better code splitting and caching

### Adding More Lazy Imports

When adding new heavy dependencies, consider lazy loading them:

```typescript
// For libraries > 50KB, use dynamic import
const HeavyLib = await import("heavy-library").then((m) => m.default);

// For Next.js components
const Component = dynamic(() => import("@/components/HeavyComponent"), {
  loading: () => <Spinner />,
  ssr: false, // if not needed on server
});
```

## Performance Modes

### Overview

The application provides three performance modes that automatically adjust settings based on graph size:

- **Auto (Recommended)**: Intelligently balances quality and performance based on graph size
- **Quality**: Prioritizes visual quality over performance (best for small to medium graphs)
- **Speed**: Prioritizes performance over visual quality (best for very large graphs)

Users can change modes via the Performance Settings dialog, and preferences are persisted to localStorage.

### Performance Thresholds

The following thresholds are used in **Auto mode** (configurable via environment variables):

| Threshold | Default | Env Var | Description |
|-----------|---------|---------|-------------|
| Worker | 1,500 nodes | `NEXT_PUBLIC_WORKER_THRESHOLD` | Use Web Worker for layout |
| Virtualization | 2,500 nodes | `NEXT_PUBLIC_VIRTUALIZATION_THRESHOLD` | Enable viewport virtualization |
| Reduced Labels | 5,000 nodes | `NEXT_PUBLIC_REDUCED_LABELS_THRESHOLD` | Reduce label density |
| Disable Adorners | 5,000 nodes | `NEXT_PUBLIC_DISABLE_ADORNERS_THRESHOLD` | Disable animations/effects |

### Mode Behavior

| Feature | Auto | Quality | Speed |
|---------|------|---------|-------|
| Web Worker | ≥ 1,500 nodes | ≥ 1,500 nodes | ≥ 500 nodes |
| Virtualization | ≥ 2,500 nodes | Never | Always |
| Label Sampling | ≥ 5,000 nodes | Never | Always |
| Animations/Effects | ≥ 5,000 nodes disabled | Always enabled | Always disabled |
| Frame Watchdog | Enabled | Enabled | Enabled |
| OffscreenCanvas | ≥ 2,500 nodes (if supported) | Never | If supported |

## Web Worker Integration

### Overview

For graphs with **> 1500 nodes** (or > 500 in Speed mode), layout computation automatically offloads to a Web Worker to keep the UI responsive.

### Thresholds

| Graph Size | Strategy | Expected Performance |
|------------|----------|---------------------|
| < 1500 nodes | Main thread (direct) | ≤ 1500ms initial layout |
| ≥ 1500 nodes | Web Worker (automatic) | Non-blocking, ~2000ms |
| > 10,000 nodes | Consider Canvas/WebGL rendering | Future optimization |

**Configuration:**
```typescript
// Automatic (recommended)
const result = await elkLayout(nodes, edges);
// Uses worker if nodes.length > 1500

// Force worker usage
const result = await elkLayout(nodes, edges, { useWorker: true });

// Disable worker (force main thread)
const result = await elkLayout(nodes, edges, { useWorker: false });
```

### Worker Architecture

**Location**: `src/workers/layout.worker.ts`

**Communication**: Uses [Comlink](https://github.com/GoogleChromeLabs/comlink) for type-safe RPC:
- No manual `postMessage` / `onmessage` handling
- TypeScript types preserved across worker boundary
- Automatic promise resolution

**Worker lifecycle:**
1. Worker created on-demand for large graphs
2. Layout computation runs in background thread
3. Worker terminated after result returned
4. Falls back to main thread if worker fails

### Frame Watchdog

### Overview

The frame watchdog monitors `requestAnimationFrame` performance to detect and report frame drops that impact the 60 FPS target.

### Configuration

```typescript
import { FrameWatchdog } from '@/lib/frame-watchdog';

const watchdog = new FrameWatchdog({
  maxFrameTime: 16.7,      // 60 FPS target
  threshold: 3,            // Warn after 3 consecutive slow frames
  warningCooldown: 5000,   // Minimum 5s between warnings
  debug: false,            // Enable debug logging
  onSlowFrames: (stats) => {
    console.log('Performance degraded:', stats);
  },
});

watchdog.start();

// Later...
watchdog.stop();
const report = watchdog.getReport();
console.log(report);
```

### React Hook

For React components, use the `usePerformance` hook:

```typescript
import { usePerformance } from '@/lib/hooks/usePerformance';

function GraphComponent({ nodes, edges }) {
  const { mode, settings, frameStats, isPerformanceGood } = usePerformance({
    nodeCount: nodes.length,
    edgeCount: edges.length,
    enableWatchdog: true,
  });

  return (
    <div>
      {!isPerformanceGood && (
        <div className="performance-warning">
          Frame rate degraded. Consider switching to Speed mode.
        </div>
      )}
      <GraphSVG
        nodes={nodes}
        edges={edges}
        enableVirtualization={settings.enableVirtualization}
        reduceLabelDensity={settings.reduceLabelDensity}
      />
    </div>
  );
}
```

## Performance Monitoring

**In development:**
```javascript
const result = await elkLayout(nodes, edges);
console.log(`Layout completed in ${result.duration}ms, cached: ${result.cached}`);

// Check frame performance
const watchdog = getFrameWatchdog();
console.log(watchdog.getReport());
```

**In production:**
- Monitor `result.duration` to detect performance regressions
- Track cache hit rate (`result.cached`)
- Monitor frame stats via watchdog for real-time performance
- Alert if duration exceeds thresholds:
  - < 1500 nodes: > 2000ms is concerning
  - ≥ 1500 nodes: > 5000ms is concerning
- Alert if slow frame percentage > 10%

## Profiling Guide

### Browser DevTools

**Performance profiling:**
1. Open Chrome DevTools → Performance tab
2. Click Record (or Cmd/Ctrl + E)
3. Navigate to graph visualization page
4. Stop recording
5. Analyze:
   - **Main thread**: Should be mostly idle during worker layout
   - **Worker thread**: Shows ELK computation
   - **Rendering**: Check for long frames (> 16ms)

**Memory profiling:**
1. Open Chrome DevTools → Memory tab
2. Take heap snapshot before graph load
3. Navigate to graph, wait for layout
4. Take second snapshot
5. Compare snapshots:
   - Target: < 100MB for 1000-node graph
   - Watch for: Retained objects after navigation

### React DevTools

**Component profiling:**
1. Install React DevTools extension
2. Open Profiler tab
3. Click Record
4. Interact with graph (zoom, pan, select)
5. Stop recording
6. Identify:
   - Components rendering unnecessarily
   - Expensive render operations
   - Opportunities for `React.memo`

### Bundle Size Tracking

**Automated tracking in CI:**
```bash
# In CI workflow, after build:
pnpm build:analyze

# Extract bundle sizes
du -sh .next/static/chunks/*.js

# Compare with baseline (stored in repo or artifact)
# Alert if main bundle increases by > 10%
```

## Optimization Checklist

### Before Merging PRs

- [ ] Run `pnpm build:analyze` and verify bundle size impact
- [ ] Check that ELK import is not eagerly loaded
- [ ] Test with > 1500 node graph to verify worker usage
- [ ] Profile with React DevTools to check for unnecessary renders
- [ ] Verify memory usage stays within targets

### Quarterly Review

- [ ] Run performance benchmarks (see `docs/PERFORMANCE_LAYOUT.md`)
- [ ] Review bundle composition for new heavy dependencies
- [ ] Check cache hit rates in production metrics
- [ ] Evaluate need for Canvas/WebGL rendering

## Common Issues

### "Performance is degraded / slow frames"

**Symptom:** Frame watchdog reports > 10% slow frames, UI feels sluggish

**Investigation:**
1. Check current performance mode: `localStorage.getItem('perf-mode')`
2. Verify graph size and thresholds
3. Check browser console for frame watchdog warnings
4. Profile with DevTools Performance tab

**Fix:**
- Switch to Speed mode for large graphs
- Reduce graph complexity (fewer nodes/edges)
- Check for heavy operations in event handlers
- Disable browser extensions that may interfere

### "Worker construction failed"

**Symptom:** Layout falls back to main thread even for large graphs

**Causes:**
- CSP headers blocking `worker-src blob:`
- Build configuration issue with worker bundling
- Browser doesn't support Worker API

**Fix:**
- Check `next.config.ts` for worker CSP permissions
- Verify worker file loads correctly in Network tab
- Check browser console for worker errors

### "Bundle size increased significantly"

**Symptom:** Main bundle size grew by > 50KB

**Investigation:**
```bash
pnpm build:analyze
# Look for new dependencies in the main chunk
# Check if dynamic imports are working
```

**Common causes:**
- Eager import added instead of dynamic import
- New dependency not tree-shakeable
- Circular dependencies preventing code splitting

### "Layout slower than expected"

**Symptom:** Layout takes > 2000ms for < 1000 nodes

**Investigation:**
1. Check if cache is disabled: `enableCaching: false`
2. Verify worker threshold logic is correct
3. Check current performance mode
4. Profile in DevTools to find bottleneck
5. Check for network requests during layout

**Fix:**
- Ensure caching is enabled
- Try Speed mode for faster layout
- Clear layout cache if corrupted
- Check for interfering browser extensions

### "OffscreenCanvas not working"

**Symptom:** OffscreenCanvas feature flag enabled but not being used

**Causes:**
- Browser doesn't support OffscreenCanvas API
- Feature flag not properly set in environment
- Graph size below threshold for auto-enable

**Investigation:**
```javascript
// Check browser support
console.log('OffscreenCanvas supported:', typeof OffscreenCanvas !== 'undefined');

// Check feature flag
import { isFeatureEnabled } from '@/lib/feature-flags';
console.log('Feature enabled:', isFeatureEnabled('enableOffscreenCanvas'));

// Check current settings
import { usePerformance } from '@/lib/hooks/usePerformance';
const { settings } = usePerformance({ nodeCount, edgeCount });
console.log('Use OffscreenCanvas:', settings.useOffscreenCanvas);
```

**Fix:**
- Use a browser that supports OffscreenCanvas (Chrome 69+, Edge 79+)
- Set `NEXT_PUBLIC_ENABLE_OFFSCREEN_CANVAS=true` in `.env.local`
- Use Speed mode or larger graphs to trigger auto-enable

## Future Optimizations

### Planned

1. **Progressive rendering** (< 100ms initial render)
   - Render visible nodes first
   - Stream layout results as they compute
   - Target: Perceived instant feedback

2. **Layout streaming** (for very large graphs)
   - Compute layout in chunks
   - Yield control back to main thread
   - Target: Keep UI responsive even on slow devices

3. **Canvas/WebGL rendering** (> 10k nodes)
   - SVG performance degrades at scale
   - Switch to Canvas for edges, keep SVG for labels
   - Target: Maintain 60 FPS with 10k+ nodes

### Under Evaluation

- **Shared worker** for cross-tab layout caching
- **IndexedDB** for persistent layout cache
- **WASM** for faster layout computation
- **GPU acceleration** for edge routing

## References

- [ELK Algorithm Performance](https://eclipse.dev/elk/documentation/algorithmdevelopers/performance.html)
- [Next.js Bundle Analyzer](https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer)
- [Web Workers Best Practices](https://web.dev/workers-basics/)
- [React Performance Optimization](https://react.dev/reference/react/memo)

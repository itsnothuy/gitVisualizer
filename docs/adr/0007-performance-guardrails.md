# ADR 0007: Performance Guardrails and Auto-Thresholds

**Status:** Accepted

**Date:** 2025-10-20

**Context:**

As graphs grow in size (1,000+ commits), the application must maintain acceptable performance (60 FPS pan/zoom, < 1.5s initial layout) without requiring manual user intervention. Without automated performance management, large graphs can cause UI blocking, frame drops, and poor user experience.

Key challenges:
1. Layout computation blocking the main thread for large graphs
2. Rendering all nodes/edges causing frame drops during interaction
3. No visibility into real-time performance issues
4. Users unable to easily control performance/quality tradeoffs

**Decision:**

We implement automatic performance guardrails with configurable thresholds:

### 1. Performance Modes

Three modes offering different quality/performance tradeoffs:

- **Auto (default)**: Automatically applies optimizations based on graph size
- **Quality**: Prioritizes visual fidelity (best for < 2,500 commits)
- **Speed**: Prioritizes performance (best for > 5,000 commits)

User preference persisted to `localStorage` with key `perf-mode`.

### 2. Auto-Threshold System

Default thresholds (env-tunable):

| Feature | Threshold | Env Variable |
|---------|-----------|--------------|
| Web Worker | 1,500 nodes | `NEXT_PUBLIC_WORKER_THRESHOLD` |
| Virtualization | 2,500 nodes | `NEXT_PUBLIC_VIRTUALIZATION_THRESHOLD` |
| Reduced Labels | 5,000 nodes | `NEXT_PUBLIC_REDUCED_LABELS_THRESHOLD` |
| Disable Adorners | 5,000 nodes | `NEXT_PUBLIC_DISABLE_ADORNERS_THRESHOLD` |

### 3. Frame Watchdog

Real-time frame time monitoring via `requestAnimationFrame`:
- Tracks frame times with 60-frame rolling window
- Warns on 3+ consecutive frames over 16.7ms budget
- Rate-limited warnings (5s cooldown)
- Exposes stats: avg, max, p95, slow frame percentage

### 4. Feature Flags

`enableOffscreenCanvas`: Opt-in support for OffscreenCanvas rendering (experimental, Chrome 69+)

### 5. Settings UI

`PerformanceSettings` component provides:
- Mode selector (Auto/Quality/Speed)
- Visual explanation of each mode
- Accessible via Settings menu

### 6. React Integration

`usePerformance` hook provides:
- Current mode and derived settings
- Frame statistics
- Performance health indicator
- Automatic watchdog lifecycle management

**Alternatives Considered:**

1. **Manual user controls only**: Rejected - places burden on users to understand thresholds
2. **Fixed performance mode**: Rejected - no flexibility for user preference or edge cases
3. **Client-side detection only**: Accepted - server can't know graph size until loaded
4. **Machine learning-based tuning**: Rejected - overly complex for current needs

**Consequences:**

### Positive:
- Automatic performance management for 80% of use cases
- Clear escape hatch (Speed mode) for power users
- Observable performance via watchdog
- Progressive optimization as graph size increases
- No breaking changes to existing APIs

### Negative:
- Additional localStorage usage (~10 bytes)
- Frame watchdog adds ~0.1% CPU overhead
- Need to maintain threshold values as performance improves
- Users may not discover Settings UI without guidance

### Neutral:
- Thresholds based on empirical testing; may need tuning
- OffscreenCanvas support limited to modern browsers
- Performance mode doesn't affect layout algorithm (ADR-0004)

**Testing:**

- Unit tests: `perf-config.test.ts`, `frame-watchdog.test.ts`
- E2E tests: `performance.spec.ts` (frame time assertions, mode persistence)
- Manual testing: Verified on 500, 2,500, and 5,000 commit graphs

**Monitoring:**

Recommend tracking in production:
- Distribution of performance modes used
- Frame watchdog warnings by graph size
- Layout duration by graph size and mode
- Correlation between mode and session engagement

**Future Enhancements:**

1. **Adaptive thresholds**: Adjust based on device performance
2. **Smart mode switching**: Suggest mode change when performance degrades
3. **Performance budgets**: Per-page performance targets in CI
4. **Telemetry**: Aggregate performance metrics (opt-in)

**References:**

- [RFC: Performance Guardrails](https://github.com/itsnothuy/gitVisualizer/issues/XXX)
- [PERF.md](../PERF.md)
- [Web Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API)
- [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)

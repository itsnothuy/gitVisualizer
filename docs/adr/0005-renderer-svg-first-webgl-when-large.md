# ADR-0005: Renderer = React + SVG first; escalate to WebGL for very large graphs

- **Status**: Accepted
- **Date**: 2025-10-09
- **Deciders**: FE Lead, Perf
- **Tags**: rendering, performance

## Context
SVG offers great accessibility and developer ergonomics. But extremely large graphs can suffer.

## Decision
Use React + SVG with virtualization for small/medium graphs. If visible elements exceed ~10k, switch edges/nodes to Canvas/WebGL or OffscreenCanvas.

## Alternatives Considered
- Always WebGL: best throughput; higher complexity & a11y effort.
- Always Canvas: simpler than WebGL; less semantic a11y than SVG.

## Consequences
A11y friendliness and fast iteration now; escape hatch for scale.

## Implementation Notes
Expose a feature flag for “high-density mode.” Keep text overlays minimal in WebGL paths.

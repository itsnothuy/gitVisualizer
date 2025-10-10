# ADR-0004: DAG Layout = ELK (layered)

- **Status**: Accepted
- **Date**: 2025-10-09
- **Deciders**: FE Lead, Graph Specialist
- **Tags**: layout, visualization

## Context
We need a stable, configurable layered (Sugiyama) layout to present first-parent flow and merges clearly.

## Decision
Use **ELK (elkjs)** layered algorithm for initial layout and lane assignment.

## Alternatives Considered
- Custom DAG heuristics: faster to hack, but poor maintainability.
- d3-dag variants: good for DAGs but less control for Git-specific lanes.

## Consequences
Predictable, high-quality layout; tuning effort for large histories.

## Implementation Notes
Batch layout in Web Workers; cache positions; define thresholds to switch to progressive layout.

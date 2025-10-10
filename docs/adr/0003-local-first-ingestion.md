# ADR-0003: Local-first Git ingestion (no upload by default)

- **Status**: Accepted
- **Date**: 2025-10-09
- **Deciders**: Security, FE Lead
- **Tags**: privacy, ingestion

## Context
Users want to visualize local repos without uploading proprietary code or history.

## Decision
Use the **File System Access API** for local directories and **isomorphic-git + LightningFS** for in-browser clones. Cache data in OPFS/IndexedDB. No server database in MVP.

## Alternatives Considered
- Server-side ingestion (libgit2/go-git): fast on very large repos but violates our default privacy guarantee.
- Electron desktop: more power; increases distribution/ops.

## Consequences
Strong privacy; some browser perf limits; careful workerization required.

## Implementation Notes
Explicit permission prompts; token storage in memory; feature-flag any overlays (GitHub/GitLab). Provide a “no-network” mode switch.

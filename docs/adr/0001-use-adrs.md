# ADR-0001: Use Architecture Decision Records

- **Status**: Accepted
- **Date**: 2025-10-09
- **Deciders**: Eng Lead, FE Lead, Security, PM
- **Tags**: governance, documentation

## Context
We need durable, reviewable records of architectural decisions and their trade-offs for a privacy-first, local-first Git visualizer.

## Decision
Adopt ADRs for architecturally significant decisions. Store under `docs/adr/`, commit in PRs that introduce or change architecture.

## Alternatives Considered
- No ADRs: faster initially, but poor traceability.
- Wiki pages: easy to drift; not versioned with code.

## Consequences
Better traceability and onboarding; small maintenance overhead.

## Implementation Notes
Use `0000-adr-template.md`. Each ADR must include Status, Context, Decision, Alternatives, Consequences, Implementation Notes, References.

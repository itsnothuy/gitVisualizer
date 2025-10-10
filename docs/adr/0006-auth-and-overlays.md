# ADR-0006: Auth & overlays with minimal scopes

- **Status**: Accepted
- **Date**: 2025-10-09
- **Deciders**: Security, PM
- **Tags**: security, api

## Context
Optional overlays (PRs, tags, CI) should enrich the graph without compromising privacy.

## Decision
Use OAuth with PKCE; **read-only** scopes (GitHub/GitLab). Keep tokens in memory; prompt the user to opt-in to overlays per repository.

## Alternatives Considered
- Persist tokens in local storage: convenient; increases risk.
- Broad scopes: easier API use; violates least-privilege.

## Consequences
Slightly more friction at first use; far better security posture.

## Implementation Notes
Implement rate-limit aware GraphQL/REST clients with caching/backoff. Provide a “disconnect & purge” button.

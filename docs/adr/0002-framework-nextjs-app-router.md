# ADR-0002: Framework = Next.js (App Router)

- **Status**: Accepted
- **Date**: 2025-10-09
- **Deciders**: FE Lead, PM
- **Tags**: framework, runtime

## Context
Team familiarity with React and Next; desire for SSR/SSG where helpful; strong ecosystem and testing docs.

## Decision
Use Next.js App Router with TypeScript. Keep server components minimal; most graph logic runs client-side to preserve privacy.

## Alternatives Considered
- SvelteKit: lean and fast; smaller hiring pool for our team.
- Remix/React Router 7: excellent routing; fewer built-in patterns we need.

## Consequences
Fast onboarding; rich docs and examples; lock-in to React conventions.

## Implementation Notes
Create app via `create-next-app`; enforce TypeScript strict; wire Tailwind and shadcn/ui for consistent components.

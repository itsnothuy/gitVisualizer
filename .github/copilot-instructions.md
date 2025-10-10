# Copilot Repository Instructions — Git Visualizer

## Purpose
You are assisting on a **privacy-first, local-first** Git visualizer. Priorities: correctness of the commit DAG; beginner-friendly UX; WCAG 2.2 AA; zero exfiltration of local data by default.

## Models & Modes
- **Preferred model in Copilot Chat:** Claude Sonnet 4 (or 4.5 if available).
- **Working style:** Use **Agent Mode** for interactive multi-step changes; use the **Coding Agent** for background work that opens PRs with diffs and status checks. Never merge without human approval.

## Non-negotiables
- **Privacy:** Never upload local repo contents or personally identifiable files. All processing stays in-browser unless a maintainer explicitly enables an overlay feature.
- **Security:** Use minimal OAuth scopes (read-only). Keep tokens in memory by default; no silent persistence.
- **A11y:** Target **WCAG 2.2 AA**. Keyboard-first nav (Tab/Shift+Tab), visible focus, ARIA labels. Avoid color-only encodings; provide patterns/shape/textual cues.

## Build, Test, Lint (use these unless the repo specifies overrides)
- Install: `corepack enable && pnpm i --frozen-lockfile`
- Lint: `pnpm lint`  (ESLint + jsx-a11y + Prettier)
- Unit/Integration: `pnpm test` (Vitest + @testing-library)
- E2E/Smoke: `pnpm exec playwright test`
- Dev server: `pnpm dev`
- Build: `pnpm build`

## Branch & PR Workflow
- Branch naming: `feat/<area>`, `chore/<area>`, `fix/<area>`, `docs/<area>`
- Open small, reviewable PRs with:
  - Summary of intent
  - Screenshots/artifacts for UI changes
  - Test changes
  - A11y notes (focus order changes, labels)
  - Performance notes if element counts changed

## Checkpoints (require confirmation before proceeding)
1. **Scaffold** structures & configs
2. **Ingestion** (File System Access; isomorphic-git shallow clone)
3. **Layout** (ELK layered) with cached positions
4. **Rendering** (React+SVG) with virtualization
5. **Overlays** (GitHub/GitLab) behind feature flags
6. **A11y pass** & **Perf sanity**; add tests; open PR

## Coding Standards
- TypeScript strict; no `any` unless justified.
- Favor pure functions and deterministic transforms from Git objects → DAG model.
- Public APIs typed and documented with JSDoc.
- Commit messages: Conventional Commits.

## Performance & Fallbacks
- Aim ≤ 1500 ms initial layout on medium graphs; keep pan/zoom ≤ 16 ms/frame.
- If visible element count > 10k, propose switching edges/nodes to Canvas/WebGL or virtualized rendering, and commit a spike branch.

## Git Graph & Overlays
- Layout: ELK (layered). Avoid ad-hoc absolute positioning.
- Start with React + SVG; only escalate to OffscreenCanvas/WebGL if targets are exceeded.
- Overlays (opt-in): GitHub GraphQL for PRs/tags; Checks/Statuses; GitLab REST for MRs/pipelines. Apply rate-limit friendly pagination & caching.

## Documentation & Decisions
- Significant changes require an **ADR** under `docs/adr/` (Status, Context, Decision, Alternatives, Consequences, References).
- Keep `/docs/PLAN.md` and `/docs/ARCHITECTURE.md` in sync with code.

## What to do if unclear
- Ask for a **minimal ADR patch** or a short proposal PR. Keep artifacts in the repo, not inline chat.

## Area-Specific Instructions

For detailed area-specific instructions, refer to the following files based on the code area you're working on:

| Pattern | File Path | Description |
| ------- | --------- | ----------- |
| `src/viz/**`, `src/components/viz/**`, `packages/viz/**` | `.github/instructions/viz.instructions.md` | Visualization layer instructions for DAG layout and rendering with ELK.js, React + SVG, performance targets, and accessibility requirements. |
| `src/lib/overlays/**`, `packages/overlays/**`, `src/app/(overlays)/**` | `.github/instructions/overlays.instructions.md` | Overlay system instructions for GitHub/GitLab integration with privacy-first OAuth, rate limiting, and read-only access patterns. |
| `src/lib/git/**`, `packages/ingestion/**` | `.github/instructions/ingestion.instructions.md` | Ingestion layer instructions for local-first Git operations using File System Access API and isomorphic-git with shallow cloning. |
| `src/**`, `packages/**`, `app/**` | `.github/instructions/a11y.instructions.md` | Accessibility instructions for WCAG 2.2 AA compliance, keyboard navigation, screen reader support, and color-independent design. |

**Note:** These area-specific instructions complement the repository-level instructions above. Always check if area-specific instructions apply to your work.

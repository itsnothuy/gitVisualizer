---
applyTo: "src/viz/**,src/components/viz/**,packages/viz/**"
---

# Area Instructions — Visualization (DAG Layout & Rendering)

## Purpose
You are working inside the **visualization layer**: DAG layout, lane assignment, and rendering (graph nodes/edges, interactions, zoom/pan). Optimize for **clarity, performance, and accessibility**.

## Non-negotiables
- **Layout**: Use **ELK (elkjs)** layered (Sugiyama) algorithm for positioning and lanes. Tune options; no ad-hoc absolute positioning.
- **Render**: Default to **React + SVG** (semantic, accessible). If *visible* elements > ~10k or FPS drops, propose a Canvas/WebGL or OffscreenCanvas path for edges, keeping labels as overlay. Back your change with a perf note. (SVG is great up to mid-sized scenes; escalate when density rises.)
- **A11y**: Meet **WCAG 2.2 AA**; provide keyboard nav (Tab/Shift+Tab), visible focus, text alternatives. **No color-only encodings**—use shape/pattern/labels for status/branches. Use ARIA roles thoughtfully for interactive SVG.

## Do / Don’t
**Do**
- Batch layout work in **Web Workers**; keep main thread responsive.
- Cache **node positions** keyed by commit OID + layout params; incremental relayout on delta changes.
- Use progressive edge routing (draw on idle or in chunks) to keep **60 FPS pan/zoom** targets.

**Don’t**
- Don’t bypass ELK for quick fixes.
- Don’t rely on color alone to convey state (CI/branch). Provide `title`/`aria-label` on SVG groups.

## Acceptance criteria (per PR)
- **Layout**: ELK config documented in code; deterministic results with same inputs.
- **Perf**: First layout ≤ **1500 ms** on “medium” graphs; pan/zoom ≤ **16 ms/frame** in local dev. Include a short perf note when edge/node counts change.
- **A11y**: Tabbing reaches nodes; SR announces node label + status; color-independent cue present.

## Commands
- Build/test: `pnpm lint && pnpm test && pnpm build`
- E2E (smoke): `pnpm exec playwright test`

## References
- **ELK layered algorithm & options**: https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html
- **elkjs** repo: https://github.com/kieler/elkjs
- **WCAG 2.2**: https://www.w3.org/WAI/WCAG22/quickref/
- **WAI-ARIA**: https://www.w3.org/WAI/ARIA/apg/

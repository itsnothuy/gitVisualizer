# Area-Specific Copilot Instructions

This directory contains area-specific instructions for GitHub Copilot coding agents. These instructions are automatically applied when working on specific areas of the codebase.

## How It Works

Each `.instructions.md` file in this directory contains specialized guidance for a particular area of the codebase. The files use YAML frontmatter to specify which file patterns they apply to:

```yaml
---
applyTo: "src/viz/**,src/components/viz/**"
---
```

When a Copilot agent works on files matching these patterns, it will automatically load and follow the corresponding instructions.

## Available Instructions

| File | Applies To | Purpose |
| ---- | ---------- | ------- |
| `viz.instructions.md` | Visualization code (`src/viz/**`, `src/components/viz/**`) | DAG layout with ELK.js, React + SVG rendering, performance optimization |
| `overlays.instructions.md` | Overlay system (`src/lib/overlays/**`, `src/app/(overlays)/**`) | GitHub/GitLab integration with privacy-first OAuth and rate limiting |
| `ingestion.instructions.md` | Git operations (`src/lib/git/**`, `packages/ingestion/**`) | Local-first Git operations with File System Access API and isomorphic-git |
| `a11y.instructions.md` | All source code (`src/**`, `packages/**`, `app/**`) | WCAG 2.2 AA accessibility compliance and keyboard navigation |

## Structure

Each instruction file follows this structure:

1. **Frontmatter**: YAML block with `applyTo` patterns
2. **Purpose**: Brief description of the area
3. **Non-negotiables**: Critical requirements that must be followed
4. **Do / Don't**: Best practices and anti-patterns
5. **Acceptance criteria**: What to verify before submitting PRs
6. **Commands**: Relevant build/test/lint commands
7. **References**: Links to documentation and resources

## Updating Instructions

When modifying these instructions:

1. Keep them focused on the specific area's concerns
2. Ensure `applyTo` patterns are accurate and don't overlap unnecessarily
3. Include concrete examples and actionable guidance
4. Add relevant documentation links
5. Test that the instructions don't conflict with repository-level instructions in `../.github/copilot-instructions.md`

## Repository-Level Instructions

For general repository instructions that apply to all code changes, see:
- `../.github/copilot-instructions.md` - Main repository instructions

The area-specific instructions in this directory complement (not replace) the repository-level instructions.

## References

- [Best practices for Copilot coding agent in your repository](https://gh.io/copilot-coding-agent-tips)
- [GitHub Copilot documentation](https://docs.github.com/en/copilot)

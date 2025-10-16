# LGB Fixtures and Visual Goldens

This directory contains test fixtures for LGB (Learn Git Branching) mode visual testing.

## Structure

```
fixtures/lgb/
├── intro.json          # Introductory Git scenario (commit → branch → merge)
├── rebase.json         # Rebase scenario (feature branch onto main)
├── goldens/            # Visual golden SVG snapshots
│   ├── .gitkeep
│   ├── *.svg          # SVG snapshots at each operation step
│   ├── *.png          # Screenshots for visual verification
│   └── *.json         # Metadata files
└── README.md          # This file
```

## Fixtures

### intro.json

**Description:** Introductory Git scenario demonstrating basic operations

**Operations:**
1. Initial state with commit C1 on main
2. Create commit C2 on main
3. Create feature branch at C2
4. Checkout feature branch
5. Create commit C3 on feature
6. Checkout main
7. Create commit C4 on main
8. Merge feature into main (creates C5)

**Expected visual:**
- Linear commits C1, C2 on main
- Branch divergence at C2 (feature branch)
- Commit C3 on feature lane
- Commit C4 on main lane
- Merge commit C5 with two parents (C4, C3)

### rebase.json

**Description:** Rebase scenario with dashed copy arcs

**Initial state:**
- C1 (root)
- C2 on main (from C1)
- C3, C4 on feature (from C1)

**Operations:**
1. Rebase feature onto main (C3, C4 → C3', C4')
2. Cherry-pick C3 onto main (creates C5)

**Expected visual:**
- Dashed arcs showing rebase copies
- Original commits C3, C4 dimmed
- New commits C3', C4' on main base
- Single dashed arc for cherry-pick

## Visual Goldens

Visual goldens are SVG snapshots captured at specific points during Git operation animations. They serve as regression tests to detect unintended visual changes.

### Recording Goldens

```bash
# Record all goldens
RECORD_GOLDENS=true pnpm test:goldens

# This captures:
# - Initial state SVG
# - SVG after each operation
# - Screenshots (.png) for manual review
```

### Golden Files

Each scene has multiple frames:

**intro scene:**
- `intro-initial.svg` - Initial state with C1
- `intro-after-commit.svg` - After C2 created
- `intro-after-branch.svg` - After feature branch created
- `intro-final.svg` - After merge complete

**rebase scene:**
- `rebase-initial.svg` - Diverged branches
- `rebase-during-rebase.svg` - Dashed arcs visible
- `rebase-final.svg` - Rebased commits in place
- `rebase-cherry-pick.svg` - After cherry-pick

### Comparison Tolerance

SVG comparison uses tolerant diff to handle minor rendering variations:

- **Position tolerance:** 0.5px (sub-pixel differences ignored)
- **Opacity tolerance:** 0.01 (1% opacity differences ignored)
- **Transform tolerance:** 0.5px
- **Ignored attributes:** `data-testid`, `id`, `aria-describedby`

### Updating Goldens

When making intentional visual changes:

1. Re-record goldens: `RECORD_GOLDENS=true pnpm test:goldens`
2. Review changes: `git diff fixtures/lgb/goldens/`
3. Verify screenshots match expectations
4. Commit updated goldens with descriptive message

## LGB Geometry Verification

The golden tests verify LGB-style layout:

**Grid layout:**
- **Rows = Generations:** Commits at same topological level share y-coordinate
- **Columns = Branch lanes:** Commits on same branch share x-coordinate column

**Labels:**
- Branch tags inline at commit tip
- HEAD arrow clearly visible
- Detached HEAD shows tag above node

**Edges:**
- Merge: two-parent links
- Rebase: dashed "copy" arcs
- Cherry-pick: single dashed arc

**Animation:**
- Motion windows: 120–480ms
- Input locked during scenes
- Reduced-motion: ≤80ms

## CI Integration

The `lgb-parity.yml` workflow:

1. **Git Parity:** Verifies Git operations match CLI behavior
2. **Visual Goldens:** Compares SVG against committed goldens
3. **Accessibility:** Runs axe-core scan (0 critical violations required)

**Artifacts uploaded:**
- SVG goldens
- Screenshots
- Parity JSON reports
- A11y scan results

## References

- [TESTING.md](/docs/TESTING.md) - Full testing strategy
- [LGB_MODE.md](/docs/LGB_MODE.md) - LGB mode documentation
- [scripts/visual-goldens.ts](/scripts/visual-goldens.ts) - Golden utilities
- [scripts/git-parity.ts](/scripts/git-parity.ts) - Parity harness

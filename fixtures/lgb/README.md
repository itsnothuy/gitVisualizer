# LGB Test Fixtures and Visual Regression Testing

Technical documentation for Learn Git Branching (LGB) mode testing infrastructure.

## Overview

This directory contains test fixtures and visual golden files for LGB scenarios. For user-facing LGB documentation, see the main [README.md](../../README.md#-learn-git-branching-mode).

## Structure

```
fixtures/lgb/
├── intro.json          # Basic Git operations scenario
├── rebase.json         # Rebase and cherry-pick scenario
├── goldens/            # Visual regression test files
│   ├── *.svg          # SVG snapshots at operation steps
│   ├── *.png          # Screenshots for manual verification
│   └── *.json         # Test metadata
└── README.md          # Technical testing documentation
```

## Test Scenarios

### intro.json - Git Basics
**Teaching Goals**: Commits, branching, merging
**Operations**: C1 → C2 → branch feature → C3 on feature → C4 on main → merge
**Visual Verification**: Linear progression, branch divergence, merge commit with two parents

### rebase.json - Advanced Workflows  
**Teaching Goals**: Rebase vs merge, cherry-pick operations
**Operations**: Diverged branches → rebase feature onto main → cherry-pick commit
**Visual Verification**: Dashed copy arcs, dimmed original commits, new commit positions

## Visual Golden Testing

### Recording Process
```bash
# Record new golden files
RECORD_GOLDENS=true pnpm test:goldens

# Review changes
git diff fixtures/lgb/goldens/
```

### Comparison Tolerances
- **Position**: 0.5px (sub-pixel rendering differences)
- **Opacity**: 0.01 (1% opacity variations)
- **Transforms**: 0.5px translation tolerance
- **Ignored**: `data-testid`, `id`, `aria-describedby` attributes

### CI Integration
The `lgb-parity.yml` workflow verifies:
1. **Git Operation Correctness**: Commands match CLI Git behavior
2. **Visual Consistency**: SVG output matches committed goldens  
3. **Accessibility**: Zero critical axe-core violations
4. **Performance**: Layout times within target thresholds

## Animation Verification

### Timing Constraints
- **Motion windows**: 120-480ms per operation
- **Input locking**: During active animations
- **Reduced motion**: ≤80ms when `prefers-reduced-motion`

### Accessibility Testing
- **Focus management**: Tab order preserved during animations
- **Screen reader**: Status announcements for state changes
- **Keyboard users**: No interaction loss during transitions

## Development Workflow

### Adding New Scenarios
1. Create fixture JSON with Git operations sequence
2. Add expected visual states to golden recorder
3. Update test suite to include new scenario
4. Document educational goals and target concepts

### Updating Goldens
When making intentional visual changes:
1. Re-record: `RECORD_GOLDENS=true pnpm test:goldens`
2. Review diffs: Compare new vs old SVG files
3. Verify screenshots match expectations
4. Commit with descriptive message explaining visual changes

For complete testing documentation, see [docs/TESTING.md](../../docs/TESTING.md).

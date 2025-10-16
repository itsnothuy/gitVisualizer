# LGB Visual Goldens and Git Parity Harness - Usage Guide

## Overview

This implementation provides two complementary testing systems for Git Visualizer:

1. **Visual Goldens** - SVG snapshot regression testing for LGB-style visualizations
2. **Git Parity Harness** - Differential testing against git CLI to verify correctness

## Visual Goldens System

### Purpose

Visual goldens capture SVG snapshots at key points during Git operation animations to detect unintended visual regressions.

### Recording Goldens

```bash
# Start the dev server
pnpm dev

# In another terminal, record goldens
RECORD_GOLDENS=true pnpm test:goldens
```

This will:
1. Navigate to `/fixture?fixture=intro` and `/fixture?fixture=rebase`
2. Capture SVG content at each operation step
3. Save SVG files to `fixtures/lgb/goldens/`
4. Save PNG screenshots for visual verification

### Running Golden Tests

```bash
# Run golden comparison tests
pnpm exec playwright test e2e/lgb-goldens.spec.ts

# Run with UI mode for debugging
pnpm exec playwright test e2e/lgb-goldens.spec.ts --ui
```

### Viewing Fixtures

The fixture page allows you to visualize the LGB fixtures:

- **Intro fixture:** http://localhost:3000/fixture?fixture=intro
- **Rebase fixture:** http://localhost:3000/fixture?fixture=rebase

### Golden Structure

Goldens are stored in `fixtures/lgb/goldens/`:

```
fixtures/lgb/goldens/
├── .gitkeep                  # Tracked in git
├── intro-initial.svg         # Generated (gitignored)
├── intro-initial.png         # Generated (gitignored)
├── rebase-initial.svg        # Generated (gitignored)
├── rebase-initial.png        # Generated (gitignored)
└── demo-*.svg/png           # Generated (gitignored)
```

**Note:** Generated golden files are gitignored by default. Only commit them when establishing new baselines.

### Comparison Tolerance

The visual golden system uses tolerant comparison to handle minor rendering variations:

```typescript
{
  positionTolerance: 0.5,      // 0.5px sub-pixel differences ignored
  opacityTolerance: 0.01,      // 1% opacity differences ignored
  transformTolerance: 0.5,     // 0.5px transform differences ignored
  ignoreAttributes: [          // Attributes excluded from comparison
    'data-testid',
    'id',
    'aria-describedby'
  ]
}
```

### Updating Goldens

When making intentional visual changes:

```bash
# 1. Re-record goldens
RECORD_GOLDENS=true pnpm test:goldens

# 2. Review changes
git diff fixtures/lgb/goldens/

# 3. Verify screenshots visually
open fixtures/lgb/goldens/*.png

# 4. If changes are correct, commit new goldens
git add fixtures/lgb/goldens/
git commit -m "Update visual goldens for [reason]"
```

## Git Parity Harness

### Purpose

The Git parity harness verifies that our Git model implementations match the behavior of the actual Git CLI.

### Running Parity Tests

```bash
# Test current repository
pnpm test:parity .

# Test a specific repository
pnpm test:parity /path/to/repo

# Output JSON report
pnpm test:parity . --json

# Save JSON report to file
pnpm test:parity . --json > parity-report.json
```

### Parity Test Coverage

The harness tests:

1. **merge-base** - Verify merge-base algorithm matches `git merge-base A B`
2. **first-parent walk** - Verify first-parent history matches `git log --first-parent`
3. **branch --contains** - Verify branch containment logic matches `git branch --contains <sha>`
4. **commit parents** - Verify parent relationships match `git log --format="%H %P"`

### Example Output

```
Running Git parity tests on: /path/to/repo

✓ merge-base: PASS
✓ first-parent-walk: PASS
✓ branch-contains: PASS
✓ commit-parents: PASS

Results: 4/4 tests passed

--- JSON Report ---
{
  "repoPath": "/path/to/repo",
  "timestamp": "2025-10-16T16:00:00.000Z",
  "results": [...],
  "totalTests": 4,
  "passed": 4,
  "failed": 0
}
```

### Adding New Parity Tests

To add a new parity test in `scripts/git-parity.ts`:

```typescript
async function testMyGitOperation(repoPath: string): Promise<ParityResult> {
  try {
    // Execute git CLI command
    const gitResult = await gitExec(repoPath, ['my-git-command', 'args']);
    
    // TODO: Compare with our model implementation
    const modelResult = await myModelImplementation(repoPath);
    
    const match = gitResult === modelResult;
    
    return {
      test: 'my-git-operation',
      passed: match,
      expected: gitResult,
      actual: modelResult,
    };
  } catch (error) {
    return {
      test: 'my-git-operation',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Add to test suite in runParityTests()
const tests = [
  testMergeBase,
  testFirstParentWalk,
  testBranchContains,
  testCommitParents,
  testMyGitOperation,  // Add here
];
```

## CI Integration

The `lgb-parity.yml` workflow runs automatically on:
- Pull requests to `main`
- Pushes to `main` or `test/lgb-parity-scenes`

### Jobs

1. **git-parity**
   - Runs Git CLI parity tests
   - Uploads JSON diff report as artifact

2. **visual-goldens**
   - Builds the application
   - Runs visual golden tests
   - Uploads SVG goldens and screenshots as artifacts
   - Uploads Playwright test report

3. **accessibility-check**
   - Runs axe-core accessibility scan
   - Ensures 0 critical violations
   - Uploads a11y results as artifact

### Artifacts

All CI runs upload the following artifacts (30-day retention):

- `git-parity-report` - JSON diff of parity test results
- `lgb-svg-goldens` - SVG golden files
- `lgb-screenshots` - PNG screenshots
- `lgb-goldens-report` - Playwright test report
- `lgb-a11y-results` - Accessibility scan results

### Viewing CI Artifacts

1. Go to the PR or commit in GitHub
2. Click on the "Checks" tab
3. Find the "LGB Parity Tests" workflow
4. Click on a job to see its output
5. Scroll to the bottom to download artifacts

## LGB Accuracy Requirements

The tests verify these LGB-style requirements:

### Geometry
- ✅ Rows represent generations (commits at same level have same y-coordinate)
- ✅ Columns represent branch lanes (commits on same branch share x-coordinate column)
- ✅ Layered layout via ELK.js Sugiyama algorithm

### Labels
- ✅ Branch tags inline at commit tip
- ✅ HEAD arrow clearly visible
- ✅ Detached HEAD shows tag above node

### Edges
- ✅ Merge commits show two-parent links
- ✅ Rebase shows dashed "copy" arcs
- ✅ Cherry-pick shows single dashed copy arc

### Motion
- ✅ Animation windows: 120–480ms
- ✅ Input locked during scenes
- ✅ Reduced-motion collapses to ≤80ms

### Accessibility
- ✅ `aria-live` announces each operation
- ✅ Axe-core reports 0 critical violations
- ✅ Keyboard navigation functional during animations

## Troubleshooting

### Golden comparison fails with position differences

**Issue:** Visual golden test fails due to position mismatches.

**Solution:**
1. Check if tolerance needs adjustment in `DEFAULT_TOLERANCE`
2. Verify ELK layout is deterministic (same inputs → same output)
3. Re-record goldens if intentional change was made

### Parity test fails

**Issue:** Git parity test shows mismatch with CLI.

**Solution:**
1. Check Git CLI version: `git --version` (requires Git 2.30+)
2. Verify repository state matches test expectations
3. Compare JSON diff in CI artifacts to identify discrepancy
4. Update model implementation if CLI is correct

### Build fails with fixture import error

**Issue:** Build fails to import fixture JSON files.

**Solution:**
1. Ensure fixtures exist at `fixtures/lgb/intro.json` and `fixtures/lgb/rebase.json`
2. Check TypeScript config allows JSON imports
3. Verify fixture format matches expected schema

### Visual golden test times out

**Issue:** Playwright test times out waiting for SVG.

**Solution:**
1. Increase timeout in test: `{ timeout: 10000 }`
2. Check dev server is running: `pnpm dev`
3. Verify fixture page renders correctly: visit `/fixture?fixture=intro`

## References

- [TESTING.md](/docs/TESTING.md) - Full testing strategy
- [LGB_MODE.md](/docs/LGB_MODE.md) - LGB mode documentation
- [fixtures/lgb/README.md](/fixtures/lgb/README.md) - Fixtures documentation
- [scripts/visual-goldens.ts](/scripts/visual-goldens.ts) - Golden utilities
- [scripts/git-parity.ts](/scripts/git-parity.ts) - Parity harness

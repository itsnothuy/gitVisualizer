# Git Visualizer Testing Strategy

## Overview

Git Visualizer follows a comprehensive testing approach that ensures correctness, accessibility, performance, and privacy compliance. Our testing strategy prioritizes automated verification while incorporating manual testing for accessibility and user experience validation.

## Testing Principles

### Quality Gates
- **Unit Tests**: >80% code coverage for business logic
- **Integration Tests**: All API integrations and Git operations
- **E2E Tests**: Complete user workflows and accessibility compliance
- **Performance Tests**: Layout and rendering benchmarks
- **Security Tests**: Privacy and data handling verification

### Accessibility First
- **Automated A11y**: axe-core integration in all test suites
- **Manual Testing**: Screen reader testing for complex interactions
- **Keyboard Navigation**: Complete keyboard-only workflow testing
- **Visual Testing**: High contrast and zoom level validation

### Privacy Validation
- **Data Isolation**: Verify no data leaves the device without consent
- **Permission Testing**: File System Access API permission flows
- **Token Handling**: Ensure OAuth tokens are never persisted

## Test Architecture

```
tests/
├── unit/                     # Unit tests (Vitest)
│   ├── lib/
│   │   ├── git/             # Git parsing and operations
│   │   ├── viz/             # Layout and rendering logic
│   │   └── overlays/        # Overlay API integrations
│   ├── components/          # React component tests
│   └── utils/               # Utility function tests
├── integration/             # Integration tests (Vitest + @testing-library)
│   ├── git-operations/      # Full Git workflow tests
│   ├── layout-engine/       # ELK.js integration tests
│   └── overlay-system/      # External API integration tests
├── e2e/                     # End-to-end tests (Playwright)
│   ├── accessibility/       # A11y compliance tests
│   ├── performance/         # Performance benchmark tests
│   ├── privacy/             # Data handling and privacy tests
│   └── workflows/           # Complete user journey tests
├── fixtures/                # Test data and mock repositories
│   ├── repositories/        # Sample Git repositories
│   ├── api-responses/       # Mock API responses
│   └── layouts/             # Expected layout results
└── helpers/                 # Test utilities and helpers
    ├── git-mocks/           # Git operation mocks
    ├── a11y-helpers/        # Accessibility testing utilities
    └── performance/         # Performance measurement tools
```

## Unit Testing Strategy

### Framework: Vitest + @testing-library/react

#### Git Operations (`src/lib/git/`)

```typescript
// Example: local.test.ts
describe('Local Git Operations', () => {
  it('should parse commit history correctly', async () => {
    const mockRepo = await createMockRepository();
    const commits = await parseCommitHistory(mockRepo);
    
    expect(commits).toHaveLength(5);
    expect(commits[0]).toMatchObject({
      id: expect.stringMatching(/^[0-9a-f]{40}$/),
      title: 'Initial commit',
      parents: [],
    });
  });

  it('should handle merge commits', async () => {
    const mockRepo = await createMockRepositoryWithMerges();
    const commits = await parseCommitHistory(mockRepo);
    const mergeCommit = commits.find(c => c.parents.length > 1);
    
    expect(mergeCommit).toBeDefined();
    expect(mergeCommit.parents).toHaveLength(2);
  });

  it('should respect shallow clone depth', async () => {
    const mockRepo = await createMockRepository({ depth: 3 });
    const commits = await parseCommitHistory(mockRepo);
    
    expect(commits).toHaveLength(3);
  });
});
```

#### Layout Engine (`src/viz/elk/`)

```typescript
// Example: layout.test.ts
describe('ELK Layout Engine', () => {
  it('should position nodes without overlap', async () => {
    const graph = createLinearGraph(10);
    const layout = await elkLayout(graph.nodes, graph.edges);
    
    // Verify no node overlaps
    const positions = layout.children.map(node => ({
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    }));
    
    expect(hasOverlaps(positions)).toBe(false);
  });

  it('should handle complex branching', async () => {
    const graph = createBranchingGraph();
    const layout = await elkLayout(graph.nodes, graph.edges);
    
    expect(layout.children).toHaveLength(graph.nodes.length);
    expect(layout.edges).toHaveLength(graph.edges.length);
  });

  it('should maintain consistent layout with same input', async () => {
    const graph = createRandomGraph();
    const layout1 = await elkLayout(graph.nodes, graph.edges);
    const layout2 = await elkLayout(graph.nodes, graph.edges);
    
    expect(layout1).toEqual(layout2);
  });
});
```

#### React Components (`src/components/`)

```typescript
// Example: Graph.test.tsx
describe('GraphSVG Component', () => {
  it('should render nodes and edges correctly', () => {
    const mockData = createMockGraphData();
    render(<GraphSVG {...mockData} />);
    
    expect(screen.getAllByRole('graphics-symbol')).toHaveLength(mockData.nodes.length);
    expect(screen.getByRole('graphics-document')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    const mockData = createMockGraphData();
    render(<GraphSVG {...mockData} />);
    
    const firstNode = screen.getAllByRole('graphics-symbol')[0];
    await user.tab();
    expect(firstNode).toHaveFocus();
    
    await user.keyboard('{ArrowRight}');
    expect(screen.getAllByRole('graphics-symbol')[1]).toHaveFocus();
  });

  it('should provide accessible labels', () => {
    const mockData = createMockGraphData();
    render(<GraphSVG {...mockData} />);
    
    const nodes = screen.getAllByRole('graphics-symbol');
    nodes.forEach(node => {
      expect(node).toHaveAttribute('aria-label');
    });
  });
});
```

### Coverage Requirements

- **Business Logic**: 90% line coverage
- **Components**: 85% line coverage with accessibility scenarios
- **Utilities**: 95% line coverage
- **Error Handling**: 100% coverage of error paths

## Integration Testing Strategy

### Git Operations Integration

```typescript
// Example: git-integration.test.ts
describe('Git Integration Workflows', () => {
  it('should complete full local repository workflow', async () => {
    // Mock File System Access API
    const mockDirectoryHandle = createMockDirectoryHandle();
    
    // Test complete workflow
    const repo = await openLocalRepository(mockDirectoryHandle);
    expect(repo.name).toBe('test-repository');
    
    const graph = await buildCommitGraph(repo);
    expect(graph.nodes.length).toBeGreaterThan(0);
    
    const layout = await computeLayout(graph);
    expect(layout.bounds.width).toBeGreaterThan(0);
  });

  it('should handle repository validation errors gracefully', async () => {
    const invalidHandle = createInvalidDirectoryHandle();
    
    await expect(openLocalRepository(invalidHandle))
      .rejects.toThrow('Invalid repository');
  });
});
```

### Overlay System Integration

```typescript
// Example: overlay-integration.test.ts
describe('GitHub Overlay Integration', () => {
  beforeEach(() => {
    // Mock fetch for GitHub API
    fetchMock.resetMocks();
  });

  it('should fetch PR information for commits', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      data: {
        repository: {
          // Mock GraphQL response
        }
      }
    }));

    const commits = ['abc123', 'def456'];
    const prInfo = await getPullRequestsForCommits('owner', 'repo', commits);
    
    expect(prInfo.size).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Bearer')
        })
      })
    );
  });

  it('should handle rate limiting gracefully', async () => {
    fetchMock.mockRejectOnce(new Error('Rate limited'));
    
    const commits = ['abc123'];
    await expect(getPullRequestsForCommits('owner', 'repo', commits))
      .rejects.toThrow('Rate limited');
    
    // Verify exponential backoff is triggered
    expect(mockRateLimitHandler).toHaveBeenCalled();
  });
});
```

## End-to-End Testing Strategy

### Framework: Playwright

#### Complete User Workflows

```typescript
// Example: e2e/workflows/local-repository.spec.ts
test.describe('Local Repository Workflow', () => {
  test('should open and visualize local repository', async ({ page }) => {
    await page.goto('/');
    
    // Mock File System Access API
    await page.addInitScript(() => {
      window.showDirectoryPicker = async () => mockDirectoryHandle;
    });
    
    // Click open repository button
    await page.click('[data-testid="open-repository"]');
    
    // Verify repository loaded
    await expect(page.locator('[data-testid="graph-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="commit-node"]')).toHaveCount(5);
    
    // Test graph interactions
    await page.click('[data-testid="commit-node"]:first-child');
    await expect(page.locator('[data-testid="commit-details"]')).toBeVisible();
  });

  test('should handle permission denied gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Mock permission denied
    await page.addInitScript(() => {
      window.showDirectoryPicker = async () => {
        throw new DOMException('Permission denied', 'NotAllowedError');
      };
    });
    
    await page.click('[data-testid="open-repository"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Permission denied');
  });
});
```

#### Accessibility Testing

```typescript
// Example: e2e/accessibility/keyboard-navigation.spec.ts
test.describe('Keyboard Navigation', () => {
  test('should support full keyboard navigation', async ({ page }) => {
    await page.goto('/?demo=true'); // Load demo repository
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'first-commit');
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'second-commit');
    
    // Test Enter activation
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="commit-details"]')).toBeVisible();
    
    // Test Escape to close
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="commit-details"]')).not.toBeVisible();
  });

  test('should provide screen reader accessible content', async ({ page }) => {
    await page.goto('/?demo=true');
    
    // Check for proper ARIA labels
    const graphContainer = page.locator('[role="graphics-document"]');
    await expect(graphContainer).toHaveAttribute('aria-label', 'Commit graph');
    
    // Check node accessibility
    const commitNodes = page.locator('[role="graphics-symbol"]');
    await expect(commitNodes.first()).toHaveAttribute('aria-label');
    
    // Test live region updates
    await page.click('[data-testid="commit-node"]:first-child');
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toContainText('Selected commit');
  });
});
```

### Performance Testing

```typescript
// Example: e2e/performance/rendering.spec.ts
test.describe('Performance Benchmarks', () => {
  test('should meet layout performance targets', async ({ page }) => {
    await page.goto('/?repo=large-demo'); // 1000+ commits
    
    const startTime = Date.now();
    
    // Wait for layout completion
    await page.waitForSelector('[data-testid="layout-complete"]');
    
    const layoutTime = Date.now() - startTime;
    expect(layoutTime).toBeLessThan(1500); // ≤ 1500ms target
  });

  test('should maintain 60 FPS during interactions', async ({ page }) => {
    await page.goto('/?repo=medium-demo');
    
    // Start performance monitoring
    await page.evaluate(() => {
      window.performanceFrames = [];
      let lastTime = performance.now();
      
      function measureFrame() {
        const currentTime = performance.now();
        const frameDuration = currentTime - lastTime;
        window.performanceFrames.push(frameDuration);
        lastTime = currentTime;
        requestAnimationFrame(measureFrame);
      }
      
      requestAnimationFrame(measureFrame);
    });
    
    // Perform zoom and pan operations
    await page.mouse.wheel(0, -120); // Zoom in
    await page.mouse.move(100, 100);
    await page.mouse.down();
    await page.mouse.move(200, 200); // Pan
    await page.mouse.up();
    
    // Check frame rates
    const frameDurations = await page.evaluate(() => window.performanceFrames);
    const avgFrameDuration = frameDurations.reduce((a, b) => a + b) / frameDurations.length;
    
    expect(avgFrameDuration).toBeLessThan(16.67); // 60 FPS = 16.67ms per frame
  });
});
```

### Privacy Testing

```typescript
// Example: e2e/privacy/data-handling.spec.ts
test.describe('Privacy and Data Handling', () => {
  test('should not make network requests in local-only mode', async ({ page, context }) => {
    // Monitor network requests
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    
    await page.goto('/?mode=local-only');
    await page.click('[data-testid="open-repository"]');
    
    // Filter out localhost and data URLs
    const externalRequests = requests.filter(url => 
      !url.startsWith('http://localhost') && 
      !url.startsWith('data:') &&
      !url.startsWith('blob:')
    );
    
    expect(externalRequests).toHaveLength(0);
  });

  test('should clear all data on disconnect', async ({ page }) => {
    await page.goto('/');
    
    // Load repository
    await page.click('[data-testid="open-repository"]');
    
    // Verify data exists
    const hasData = await page.evaluate(() => {
      return indexedDB.databases().then(dbs => dbs.length > 0);
    });
    expect(hasData).toBe(true);
    
    // Disconnect and purge
    await page.click('[data-testid="disconnect-repository"]');
    await page.click('[data-testid="confirm-purge"]');
    
    // Verify data cleared
    const hasDataAfter = await page.evaluate(() => {
      return indexedDB.databases().then(dbs => dbs.length === 0);
    });
    expect(hasDataAfter).toBe(true);
  });
});
```

## Accessibility Testing

### Automated Testing

```typescript
// jest-axe integration
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Compliance', () => {
  it('should have no axe violations on main page', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no axe violations on graph visualization', async () => {
    const mockData = createMockGraphData();
    const { container } = render(<GraphSVG {...mockData} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing Checklist

#### Screen Reader Testing
- [ ] JAWS (Windows)
- [ ] NVDA (Windows)
- [ ] VoiceOver (macOS)
- [ ] Orca (Linux)

#### Testing Scenarios
- [ ] Navigate graph using only keyboard
- [ ] Screen reader announces graph structure
- [ ] Focus indicators visible at all zoom levels
- [ ] Color-blind accessible status indicators
- [ ] High contrast mode compatibility
- [ ] 200% zoom level usability

## Performance Testing

### Metrics and Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Layout | ≤ 1500ms | Time from data load to positioned graph |
| Pan/Zoom FPS | ≥ 60 FPS | Frame duration during interactions |
| Memory Usage | ≤ 100MB | Heap size for 1000-node graph |
| Bundle Size | ≤ 500KB | Gzipped main bundle |

### Load Testing

```typescript
// Example: performance/load-testing.ts
describe('Load Testing', () => {
  const testSizes = [10, 100, 1000, 5000, 10000];

  testSizes.forEach(size => {
    it(`should handle ${size} nodes efficiently`, async () => {
      const graph = generateRandomGraph(size);
      
      const startTime = performance.now();
      const layout = await elkLayout(graph.nodes, graph.edges);
      const layoutTime = performance.now() - startTime;
      
      // Scale targets by graph size
      const expectedTime = Math.min(size * 0.5, 5000); // Max 5s for any size
      expect(layoutTime).toBeLessThan(expectedTime);
      
      // Memory usage check
      const memUsage = performance.memory?.usedJSHeapSize || 0;
      const expectedMem = size * 1000; // ~1KB per node
      expect(memUsage).toBeLessThan(expectedMem);
    });
  });
});
```

## Test Data and Fixtures

### Repository Fixtures

```typescript
// fixtures/repositories/index.ts
export const repositories = {
  linear: {
    commits: 10,
    branches: 1,
    description: 'Simple linear history'
  },
  branching: {
    commits: 50,
    branches: 5,
    merges: 3,
    description: 'Complex branching with merges'
  },
  large: {
    commits: 5000,
    branches: 20,
    merges: 100,
    description: 'Large repository for performance testing'
  }
};

export function createMockRepository(config: RepositoryConfig) {
  // Generate mock Git repository data
}
```

### API Response Mocks

```typescript
// fixtures/api-responses/github.ts
export const mockGitHubResponses = {
  pullRequests: {
    data: {
      repository: {
        // GraphQL response structure
      }
    }
  },
  rateLimit: {
    remaining: 5000,
    limit: 5000,
    resetTime: Date.now() + 3600000
  }
};
```

## Continuous Integration

### Quality Gates Workflow

The `quality.yml` workflow provides comprehensive quality gates that must pass before PRs can be merged:

#### Jobs

1. **Lint** - Code quality and style
   - ESLint checks with jsx-a11y rules
   - TypeScript type checking
   - Blocks PR on failures

2. **Test** - Unit and integration tests
   - Vitest test suite execution
   - Coverage report generation
   - Uploads coverage artifacts

3. **Build** - Production build verification
   - Next.js production build
   - Uploads build artifacts for downstream jobs
   - Validates bundling and static generation

4. **Lighthouse CI** - Performance and quality metrics
   - Runs Lighthouse audits on key pages (/, /demo)
   - Enforces budget thresholds:
     - Performance: ≥90 (warn)
     - Accessibility: ≥95 (error)
     - Best Practices: ≥90 (warn)
     - SEO: ≥90 (warn)
   - Performance budgets:
     - First Contentful Paint: ≤2000ms
     - Largest Contentful Paint: ≤2500ms
     - Cumulative Layout Shift: ≤0.1
     - Total Blocking Time: ≤300ms
   - Uploads Lighthouse reports as artifacts

5. **Accessibility** - WCAG 2.2 AA compliance
   - Runs Playwright tests with @axe-core/playwright
   - Tests critical violations (must be zero)
   - Tests serious violations (must be zero)
   - Validates keyboard navigation
   - Checks color contrast compliance
   - Verifies ARIA attributes
   - Uploads test reports and traces on failure

#### Running Locally

```bash
# Run individual quality gates
pnpm lint
pnpm typecheck
pnpm test --run
pnpm build

# Run Lighthouse CI (requires built app)
pnpm build
pnpm start &  # Start server in background
pnpm lighthouse

# Run accessibility tests
pnpm exec playwright test e2e/accessibility/
```

#### Lighthouse Configuration

The `lighthouserc.json` file defines:
- URLs to audit
- Budget thresholds
- Assertion rules
- Upload targets

See the [Lighthouse CI documentation](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md) for more details.

### CI Workflow (Legacy)

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install
      - run: pnpm test:e2e

  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:a11y
```

## Test Commands

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:a11y": "playwright test tests/e2e/accessibility",
    "test:performance": "playwright test tests/e2e/performance",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui"
  }
}
```

## Quality Assurance Process

### Pre-commit Hooks

```typescript
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint
pnpm test:unit --run
pnpm test:a11y --grep="smoke"
```

### Pull Request Requirements

1. **All tests pass**: Unit, integration, and E2E
2. **Coverage maintained**: No decrease in overall coverage
3. **Accessibility verified**: Automated axe checks pass
4. **Performance checked**: No regression in key metrics
5. **Manual testing**: Complex features tested manually

### Release Testing

Before each release:
1. Full test suite execution on multiple browsers
2. Manual accessibility testing with screen readers
3. Performance regression testing
4. Privacy and security verification
5. Cross-platform compatibility check

## Testing Tools and Configuration

### Tool Versions

- **Vitest**: ^3.2.4 (Unit and integration testing)
- **Playwright**: ^1.56.0 (E2E testing)
- **@testing-library/react**: ^16.3.0 (Component testing)
- **@testing-library/jest-dom**: ^6.9.1 (DOM matchers)
- **jest-axe**: Latest (Accessibility testing)

### Configuration Files

- `vitest.config.ts`: Unit and integration test configuration
- `playwright.config.ts`: E2E test configuration
- `tests/setup.ts`: Global test setup and mocks
- `tests/helpers/`: Shared test utilities

This comprehensive testing strategy ensures that Git Visualizer meets its quality, accessibility, and performance goals while maintaining the privacy-first principles that guide the project.

## Visual Goldens & Parity Testing

### Overview

Git Visualizer uses visual golden testing and Git CLI parity verification to ensure correctness and visual consistency of LGB-style animations and Git operations.

### Visual Golden System

Visual goldens are SVG snapshots captured at key points during Git operation animations. They serve as regression tests to detect unintended visual changes.

#### Recording Goldens

To record new golden SVG snapshots:

```bash
# Record goldens for all LGB scenes
RECORD_GOLDENS=true pnpm test:goldens

# This will:
# 1. Start the dev server with LGB mode
# 2. Load each fixture (intro.json, rebase.json)
# 3. Capture SVG at each operation step
# 4. Save to fixtures/lgb/goldens/
```

#### Golden Structure

Goldens are stored in `fixtures/lgb/goldens/`:

```
fixtures/lgb/goldens/
├── intro-initial.svg           # Initial state
├── intro-after-commit.svg      # After first commit
├── intro-after-branch.svg      # After branch creation
├── intro-final.svg             # After merge
├── rebase-initial.svg          # Rebase fixture initial state
├── rebase-during-rebase.svg    # During rebase animation
├── rebase-final.svg            # After rebase complete
├── rebase-cherry-pick.svg      # After cherry-pick
└── *.json                      # Metadata files
```

#### Comparing Against Goldens

The visual golden system supports tolerant comparison:

```typescript
import { compareAgainstGolden, DEFAULT_TOLERANCE } from '@/scripts/visual-goldens';

const result = await compareAgainstGolden(
  'intro',
  actualFrames,
  DEFAULT_TOLERANCE
);

if (!result.passed) {
  console.error('Visual regression detected!');
  result.results.forEach(r => {
    if (!r.match) {
      console.error(`Frame ${r.frameId}:`, r.diffs);
    }
  });
}
```

**Tolerance settings:**
- Position tolerance: 0.5px (sub-pixel differences ignored)
- Opacity tolerance: 0.01 (1% opacity differences ignored)
- Transform tolerance: 0.5px
- Ignored attributes: `data-testid`, `id`, `aria-describedby`

#### Updating Goldens

When intentional changes are made to the visualization:

```bash
# Re-record all goldens
RECORD_GOLDENS=true pnpm test:goldens

# Review changes
git diff fixtures/lgb/goldens/

# Commit updated goldens
git add fixtures/lgb/goldens/
git commit -m "Update visual goldens for [reason]"
```

### Git Parity Harness

The Git parity harness verifies that our Git model implementations match the behavior of the actual Git CLI.

#### Running Parity Tests

```bash
# Run parity tests on current repository
pnpm test:parity .

# Run on a specific repository
pnpm test:parity /path/to/repo

# Output JSON report
pnpm test:parity . --json
```

#### Parity Test Coverage

The harness tests the following Git operations:

1. **merge-base**: Verify our merge-base algorithm matches `git merge-base A B`
2. **first-parent walk**: Verify our first-parent history matches `git log --first-parent`
3. **branch --contains**: Verify branch containment logic matches `git branch --contains <sha>`
4. **commit parents**: Verify parent relationships match `git log --format="%H %P"`

#### Adding New Parity Tests

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

#### CI Integration

The LGB parity workflow runs on every PR and push:

**Jobs:**
1. `git-parity`: Runs Git CLI parity tests, uploads JSON diff report
2. `visual-goldens`: Captures and compares SVG goldens, uploads screenshots
3. `accessibility-check`: Runs axe-core on LGB mode, ensures 0 critical violations

**Artifacts uploaded:**
- `git-parity-report`: JSON diff of parity test results
- `lgb-svg-goldens`: SVG golden files
- `lgb-screenshots`: PNG screenshots for visual verification
- `lgb-goldens-report`: Playwright test report
- `lgb-a11y-results`: Accessibility scan results

#### LGB Accuracy Requirements

Visual goldens and geometry tests verify:

**Geometry:**
- Rows represent generations (commits at same level have same y-coordinate)
- Columns represent branch lanes (commits on same branch share x-coordinate column)
- Layered layout via ELK.js Sugiyama algorithm

**Labels:**
- Branch tags inline at commit tip
- HEAD arrow clearly visible
- Detached HEAD shows tag above node

**Edges:**
- Merge commits show two-parent links
- Rebase shows dashed "copy" arcs
- Cherry-pick shows single dashed copy arc

**Motion:**
- Animation windows: 120–480ms
- Input locked during scenes
- Reduced-motion collapses to ≤80ms

**Accessibility:**
- `aria-live` announces each operation
- Axe-core reports 0 critical violations
- Keyboard navigation functional during animations

### Test Commands

```bash
# Visual goldens
pnpm test:goldens              # Record new goldens
pnpm exec playwright test e2e/lgb-goldens.spec.ts  # Run golden tests

# Git parity
pnpm test:parity .             # Run parity tests
pnpm test:parity . --json      # Output JSON report

# Combined CI workflow
# Runs automatically on PR/push to main or test/lgb-parity-scenes branch
```

### Troubleshooting

**Golden comparison fails with position differences:**
- Check if tolerance needs adjustment in `DEFAULT_TOLERANCE`
- Verify ELK layout is deterministic (same inputs → same output)
- Re-record goldens if intentional change was made

**Parity test fails:**
- Check Git CLI version: `git --version` (requires Git 2.30+)
- Verify repository state matches test expectations
- Compare JSON diff in CI artifacts to identify discrepancy

**Animation timing differences:**
- Verify `prefers-reduced-motion` is respected
- Check that motion windows are within 120–480ms range
- Ensure input is locked during animation playback
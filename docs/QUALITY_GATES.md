# Quality Gates

This document describes the quality gates enforced by the CI pipeline to ensure code quality, performance, and accessibility standards.

## Overview

The quality gates workflow (`.github/workflows/quality.yml`) runs automatically on all pull requests and pushes to the main branch. All jobs must pass before a PR can be merged.

## Jobs

### 1. Lint
**Purpose**: Ensures code quality and consistent style

**Checks**:
- ESLint with Next.js and jsx-a11y rules
- TypeScript type checking
- Prettier formatting (via ESLint)

**Run Locally**:
```bash
pnpm lint
pnpm typecheck
```

**Failure Conditions**:
- ESLint errors
- TypeScript compilation errors
- Accessibility linting violations

---

### 2. Test
**Purpose**: Validates functionality through automated tests

**Checks**:
- Unit tests (Vitest)
- Integration tests
- Test coverage reporting

**Run Locally**:
```bash
pnpm test --run
```

**Artifacts**:
- Test coverage reports (30-day retention)

**Failure Conditions**:
- Any test failure
- Uncaught exceptions

---

### 3. Build
**Purpose**: Verifies production build succeeds

**Checks**:
- Next.js production build
- Static page generation
- Bundle optimization

**Run Locally**:
```bash
pnpm build
```

**Artifacts**:
- Build output (7-day retention)
- Used by downstream Lighthouse job

**Failure Conditions**:
- Build errors
- Missing dependencies
- Invalid configuration

---

### 4. Lighthouse CI
**Purpose**: Enforces performance, accessibility, and best practices standards

**Audits**:
- `/` (homepage)
- `/demo` (graph visualization page)

**Budget Thresholds**:

| Category | Threshold | Level |
|----------|-----------|-------|
| Performance | ≥90 | Warn |
| Accessibility | ≥95 | Error |
| Best Practices | ≥90 | Warn |
| SEO | ≥90 | Warn |

**Performance Metrics**:

| Metric | Budget | Level |
|--------|--------|-------|
| First Contentful Paint | ≤2000ms | Warn |
| Largest Contentful Paint | ≤2500ms | Warn |
| Cumulative Layout Shift | ≤0.1 | Warn |
| Total Blocking Time | ≤300ms | Warn |
| Speed Index | ≤3000ms | Warn |
| Time to Interactive | ≤3500ms | Warn |

**Run Locally**:
```bash
# 1. Build the application
pnpm build

# 2. Start production server
pnpm start

# 3. Run Lighthouse CI (in another terminal)
pnpm lighthouse
```

**Configuration**: `lighthouserc.json`

**Artifacts**:
- Lighthouse reports (HTML) (30-day retention)
- Located in `.lighthouseci/` directory

**Failure Conditions**:
- Accessibility score <95 (blocks PR)
- Performance/SEO/Best Practices score <90 (warns but doesn't block)
- Metric budgets exceeded (warns)

---

### 5. Accessibility
**Purpose**: Ensures WCAG 2.2 AA compliance through automated testing

**Tests**:
- Critical violations (must be zero)
- Serious violations (must be zero)
- Keyboard navigation
- Color contrast (WCAG AA)
- ARIA attributes validity

**Technology**:
- Playwright with @axe-core/playwright
- Tests against WCAG 2.2 AA, WCAG 2.1 AA, WCAG 2.0 AA

**Run Locally**:
```bash
# Install browsers (first time only)
pnpm exec playwright install --with-deps chromium

# Run accessibility tests
pnpm exec playwright test e2e/accessibility/
```

**Test Files**:
- `e2e/accessibility/a11y.spec.ts` - General accessibility tests
- `e2e/accessibility/graph-critical-a11y.spec.ts` - Graph-specific critical tests

**Artifacts**:
- HTML test reports (30-day retention)
- Test traces on failure (30-day retention)

**Failure Conditions**:
- Any critical accessibility violations
- Any serious accessibility violations
- Keyboard navigation issues
- ARIA validation errors
- Color contrast violations

---

## Interpreting Results

### Successful Run
All jobs show green checkmarks. PR is ready to merge (subject to code review).

### Failed Lint/TypeCheck
Review the job logs for specific errors. Common issues:
- Missing semicolons
- Unused variables
- Type mismatches
- Accessibility linting violations (e.g., missing alt text)

### Failed Tests
Review test output for failures. Check:
- Test expectations vs. actual behavior
- Mock data validity
- Async timing issues

### Failed Build
Review build logs. Common issues:
- Import errors
- Configuration problems
- Missing environment variables

### Failed Lighthouse
Download the Lighthouse report artifact to see detailed metrics:
1. Go to the failed workflow run
2. Scroll to "Artifacts" section
3. Download "lighthouse-reports"
4. Open HTML files in browser

Focus on:
- Accessibility issues (must fix)
- Performance regressions (investigate if significant)

### Failed Accessibility Tests
Download test reports and traces:
1. Go to the failed workflow run
2. Download "playwright-a11y-report" artifact
3. Open `index.html` in browser

The report shows:
- Which accessibility rule was violated
- Affected elements
- How to fix the issue

## Troubleshooting

### Lighthouse CI Fails to Connect
**Symptom**: "Error: Server did not start within timeout"

**Solution**:
- Verify `pnpm start` successfully starts the server locally
- Check port 3000 is not blocked
- Review Next.js build output for errors

### Accessibility Tests Fail Locally but Pass in CI
**Symptom**: Tests work on CI but not locally

**Solution**:
- Ensure Playwright browsers are installed: `pnpm exec playwright install --with-deps chromium`
- Update Playwright: `pnpm update @playwright/test`
- Clear browser cache: `rm -rf ~/.cache/ms-playwright`

### Lighthouse Scores Fluctuate
**Symptom**: Scores vary between runs

**Solution**:
- Lighthouse runs 3 times and uses median values
- CI environment is consistent; local environment may vary
- Focus on trends, not absolute scores
- Run `pnpm build:analyze` to check bundle size

## Updating Budgets

Budget thresholds are defined in `lighthouserc.json`. When updating:

1. **Document the reason**: Add a comment explaining why the budget changed
2. **Review impact**: Consider user experience implications
3. **Test locally**: Run Lighthouse CI locally first
4. **Monitor trends**: Track performance over time

Example:
```json
{
  "assertions": {
    "categories:accessibility": ["error", { "minScore": 0.95 }],
    // Temporarily lowered from 0.95 to 0.90 due to third-party widget
    // TODO: Re-evaluate after widget A11y improvements (Issue #123)
    "categories:accessibility": ["error", { "minScore": 0.90 }]
  }
}
```

## Best Practices

### Before Opening a PR
1. Run `pnpm lint && pnpm typecheck`
2. Run `pnpm test --run`
3. Run `pnpm build`
4. For UI changes: Run accessibility tests locally

### During Code Review
- Check quality gate results
- Review Lighthouse reports for performance impact
- Review accessibility test results
- Verify artifacts if needed

### After Merging
- Monitor production metrics
- Compare Lighthouse scores to baseline
- Address any degradation promptly

## Additional Resources

- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [Testing Documentation](./TESTING.md)

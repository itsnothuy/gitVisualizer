# End-to-End Tests

This directory contains Playwright E2E tests for Git Visualizer.

## Running Tests

```bash
# Install Playwright browsers (first time only)
pnpm exec playwright install --with-deps chromium

# Run all E2E tests
pnpm test:e2e

# Run specific test suite
pnpm test:e2e accessibility

# Run in UI mode (interactive)
pnpm exec playwright test --ui

# Run in debug mode
pnpm exec playwright test --debug
```

## Test Structure

- `accessibility/` - Accessibility compliance tests (WCAG 2.2 AA)
  - Automated axe-core scans
  - Keyboard navigation tests
  - Screen reader compatibility checks
  
- `basic-navigation.spec.ts` - Basic page navigation and functionality tests

## Writing Tests

All E2E tests should:
1. Test real user workflows
2. Include accessibility checks where applicable
3. Use semantic selectors (roles, labels) over CSS selectors
4. Be independent and isolated from each other

## CI Integration

E2E tests run automatically in GitHub Actions CI on every push and PR.

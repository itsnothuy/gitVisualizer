# Onboarding & Samples Testing Guide

This document describes how to test the onboarding wizard and sample repositories feature.

## Manual Testing Checklist

### First Visit Experience

- [ ] **Auto-show Onboarding**
  1. Clear localStorage: `localStorage.removeItem('gitVisualizer.hasSeenOnboarding')`
  2. Refresh the page
  3. Verify onboarding wizard appears automatically
  4. Verify it shows "Welcome to Git Visualizer" as title

- [ ] **Keyboard Navigation**
  1. Open onboarding wizard
  2. Press Tab to navigate through interactive elements
  3. Press Enter on "Next" button to advance steps
  4. Verify focus is visible at all times
  5. Verify you can complete wizard using only keyboard

- [ ] **Skip Tutorial**
  1. Open onboarding wizard
  2. Click "Skip Tutorial" button
  3. Verify dialog closes
  4. Verify `localStorage.getItem('gitVisualizer.hasSeenOnboarding')` returns `"true"`
  5. Verify wizard doesn't show again on next page load

- [ ] **Complete Wizard**
  1. Open onboarding wizard
  2. Click "Next" through all 3 steps
  3. On step 3, click "Get Started"
  4. Verify dialog closes
  5. Verify onboarding is marked as complete

### Onboarding Content

- [ ] **Step 1: Welcome + Browser Support**
  - Verify "Try a Sample" option is explained
  - Verify "Open Your Repository" option is explained
  - Verify browser support matrix table is visible
  - Verify table shows Chrome, Edge, Firefox, Safari
  - Verify support checkmarks/crosses are correct
  - Verify current browser is indicated

- [ ] **Step 2: Privacy & Security**
  - Verify "Privacy-First by Design" message
  - Verify all 4 privacy guarantees are listed:
    - No Data Upload
    - Read-Only Access
    - Disconnect Anytime
    - Secure by Default
  - Verify link to Security Documentation

- [ ] **Step 3: Key Features**
  - Verify 4 key features are listed:
    - Interactive Commit Graph
    - Pan & Zoom Navigation
    - Commit Details
    - Fully Accessible
  - Verify "Get Started" button is present

### Sample Repositories

- [ ] **Samples Tab Visibility**
  1. Click "Open Repository" button
  2. Verify dialog opens
  3. Verify "Try a Sample" tab is visible and first
  4. Verify tab is active by default for new users

- [ ] **Sample List Display**
  1. Navigate to "Try a Sample" tab
  2. Verify 3 samples are displayed:
     - Linear History (beginner, 4 commits, 1 branch)
     - Feature Branches (intermediate, 5 commits, 2 branches)
     - Complex Merge History (advanced, 9 commits, 3 branches, 1 tag)
  3. Verify each sample shows:
     - Name and description
     - Difficulty badge (colored)
     - Commit/branch/tag counts
     - Highlights list
     - "Load Sample" button

- [ ] **Load Sample**
  1. Click "Load Sample" on Linear History
  2. Verify loading indicator appears
  3. Verify dialog closes after load completes
  4. Verify success message appears (or repository loads)
  5. Repeat for other samples

### Browser Support Matrix

- [ ] **Standalone Matrix**
  1. Open onboarding wizard (step 1)
  2. Verify matrix table has proper headers
  3. Verify all browsers are listed with correct support indicators
  4. Verify "Your Browser" section shows detected browser
  5. Verify notes section explains each method

### Accessibility

- [ ] **WCAG 2.2 AA Compliance**
  - Run axe DevTools on onboarding dialog (all steps)
  - Verify 0 critical violations
  - Verify 0 serious violations
  - Run axe on samples panel
  - Verify all interactive elements are keyboard accessible

- [ ] **Screen Reader Testing**
  1. Enable screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)
  2. Navigate onboarding wizard with keyboard
  3. Verify all content is announced
  4. Verify progress indicators are announced
  5. Verify button states are announced

- [ ] **Keyboard Navigation**
  - Tab through all interactive elements in order
  - Verify visible focus indicators
  - Verify Escape closes dialog
  - Verify Enter activates buttons
  - Verify arrow keys work in tables (if applicable)

### Edge Cases

- [ ] **localStorage Unavailable**
  1. Block localStorage in browser (privacy mode or settings)
  2. Verify app still works
  3. Verify onboarding shows but doesn't persist state

- [ ] **Network Errors**
  1. Block `/samples/samples.json` in DevTools Network tab
  2. Open samples tab
  3. Verify error message is shown gracefully

- [ ] **Slow Network**
  1. Throttle network to Slow 3G
  2. Load a sample
  3. Verify progress indicator shows
  4. Verify loading can be cancelled (if cancel button present)

### Integration Tests

- [ ] **Sample → Demo Flow**
  1. Load a sample repository
  2. Verify graph renders correctly
  3. Interact with graph (pan, zoom, click commits)
  4. Verify all features work with loaded sample

- [ ] **Learn More Button**
  1. Complete onboarding once
  2. Refresh page (should not show onboarding)
  3. Click "Learn More" button on home page
  4. Verify onboarding reopens
  5. Verify can navigate through all steps again

## Automated Testing

### Unit Tests
Run existing unit tests:
```bash
pnpm test
```

All tests should pass without errors.

### E2E Tests (Playwright)
Due to browser installation limitations in CI environments, manual E2E testing is recommended. However, the test file `e2e/onboarding-samples.spec.ts` is provided for local testing.

To run locally:
```bash
# Install browsers (one time)
pnpm exec playwright install

# Build the app
pnpm build

# Run E2E tests
pnpm test:e2e
```

## Accessibility Audit

### Automated
```bash
# Install axe-core DevTools browser extension
# Visit http://localhost:3000
# Open DevTools → axe DevTools → Scan All
```

### Manual
- Keyboard-only navigation
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Color contrast verification
- Focus visible verification
- Reduced motion testing

## Browser Matrix Testing

Test in:
- [ ] Chrome 86+
- [ ] Edge 86+
- [ ] Firefox 90+
- [ ] Safari 15.2+

Verify for each browser:
- Onboarding shows correctly
- Samples load successfully
- Browser support matrix shows accurate information
- Recommended method is highlighted

## Performance

- [ ] **Load Time**
  - Onboarding dialog opens within 100ms
  - Sample metadata loads within 500ms
  - Sample ZIP downloads within 2s on normal connection
  - Sample decompression completes within 1s

- [ ] **Memory**
  - Monitor memory usage when loading samples
  - Verify no memory leaks after closing dialog
  - Check that old samples are garbage collected

## Reporting Issues

When reporting issues, include:
1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots/screen recordings
5. Console errors (if any)
6. Network tab (for sample loading issues)

## Success Criteria

All tests above should pass with:
- ✅ Zero critical accessibility violations
- ✅ All manual test cases passing
- ✅ Keyboard navigation working completely
- ✅ Screen reader compatibility confirmed
- ✅ Cross-browser compatibility verified
- ✅ Performance targets met

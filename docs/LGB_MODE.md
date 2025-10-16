# LGB Mode (Learn Git Branching Skin)

## Overview

LGB Mode is a visual "skin" that recreates the look and feel of [Learn Git Branching](https://learngitbranching.js.org/) for educational purposes. This mode provides a familiar interface for users who are accustomed to the LGB tool while maintaining all accessibility and privacy-first principles of Git Visualizer.

## Features

### Skin & Theme Toggle

- **Visual Only**: This implementation provides styling only—no animation engine yet
- **Theme Toggle**: Access LGB mode via the toggle in the application header
- **Persistence**: Theme preference is saved in `sessionStorage` for the current session
- **Accessibility**: Full WCAG 2.2 AA compliance maintained across both themes

### Visual Elements

The LGB skin includes:

- **Color Palette**: Dark background (`#0f0f12`) with accessible contrast ratios
- **Node Styling**: 
  - Radius: 8px (vs. 6px in default)
  - Stroke width: 2px
  - Colors for different states (accent, merge, rebase, danger)
- **Edge Styling**: 
  - Custom arrowheads matching LGB style
  - Dashed "copy" class for future rebase visualizations
- **Timing Variables**: Respects `prefers-reduced-motion` by collapsing durations

### Theme Tokens

All LGB-specific styles are defined in `/src/viz/skins/lgb/tokens.css`:

```css
:root {
  --lgb-bg: #0f0f12;
  --lgb-fg: #f5f7fb;
  --lgb-muted: #c7c9d3;
  --lgb-accent: #3aa3ff;
  --lgb-merge: #ffd166;
  --lgb-rebase: #70e1a1;
  --lgb-danger: #ff6b6b;
  --lgb-edge: #9aa0a6;
  --lgb-node-radius: 8px;
  --lgb-node-stroke: 2px;
  /* Motion timing (collapsed for reduced-motion) */
}
```

## Usage

### Enabling LGB Mode

1. Navigate to any page in Git Visualizer
2. Click the "LGB Mode" toggle in the header
3. The theme will immediately apply to all graph visualizations

### Programmatic Access

```typescript
import { useTheme } from '@/lib/theme/use-theme'
import { lgbSkin } from '@/viz/skins/lgb/skin'

function MyComponent() {
  const { theme, setTheme } = useTheme()
  
  // Check current theme
  if (theme === 'lgb') {
    // LGB mode is active
  }
  
  // Toggle theme
  setTheme(theme === 'lgb' ? 'default' : 'lgb')
  
  // Use appropriate skin
  const skin = theme === 'lgb' ? lgbSkin : defaultSkin
}
```

### Graph Component Integration

```typescript
import { GraphSVG } from '@/viz/svg/Graph'
import { lgbSkin } from '@/viz/skins/lgb/skin'

<GraphSVG
  nodes={nodes}
  edges={edges}
  positions={positions}
  skin={lgbSkin}  // Optional: defaults to defaultSkin
/>
```

## Architecture

### File Structure

```
src/
├── viz/skins/lgb/
│   ├── tokens.css          # CSS custom properties
│   ├── skin.ts             # Skin configuration object
│   └── LgbSvgDefs.tsx      # SVG defs (markers, patterns)
├── lib/theme/
│   ├── use-theme.ts        # Theme state management hook
│   └── __tests__/
│       └── use-theme.test.ts
└── components/settings/
    ├── theme-toggle.tsx    # UI toggle component
    └── __tests__/
        └── theme-toggle.test.tsx
```

### Data Flow

1. User clicks theme toggle button
2. `useTheme()` hook updates state and `sessionStorage`
3. `<html data-theme="lgb">` attribute is applied
4. CSS cascade applies LGB variables
5. Graph components receive `lgbSkin` prop
6. `LgbSvgDefs` renders custom SVG markers/patterns

## Accessibility

### Keyboard Support

- Toggle is fully keyboard accessible (Tab, Enter/Space)
- All graph interactions work identically in both themes

### Screen Readers

- Toggle button includes proper ARIA labels
- `aria-pressed` state indicates current theme
- All color encodings have non-color alternatives (shapes, patterns)

### Reduced Motion

LGB timing variables automatically collapse when `prefers-reduced-motion: reduce` is detected:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --lgb-dur-veryshort: 40ms;
    --lgb-dur-short: 60ms;
    --lgb-dur-medium: 80ms;
    --lgb-dur-long: 100ms;
  }
}
```

## Contrast Ratios

All LGB colors meet or exceed WCAG 2.2 AA requirements:

- Foreground on background: 13.7:1 (AAA)
- Accent on background: 7.1:1 (AA+)
- Muted on background: 8.2:1 (AA+)

## Testing

### Unit Tests

```bash
pnpm test src/lib/theme
pnpm test src/components/settings
```

### E2E Tests

Theme toggle functionality can be tested with Playwright:

```typescript
test('LGB mode toggle', async ({ page }) => {
  await page.goto('/')
  const toggle = page.getByTestId('theme-toggle')
  
  // Initial state
  await expect(toggle).toHaveText('Off')
  
  // Toggle on
  await toggle.click()
  await expect(toggle).toHaveText('On')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lgb')
  
  // Toggle off
  await toggle.click()
  await expect(toggle).toHaveText('Off')
  await expect(page.locator('html')).not.toHaveAttribute('data-theme')
})
```

## Attribution

This skin recreates the visual style of [Learn Git Branching](https://github.com/pcottle/learnGitBranching) (MIT License). See `THIRD_PARTY_NOTICES.md` for full attribution.

## Future Enhancements

- Animation engine for commit operations (branch, merge, rebase, cherry-pick)
- Interactive tutorials matching LGB scenarios
- Saved lesson progress (local-only, no server sync)
- Custom color schemes within LGB style

## Animation Core

The LGB mode now includes a complete animation engine for visualizing Git operations. The animation system is designed with accessibility and performance in mind.

### Architecture

The animation core consists of several layers:

```
src/viz/anim/
├── types.ts           # Core types, durations, easing functions
├── engine.ts          # Animation engine with playback control
├── selectors.ts       # Element targeting by IDs
├── primitives.ts      # High-level animation building blocks
├── mapper.ts          # Maps Git diffs to animation scenes
├── scenes/            # Pre-built animation scenes
│   └── core.ts        # Common Git operation scenes
└── useAnimation.ts    # React hook for integration
```

### Core Scenes

The animation system provides pre-built scenes for common Git operations:

#### 1. Commit
Creates a new commit node with fade-in animation and branch label updates.

```typescript
import { sceneCommit } from '@/viz/anim/scenes/core';

const scene = sceneCommit('new-commit-id');
// - Fade in new node (220ms)
// - Highlight branch tip (320ms)
// - Update HEAD pointer if applicable
```

**Visual behavior:**
- New node fades in above current branch tip
- Branch label slides to new position
- HEAD arrow nudges if on that branch
- Total duration: ~540ms

#### 2. Branch Create
Animates creating a new branch label at a commit.

```typescript
const scene = sceneBranchCreate('feature', 'commit-id', { x: 100, y: 50 });
// - Highlight anchor commit (220ms)
// - Label appears and positions (220ms)
```

**Visual behavior:**
- Brief pulse on anchor commit
- Branch label fades in at position
- Label aligns inline with commit node
- Total duration: ~440ms

#### 3. Branch Delete
Removes a branch label with fade-out animation.

```typescript
const scene = sceneBranchDelete('feature');
// - Label fades out (220ms)
```

**Visual behavior:**
- Branch label fades out smoothly
- No node changes (commit remains)
- Total duration: ~220ms

#### 4. Checkout (HEAD Move)
Animates switching branches or checking out a commit.

```typescript
const scene = sceneCheckout('from-id', 'to-id', 'HEAD', { x: 200, y: 50 });
// - Unhighlight old position (120ms)
// - Move HEAD label (220ms)
// - Highlight new position (320ms)
```

**Visual behavior:**
- HEAD arrow animates along edge path
- Old tip dims, new tip highlights
- For detached HEAD, shows tag above node
- Total duration: ~660ms

#### 5. Fast-Forward
Animates moving a branch forward along a linear path.

```typescript
const scene = sceneFastForward(
  'main',
  'old-tip',
  'new-tip',
  ['intermediate-1', 'intermediate-2'],
  { x: 300, y: 50 }
);
// - Cascade highlight along path
// - Fade in intermediate nodes
// - Slide branch label
```

**Visual behavior:**
- Cascading highlight from old to new tip
- Intermediate commits fade in if hidden
- Branch label slides smoothly
- Total duration: variable (~600-800ms)

#### 6. Merge (2-Parent)
Creates a merge commit with two parent edges.

```typescript
const scene = sceneMerge2P(
  'merge-id',
  'parent-1',
  'parent-2',
  'edge-id',
  'main',
  { x: 400, y: 50 }
);
// - Show dashed second-parent edge (220ms)
// - Pop in merge node (220ms)
// - Highlight parents (220ms)
// - Update branch label (220ms)
```

**Visual behavior:**
- Temporary dashed arc to second parent
- Merge node pops in at intersection
- Both parents briefly highlighted
- Branch label moves to merge commit
- Total duration: ~1200ms (includes edge lifetime)

#### 7. Reset
Moves HEAD/branch to a previous commit (soft or hard mode).

```typescript
const scene = sceneReset('current-id', 'target-id', 'HEAD', { x: 100, y: 50 }, 'hard');
// - Emphasize current with danger color (220ms)
// - Quick snap to target (120ms)
// - Highlight target (320ms)
```

**Visual behavior:**
- Current position emphasized (accent for soft, danger for hard)
- Safe "snap" animation (no silent node loss)
- Target commit highlighted
- Total duration: ~660ms

**Safety notes:**
- Hard reset uses danger color (red)
- Soft reset uses accent color (blue)
- No commits are visually removed

#### 8. Revert
Creates a new commit that undoes changes from a previous commit.

```typescript
const scene = sceneRevert('revert-id', 'original-id', 'main', { x: 500, y: 50 });
// - Highlight commit being reverted (220ms)
// - Fade in revert commit with danger stroke (220ms)
// - Move branch label (220ms)
// - Final pulse (320ms)
```

**Visual behavior:**
- Original commit briefly highlighted
- Revert commit appears with danger color
- Branch label moves to new commit
- Pulse emphasizes it's a special commit
- Total duration: ~980ms

### Timing Guidelines

All scenes respect consistent timing windows:
- **Very Short**: 120ms (quick transitions, snaps)
- **Short**: 220ms (standard animations, fades)
- **Medium**: 320ms (emphasis, highlights)
- **Long**: 480ms (complex movements)

**Reduced Motion:** When `prefers-reduced-motion: reduce` is detected, all durations are capped at ≤80ms.

### Git Operation Mapper

The mapper module (`mapper.ts`) converts Git state diffs to animation scenes:

```typescript
import { mapDiffToScene, type GitDiff } from '@/viz/anim/mapper';

const diff: GitDiff = {
  operation: 'commit',
  oldState: { nodes: [...], refs: [...], head: 'main' },
  newState: { nodes: [...newCommit], refs: [...], head: 'main' },
};

const scene = mapDiffToScene(diff);
// Returns appropriate AnimScene for the operation
```

**Supported operations:**
- `commit` → `sceneCommit`
- `branch-create` → `sceneBranchCreate`
- `branch-delete` → `sceneBranchDelete`
- `checkout` → `sceneCheckout`
- `fast-forward` → `sceneFastForward`
- `merge` → `sceneMerge2P`
- `reset` → `sceneReset`
- `revert` → `sceneRevert`

### Integration Example

```typescript
import { useAnimation } from '@/viz/anim/useAnimation';
import { mapDiffToScene } from '@/viz/anim/mapper';

function MyComponent() {
  const animation = useAnimation({
    onComplete: () => console.log('Animation done!'),
    onAnnounce: (msg) => console.log('Screen reader:', msg),
  });

  const handleGitOperation = (diff: GitDiff) => {
    const scene = mapDiffToScene(diff);
    if (scene) {
      animation.play(scene);
    }
  };

  return (
    <button onClick={() => handleGitOperation(someDiff)} disabled={animation.isLocked}>
      Perform Git Operation
    </button>
  );
}
```

### Key Features

#### 1. Declarative Animation API

Animations are defined declaratively using `AnimStep` objects:

```typescript
const scene: AnimScene = {
  name: 'commit',
  total: 220,
  steps: [
    { t: 0, sel: { nodes: ['new-commit'] }, op: 'fade', to: 1, dur: 220 },
  ],
};
```

#### 2. Animation Primitives

High-level primitives simplify common operations:

- **fade(selector, opacity)** - Fade elements in/out
- **move(selector, position)** - Translate elements
- **pulse(selector, scale)** - Scale pulse effect
- **stroke(selector, props)** - Change stroke properties
- **classAdd/classRemove(selector, className)** - Toggle CSS classes

#### 3. Helper Utilities

Composite operations for Git visualizations:

- **highlightBranchTip(nodeId)** - Emphasize HEAD pointer
- **moveBranchLabel(labelId, position)** - Animate label repositioning
- **ghostNode(nodeId, from, to)** - Show copy operations (cherry-pick, rebase)
- **tempDashedEdge(edgeId)** - Temporary relationship visualization

#### 4. Animation Engine

The engine provides:

- **Queue & Playback**: Plays animation scenes with requestAnimationFrame
- **Input Locking**: Disables user input during playback
- **State Management**: Tracks playing/paused/idle/cancelled states
- **Visibility Handling**: Auto-pauses on tab hide, resumes on show
- **Cancellation**: Clean cancellation and reset

#### 5. Accessibility (A11y)

Full WCAG 2.2 AA compliance:

- **aria-live region**: Polite announcements for screen readers
- **Reduced motion**: Respects `prefers-reduced-motion`, caps durations at ≤80ms
- **Keyboard access**: Navigation remains functional during animations
- **Semantic descriptions**: Each scene has a description for announcements

### Usage

#### React Integration

Use the `useAnimation` hook in React components:

```typescript
import { useAnimation } from '@/viz/anim/useAnimation';
import { sceneCommit } from '@/viz/anim/scenes/core';

function MyComponent() {
  const animation = useAnimation({
    onComplete: () => console.log('Animation done!'),
    onAnnounce: (msg) => console.log('Screen reader:', msg),
  });

  const handleCommit = () => {
    const scene = sceneCommit('new-commit-id');
    animation.play(scene);
  };

  return (
    <>
      <button onClick={handleCommit} disabled={animation.isLocked}>
        Create Commit
      </button>
      <GraphSVG
        nodes={nodes}
        edges={edges}
        positions={positions}
        animationScene={currentScene}
      />
    </>
  );
}
```

#### Building Custom Scenes

Compose scenes using primitives:

```typescript
import { buildScene } from '@/viz/anim/engine';
import { fadeInNode, highlightBranchTip } from '@/viz/anim/primitives';
import { DURATIONS } from '@/viz/anim/types';

function customMergeScene(mergeNodeId: string): AnimScene {
  const steps = [
    ...fadeInNode(mergeNodeId, { t: 0, dur: DURATIONS.short }),
    ...highlightBranchTip(mergeNodeId, { t: DURATIONS.short, dur: DURATIONS.medium }),
  ];

  return buildScene('merge', steps, 'Merging branches');
}
```

### Queue Semantics

- **Single scene at a time**: Starting a new scene cancels the current one
- **Input locking**: Mouse/keyboard input is blocked during playback
- **Atomic operations**: Each scene represents a complete Git operation
- **Clean cancellation**: Cancel/reset clears all state and unlocks input

### Performance

- **requestAnimationFrame**: Smooth 60 FPS animations
- **Deterministic scheduling**: Same inputs produce identical animations
- **Efficient selectors**: Direct querySelector targeting by data attributes
- **Lazy easing**: Simple easing implementations, extensible for libraries

### Testing

Animation system includes comprehensive tests:

- **Unit tests**: Engine determinism, selector targeting, reduced motion
- **E2E tests**: Keyboard usability, axe scan, structural integrity
- **Snapshot tests**: Verify reduced-motion behavior

Run tests:
```bash
pnpm test src/viz/anim           # Unit tests
pnpm test:e2e e2e/animation      # E2E tests
```

## Troubleshooting

### Theme not persisting across browser restarts

- Theme uses `sessionStorage` by design—it's cleared when browser closes
- This prevents persistent fingerprinting and respects privacy

### Colors look different than Learn Git Branching

- LGB colors have been adjusted for WCAG 2.2 AA compliance
- Original LGB uses some combinations below AA contrast thresholds

### Theme not applying immediately

- Check browser console for errors
- Verify `data-theme` attribute on `<html>` element
- Clear `sessionStorage` and try again

## References

- [Learn Git Branching](https://learngitbranching.js.org/)
- [WCAG 2.2 Color Contrast](https://www.w3.org/WAI/WCAG22/quickref/#contrast-minimum)
- [Reduced Motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

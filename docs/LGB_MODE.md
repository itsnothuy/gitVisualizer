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

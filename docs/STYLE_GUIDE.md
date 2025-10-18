# Visual Style Guide

This document describes the visual styling system for the Git DAG visualization, including grid constants, design tokens, and visual element specifications.

## Grid System

The visualization uses a **grid-based positioning system** where branches occupy columns and commits occupy rows.

### Constants

```typescript
ROW_WIDTH = 80;   // Horizontal spacing between branches (in pixels)
ROW_HEIGHT = 60;  // Vertical spacing between commits (in pixels)
```

### Coordinate System

- **X-axis (horizontal)**: Represents branches
  - `x = branchIndex × ROW_WIDTH`
  - Branches are ordered left-to-right
  - Branch index 0 is the leftmost branch

- **Y-axis (vertical)**: Represents commit levels
  - `y = commitLevel × ROW_HEIGHT`
  - Commit level 0 is the topmost (most recent) commit
  - Higher levels represent older commits

### Grid Functions

```typescript
// Convert grid position to screen coordinates
gridToScreen({ branchIndex: 2, commitLevel: 3 })
// Returns: { x: 160, y: 180 }

// Convert screen coordinates to grid position
screenToGrid({ x: 160, y: 180 })
// Returns: { branchIndex: 2, commitLevel: 3 }

// Calculate Manhattan distance between grid positions
gridDistance(pos1, pos2)
// Returns: |pos1.branchIndex - pos2.branchIndex| + |pos1.commitLevel - pos2.commitLevel|
```

## Visual Elements

### VisNode (Commit Node)

**Dimensions:**
- Radius: `8px` (from skin.node.r)
- Stroke width: `2px` (from skin.node.strokeWidth)
- Focus ring radius: `14px`

**Visual Components:**
- Main circle (commit dot)
- Short SHA label (7 characters, positioned at x=12, y=4)
- Optional CI status indicator (positioned at x=8, y=-8)
- Optional refs indicator (positioned at x=-8, y=-8)
- Optional PR indicator (positioned at x=-10, y=6)

**Accessibility:**
- `role="button"`
- `tabindex="0"`
- `aria-label="Commit {shortSha}: {title}{ciStatus}"`

**CI Status Indicators (Color-Independent):**
- Success: ✓ Checkmark (green)
- Failed: ✗ Cross (red)
- Pending: ○ Clock (yellow)
- Unknown: ? Question mark (gray)

### VisEdge (Commit Edge)

**Path Style:**
- Stroke width: `2px`
- Curved paths using cubic Bezier curves
- Control points calculated based on source/target positions

**Curve Algorithm:**
- Vertical edges: Simple S-curve with vertical control points
- Horizontal edges: S-curve with horizontal and vertical offsets
- Control offset: `min(|dx| × 0.5, 40px)`

**Accessibility:**
- `aria-hidden="true"` (edges are decorative)

### VisTag (Branch Label / HEAD)

**Layout:**
- Inline placement: At commit position
- Above placement: 25px above commit position

**Dimensions:**
- Text height: `18px`
- Padding: `4px`
- Border radius: `3px`
- Approximate width: `(label.length × 7) + 8px`

**Tag Types:**
- **Branch**: Green background, green text
- **HEAD**: Blue background, blue text, dot indicator at x=-8
- **Detached HEAD**: Orange background, orange text

**Accessibility:**
- `role="label"`
- `tabindex="0"`
- `aria-label="{type}: {label}"`

### VisBranch (Branch Visualization)

**Components:**
- Branch tag (VisTag instance) at tip position
- Optional: Branch line showing extent (future enhancement)

**Calculation:**
- X-coordinate: `branchIndex × ROW_WIDTH`

## Design Tokens

### Skin System

Visual elements use the skin system for colors and dimensions:

```typescript
interface Skin {
  node: {
    r: number;          // Node radius
    strokeWidth: number; // Node stroke width
  };
  colors: Record<string, string>;
  defsId: string;
}
```

### Default Skin

```typescript
defaultSkin = {
  node: { r: 6, strokeWidth: 2 },
  colors: {},
  defsId: 'defs'
}
```

### LGB (Learn Git Branching) Skin

```typescript
lgbSkin = {
  node: { r: 8, strokeWidth: 2 },
  colors: {
    bg: 'var(--lgb-bg)',
    fg: 'var(--lgb-fg)',
    muted: 'var(--lgb-muted)',
    accent: 'var(--lgb-accent)',
    // ... additional colors
  },
  defsId: 'lgb-defs'
}
```

## Accessibility Guidelines

### Color Independence

All visual information must be conveyed through **multiple channels**, not color alone:

1. **Shape**: Different symbols for different statuses
2. **Text**: Textual labels and indicators
3. **Pattern**: Visual patterns in addition to colors
4. **Position**: Consistent positioning for different element types

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order follows visual flow (left-to-right, top-to-bottom)
- Arrow keys for spatial navigation between commits
- Enter/Space to activate nodes
- Escape to blur focused elements

### Focus Indicators

- Visible focus rings on all focusable elements
- Focus ring size: 2× base element size
- Focus ring uses `text-ring` color class
- Never hide or disable focus indicators

### ARIA Labels

Every visual element must have appropriate ARIA attributes:

- **Nodes**: `role="button"`, descriptive `aria-label`
- **Edges**: `aria-hidden="true"` (decorative)
- **Tags**: `role="label"`, descriptive `aria-label`
- **Branches**: `role="group"`, descriptive `aria-label`

## Animation Principles

When animating visual elements:

1. **Respect `prefers-reduced-motion`**: Provide motion-light alternatives
2. **Smooth transitions**: Use cubic-bezier easing
3. **Consistent timing**: 200-300ms for most transitions
4. **Purposeful motion**: Only animate to convey state changes

## Performance Considerations

### Rendering Thresholds

- SVG rendering: Up to ~10,000 elements
- Canvas/WebGL fallback: Beyond 10,000 elements
- Virtualization: Enable when visible elements exceed 1,000

### Optimization Strategies

1. **Batch updates**: Group multiple element changes
2. **Lazy rendering**: Render only visible elements
3. **Memoization**: Cache computed positions and paths
4. **Web Workers**: Offload layout computation

## Testing

### Visual Regression Tests

Ensure visual consistency by:
1. Taking snapshots of rendered elements
2. Comparing against golden images
3. Checking element positions match grid expectations

### Accessibility Tests

Run automated accessibility checks:
```bash
pnpm test:e2e  # Includes axe-core checks
```

Verify:
- Zero critical violations
- Keyboard navigation works
- Focus indicators visible
- ARIA labels present and descriptive

## References

- [WCAG 2.2 AA Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [SVG Accessibility](https://www.w3.org/TR/svg-aam-1.0/)

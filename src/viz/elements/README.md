# Visual Elements Architecture

This directory contains the class-based visual element system for rendering Git DAG visualizations with full accessibility support and grid-based positioning.

## Overview

The visual architecture provides a structured, class-based approach to rendering Git commits, branches, edges, and tags as SVG elements. It follows object-oriented principles with a clear inheritance hierarchy and separation of concerns.

## Architecture

### Class Hierarchy

```
VisBase (abstract)
├── VisNode     - Commit visualization with CI status
├── VisEdge     - Curved paths between commits
├── VisTag      - Branch/HEAD labels
└── VisBranch   - Branch management with tags
```

### Core Components

#### 1. **VisBase** (`VisBase.ts`)
Abstract base class providing common functionality:
- `getID()` - Get unique identifier
- `getScreenCoords()` - Get screen position
- `render()` - Render to SVG element
- `update()` - Update visual representation
- `remove()` - Clean up and remove from DOM

#### 2. **Grid System** (`grid.ts`)
Deterministic positioning system:
- `ROW_WIDTH = 80px` - Horizontal spacing between branches
- `ROW_HEIGHT = 60px` - Vertical spacing between commits
- `gridToScreen()` - Convert grid position to pixels
- `screenToGrid()` - Convert pixels to grid position
- `gridDistance()` - Calculate Manhattan distance

#### 3. **VisNode** (`VisNode.ts`)
Commit node rendering with:
- Circle dot (radius from skin)
- Short SHA label (7 chars)
- CI status indicators (color-independent shapes)
- Branch/tag indicators
- PR indicators
- Keyboard navigation support
- ARIA labels for accessibility

#### 4. **VisEdge** (`VisEdge.ts`)
Edge rendering with:
- Cubic Bezier curves for smooth paths
- Automatic control point calculation
- Support for multiple parents (merge commits)
- Adaptive curves based on edge direction

#### 5. **VisTag** (`VisTag.ts`)
Label rendering for:
- Branch names
- HEAD marker
- Detached HEAD
- Dynamic placement (inline or above node)
- Color-coded with accessible shapes

#### 6. **VisBranch** (`VisBranch.ts`)
Branch visualization including:
- Branch tag management
- Commit tracking
- X-coordinate calculation
- Dynamic updates

## Usage

### Basic Example

```typescript
import { VisNode, VisEdge, gridToScreen } from '@/viz/elements';

// Define visuals (from skin system)
const visuals = {
  colors: {},
  node: { r: 8, strokeWidth: 2 }
};

// Create a commit node
const commit = {
  id: 'abc123',
  title: 'Initial commit',
  ts: Date.now(),
  parents: []
};

const position = { branchIndex: 0, commitLevel: 0 };
const node = new VisNode(commit, position, visuals);

// Render to SVG
const svgContainer = document.querySelector('svg');
const nodeElement = node.render();
svgContainer.appendChild(nodeElement);
```

### Lifecycle Management

Use the `VisualElementManager` for managing collections:

```typescript
import { VisualElementManager } from '@/viz/elements/examples';

const manager = new VisualElementManager();

// Add elements
manager.addNode('abc123', node);
manager.addEdge('edge-1', edge);

// Retrieve elements
const node = manager.getNode('abc123');

// Remove elements
manager.removeNode('abc123');

// Clear all
manager.clear();
```

### Advanced: Merge Commits

```typescript
import { createEdgesForCommit } from '@/viz/elements';

const mergeCommit = {
  id: 'merge123',
  title: 'Merge feature',
  ts: Date.now(),
  parents: ['parent1', 'parent2']
};

const edges = createEdgesForCommit(
  mergeCommit.id,
  { branchIndex: 1, commitLevel: 2 },
  [
    { id: 'parent1', position: { branchIndex: 0, commitLevel: 1 } },
    { id: 'parent2', position: { branchIndex: 2, commitLevel: 1 } }
  ],
  visuals
);

// Render all edges
edges.forEach(edge => {
  const element = edge.render();
  svgContainer.appendChild(element);
});
```

## Accessibility

All elements follow WCAG 2.2 AA guidelines:

### Keyboard Navigation
- **Tab/Shift+Tab**: Navigate between nodes
- **Arrow keys**: Spatial navigation
- **Enter/Space**: Activate nodes
- **Escape**: Blur focused element

### ARIA Support
- `role="button"` on nodes (interactive)
- `role="label"` on tags
- `role="group"` on branches
- Descriptive `aria-label` on all elements
- `aria-hidden="true"` on decorative edges

### Color Independence
Status indicators use multiple cues:
- ✓ **Success**: Green checkmark
- ✗ **Failed**: Red cross
- ○ **Pending**: Yellow clock
- ? **Unknown**: Gray question mark

### Focus Management
- Visible focus rings (2× element size)
- Never hide focus indicators
- Consistent focus order

## Grid System

The grid provides deterministic positioning:

```
┌─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  ← Branch indices (columns)
├─────┼─────┼─────┼─────┤
│  ●  │     │     │     │  0 ← Commit levels (rows)
├─────┼─────┼─────┼─────┤
│  │  │  ●  │     │     │  1
├─────┼─────┼─────┼─────┤
│  ●  │  │  │  ●  │     │  2
└─────┴─────┴─────┴─────┘

x = branchIndex × ROW_WIDTH
y = commitLevel × ROW_HEIGHT
```

## Design Tokens

Visual elements respect the skin system:

```typescript
interface Skin {
  node: {
    r: number;          // Node radius (default: 8)
    strokeWidth: number; // Stroke width (default: 2)
  };
  colors: Record<string, string>;
  defsId: string;
}
```

## Testing

### Unit Tests
Located in `__tests__/`:
- `grid.test.ts` - Grid system (17 tests)
- `elements.test.ts` - Element classes (26 tests)
- `examples.test.ts` - Usage patterns (9 tests)

Run with:
```bash
pnpm test src/viz/elements
```

### E2E Tests
Located in `/e2e/visual-architecture.spec.ts`:
- Node positioning
- Edge rendering
- Accessibility checks (axe-core)
- Keyboard navigation

Run with:
```bash
pnpm test:e2e
```

## Performance

### Rendering Strategy
- SVG for graphs up to ~10k elements
- Canvas/WebGL for larger graphs (future)
- Element virtualization when needed

### Optimization Tips
1. **Batch updates**: Group multiple element changes
2. **Reuse elements**: Update positions instead of re-rendering
3. **Virtualize**: Only render visible elements
4. **Cache**: Store computed paths and positions

## Integration

The visual architecture can be used in two ways:

1. **Standalone**: Create and manage elements directly
2. **React integration**: Wrap elements in React components

See `examples.ts` for comprehensive usage patterns.

## Future Enhancements

Planned features:
- [ ] Canvas fallback renderer for large graphs
- [ ] Animated transitions between states
- [ ] Interactive edge editing
- [ ] Collaborative multi-user cursors
- [ ] Export to SVG/PNG/PDF

## References

- [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) - System architecture
- [STYLE_GUIDE.md](../../../docs/STYLE_GUIDE.md) - Visual style guide
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)

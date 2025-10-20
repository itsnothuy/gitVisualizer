# Git Visualizer Architecture

## Overview

Git Visualizer is a **privacy-first, local-first** Git commit graph visualization tool built with Next.js 15, designed to render Git repositories as interactive DAGs (Directed Acyclic Graphs) while maintaining strict privacy controls and WCAG 2.2 AA accessibility standards.

## Core Principles

### Privacy & Security
- **Local-first**: All repository processing happens in-browser by default
- **Zero exfiltration**: No repository contents leave the device without explicit user consent
- **Minimal scopes**: When overlays are enabled, use read-only OAuth scopes only
- **Session-based tokens**: Authentication tokens stored in memory, not persisted

### Performance Targets
- Initial layout: ≤ 1500ms on medium-sized graphs
- Pan/zoom interactions: ≤ 16ms/frame for smooth 60 FPS
- Scalability: React+SVG up to ~10k elements, Canvas/WebGL beyond that
- Automatic performance guardrails with configurable thresholds (see ADR-0007)

### Accessibility
- **WCAG 2.2 AA compliance** across all interfaces
- Keyboard-first navigation (Tab/Shift+Tab)
- Color-independent information encoding
- Screen reader compatibility with semantic SVG

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (Next.js App Router + React)                     │
│  ├── Page Components (src/app/)                            │
│  ├── UI Components (src/components/ui/)                    │
│  └── Visualization Components (src/viz/svg/)               │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                      │
│  ├── Git Ingestion (src/lib/git/)                         │
│  │   ├── Local: File System Access API                    │
│  │   └── Remote: isomorphic-git + LightningFS             │
│  ├── DAG Layout (src/viz/elk/)                            │
│  │   └── ELK.js (Sugiyama layered algorithm)              │
│  └── Overlays (src/lib/overlays/) [Future]                │
│      ├── GitHub GraphQL/REST API                          │
│      └── GitLab REST API                                  │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer                                             │
│  ├── OPFS (Origin Private File System)                    │
│  ├── IndexedDB (metadata cache)                           │
│  └── Memory (layout cache, tokens)                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Data Flow
1. **Ingestion**: Repository → Git Objects → DAG Model
2. **Layout**: DAG Model → ELK Layout → Positioned Nodes/Edges
3. **Rendering**: Positioned Elements → SVG/Canvas → Interactive Visualization
4. **Overlays**: (Optional) Remote APIs → Enriched Metadata → Enhanced Visualization

### Core Data Types

```typescript
// Git DAG Model
export type DagNode = {
  id: string;           // commit SHA
  title: string;        // commit message (truncated)
  ts: number;          // timestamp
  parents: string[];   // parent commit SHAs
  refs?: string[];     // branch/tag refs
  pr?: { id: string; url: string } | null;     // overlay: PR info
  ci?: { status: "success" | "failed" | "pending" | "unknown" } | null; // overlay: CI status
};

// Layout output
export type LayoutNode = DagNode & {
  x: number;
  y: number;
  width: number;
  height: number;
};
```

## Module Breakdown

### 1. Ingestion Layer (`src/lib/git/`)

**Local Repository Access** (`local.ts`)
- File System Access API integration
- Directory picker with clear permission prompts
- Local .git folder parsing via isomorphic-git

**Remote Repository Access** (`remote.ts`)
- Shallow clone capability via isomorphic-git + LightningFS
- CORS proxy support for GitHub/GitLab clones
- OPFS storage for cloned repositories

**Key Features:**
- Feature-flagged network vs local-only modes
- Graceful fallbacks for browsers without File System Access API
- No persistence of sensitive data outside OPFS/IndexedDB

### 2. Visualization Layer (`src/viz/`)

**Layout Engine** (`elk/layout.ts`)
- ELK.js integration for Sugiyama layered algorithm
- Configurable layout parameters
- Web Worker support for non-blocking layout computation
- Position caching by commit OID + layout params

**SVG Rendering** (`svg/Graph.tsx`)
- React + SVG for semantic, accessible rendering
- ARIA labels and keyboard navigation
- Progressive enhancement for large graphs
- Color-independent status encoding (shapes, patterns, text)

**Performance Considerations:**
- Virtualization for large node sets
- Canvas/WebGL fallback path for >10k elements
- Incremental layout updates on repository changes

**Visual Elements Architecture** (`elements/`)
- Class-based visual element system for rendering Git DAG
- `VisBase`: Abstract base class for all visual elements
- `VisNode`: Commit node rendering with accessibility support
- `VisEdge`: Curved edge paths using cubic Bezier curves
- `VisTag`: Branch labels, HEAD markers with dynamic placement
- `VisBranch`: Branch management with commit tracking
- Grid system: `ROW_WIDTH=80px`, `ROW_HEIGHT=60px` for consistent positioning

**Visual Elements Class Hierarchy:**
```
VisBase (abstract)
├── VisNode     - Commit dots with SHA labels, CI status
├── VisEdge     - Curved paths between commits
├── VisTag      - Branch/HEAD labels (inline or above)
└── VisBranch   - Branch visualization with tag management
```

**Grid Positioning System:**
- Branches occupy columns (x = branchIndex × ROW_WIDTH)
- Commits occupy rows (y = commitLevel × ROW_HEIGHT)
- Functions: `gridToScreen()`, `screenToGrid()`, `gridDistance()`
- Provides deterministic, predictable layout for DAG elements

### 3. Command System (`src/cli/`)

**Interactive Git Operations** - LearnGitBranching-inspired command interface

**Command Parser** (`CommandParser.ts`)
- Parses user input into structured command objects
- Tokenization with quoted string support
- Option parsing (short flags, long options, values)
- Command validation with helpful error messages
- Support for aliases (co, br, ci, st)

**Git Engine** (`GitEngine.ts`)
- In-memory Git state management
- Implements core Git operations:
  - `commit`, `branch`, `checkout`, `switch`
  - `merge` (fast-forward and merge commits)
  - `reset`, `revert`, `tag`, `status`, `log`
- Detached HEAD support
- HEAD~n notation for commit navigation
- Merge conflict detection (future)

**Command Pipeline** (`processCommand.ts`)
- Orchestrates: Parse → Execute → Update → Animate
- Undo/Redo system with history stack
- Animation callbacks for visual updates
- Command history management (up to 50 commands)
- Error handling and recovery

**Command Console UI** (`components/cli/CommandConsole.tsx`)
- Terminal-like interface with command input
- Command history navigation (↑/↓ arrows)
- Real-time output display (commands, output, errors)
- Console locking during animations
- ARIA labels for accessibility
- Keyboard shortcuts (Esc to clear)

**Data Flow:**
```
User Input → Parser → Git Engine → State Update → Animation Trigger
     ↓                                  ↓
  History                         Visualization
```

**State Management:**
```typescript
GitState {
  commits: Map<id, GitCommit>
  branches: Map<name, GitBranch>
  tags: Map<name, GitTag>
  head: HeadState (branch | detached)
}

CommandHistory {
  undoStack: HistoryEntry[]
  redoStack: HistoryEntry[]
  maxSize: number
}
```

### 4. Overlay System (`src/lib/overlays/`) [Future]

**GitHub Integration**
- GraphQL API for commit → PR mapping
- Checks/Statuses API for CI information
- Rate-limit aware with exponential backoff
- OAuth PKCE with minimal read-only scopes

**GitLab Integration**
- REST API for Merge Request associations
- Pipeline status integration
- Instance-configurable rate limiting
- Similar OAuth patterns as GitHub

**Privacy Controls:**
- Per-repository overlay opt-in
- Global overlay disable toggle
- In-memory token storage
- Graceful degradation when overlays fail

## Accessibility Architecture

### WCAG 2.2 AA Compliance
- **Keyboard Navigation**: Full tab order through graph nodes
- **Focus Management**: Visible focus indicators on all interactive elements
- **Screen Reader Support**: Semantic SVG with ARIA labels and descriptions
- **Color Independence**: Status indicated via shape, pattern, and text, not color alone
- **Motion Sensitivity**: Respects `prefers-reduced-motion` for animations

### Implementation Details
- SVG `<g>` groupings for related elements
- `role="graphics-document"` for main graph
- `aria-label` for node descriptions
- `tabindex="0"` for keyboard-accessible nodes
- Status shapes: ✓ (success), ✗ (failed), ○ (pending), ? (unknown)

## Technology Stack

### Core Framework
- **Next.js 15** with App Router
- **React 19** for UI components
- **TypeScript 5** with strict mode
- **Tailwind CSS 4** for styling

### Visualization
- **ELK.js 0.11** for graph layout
- **React SVG** for accessible rendering
- **react-zoom-pan-pinch** for graph interactions

### Git Operations
- **isomorphic-git 1.34** for Git operations
- **@isomorphic-git/lightning-fs** for browser filesystem
- **File System Access API** for local repository access

### Development & Testing
- **Vitest** for unit/integration testing
- **Playwright** for E2E testing
- **ESLint** with jsx-a11y plugin for accessibility linting
- **Prettier** for code formatting

## Storage Strategy

### Local Storage (OPFS)
- Cloned repository files
- Layout computation cache
- User preferences (non-sensitive)

### Memory Storage
- OAuth tokens (session-only)
- Current graph state
- Layout worker results

### IndexedDB
- Repository metadata cache
- Overlay response cache (with TTL)
- Performance metrics

## Security Considerations

### Data Protection
- Repository contents never leave the device without explicit consent
- OAuth tokens stored in memory only (no localStorage)
- CORS proxy configuration documented for self-hosting
- File System Access API permissions properly scoped

### Network Security
- Read-only API scopes for all external integrations
- Rate limiting and exponential backoff
- Proper HTTPS enforcement in production
- CSP headers for XSS protection

## Performance Architecture

### Rendering Performance
- SVG rendering for graphs up to ~10k elements
- Canvas/WebGL fallback for larger graphs
- Element virtualization for viewport-based rendering
- Progressive edge drawing on idle frames

### Layout Performance
- Web Worker-based layout computation
- Position caching with invalidation strategies
- Incremental updates for repository changes
- Debounced layout recalculation

### Memory Management
- Efficient DAG representation
- Layout result pooling
- Overlay response caching with LRU eviction
- Garbage collection-friendly data structures

## Extension Points

The architecture supports future enhancements:

1. **Additional Git Providers**: Extend overlay system for Bitbucket, Azure DevOps
2. **Custom Layout Algorithms**: Plugin system for alternative layout engines
3. **Export Formats**: SVG, PNG, PDF export capabilities
4. **Advanced Filtering**: Complex query system for large repositories
5. **Collaborative Features**: Share graph views (metadata only)
6. **Performance Analytics**: Graph complexity metrics and recommendations

## Decision Records

For detailed architectural decisions, see:
- [ADR-0002: Next.js App Router](./adr/0002-framework-nextjs-app-router.md)
- [ADR-0003: Local-first Ingestion](./adr/0003-local-first-ingestion.md)
- [ADR-0004: ELK Layered Layout](./adr/0004-dag-layout-elk-layered.md)
- [ADR-0005: SVG-first Rendering](./adr/0005-renderer-svg-first-webgl-when-large.md)
- [ADR-0006: Auth and Overlays](./adr/0006-auth-and-overlays.md)
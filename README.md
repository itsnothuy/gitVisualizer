# Git Visualizer

> A privacy-first, local-first Git commit graph visualizer designed for learning, exploration, and accessibility.

[![CI](https://github.com/yourusername/git-viz/workflows/CI/badge.svg)](https://github.com/yourusername/git-viz/actions)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2%20AA-green.svg)](https://www.w3.org/WAI/WCAG22/quickref/)
[![Privacy](https://img.shields.io/badge/Privacy-First-blue.svg)](#privacy--security)

## 🎯 What Makes This Different

**Privacy by Design**: Your Git repositories never leave your device. No data exfiltration, no tracking, no cloud storage required.

**Accessibility First**: Built for everyone with WCAG 2.2 AA compliance, full keyboard navigation, and screen reader support.

**Educational Focus**: Perfect for Git learners with clear visualizations and beginner-friendly UX that makes complex Git concepts understandable.

## ✨ Key Features

### 🔒 Privacy & Security
- **Local-first architecture** - All processing happens in your browser
- **Zero data exfiltration** - Repository contents never leave your device
- **Optional overlays** - GitHub/GitLab integration only with explicit consent
- **No tracking or analytics** - Your Git workflow remains private

### 🎓 Learning & Education
- **Learn Git Branching (LGB) mode** - Interactive Git scenarios with visual feedback
- **Clear commit graph visualization** - Understand complex branching and merging
- **Beginner-friendly UX** - Progressive disclosure of advanced features
- **Visual golden testing** - Consistent, reliable visual output for educational content

### ♿ Accessibility & Inclusion
- **WCAG 2.2 AA compliant** - Verified with automated and manual testing
- **Full keyboard navigation** - Tab/Shift+Tab through all interactive elements
- **Screen reader optimized** - Semantic SVG with comprehensive ARIA labels
- **Color-independent design** - Patterns and shapes complement color coding
- **Reduced motion support** - Respects user preferences for animations

### ⚡ Performance & Scale
- **Efficient rendering** - React + SVG with virtualization for large repositories
- **Web Worker layouts** - ELK.js processing doesn't block the UI
- **Smart caching** - Layout results cached by commit SHA + parameters
- **Shallow cloning** - Minimal bandwidth usage for remote repositories

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ with corepack enabled
- Modern browser with File System Access API support
- HTTPS (required for file system access)

### Quick Start

```bash
# Clone and install
git clone https://github.com/yourusername/git-viz.git
cd git-viz
corepack enable && pnpm install --frozen-lockfile

# Start development server with HTTPS
pnpm dev:https

# Open https://localhost:3000 and connect your repository
```

### Browser Support

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| **Local repositories** | 86+ | 86+ | 15.2+ (partial) | ❌ |
| **Remote cloning** | 86+ | 86+ | 15.2+ | 111+ |
| **Core visualization** | ✅ | ✅ | ✅ | ✅ |

## 📖 Usage

### Connecting Local Repositories

1. Click **"Connect Local Repository"**
2. Select your Git repository folder
3. Grant read-only access when prompted
4. Explore your commit graph with full privacy

### Cloning Remote Repositories

1. Click **"Clone Remote Repository"**
2. Enter repository URL (must be public)
3. Choose shallow clone depth
4. Repository cloned to browser storage (OPFS)

*Note: Remote cloning may require CORS proxy for some repositories*

### Navigation & Interaction

- **Keyboard**: Tab/Shift+Tab to navigate, Arrow keys within graph
- **Mouse**: Click to select, drag to pan, scroll to zoom
- **Touch**: Pinch to zoom, drag to pan on mobile devices

## 🏗️ Architecture

### Core Modules

```
src/
├── lib/git/           # Git ingestion (local + remote)
├── viz/               # Visualization layer (ELK + React + SVG)
├── components/        # UI components with accessibility
├── app/               # Next.js App Router pages
└── lib/overlays/      # Optional GitHub/GitLab integration
```

### Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Git Operations**: isomorphic-git, File System Access API
- **Layout Engine**: ELK.js (Eclipse Layout Kernel)
- **Rendering**: React + SVG with Canvas/WebGL fallbacks
- **Styling**: Tailwind CSS, Radix UI primitives
- **Testing**: Vitest, Playwright, axe-core for accessibility

## 🎮 Learn Git Branching Mode

Interactive Git scenarios that teach version control concepts:

### Available Scenarios
- **Introduction**: Basic commits, branching, and merging
- **Rebase Workflows**: Understanding rebase vs merge
- **Cherry-picking**: Selective commit application
- **Advanced Branching**: Complex workflow patterns

### Features
- **Visual step-by-step execution** - See Git operations happen in real-time
- **Undo/redo support** - Experiment safely with Git commands
- **Animation system** - Smooth transitions between Git states
- **Progress tracking** - Visual indicators of lesson completion

## 🔧 Development

### Commands

```bash
# Development
pnpm dev              # Development server (HTTP)
pnpm dev:https        # Development server (HTTPS - required for File System API)

# Testing
pnpm test             # Unit tests
pnpm test:watch       # Watch mode
pnpm test:e2e         # End-to-end tests
pnpm test:a11y        # Accessibility tests

# Quality
pnpm lint             # ESLint + Prettier
pnpm type-check       # TypeScript checking
pnpm build            # Production build
```

### Testing Strategy

- **Unit Tests**: Core Git operations and layout algorithms
- **Integration Tests**: File system access and repository parsing
- **E2E Tests**: Complete user workflows with Playwright
- **Visual Golden Tests**: SVG snapshot comparison for LGB scenarios
- **Accessibility Tests**: axe-core integration with zero critical violations

## 🔐 Privacy & Security

### Data Handling
- **Local repositories**: Read-only access, no data persistence outside OPFS
- **Remote repositories**: Cloned to browser storage, never uploaded
- **Overlay integrations**: Explicit opt-in with minimal read-only scopes
- **No telemetry**: Zero tracking, analytics, or user behavior monitoring

### Security Headers
- Content Security Policy with strict directives
- HTTPS-only with HSTS
- No third-party script execution
- Frame-ancestors prevention

### OAuth (Optional Overlays)
- PKCE flow for secure authentication
- Minimal scopes (read-only repository access)
- Tokens stored in memory only
- Per-repository consent management

## 🤝 Contributing

### Areas for Contribution
- **Accessibility testing** with real assistive technologies
- **Browser compatibility** testing and fallbacks
- **Performance optimization** for large repositories
- **Educational content** creation for LGB scenarios
- **Documentation** improvements and translations

### Getting Started
1. Read our [Contributing Guidelines](CONTRIBUTING.md)
2. Check the [Development Plan](docs/PLAN.md) for current priorities
3. Review [Architecture Documentation](docs/ARCHITECTURE.md)
4. Join discussions in GitHub Issues

## 📚 Documentation

### User Guides
- [Getting Started Guide](docs/getting-started.md)
- [Accessibility Features](docs/accessibility.md)
- [Privacy & Security](docs/privacy.md)
- [Learn Git Branching](docs/lgb-mode.md)

### Developer Docs
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Development Plan](docs/PLAN.md)
- [Testing Strategy](docs/TESTING.md)
- [API Documentation](docs/api/)

### Examples
- [Ingestion Usage Examples](docs/examples/ingestion-usage.md)
- [Custom Layout Configurations](docs/examples/layout-config.md)
- [Overlay Integration Patterns](docs/examples/overlay-integration.md)

## 🏆 Project Goals

### Primary Objectives
1. **Privacy-first Git visualization** that keeps data local
2. **Accessible design** that works for all users
3. **Educational value** for Git learning and exploration
4. **Performance** that scales to large repositories

### Success Metrics
- **WCAG 2.2 AA compliance** (verified with real screen readers)
- **Zero data exfiltration** by default operation
- **Sub-1500ms initial layout** on medium repositories (~1000 commits)
- **60 FPS interactions** regardless of repository size

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ELK.js team** for the powerful layout algorithms
- **isomorphic-git contributors** for making Git work in browsers
- **Web accessibility community** for guidance and testing
- **Learn Git Branching project** for educational inspiration

---

**Made with ❤️ for the Git community, accessibility advocates, and privacy-conscious developers.**
| Chrome 86+ | ✅ | ✅ | ✅ | Direct Folder Access |
| Edge 86+ | ✅ | ✅ | ✅ | Direct Folder Access |
| Firefox 90+ | ❌ | ✅ | ✅ | Folder Upload |
| Safari 15.2+ | ❌ | ✅ | ✅ | Folder Upload |

**Notes:**
- **Direct Folder Access** (File System Access API) provides the best experience with read-only access to local folders
- **Folder Upload** uses `webkitdirectory` input for browsers without File System Access API support
- **ZIP Upload** works in all browsers as a universal fallback
- All methods process files entirely in your browser - no data is uploaded

**Performance:**
- Supports repositories up to 500MB with 50,000 files
- ZIP decompression runs in a Web Worker to prevent UI freezing
- Progress indicators show real-time processing status

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm dev:https        # Start dev server with HTTPS

# Quality Assurance
pnpm validate         # Run all checks (type, lint, test, build)
pnpm typecheck        # TypeScript type checking
pnpm lint             # ESLint checking
pnpm lint:fix         # Fix auto-fixable lint issues
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests

# Build & Deploy
pnpm build            # Production build
pnpm build:analyze    # Build with bundle analysis
pnpm start            # Start production server

# Maintenance
pnpm clean            # Clear build cache
pnpm reset            # Reset node_modules and reinstall
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect Next.js and configure build settings
3. Deploy with zero configuration

### Static Export

For static hosting (GitHub Pages, Netlify, etc.):

```bash
# Add to next.config.ts
output: 'export'

# Build and export
pnpm build
```

### Environment Variables

No environment variables are required for basic functionality. All Git operations happen locally in the browser.

## Security

- **No Data Exfiltration**: All repository data stays on your device
- **Secure Contexts Only**: Requires HTTPS for File System Access API
- **No External Dependencies**: Works completely offline after initial load
- **Security Headers**: OWASP-recommended headers including CSP, HSTS, and more
- **Content Security Policy**: Strict CSP with local-only connections by default

### Security Testing

You can verify the security posture of this application using [Mozilla Observatory](https://observatory.mozilla.org/):

```bash
# After deploying or running locally
# Visit: https://observatory.mozilla.org/
# Enter your deployment URL (or use ngrok/similar for local testing)
# Observatory will scan and grade your security headers

# Or use the command-line tool:
npm install -g observatory-cli
observatory <your-url>
```

The application implements:
- **Content-Security-Policy**: Restricts resource loading, prevents XSS
- **Strict-Transport-Security**: Enforces HTTPS connections
- **X-Content-Type-Options**: Prevents MIME-sniffing attacks
- **X-Frame-Options**: Prevents clickjacking
- **Referrer-Policy**: Controls referrer information leakage
- **Permissions-Policy**: Disables unnecessary browser features
- **Cross-Origin-Opener-Policy**: Isolates browsing context
- **Cross-Origin-Embedder-Policy**: Requires CORS for cross-origin resources

## Performance

- **Bundle Size**: ~126KB initial load, ~576KB for visualization features
- **Virtualization**: Automatic performance optimization for large repositories
- **Web Workers**: Layout calculations run in background threads (planned)

## Accessibility

Git Visualizer is designed to be fully accessible and meets **WCAG 2.2 Level AA** standards.

### WCAG 2.2 Compliance

Our commitment to accessibility includes:

- ✅ **Zero Critical Violations**: Verified with axe-core automated testing across all browsers
- ✅ **WCAG 2.2 AA Certified**: Meets all Level A and AA success criteria
- ✅ **Keyboard Navigation**: Complete keyboard access—no mouse required
- ✅ **Screen Reader Support**: Comprehensive ARIA labels and semantic markup
- ✅ **Color Independence**: All information conveyed through multiple methods (shape, text, and color)
- ✅ **Reduced Motion**: Respects `prefers-reduced-motion` system preference
- ✅ **Focus Appearance**: Strong visible focus indicators (2px rings with 3:1+ contrast)

### WCAG 2.2 New Features

We implement all WCAG 2.2 Level AA requirements:

**2.4.11 Focus Not Obscured**: No overlays hide focused elements
- Focus rings extend beyond nodes (r=14 vs r=8)
- Pan/zoom keeps focused elements visible

**2.5.7 Dragging Movements**: Keyboard alternatives for all drag operations
- Arrow keys navigate between nodes (no drag required)
- Mouse wheel zooms without dragging
- Keyboard shortcuts for pan/zoom (planned)

**2.5.8 Target Size (Minimum)**: Interactive elements meet 24×24px target size
- Graph nodes: 28px diameter interactive area
- Nodes spaced 50-100px apart (exceeds 24px spacing requirement)
- UI buttons: 40×40px minimum

**Reduced Motion Support**: Animations collapse to ≤80ms
- Outline/opacity cues replace long path animations
- `prefers-reduced-motion: reduce` fully supported
- Information conveyed without relying on animation

### Keyboard Navigation

Full keyboard support for all features:

- **Tab / Shift+Tab**: Navigate between interactive elements
- **Arrow Keys**: Navigate between graph nodes
- **Enter / Space**: Activate selected node
- **Escape**: Unfocus current element or dismiss tooltips
- **Mouse Wheel**: Zoom in/out (no drag required)

### Testing & Verification

Our accessibility is validated through:

- **Automated**: axe-core + @axe-core/playwright in CI/CD
- **Manual**: Screen reader testing (NVDA, VoiceOver, JAWS)
- **Browsers**: Chrome, Firefox, Safari, Edge (all latest versions)
- **Standards**: WCAG 2.0, 2.1, 2.2 (Level A & AA)

### Documentation

For detailed compliance information:
- [WCAG 2.2 Checklist](/a11y/WCAG22_CHECKLIST.md) - Comprehensive compliance documentation
- [WCAG 2.2 Understanding Docs](https://www.w3.org/WAI/WCAG22/Understanding/) - Official W3C guidelines
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/) - Interactive checklist

### Reporting Issues

Found an accessibility issue? Please [open an issue](https://github.com/itsnothuy/gitVisualizer/issues) with:
- Description of the barrier
- Steps to reproduce
- Assistive technology used (if applicable)
- WCAG success criterion affected (if known)

We prioritize accessibility issues and aim to address them promptly.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Roadmap

- [ ] GitHub/GitLab integration (opt-in overlays)
- [ ] Performance optimizations for very large repositories  
- [ ] Additional visualization modes
- [ ] Export functionality (PNG/SVG)
- [ ] Advanced Git operations support

---

Built with ❤️ for developers who want to understand their Git history without compromising privacy.

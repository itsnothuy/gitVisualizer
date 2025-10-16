# Git Visualizer
A privacy-first, local-first Git repository visualizer that renders commit graphs as interactive DAGs (Directed Acyclic Graphs). Built with Next.js, React, and ELK layout engine.
<p align="center">
  <img src="./assets/home.png" alt="Home Page"  width="800"/> &nbsp;&nbsp;&nbsp;
</p>
## Features

- 🔒 **Privacy-First**: All processing happens in your browser - no data leaves your device
- 📁 **Local Repository Access**: Uses File System Access API to read local Git repositories
- 🎨 **Interactive Visualization**: Pan, zoom, and explore commit graphs with keyboard navigation
- ♿ **Accessible**: WCAG 2.2 AA compliant with keyboard navigation and screen reader support
- ⚡ **Fast Rendering**: Optimized SVG rendering with virtualization for large repositories
- 🎯 **Beginner Friendly**: Clean, intuitive interface for understanding Git history

## LGB Mode

<p align="center">
  <img src="./assets/home.png" alt="LGB Mode Visualization" width="800"/>
</p>

Git Visualizer includes an optional **LGB (Learn Git Branching) Mode** that recreates the familiar visual style of [Learn Git Branching](https://learngitbranching.js.org/) for educational purposes.

### What is LGB Mode?

LGB Mode provides a **grid-based layout** with smooth animations that help visualize Git operations:

- **Grid Layout**: Commits arranged with generations (topological levels) as rows and branch lanes as columns
- **Animated Operations**: Watch commits, branches, merges, rebases, and cherry-picks unfold with 120-480ms motion windows
- **Visual Grammar**: 
  - Branch labels inline at tips
  - HEAD arrow clearly visible
  - Merge commits show two-parent links
  - Rebase uses dashed "copy" arcs
  - Cherry-pick displays single copy arc

### Accessibility & Performance

**Accessibility (WCAG 2.2 AA):**
- ✅ **Reduced Motion Support**: Automatically collapses animation durations to ≤80ms when `prefers-reduced-motion: reduce` is detected
- ✅ **Screen Reader Announcements**: `aria-live` region announces each Git operation (e.g., "Committed to main", "Rebased 3 commits onto main")
- ✅ **Keyboard Navigation**: Full keyboard access maintained during animations
- ✅ **Color Independence**: All information uses shapes, patterns, and text—not color alone
- ✅ **Zero Critical Violations**: Verified with axe-core in automated tests

**Performance:**
- ⚡ **Smooth 60 FPS**: Animations run at 60 FPS using `requestAnimationFrame`
- 🔒 **Input Locking**: User input disabled during playback to prevent race conditions
- 🎯 **Optimized for Medium Graphs**: First layout ≤1500ms, pan/zoom ≤16ms/frame
- 📊 **Canvas Fallback Ready**: For graphs >10k elements (not yet implemented)

### How to Enable

1. Click the **"LGB Mode"** toggle in the application header
2. Theme applies immediately to all graph visualizations
3. Preference saved in `sessionStorage` for the current session

### Known Limitations

- **Grid Approximation**: ELK's layered algorithm may produce slightly different spacing than original LGB
- **Input Locking**: All user input locked during animation playback (no pausing/scrubbing)
- **Single Scene**: Only one animation at a time; new scenes cancel current ones
- **Browser Support**: Safari <15.4 may not respect `prefers-reduced-motion`

### Learn More

- 📖 **Full Documentation**: See [/docs/LGB_MODE.md](/docs/LGB_MODE.md) for architecture, API, and testing details
- 🎓 **Learn Git Branching**: Visit [learngitbranching.js.org](https://learngitbranching.js.org/) to try the original tool
- 📜 **Attribution**: See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for license information

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Modern browser with File System Access API support (Chrome 86+, Edge 86+)
- HTTPS connection (required for File System Access API)

### Development

```bash
# Install dependencies
pnpm install

# Start development server with HTTPS
pnpm dev:https

# Or start regular development server
pnpm dev
```

Open [https://localhost:3000](https://localhost:3000) to view the application.

### Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## Usage

1. **Open a Repository**: Click "Open Repository" and select a local Git folder
2. **Explore the Graph**: Use mouse to pan/zoom, or keyboard navigation (Tab, Arrow keys)
3. **View Commit Details**: Click on nodes to see commit information
4. **Accessibility**: Full keyboard navigation support with Tab/Shift+Tab

## Architecture

- **Frontend**: Next.js 15 with React 19
- **Layout Engine**: ELK.js for automatic graph layout
- **Rendering**: SVG with React components
- **Git Operations**: isomorphic-git for browser-based Git operations
- **Testing**: Vitest + Playwright for unit and E2E tests

## Browser Support

- Chrome 86+ (recommended)
- Edge 86+
- Firefox and Safari have limited support due to File System Access API requirements

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Commands

```bash
# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Lint code
pnpm lint

# Type check
pnpm typecheck
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

- **WCAG 2.2 AA Compliant**: Full accessibility support
- **Keyboard Navigation**: Tab through interface, arrow keys in graph
- **Screen Reader Support**: Proper ARIA labels and semantic markup
- **Color Independence**: Status indicators use shapes, not just colors

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

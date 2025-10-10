# Git Visualizer Build & Development Workflow

## Quick Start

```bash
# Prerequisites: Node.js 18+, corepack enabled
corepack enable
pnpm install --frozen-lockfile

# Development
pnpm dev              # Start dev server on http://localhost:3000

# Quality Assurance
pnpm lint            # ESLint + jsx-a11y + Prettier
pnpm test            # Unit & integration tests (Vitest)
pnpm exec playwright test  # E2E tests

# Production
pnpm build           # Build for production
pnpm start           # Start production server
```

## Development Environment Setup

### System Requirements

- **Node.js**: 18.x or higher
- **pnpm**: Latest (via corepack)
- **Browser**: Chrome/Edge 90+, Firefox 88+, Safari 14+

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd git-viz

# Enable package manager
corepack enable

# Install dependencies (frozen lockfile for reproducible builds)
pnpm install --frozen-lockfile

# Verify setup
pnpm lint           # Should pass without errors
pnpm test           # Should pass all tests
pnpm build          # Should build successfully
```

### Environment Configuration

```bash
# Optional: Create .env.local for development overrides
cp .env.example .env.local

# Environment variables
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ENABLE_OVERLAYS=false  # Privacy-first default
```

## Build System

### Next.js Configuration

- **Framework**: Next.js 15 with App Router
- **Build Tool**: Turbopack (enabled by default)
- **TypeScript**: Strict mode with path mapping
- **Styling**: Tailwind CSS 4 with component system

### Build Targets

```bash
# Development (with HMR)
pnpm dev

# Production build
pnpm build

# Production preview
pnpm build && pnpm start

# Static export (for hosting)
pnpm build && pnpm export
```

### Build Optimization

- **Bundle Analysis**: `pnpm build:analyze`
- **Tree Shaking**: Automatic for ES modules
- **Code Splitting**: Route-based automatic splitting
- **Asset Optimization**: Next.js built-in image and font optimization

## Development Workflow

### Branch Strategy

```bash
# Feature development
git checkout -b feat/area-name
# Examples:
# feat/ingestion-file-picker
# feat/viz-layout-caching
# feat/overlays-github-auth

# Bug fixes
git checkout -b fix/area-description
# fix/viz-keyboard-navigation
# fix/ingestion-permission-handling

# Documentation
git checkout -b docs/area-topic
# docs/architecture-update
# docs/api-reference

# Chores (deps, config, etc.)
git checkout -b chore/description
# chore/dependencies-update
# chore/ci-performance
```

### Commit Convention

```bash
# Conventional Commits format
feat(area): add feature description
fix(area): resolve issue description
docs(area): update documentation
chore(area): maintenance task
test(area): add or update tests

# Examples:
git commit -m "feat(ingestion): add File System Access API support"
git commit -m "fix(viz): improve keyboard navigation focus order"
git commit -m "docs(api): document overlay authentication flow"
```

### Code Quality Pipeline

```bash
# Pre-commit (recommended setup)
npm install -g husky
pnpm prepare

# Manual quality checks
pnpm lint              # ESLint + Prettier
pnpm lint:fix          # Auto-fix linting issues
pnpm typecheck         # TypeScript type checking
pnpm test              # Unit tests
pnpm test:coverage     # Coverage report
```

## Testing Commands

### Unit & Integration Tests (Vitest)

```bash
# Run all tests
pnpm test

# Watch mode for development
pnpm test:watch

# Coverage report
pnpm test:coverage

# Specific test patterns
pnpm test git           # Run git-related tests
pnpm test layout        # Run layout tests
pnpm test a11y          # Run accessibility tests
```

### End-to-End Tests (Playwright)

```bash
# Install browsers (first time only)
pnpm exec playwright install

# Run all E2E tests
pnpm exec playwright test

# Run specific test suites
pnpm exec playwright test accessibility  # A11y tests
pnpm exec playwright test performance    # Performance tests
pnpm exec playwright test workflows      # User workflow tests

# Debug mode
pnpm exec playwright test --debug

# UI mode
pnpm exec playwright test --ui
```

### Accessibility Testing

```bash
# Automated accessibility checks
pnpm test:a11y

# Manual testing checklist
# - Keyboard navigation (Tab/Shift+Tab)
# - Screen reader compatibility (NVDA/VoiceOver)
# - High contrast mode
# - 200% zoom level
# - Color-blind simulation
```

## Performance Optimization

### Development Monitoring

```bash
# Bundle analyzer
pnpm build:analyze

# Performance testing
pnpm test:performance

# Lighthouse CI (in CI/CD)
pnpm lighthouse
```

### Performance Targets

- **Initial Layout**: ≤ 1500ms (medium graphs)
- **Interactions**: ≤ 16ms/frame (60 FPS)
- **Bundle Size**: ≤ 500KB gzipped
- **Memory Usage**: ≤ 100MB (1000-node graph)

### Optimization Strategies

1. **Layout Caching**: Cache ELK.js results by content hash
2. **Web Workers**: Offload layout computation
3. **Virtualization**: Render only visible elements for large graphs
4. **Code Splitting**: Route and component-level splitting
5. **Asset Optimization**: Image compression, font subsetting

## Deployment

### Production Build

```bash
# Standard production build
pnpm build

# Verify build output
pnpm start

# Health check
curl http://localhost:3000/api/health
```

### Environment-Specific Builds

```bash
# Staging environment
NODE_ENV=staging pnpm build

# Production with overlays enabled
NEXT_PUBLIC_ENABLE_OVERLAYS=true pnpm build

# Static export for CDN
pnpm build && pnpm export
```

### Deployment Targets

- **Vercel**: Automatic deployment from Git
- **Netlify**: Static site deployment
- **Docker**: Container deployment
- **Self-hosted**: Node.js server deployment

## Privacy & Security Compliance

### Build-time Security Checks

```bash
# Dependency vulnerability audit
pnpm audit

# License compliance check
pnpm licenses list

# Security headers validation
pnpm security:headers
```

### Privacy Verification

```bash
# Network request monitoring
pnpm test:privacy

# Data exfiltration check
pnpm test:data-isolation

# Overlay consent verification
pnpm test:overlay-privacy
```

## Troubleshooting

### Common Build Issues

#### Node.js Version Mismatch
```bash
# Check version
node --version  # Should be 18.x or higher

# Use nvm if needed
nvm use 18
```

#### Dependency Issues
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install --frozen-lockfile

# Check for peer dependency conflicts
pnpm install --shamefully-hoist
```

#### TypeScript Errors
```bash
# Clear Next.js cache
rm -rf .next

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

#### Performance Issues
```bash
# Check bundle size
pnpm build:analyze

# Profile build performance
NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# Check for memory leaks in tests
pnpm test --detectOpenHandles
```

### Development Server Issues

#### Port Conflicts
```bash
# Use different port
pnpm dev -- --port 3001

# Or set environment variable
PORT=3001 pnpm dev
```

#### File System Access API Testing
```bash
# Requires HTTPS in some browsers
pnpm dev:https

# Use localhost, not 127.0.0.1
# Some browsers restrict File System Access to secure contexts
```

#### Hot Reload Not Working
```bash
# Check file watching limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Clear Next.js cache
rm -rf .next
```

## IDE Configuration

### VS Code Settings

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["javascript", "typescript", "jsx", "tsx"],
  "eslint.autoFixOnSave": true
}
```

### Recommended Extensions

- **ESLint**: dbaeumer.vscode-eslint
- **Prettier**: esbenp.prettier-vscode
- **TypeScript**: ms-vscode.vscode-typescript-next
- **Tailwind CSS**: bradlc.vscode-tailwindcss
- **axe Accessibility**: deque-systems.vscode-axe-linter

## CI/CD Integration

### GitHub Actions

```yaml
# Example workflow
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test:coverage
      - run: pnpm build
      
      - name: E2E Tests
        run: |
          pnpm exec playwright install
          pnpm exec playwright test
```

### Quality Gates

- **Linting**: ESLint + jsx-a11y rules must pass
- **Type Checking**: No TypeScript errors
- **Tests**: >80% coverage, all tests pass
- **Accessibility**: axe-core checks pass
- **Performance**: Bundle size within limits
- **Security**: No high/critical vulnerabilities

## Release Process

### Version Management

```bash
# Version bump (follows semantic versioning)
pnpm version patch   # Bug fixes
pnpm version minor   # New features
pnpm version major   # Breaking changes

# Pre-release
pnpm version prerelease --preid=beta
```

### Release Checklist

1. **Code Quality**: All tests pass, linting clean
2. **Documentation**: README, CHANGELOG updated
3. **Accessibility**: Manual testing completed
4. **Performance**: Benchmarks meet targets
5. **Privacy**: Data handling verified
6. **Security**: Vulnerability scan clean
7. **Cross-browser**: Tested on target browsers

### Deployment Steps

```bash
# 1. Final testing
pnpm test && pnpm exec playwright test

# 2. Production build
pnpm build

# 3. Deploy to staging
pnpm deploy:staging

# 4. Smoke tests on staging
pnpm test:smoke --env=staging

# 5. Deploy to production
pnpm deploy:production

# 6. Post-deployment verification
pnpm test:smoke --env=production
```

## Maintenance

### Regular Tasks

```bash
# Weekly: Update dependencies
pnpm update

# Monthly: Security audit
pnpm audit

# Quarterly: Major dependency updates
pnpm outdated
# Review and update major versions carefully
```

### Monitoring

- **Performance**: Bundle size tracking
- **Security**: Automated vulnerability scanning
- **Accessibility**: Lighthouse CI integration
- **Usage**: Analytics for feature adoption

This build documentation ensures consistent development practices while maintaining the privacy-first, accessibility-focused principles of Git Visualizer.
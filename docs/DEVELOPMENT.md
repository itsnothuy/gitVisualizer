# Development Guide

This guide ensures seamless development across PRs for the Git Visualizer project.

## Quick Start

### Option 1: Automated Setup
Run the development startup script:
```bash
./scripts/dev-start.sh
```

### Option 2: Manual Setup
```bash
# Install dependencies
pnpm install

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Start development server
pnpm dev
```

## Development Workflow

### Daily Development
1. **Start the project**: `pnpm dev`
2. **Run tests**: `pnpm test`
3. **Check types**: `pnpm typecheck`
4. **Lint code**: `pnpm lint`

### Before Creating a PR
1. **Run full validation**: `pnpm validate`
2. **Build the project**: `pnpm build`
3. **Run E2E tests**: `pnpm test:e2e`

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with Turbopack |
| `pnpm dev:https` | Start development server with HTTPS |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm validate` | Run all validation checks |

## Environment Setup

### Required Tools
- Node.js 18.18+
- pnpm (package manager)
- VS Code (recommended)

### VS Code Extensions
The project includes recommended extensions in `.vscode/extensions.json`:
- Tailwind CSS IntelliSense
- Prettier
- Playwright Test for VS Code
- TypeScript and JavaScript
- Code Spell Checker

### Environment Variables
Create a `.env.local` file for local development:
```env
# Optional: Enable overlay features (GitHub/GitLab integration)
NEXT_PUBLIC_ENABLE_OVERLAYS=false

# Optional: Enable debug logging
NEXT_PUBLIC_DEBUG=false
```

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Type checking errors**
   ```bash
   pnpm typecheck
   ```

3. **Linting errors**
   ```bash
   pnpm lint --fix
   ```

4. **Build failures**
   ```bash
   rm -rf .next
   pnpm build
   ```

5. **Dependency issues**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### Performance Optimization
- Use Turbopack for faster development builds
- Enable experimental optimizations in `next.config.ts`
- Leverage VS Code's TypeScript language server

## Git Workflow

### Branch Naming
- `feat/description` - New features
- `fix/description` - Bug fixes
- `chore/description` - Maintenance tasks
- `docs/description` - Documentation updates

### Commit Messages
Follow Conventional Commits:
- `feat: add new feature`
- `fix: resolve bug`
- `chore: update dependencies`
- `docs: update README`

### Pre-commit Checks
The project validates:
- TypeScript compilation
- ESLint rules
- Test execution
- Build success
# Git Ingestion Library

Privacy-first Git repository ingestion for browser-based applications.

## Overview

This library provides two primary methods for accessing Git repositories:

1. **Local Access**: Direct access to local repositories via File System Access API
2. **Remote Cloning**: Shallow cloning of remote repositories into browser storage (OPFS)

## Features

- ✅ **Privacy-First**: No data leaves the device by default
- ✅ **Type-Safe**: Full TypeScript support with comprehensive types
- ✅ **Error Handling**: Detailed error types and messages
- ✅ **Browser Support**: Feature detection with graceful fallbacks
- ✅ **Shallow Cloning**: Efficient cloning with configurable depth
- ✅ **Progress Tracking**: Real-time progress callbacks for clone operations
- ✅ **OPFS Support**: Uses Origin Private File System for better performance

## Modules

### `local.ts` - Local Repository Access

Functions for accessing local Git repositories via File System Access API.

**Key Functions:**
- `isFileSystemAccessSupported()` - Check browser support
- `pickLocalRepoDir()` - Prompt user to select a directory
- `isGitRepository()` - Validate a directory is a Git repository

**Browser Support:** Chrome 86+, Edge 86+, Safari 15.2+ (partial)

### `remote.ts` - Remote Repository Cloning

Functions for cloning remote Git repositories using isomorphic-git + LightningFS.

**Key Functions:**
- `shallowClone()` - Clone a repository with configurable depth
- `isOPFSAvailable()` - Check OPFS support

**Note:** Requires CORS proxy for cross-origin repositories.

### `types.d.ts` - Type Definitions

TypeScript definitions for File System Access API.

## Usage

See [docs/examples/ingestion-usage.md](../../../docs/examples/ingestion-usage.md) for detailed usage examples.

### Quick Example

```typescript
import { pickLocalRepoDir, isGitRepository } from "./local";

async function openRepository() {
  const result = await pickLocalRepoDir();
  
  if (result.handle) {
    const isValid = await isGitRepository(result.handle);
    if (isValid) {
      console.log("Valid repository:", result.handle.name);
    }
  } else if (result.error) {
    console.error(result.error.message);
  }
}
```

## Testing

Tests are located in `__tests__/`:
- `local.test.ts` - Tests for local repository access
- `remote.test.ts` - Tests for remote cloning

Run tests:
```bash
pnpm test git
```

## Privacy & Security

1. **Local Access**:
   - Read-only by default
   - Permission requested per session
   - No data persistence outside OPFS

2. **Remote Cloning**:
   - Uses browser OPFS storage
   - No server-side processing
   - CORS proxy may be required

3. **No Data Exfiltration**:
   - All operations are local
   - No analytics or telemetry
   - No third-party tracking

## HTTPS Requirement

File System Access API requires HTTPS. For local development:

```bash
pnpm dev:https
```

## Browser Compatibility

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| File System Access | 86+ | 86+ | 15.2+ (partial) | ❌ |
| OPFS | 86+ | 86+ | 15.2+ | 111+ |
| isomorphic-git | ✅ | ✅ | ✅ | ✅ |

## References

- [File System Access API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)
- [isomorphic-git Browser Docs](https://isomorphic-git.org/docs/en/browser)
- [OPFS - web.dev](https://web.dev/articles/origin-private-file-system)

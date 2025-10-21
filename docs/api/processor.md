# Git Repository Processor

The Git Repository Processor is a core module that converts Git repositories into DAG (Directed Acyclic Graph) visualization data. It uses `isomorphic-git` to parse Git objects and provides a unified interface for visualization.

## Features

- **Local Repository Processing**: Parse repositories from FileSystemDirectoryHandle
- **Isomorphic-git Integration**: Use browser-compatible Git parsing
- **DAG Model Building**: Convert Git commits, branches, and tags to visualization format
- **Performance Monitoring**: Track processing metrics and generate warnings
- **Progress Callbacks**: Monitor processing progress in real-time
- **LFS Detection**: Identify Git LFS usage and warn users
- **Shallow Clone Detection**: Detect and warn about shallow clones
- **Incremental Processing**: Handle large repositories with configurable limits

## API Reference

### `processLocalRepository(handle, options?)`

Process a local Git repository from a FileSystemDirectoryHandle.

**Parameters:**
- `handle: FileSystemDirectoryHandle` - Directory handle to repository root
- `options?: ProcessorOptions` - Processing options
  - `maxCommits?: number` - Maximum commits to process (default: 10000)
  - `onProgress?: (progress: ProcessProgress) => void` - Progress callback
  - `detectLFS?: boolean` - Enable LFS detection (default: true)
  - `signal?: AbortSignal` - Cancellation signal

**Returns:** `Promise<ProcessedRepository>`

**Example:**
```typescript
import { processLocalRepository } from "@/lib/git/processor";
import { pickLocalRepoDir } from "@/lib/git/local";

const result = await pickLocalRepoDir();
if (result.handle) {
  const processed = await processLocalRepository(result.handle, {
    maxCommits: 5000,
    onProgress: (progress) => {
      console.log(`${progress.phase}: ${progress.percentage}%`);
    }
  });
  
  // Access DAG nodes for visualization
  const { nodes } = processed.dag;
}
```

### `buildDagModel(commits, branches, tags)`

Build a DAG model from Git commits, branches, and tags.

**Parameters:**
- `commits: GitCommit[]` - Array of Git commits
- `branches: GitBranch[]` - Array of Git branches
- `tags: GitTag[]` - Array of Git tags

**Returns:** `DagNode[]` - Array of DAG nodes for visualization

## Related

- [Repository Context Provider](./repository-context.md)
- [File System Access API Integration](../../src/lib/git/local.ts)

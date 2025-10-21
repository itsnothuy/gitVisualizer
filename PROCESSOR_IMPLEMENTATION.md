# Git Repository Processor Implementation

This document describes the implementation of the Git Repository Processor for real repository visualization in Git Visualizer.

## Overview

The Git Repository Processor converts Git repositories into DAG (Directed Acyclic Graph) visualization data. It provides:

1. **Core Processing** - Parse Git objects using isomorphic-git
2. **State Management** - React Context for repository state
3. **Performance Monitoring** - Track metrics and generate warnings
4. **Privacy-First** - All processing happens in-browser

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   User Interface                         │
│  (Components using useRepository hook)                   │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│          Repository Context Provider                     │
│  • State management                                      │
│  • Loading states                                        │
│  • Error handling                                        │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│          Git Repository Processor                        │
│  • processLocalRepository()                              │
│  • buildDagModel()                                       │
│  • Performance monitoring                                │
│  • LFS detection                                         │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│              isomorphic-git                              │
│  • Read commits, branches, tags                          │
│  • Parse Git objects                                     │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│       File System Access API                             │
│  • Local repository access                               │
│  • Read-only by default                                  │
└──────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Git Repository Processor (`src/lib/git/processor.ts`)

**Purpose**: Core processing logic to convert Git repositories to DAG data.

**Key Functions**:
- `processLocalRepository(handle, options)` - Process repository from FileSystemDirectoryHandle
- `buildDagModel(commits, branches, tags)` - Convert Git data to visualization format
- `createFSFromHandle(handle)` - Adapt File System Access API for isomorphic-git

**Features**:
- Incremental processing with progress callbacks
- Performance monitoring and metrics
- LFS detection
- Shallow clone detection
- Configurable commit limits
- Error handling

**Test Coverage**: 20 tests covering:
- DAG model building
- Repository processing
- Edge cases (empty repos, merge commits)
- Error scenarios
- Performance warnings

### 2. Repository Context Provider (`src/lib/repository/RepositoryContext.tsx`)

**Purpose**: React state management for repository processing.

**Key Features**:
- Repository loading and clearing
- Loading state management
- Progress tracking
- Error handling
- React hook API (`useRepository`)

**Test Coverage**: 10 tests covering:
- Hook validation
- Repository loading
- State management
- Error handling
- Progress callbacks

### 3. File System Adapter

**Purpose**: Bridge between File System Access API and isomorphic-git.

**Implementation**: Custom filesystem interface that:
- Caches directory handles for performance
- Implements all required fs operations
- Handles path resolution
- Supports read operations

**Key Operations**:
- `readFile` - Read file content
- `readdir` - List directory entries
- `stat` - Get file/directory metadata
- `lstat` - Get file metadata (no symlink follow)

## Data Flow

1. **User Action**: User picks a repository directory via File System Access API
2. **Loading**: Repository Context calls `processLocalRepository()`
3. **Parsing**: Processor reads Git objects using isomorphic-git
   - List branches and resolve refs
   - List tags and resolve refs
   - Walk commit history from all branches
   - Read commit metadata
4. **Building**: Processor builds DAG model
   - Convert commits to DagNodes
   - Attach branch/tag refs
   - Truncate commit messages
5. **Completion**: Context updates state with processed data
6. **Visualization**: Components render DAG using ELK layout

## Performance Optimizations

### 1. Configurable Limits
- Default: 10,000 commits
- Adjustable via `maxCommits` option
- Warning when limit is reached

### 2. Progress Tracking
- Phase-based progress (loading, parsing, building)
- Periodic updates during commit walking
- Percentage-based progress bar

### 3. Caching
- Directory handle caching in FS adapter
- Reduces repeated getDirectoryHandle calls

### 4. Early Termination
- Support for AbortSignal
- User can cancel long-running operations

## Privacy & Security

### Privacy-First Design
- All processing in-browser
- No data leaves the device
- No server-side processing

### File System Access
- Read-only access by default
- Permission requested per session
- No persistence of handles

### LFS Handling
- Detection of Git LFS usage
- Warning displayed to users
- No automatic LFS pointer resolution

## Usage Examples

### Basic Usage

```typescript
import { RepositoryProvider, useRepository } from "@/lib/repository";
import { pickLocalRepoDir } from "@/lib/git/local";

// Wrap app with provider
<RepositoryProvider>
  <App />
</RepositoryProvider>

// Use in component
function MyComponent() {
  const { loadRepository, currentRepository } = useRepository();
  
  const handleLoad = async () => {
    const result = await pickLocalRepoDir();
    if (result.handle) {
      await loadRepository(result.handle);
    }
  };
  
  return (
    <div>
      <button onClick={handleLoad}>Load Repository</button>
      {currentRepository && (
        <div>
          Commits: {currentRepository.metadata.commitCount}
        </div>
      )}
    </div>
  );
}
```

### With Progress Tracking

```typescript
function MyComponent() {
  const { loadRepository, progress } = useRepository();
  
  const handleLoad = async () => {
    const result = await pickLocalRepoDir();
    if (result.handle) {
      await loadRepository(result.handle, {
        maxCommits: 5000,
        detectLFS: true,
      });
    }
  };
  
  return (
    <div>
      {progress && (
        <div>
          <p>{progress.message}</p>
          <progress value={progress.percentage} max={100} />
        </div>
      )}
    </div>
  );
}
```

### Direct Processor Usage

```typescript
import { processLocalRepository } from "@/lib/git/processor";

const processed = await processLocalRepository(handle, {
  maxCommits: 1000,
  onProgress: (progress) => {
    console.log(`${progress.phase}: ${progress.percentage}%`);
  },
});

// Access DAG nodes
const { nodes } = processed.dag;
```

## Testing

### Running Tests

```bash
# All tests
pnpm test

# Processor tests only
pnpm test src/lib/git/__tests__/processor.test.ts

# Context tests only
pnpm test src/lib/repository/__tests__/RepositoryContext.test.tsx
```

### Test Coverage

- **Total Tests**: 30 (20 processor + 10 context)
- **Coverage Areas**:
  - DAG model building
  - Repository processing
  - State management
  - Error handling
  - Progress tracking
  - Edge cases

## Documentation

### API Documentation
- [Processor API](./docs/api/processor.md)
- [Repository Context API](./docs/api/repository-context.md)

### Examples
- [Repository Processor Example Component](./docs/examples/RepositoryProcessorExample.tsx)

## Future Enhancements

### Planned Features
1. **Incremental Updates**: Re-process only new commits
2. **Background Processing**: Use Web Workers for large repos
3. **Caching**: Cache processed DAGs in IndexedDB
4. **Remote Integration**: Support for cloned repositories
5. **Advanced Filtering**: Filter by author, date, path

### Performance Improvements
1. **Lazy Loading**: Load commits on-demand
2. **Virtualization**: Render only visible nodes
3. **WebAssembly**: Use WASM for Git parsing
4. **Streaming**: Stream large repositories

## Troubleshooting

### Common Issues

**Issue**: "Permission denied" error
**Solution**: Ensure File System Access API is supported and user grants permission

**Issue**: Slow processing for large repositories
**Solution**: Reduce `maxCommits` limit or use progress callbacks to show loading state

**Issue**: "Repository is a shallow clone" warning
**Solution**: Normal for cloned repositories. Full history may not be available.

**Issue**: Memory issues with very large repositories
**Solution**: Use `maxCommits` to limit memory usage

## Contributing

When contributing to the processor:

1. **Add Tests**: All new features must have tests
2. **Update Docs**: Keep API documentation up-to-date
3. **Performance**: Consider impact on large repositories
4. **Privacy**: Ensure no data leaves the browser
5. **Type Safety**: Maintain strict TypeScript types

## Related

- [Ingestion Implementation](./INGESTION_FALLBACKS_SUMMARY.md)
- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Performance Guidelines](./docs/PERF.md)

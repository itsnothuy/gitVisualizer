# Repository Context Provider

The Repository Context Provider is a React context that manages repository state and provides actions for loading and processing repositories.

## Features

- **State Management**: Centralized repository state
- **Loading States**: Track processing progress
- **Error Handling**: Graceful error management
- **Progress Monitoring**: Real-time progress updates
- **Easy Integration**: Simple React hook API

## Installation

```typescript
import { RepositoryProvider, useRepository } from "@/lib/repository";
```

## Usage

### Setup Provider

Wrap your application with the `RepositoryProvider`:

```tsx
import { RepositoryProvider } from "@/lib/repository";

function App() {
  return (
    <RepositoryProvider>
      <YourApp />
    </RepositoryProvider>
  );
}
```

### Use the Hook

Access repository state and actions via the `useRepository` hook:

```tsx
import { useRepository } from "@/lib/repository";
import { pickLocalRepoDir } from "@/lib/git/local";

function RepositoryLoader() {
  const {
    currentRepository,
    isLoading,
    error,
    progress,
    loadRepository,
    clearRepository,
  } = useRepository();

  const handleLoadRepository = async () => {
    const result = await pickLocalRepoDir();
    if (result.handle) {
      await loadRepository(result.handle, {
        maxCommits: 5000,
        detectLFS: true,
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <p>Loading repository...</p>
        {progress && (
          <div>
            <p>{progress.message}</p>
            <progress value={progress.percentage} max={100} />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (currentRepository) {
    return (
      <div>
        <h2>{currentRepository.metadata.name}</h2>
        <p>Commits: {currentRepository.metadata.commitCount}</p>
        <p>Branches: {currentRepository.metadata.branchCount}</p>
        <button onClick={clearRepository}>Clear</button>
      </div>
    );
  }

  return <button onClick={handleLoadRepository}>Load Repository</button>;
}
```

## API Reference

### `useRepository()`

Hook to access the repository context.

**Returns:** `RepositoryContextValue`

**Throws:** Error if used outside of `RepositoryProvider`

### `RepositoryContextValue`

```typescript
interface RepositoryContextValue {
  currentRepository: ProcessedRepository | null;
  isLoading: boolean;
  error: string | null;
  progress: ProcessProgress | null;
  handle: FileSystemDirectoryHandle | null;
  
  loadRepository: (handle: FileSystemDirectoryHandle, options?: LoadRepositoryOptions) => Promise<void>;
  clearRepository: () => void;
  clearError: () => void;
}
```

### `LoadRepositoryOptions`

```typescript
interface LoadRepositoryOptions {
  maxCommits?: number;
  detectLFS?: boolean;
}
```

## Testing

The context includes comprehensive tests (10 test cases):
- Hook validation
- Repository loading
- Error handling
- State management
- Progress callbacks

Run tests:
```bash
pnpm test src/lib/repository/__tests__/RepositoryContext.test.tsx
```

## Related

- [Git Repository Processor](./processor.md)
- [File System Access API Integration](../../src/lib/git/local.ts)

# Sandbox Mode Documentation

## Overview

Sandbox Mode provides an interactive Git environment where you can practice Git commands, experiment with workflows, and share scenarios—all without needing a local repository. Everything runs in-memory with full persistence, undo/redo support, and shareable permalinks.

## Features

### 1. Live Command Execution

Execute real Git commands in a safe, isolated environment:

- `commit -m "message"` - Create commits
- `branch <name>` - Create/list branches
- `checkout <branch>` - Switch branches
- `merge <branch>` - Merge branches
- `reset <commit>` - Reset to a commit
- `tag <name>` - Create tags
- And more...

All commands operate on an in-memory Git state and update the visualization in real-time.

### 2. Persistent Sessions

Sessions are automatically saved to IndexedDB and persist across page reloads:

- **Command History**: All executed commands are tracked
- **Undo/Redo Stack**: Full undo/redo capability with unlimited depth
- **State Snapshots**: Git state is automatically saved
- **Session Metadata**: Track creation time, command count, commits, and branches

### 3. Export & Import

#### Export State

Export your current Git state as a JSON file:

1. Click the **Export** button in the toolbar
2. A `.json` file will be downloaded containing:
   - All commits with messages, parents, and timestamps
   - All branches with their target commits
   - All tags
   - Current HEAD position

**Example export:**

```json
{
  "commits": [
    {
      "id": "abc123",
      "parents": [],
      "message": "Initial commit",
      "timestamp": 1234567890
    }
  ],
  "branches": [
    {
      "name": "main",
      "target": "abc123"
    }
  ],
  "tags": [],
  "head": {
    "type": "branch",
    "name": "main"
  }
}
```

#### Import State

Import a previously exported JSON file or create custom scenarios:

1. Click the **Import** button
2. Select a valid JSON file
3. The sandbox will load the state and update the graph

**Privacy Note**: When importing, all data stays local. No information is sent to external servers.

### 4. Share Links

Generate shareable permalinks to share sandbox scenarios:

1. Click the **Share** button
2. The current state is encoded into a URL parameter
3. The link is automatically copied to your clipboard
4. Share the link with others

**URL Format:**
```
https://example.com/sandbox?state=<base64-encoded-state>
```

**Limitations:**

- **URL Length**: Maximum ~2000 characters (browser limitation)
- **State Size**: Complex scenarios with many commits may exceed the limit
- **Privacy**: By default, commit messages are included. For privacy, export as JSON instead and share manually

**State Compression**: The system automatically compresses states by removing optional fields to maximize compatibility.

### 5. Undo/Redo History

Full undo/redo support with visual feedback:

- **Undo**: Revert the last command (`Ctrl+Z` or click Undo button)
- **Redo**: Re-apply an undone command (`Ctrl+Shift+Z` or click Redo button)
- **History Panel**: Shows available undo/redo count and last executed command
- **Tooltips**: Hover over history buttons to see which command will be undone/redone

**History Stack**:
- Unlimited depth (configurable, default: 50)
- Persists across page reloads
- Cleared when starting a new session

### 6. Custom Scenario Creation

Create custom learning scenarios:

#### Start from Blank

1. Click **Reset** to clear the sandbox
2. The sandbox resets to a single initial commit
3. Build your scenario from scratch

#### Pre-seed a Scenario

Create a JSON file with a predefined Git state:

```json
{
  "commits": [
    { "id": "c1", "parents": [], "message": "Setup", "timestamp": 1000000 },
    { "id": "c2", "parents": ["c1"], "message": "Add feature", "timestamp": 1000001 },
    { "id": "c3", "parents": ["c1"], "message": "Fix bug", "timestamp": 1000002 }
  ],
  "branches": [
    { "name": "main", "target": "c2" },
    { "name": "bugfix", "target": "c3" }
  ],
  "tags": [
    { "name": "v1.0", "target": "c1" }
  ],
  "head": {
    "type": "branch",
    "name": "main"
  }
}
```

Then import it using the **Import** button.

## JSON Schema

### GitStateSnapshot

```typescript
interface GitStateSnapshot {
  commits: SerializedCommit[];
  branches: SerializedBranch[];
  tags: SerializedTag[];
  head: SerializedHead;
}

interface SerializedCommit {
  id: string;              // Commit SHA
  parents: string[];       // Parent commit SHAs
  message: string;         // Commit message
  author?: string;         // Optional author name
  timestamp: number;       // Unix timestamp (milliseconds)
}

interface SerializedBranch {
  name: string;            // Branch name
  target: string;          // Commit SHA
}

interface SerializedTag {
  name: string;            // Tag name
  target: string;          // Commit SHA
  message?: string;        // Optional tag message
}

type SerializedHead =
  | { type: 'branch'; name: string }      // HEAD on a branch
  | { type: 'detached'; commit: string }  // Detached HEAD
```

### Validation Rules

When creating or importing JSON:

1. **Commit IDs**: Must be unique strings
2. **Parents**: Must reference existing commit IDs
3. **Branches**: Target must reference an existing commit
4. **Tags**: Target must reference an existing commit
5. **HEAD**: Must reference an existing branch or commit

## Keyboard Shortcuts

- **Arrow Up/Down**: Navigate command history in console
- **Escape**: Clear command input
- **Tab**: Auto-complete (future feature)
- **Ctrl+Z**: Undo (when history panel is focused)
- **Ctrl+Shift+Z**: Redo (when history panel is focused)

## Accessibility

Sandbox Mode is designed to be fully accessible:

- **Keyboard Navigation**: All features accessible via keyboard
- **Screen Reader Support**: ARIA labels and live regions for state updates
- **Focus Management**: Logical tab order and visible focus indicators
- **Toast Notifications**: Success/error messages announced to screen readers

## Best Practices

### For Learning

1. Start simple: Begin with basic commands (commit, branch, checkout)
2. Use undo/redo to experiment safely
3. Export interesting scenarios for later study
4. Share scenarios with peers for collaborative learning

### For Teaching

1. Create pre-seeded scenarios for specific lessons
2. Use permalinks to distribute exercises
3. Export "before" and "after" states for comparisons
4. Build a library of common Git workflows

### For Privacy

1. **Strip messages**: When sharing, consider privacy of commit messages
2. **Use Export**: For sensitive scenarios, export as JSON and share manually
3. **Local-only**: Remember that sessions persist in IndexedDB on your device
4. **Clear sessions**: Use browser dev tools to clear IndexedDB if needed

## Troubleshooting

### Share Link Too Long

**Problem**: State is too complex for URL encoding

**Solutions**:
1. Use **Export** instead and share the JSON file
2. Simplify the scenario (fewer commits/branches)
3. Remove unnecessary tags or branches

### Import Fails

**Problem**: JSON validation error

**Solutions**:
1. Verify JSON syntax is valid
2. Check all commit IDs are unique
3. Ensure all parent/target references exist
4. Use a JSON validator

### Session Lost After Reload

**Problem**: IndexedDB not supported or disabled

**Solutions**:
1. Check browser compatibility
2. Verify IndexedDB is enabled in browser settings
3. Check for browser extensions that block storage

### Undo/Redo Not Working

**Problem**: History stack is empty

**Solutions**:
1. Execute some commands first to build history
2. Check that you haven't cleared history
3. Refresh the page to restore from IndexedDB

## Technical Details

### Storage

- **IndexedDB**: Used for session persistence
- **Database**: `gitvisualizerSandbox`
- **Store**: `sessions`
- **Quota**: Subject to browser storage quotas (typically ~50MB+)

### State Management

- **In-Memory**: GitState stored in React state
- **Immutable Updates**: State changes create new objects
- **History**: Cloned snapshots stored for undo/redo

### Performance

- **Command Execution**: < 10ms for most operations
- **State Updates**: < 50ms for graph re-rendering
- **Export/Import**: < 100ms for typical scenarios

## Future Enhancements

- [ ] GitHub Gist integration for large states
- [ ] Scenario templates library
- [ ] Command auto-completion
- [ ] Visual merge conflict resolution
- [ ] Collaborative sessions
- [ ] Replay mode for animated playback

## See Also

- [Command Reference](./COMMANDS.md)
- [Tutorial System](./TUTORIAL_SYSTEM.md)
- [Architecture](./ARCHITECTURE.md)

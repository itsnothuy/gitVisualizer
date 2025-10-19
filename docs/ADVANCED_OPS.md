# Advanced Git Operations

This document describes the advanced Git features available in the Git Visualizer, including interactive rebase, conflict resolution, and remote tracking branches.

## Overview

The Git Visualizer supports advanced Git operations that go beyond basic commits and branches:

- **Interactive Rebase**: Reorder, squash, edit, or drop commits with a visual UI
- **Conflict Resolution**: Simulate and resolve merge/rebase conflicts 
- **Remote Tracking**: Work with remotes via fetch, pull, and push operations
- **Relative References**: Navigate commits using HEAD~n and HEAD^n notation

All advanced operations respect the privacy-first principles: operations occur in-memory in sandbox mode, and remote operations use read-only scopes when connected to actual repositories.

## Interactive Rebase

### Starting an Interactive Rebase

To start an interactive rebase, use the `git rebase -i` command:

```bash
git rebase -i <base-commit>
```

For example:
```bash
git rebase -i HEAD~3
```

This will open the Interactive Rebase modal showing all commits between the base commit and HEAD.

### Interactive Rebase UI

The Interactive Rebase modal provides:

- **List of commits**: Each commit shows its SHA, message, and current operation
- **Operation selection**: Choose from pick, squash, edit, drop, or reword for each commit
- **Drag-and-drop reordering**: Reorder commits by dragging them to new positions
- **Keyboard accessible**: All operations can be performed via keyboard navigation

#### Available Operations

- **pick**: Apply the commit as-is (default)
- **squash**: Combine this commit with the previous one
- **edit**: Pause at this commit to make changes (treated as pick in current implementation)
- **drop**: Remove this commit from the history
- **reword**: Change the commit message (treated as pick in current implementation)

### Executing the Rebase

Once you've configured the operations:

1. Click "Start Rebase" to execute the rebase with your chosen operations
2. The visualizer will apply each operation in order
3. New commits are created for picked commits
4. Squashed commits are combined into their predecessor
5. Dropped commits are skipped entirely

### Aborting a Rebase

If you need to cancel the rebase:

1. Click "Abort" in the modal, or
2. Run `git rebase --abort` in the command console

This will restore the repository to its state before the rebase began.

### Example Workflow

```bash
# Start with some commits
git commit -m "Add feature A"
git commit -m "Fix typo"
git commit -m "Add feature B"
git commit -m "Fix another typo"

# Start interactive rebase to clean up history
git rebase -i HEAD~4

# In the modal:
# - pick "Add feature A"
# - squash "Fix typo" (will combine with feature A)
# - pick "Add feature B"
# - squash "Fix another typo" (will combine with feature B)

# Click "Start Rebase"
# Result: Two clean commits, one per feature
```

## Conflict Resolution

### When Conflicts Occur

Conflicts may occur during:
- **Merge operations**: When merging branches with divergent changes
- **Rebase operations**: When rebasing commits onto a different base

The visualizer simulates conflict detection by analyzing commit metadata. In sandbox mode, conflicts are simulated randomly for demonstration purposes.

### Conflict Resolution UI

When a conflict is detected, the Conflict Resolution modal appears showing:

- **Conflicted files**: List of files with conflicts
- **Resolution status**: Visual indicator (yellow = unresolved, green = resolved)
- **Resolution options**: Choose how to resolve each file

#### Resolution Strategies

For each conflicted file, you can choose:

- **Ours**: Keep the version from the current branch/commit
- **Theirs**: Use the version from the branch/commit being merged/rebased
- **Manual**: Mark as manually resolved (requires manual intervention in real repos)

#### Bulk Resolution

Use the "Use Ours (All)" or "Use Theirs (All)" buttons to apply the same strategy to all files at once.

### Completing Conflict Resolution

Once all files are resolved:

1. Click "Continue" to proceed with the merge/rebase
2. The operation will complete with the chosen resolutions

To abandon the conflicted operation:
- Click "Abort merge" or "Abort rebase"
- The repository returns to its pre-operation state

### Privacy Note

**Important**: In sandbox mode, conflict simulation does NOT access or persist actual file contents. Conflicts are simulated based on commit metadata only. When working with real repositories, file contents remain local and are never uploaded.

## Remote Tracking Branches

### Adding a Remote

Add a remote repository:

```bash
git remote add <name> <url>
```

Example:
```bash
git remote add origin https://github.com/user/repo.git
```

### Listing Remotes

View configured remotes:

```bash
git remote
```

This shows all remote names (e.g., `origin`, `upstream`).

### Fetching from a Remote

Download commits and refs from a remote:

```bash
git fetch <remote>
```

Example:
```bash
git fetch origin
```

This creates remote tracking branches like `origin/main`, `origin/develop`, etc.

### Pulling from a Remote

Fetch and merge in one operation:

```bash
git pull <remote> <branch>
```

Example:
```bash
git pull origin main
```

This is equivalent to:
```bash
git fetch origin
git merge origin/main
```

### Pushing to a Remote

Upload local commits to a remote:

```bash
git push <remote> <branch>
```

Example:
```bash
git push origin main
```

### Remote Tracking Branches in the Visualizer

Remote tracking branches appear in the graph with special styling:

- **Naming**: Remote branches use the format `remote/branch` (e.g., `origin/main`)
- **Visualization**: Displayed as separate lanes or with colored tags
- **Ahead/Behind counts**: Shows how many commits local branches are ahead or behind their tracking branches

### Privacy & Rate Limiting

When connected to real Git hosting providers:

- **Read-only scopes**: OAuth tokens use minimal read-only permissions
- **Rate limiting**: Respects GitHub/GitLab rate limits with exponential backoff
- **No data upload**: Repository contents never leave the device without explicit consent
- **Overlay opt-in**: Remote features are opt-in and can be globally disabled

## Relative References

### HEAD Notation

Navigate commits relative to HEAD:

- `HEAD`: Current commit
- `HEAD~1` or `HEAD~`: Parent of current commit
- `HEAD~2`: Grandparent of current commit
- `HEAD~n`: n commits before current

### Caret Notation

For merge commits with multiple parents:

- `HEAD^1` or `HEAD^`: First parent (same as HEAD~1)
- `HEAD^2`: Second parent (other branch that was merged)

### Using Relative References

Relative references work with any Git command:

```bash
# Reset to 3 commits ago
git reset HEAD~3

# Show a previous commit
git log HEAD~5

# Rebase onto a parent commit
git rebase -i HEAD~4
```

### Graph Highlighting

When you type a relative reference in the command console, the visualizer:
1. Resolves the reference to a specific commit
2. Highlights that commit in the graph
3. Shows the commit details in the info panel

## Accessibility

All advanced operation UIs follow WCAG 2.2 AA accessibility standards:

### Interactive Rebase Modal
- Keyboard navigation with Tab/Shift+Tab
- Arrow keys and Enter for selection
- Screen reader announcements for commit operations
- Visible focus indicators
- ARIA labels for all interactive elements

### Conflict Resolution Modal
- Keyboard-accessible file list
- Tab navigation between resolution options
- Screen reader support for conflict status
- Color-independent status indicators (dots + text)

### General Accessibility
- All modals can be closed with Escape key
- Focus management when modals open/close
- Descriptive labels for all buttons and controls
- No information conveyed by color alone

## Animation Support

Interactive rebase operations integrate with the LGB (LearnGitBranching) animation system:

### Ghost Copy Animations

When commits are rebased:
1. Original commits fade and become semi-transparent
2. "Ghost" copies show the transition
3. New commits appear in their final positions
4. Branch labels animate to new locations

### Animation Timing

- Default duration: 480ms per commit operation
- Respects `prefers-reduced-motion` user preference
- Can be disabled in settings

### Animation Callbacks

The animation system triggers on:
- Commit creation during rebase
- Branch label movements
- Commit fading (for dropped commits)
- Merge commit creation (with dual parent arcs)

## Examples

### Example 1: Clean Up Feature Branch History

```bash
# Create a messy feature branch
git checkout -b feature
git commit -m "Start feature"
git commit -m "WIP"
git commit -m "Fix bug"
git commit -m "More WIP"
git commit -m "Finish feature"

# Clean it up
git rebase -i main

# In the modal:
# - pick "Start feature"
# - drop "WIP"
# - pick "Fix bug"
# - drop "More WIP"
# - squash "Finish feature" (combines with "Fix bug" or make new commit)

# Result: Clean, linear history
```

### Example 2: Sync with Remote

```bash
# Add remote
git remote add origin https://github.com/user/repo.git

# Fetch latest changes
git fetch origin

# See what's new
git log origin/main

# Merge remote changes
git pull origin main

# Push your work
git push origin feature-branch
```

### Example 3: Resolve Merge Conflict

```bash
# Try to merge
git merge feature-branch

# If conflicts occur, modal appears
# Choose resolution strategy for each file
# Click "Continue" when all resolved

# Or abort if needed
# Click "Abort merge" to cancel
```

## Troubleshooting

### Rebase Issues

**Rebase not starting**
- Ensure you specify a valid base commit
- Check that there are commits between base and HEAD

**Can't abort rebase**
- Verify a rebase is in progress
- Check console for error messages

### Remote Issues

**Remote not found**
- Verify remote was added with `git remote add`
- Check spelling of remote name

**Fetch/Pull failures**
- In sandbox mode, ensure remote is configured
- For real repos, check network connectivity and credentials

### Conflict Resolution

**Can't continue with unresolved conflicts**
- All files must have a resolution strategy selected
- Check that all status indicators are green

## Best Practices

1. **Interactive Rebase**
   - Always work on a feature branch, not main
   - Rebase before merging to keep history clean
   - Test after rebase to ensure functionality preserved

2. **Conflict Resolution**
   - Read commit messages to understand changes
   - When in doubt, choose "manual" and inspect carefully
   - Test thoroughly after resolving conflicts

3. **Remote Operations**
   - Fetch regularly to stay up-to-date
   - Push your work frequently to back it up
   - Communicate with team before force-pushing

4. **Privacy**
   - Review remote permissions before connecting
   - Use sandbox mode for learning and experimentation
   - Never commit sensitive data to version control

## Implementation Notes

### Sandbox Mode

In sandbox mode (default):
- All operations are in-memory only
- No network requests are made
- Conflicts are simulated randomly
- Perfect for learning and experimentation

### Real Repository Mode

When connected to a real repository:
- Operations use isomorphic-git
- Remote operations may use overlays (opt-in)
- File contents stay local (OPFS)
- OAuth tokens are session-only

### Performance

- Interactive rebase UI supports up to ~100 commits efficiently
- Larger rebases may show loading indicators
- Animations can be disabled for better performance
- Remote operations are rate-limited to prevent API abuse

## Future Enhancements

Planned improvements:

- **Cherry-pick UI**: Visual selection of commits to cherry-pick
- **Patch mode**: Interactive staging of file changes
- **Conflict editor**: In-browser merge conflict editor
- **Advanced filters**: Filter commits by author, date, message
- **Comparison view**: Side-by-side diff viewer for commits

## See Also

- [Architecture Documentation](./ARCHITECTURE.md)
- [Animation System](../src/viz/anim/README.md)
- [Accessibility Guidelines](.github/instructions/a11y.instructions.md)
- [Privacy Policy](./PRIVACY.md)

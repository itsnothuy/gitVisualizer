# Git Commands Reference

This document lists all supported Git commands in the interactive command console.

## Core Commands

### commit
Create a new commit.

```bash
# Create a commit with message
commit -m "Your commit message"

# Stage all changes and commit
commit -a -m "Commit all changes"

# Amend the previous commit
commit --amend
commit --amend -m "New message"
```

**Options:**
- `-m <message>` or `--message <message>`: Commit message
- `-a` or `--all`: Stage all modified files
- `--amend`: Modify the previous commit

### branch
List, create, or delete branches.

```bash
# List all branches
branch

# Create a new branch
branch feature-name

# Delete a branch
branch -d feature-name

# Force delete a branch
branch -D feature-name
```

**Options:**
- `-d <name>`: Delete branch
- `-D <name>`: Force delete branch

### checkout
Switch branches or restore working tree files.

```bash
# Switch to existing branch
checkout main

# Create and switch to new branch
checkout -b feature-name

# Create/reset and switch to branch
checkout -B feature-name

# Checkout specific commit (detached HEAD)
checkout abc123
```

**Options:**
- `-b <name>`: Create and checkout new branch
- `-B <name>`: Create/reset and checkout branch

### switch
Switch to a branch (newer alternative to checkout for branches).

```bash
# Switch to existing branch
switch main

# Create and switch to new branch
switch -c feature-name

# Create/reset and switch to branch
switch -C feature-name
```

**Options:**
- `-c <name>`: Create and switch to new branch
- `-C <name>`: Create/reset and switch to branch

### merge
Join two or more development histories together.

```bash
# Merge branch into current branch
merge feature-name

# Merge without fast-forward
merge --no-ff feature-name

# Squash commits during merge
merge --squash feature-name

# Merge with custom message
merge -m "Merge message" feature-name
```

**Options:**
- `--no-ff`: Create a merge commit even if fast-forward is possible
- `--squash`: Squash all commits into one
- `-m <message>`: Custom merge commit message

### reset
Reset current HEAD to the specified state.

```bash
# Soft reset (keep changes staged)
reset --soft HEAD~1

# Hard reset (discard all changes)
reset --hard HEAD~1

# Reset to specific commit
reset abc123
```

**Options:**
- `--soft`: Keep changes in staging area
- `--hard`: Discard all changes
- Target: Commit SHA or HEAD~n notation

### revert
Create a new commit that undoes changes from a previous commit.

```bash
# Revert a specific commit
revert abc123

# Revert latest commit
revert HEAD
```

### tag
Create, list, or delete tags.

```bash
# List all tags
tag

# Create a tag at current commit
tag v1.0.0

# Create a tag at specific commit
tag v1.0.0 abc123

# Create annotated tag with message
tag -m "Release 1.0" v1.0.0
```

**Options:**
- `-m <message>`: Tag message

### status
Show the working tree status.

```bash
status
```

Shows:
- Current branch or detached HEAD state
- Staged/unstaged changes (in future versions)

### log
Show commit logs.

```bash
# Show all commits from HEAD
log

# Show commits from specific point
log HEAD~3

# Show commits from specific branch
log feature-name
```

## History Management

### undo
Undo the last command.

```bash
undo
```

Reverts to the previous state before the last command. Can be used multiple times to step backward through history.

### redo
Redo a previously undone command.

```bash
redo
```

Reapplies a command that was undone. Only works after using `undo`.

## Command Aliases

The following short aliases are supported:

- `co` → `checkout`
- `br` → `branch`
- `ci` → `commit`
- `st` → `status`

Example:
```bash
co -b feature  # Same as: checkout -b feature
```

## Special Notations

### HEAD References

- `HEAD`: Current commit
- `HEAD~1`, `HEAD~2`, etc.: Parent commits
- `HEAD^`: Same as HEAD~1

### Commit References

- Full SHA: `abc123def456...`
- Short SHA: `abc123` (first 7 characters)
- Branch name: `main`, `feature-name`
- Tag name: `v1.0.0`

## Command History Navigation

- **↑** (Up Arrow): Previous command in history
- **↓** (Down Arrow): Next command in history
- **Esc**: Clear current input

## Future Commands

The following commands are planned but not yet implemented:

### rebase
Reapply commits on top of another base.

```bash
# Rebase current branch onto main
rebase main

# Interactive rebase
rebase -i HEAD~3

# Rebase onto specific commit
rebase --onto main feature
```

### cherry-pick
Apply changes from specific commits.

```bash
# Cherry-pick single commit
cherry-pick abc123

# Cherry-pick multiple commits
cherry-pick abc123 def456
```

### Remote Operations

```bash
# Push to remote
push origin main
push --force

# Pull from remote
pull origin main
pull --rebase

# Fetch from remote
fetch origin

# Clone repository
clone https://github.com/user/repo.git
```

### Other Commands

```bash
# Describe current commit
describe

# Show help
help [command]
```

## Examples

### Basic Workflow

```bash
# Create and switch to feature branch
checkout -b feature

# Make some commits
commit -m "Add feature"
commit -m "Fix bug"

# Switch back to main
checkout main

# Merge feature branch
merge feature

# Delete feature branch
branch -d feature
```

### Using Undo/Redo

```bash
# Make a mistake
commit -m "Wrong commit"

# Undo it
undo

# Make the correct commit
commit -m "Correct commit"
```

### Working with Tags

```bash
# Create a release tag
tag v1.0.0

# List all tags
tag

# View commits from tag
log v1.0.0
```

## Tips

1. **Command History**: Use ↑/↓ arrows to navigate through previously executed commands
2. **Undo Safety**: The undo stack keeps up to 50 previous states
3. **Detached HEAD**: When checking out a commit SHA directly, you enter "detached HEAD" state
4. **Fast-Forward Merge**: By default, merge will fast-forward if possible. Use `--no-ff` to force a merge commit
5. **Reset Modes**: `--soft` keeps changes, `--hard` discards everything

## Error Messages

Common error messages and their meanings:

- `"commit requires -m <message> or --amend"`: You must provide a commit message
- `"A branch named 'X' already exists"`: Branch name is already in use
- `"Cannot delete branch 'X' checked out at HEAD"`: You can't delete the current branch
- `"fatal: invalid reference: X"`: The branch/commit reference doesn't exist
- `"Nothing to undo"`: The undo stack is empty
- `"Nothing to redo"`: The redo stack is empty

## See Also

- [Git Official Documentation](https://git-scm.com/doc)
- [Learn Git Branching](https://learngitbranching.js.org/) - Interactive Git tutorial
- [Architecture Documentation](./ARCHITECTURE.md)

# Tutorial Levels

This directory contains tutorial levels for the Git Visualizer educational system.

## Structure

```
levels/
├── sequences/          # Level sequence definitions
│   ├── intro.json     # Introduction sequence
│   ├── rampup.json    # Ramp-up sequence
│   └── advanced.json  # Advanced sequence
├── intro1.json        # First intro level (commits)
├── intro2.json        # Second intro level (branches)
└── intro3.json        # Third intro level (merging)
```

## File Format

### Level Files

Level files are JSON documents with the following structure:

```json
{
  "id": "level-id",
  "name": {
    "en_US": "Level Name",
    "de_DE": "Level-Name"
  },
  "description": {
    "en_US": "What you'll learn"
  },
  "difficulty": "intro",
  "order": 1,
  "initialState": {
    "commits": [...],
    "branches": [...],
    "tags": [],
    "head": {...}
  },
  "goalState": {...},
  "tutorialSteps": [...],
  "solutionCommands": ["git commit"],
  "hints": [...],
  "flags": {...}
}
```

### Sequence Files

Sequence files group related levels:

```json
{
  "id": "intro",
  "name": {
    "en_US": "Introduction to Git"
  },
  "description": {
    "en_US": "Learn the basics"
  },
  "levelIds": ["intro1", "intro2", "intro3"],
  "locked": false
}
```

## Available Levels

### Introduction Sequence

1. **intro1** - Introduction to Commits
   - Learn how to make your first commit
   - Optimal: 1 command

2. **intro2** - Branching in Git
   - Learn to create and switch branches
   - Optimal: 2 commands

3. **intro3** - Merging Branches
   - Learn to merge branches together
   - Optimal: 1 command

## Creating New Levels

See the main documentation at `/docs/TUTORIAL_SYSTEM.md` for detailed instructions on creating new levels.

### Quick Start

1. Create a new JSON file in this directory (e.g., `intro4.json`)
2. Copy the structure from an existing level
3. Define your initial and goal states
4. Add tutorial steps to guide users
5. Add the level ID to the appropriate sequence file

## Localization

All user-facing text should include at least:
- `en_US` (English - United States) - **Required**
- Additional locales as available

When adding new languages, update all level files to include the new locale.

## Testing

Run level tests with:

```bash
pnpm test src/tutorial
```

Test level JSON validity with:

```bash
pnpm test:e2e tutorial-system
```

## License

These tutorial levels are part of the Git Visualizer project.

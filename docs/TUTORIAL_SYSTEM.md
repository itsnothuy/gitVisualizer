# Tutorial System Documentation

## Overview

The Tutorial System provides an interactive, guided learning experience for Git concepts. It consists of structured levels with step-by-step tutorials, demonstrations, and hands-on challenges. Progress is tracked locally and persists across sessions.

## Architecture

### Core Components

1. **Level System** (`src/tutorial/types.ts`, `src/tutorial/LevelStore.ts`)
   - Defines level structure and metadata
   - Loads levels from JSON files in `/levels/`
   - Supports localization (i18n)

2. **Tutorial Engine** (`src/tutorial/TutorialEngine.ts`)
   - Orchestrates tutorial presentation
   - Manages state and progression
   - Validates solutions
   - Tracks command history

3. **Progress Tracker** (`src/tutorial/ProgressTracker.ts`)
   - Stores user progress in IndexedDB (with localStorage fallback)
   - Tracks completed levels, scores, and hints used
   - Manages sequence unlocking

4. **Solution Validator** (`src/tutorial/validator.ts`)
   - Compares user's Git state against goal state
   - Calculates Git golf score (commands used vs optimal)
   - Provides detailed feedback

5. **UI Components** (`src/components/tutorial/`)
   - `TutorialDialog` - Modal dialogs for instructions
   - `GitDemonstrationView` - Interactive command demonstrations
   - `TutorialManager` - Main orchestration component

## Level Structure

Levels are defined as JSON files in `/levels/` with the following structure:

```json
{
  "id": "intro1",
  "name": {
    "en_US": "Introduction to Commits",
    "de_DE": "Einführung in Commits"
  },
  "description": {
    "en_US": "Learn how to make your first commit in Git"
  },
  "difficulty": "intro",
  "order": 1,
  "initialState": {
    "commits": [...],
    "branches": [...],
    "tags": [],
    "head": { "type": "branch", "name": "main" }
  },
  "goalState": { ... },
  "tutorialSteps": [
    {
      "type": "dialog",
      "id": "intro1-welcome",
      "title": { "en_US": "Welcome to Git!" },
      "content": {
        "en_US": [
          "Git records changes as commits...",
          "Each commit has a unique identifier..."
        ]
      }
    },
    {
      "type": "demonstration",
      "id": "intro1-demo",
      "beforeText": { "en_US": ["Watch what happens..."] },
      "setupCommands": [],
      "demonstrationCommand": "git commit",
      "afterText": { "en_US": ["Great! A new commit was created."] }
    },
    {
      "type": "challenge",
      "id": "intro1-challenge",
      "instructions": { "en_US": ["Now it's your turn!"] },
      "hints": []
    }
  ],
  "solutionCommands": ["git commit"],
  "hints": [
    { "en_US": ["Try typing `git commit`"] }
  ],
  "flags": {
    "compareOnlyMain": true
  }
}
```

### Level Fields

- **id**: Unique level identifier (e.g., "intro1")
- **name**: Localized level name
- **description**: Localized level description
- **difficulty**: "intro" | "beginner" | "intermediate" | "advanced"
- **order**: Display order within sequence
- **initialState**: Starting Git repository state
- **goalState**: Target Git repository state to achieve
- **tutorialSteps**: Array of tutorial steps (dialog, demonstration, or challenge)
- **solutionCommands**: Optimal solution commands
- **hints**: Array of hint sets (localized)
- **flags**: Optional level flags (e.g., compareOnlyMain)

### Tutorial Step Types

1. **Dialog Step**: Shows instructional text
   ```typescript
   {
     type: "dialog",
     id: "step-id",
     title: { "en_US": "Title" },
     content: { "en_US": ["Paragraph 1", "Paragraph 2"] }
   }
   ```

2. **Demonstration Step**: Shows a Git command in action
   ```typescript
   {
     type: "demonstration",
     id: "step-id",
     beforeText: { "en_US": ["Setup text"] },
     setupCommands: ["git branch demo"],
     demonstrationCommand: "git commit",
     afterText: { "en_US": ["Result text"] }
   }
   ```

3. **Challenge Step**: User performs the task
   ```typescript
   {
     type: "challenge",
     id: "step-id",
     instructions: { "en_US": ["Do this task"] },
     hints: []
   }
   ```

## Level Sequences

Sequences group related levels together. Defined in `/levels/sequences/`:

```json
{
  "id": "intro",
  "name": { "en_US": "Introduction to Git" },
  "description": { "en_US": "Learn the basics" },
  "levelIds": ["intro1", "intro2", "intro3"],
  "locked": false
}
```

## Adding New Levels

### 1. Create Level JSON

Create a new file in `/levels/` (e.g., `intro4.json`):

```json
{
  "id": "intro4",
  "name": {
    "en_US": "Your Level Name"
  },
  "description": {
    "en_US": "What users will learn"
  },
  "difficulty": "intro",
  "order": 4,
  "initialState": {
    "commits": [
      {
        "id": "C0",
        "parents": [],
        "message": "Initial commit",
        "timestamp": 1700000000000
      }
    ],
    "branches": [
      {
        "name": "main",
        "target": "C0"
      }
    ],
    "tags": [],
    "head": {
      "type": "branch",
      "name": "main"
    }
  },
  "goalState": {
    // Target state after solution
  },
  "tutorialSteps": [
    // Your tutorial steps
  ],
  "solutionCommands": ["git commit", "git branch feature"],
  "hints": [
    {
      "en_US": ["Hint 1"],
      "de_DE": ["Hinweis 1"]
    }
  ]
}
```

### 2. Add to Sequence

Update the sequence file (e.g., `/levels/sequences/intro.json`):

```json
{
  "id": "intro",
  "levelIds": ["intro1", "intro2", "intro3", "intro4"]
}
```

### 3. Test the Level

```typescript
import { loadLevel } from '@/tutorial';

const result = await loadLevel('intro4');
if (result.success) {
  console.log('Level loaded:', result.level.name.en_US);
}
```

## Solution Validation

The validator compares the user's final Git state against the goal state:

1. **Commit Count**: Checks if the correct number of commits exist
2. **Commit Structure**: Validates parent relationships
3. **Branch State**: Verifies branch names and targets
4. **HEAD Position**: Confirms HEAD is in the correct state

### Validation Flags

- **compareOnlyMain**: Only compare the main branch (ignore other branches)
- **allowAnySolution**: Accept any valid solution (for sandbox levels)
- **disableHints**: Don't show hints for this level

## Git Golf Scoring

After completing a level, users receive a score based on efficiency:

```typescript
{
  commandsUsed: 3,      // Commands user executed
  optimalCommands: 2,   // Optimal solution from solutionCommands
  efficiency: 67        // (optimal/used) * 100
}
```

## Progress Tracking

### Storage

Progress is stored in:
1. **Primary**: IndexedDB (`GitVisualizerTutorial` database)
2. **Fallback**: localStorage (`gitvis_tutorial_progress_{userId}`)

### Progress Structure

```typescript
{
  userId: "user123",
  locale: "en_US",
  currentSequence: "intro",
  currentLevel: "intro2",
  levels: Map<string, {
    levelId: "intro1",
    completed: true,
    commandsUsed: 2,
    optimalCommands: 1,
    bestScore: 2,
    completedAt: 1700000000000,
    hintsUsed: 1
  }>,
  unlockedSequences: Set(["intro", "rampup"]),
  lastUpdated: 1700000000000
}
```

### APIs

```typescript
// Load progress
const progress = await loadProgress("user123");

// Update level completion
const updated = updateLevelProgress(
  progress,
  "intro1",
  commandsUsed: 2,
  optimalCommands: 1,
  hintsUsed: 0
);

// Save progress
await saveProgress(updated);

// Check completion
const completed = isLevelCompleted(progress, "intro1");

// Unlock sequence
const unlocked = unlockSequence(progress, "rampup");

// Get stats
const stats = getSequenceStats(progress, ["intro1", "intro2", "intro3"]);
// { completed: 2, total: 3, percentage: 67 }
```

## Localization

### Adding Translations

1. Add locale keys to level JSON:
   ```json
   {
     "name": {
       "en_US": "Commits",
       "de_DE": "Commits",
       "es_ES": "Confirmaciones",
       "fr_FR": "Validations"
     }
   }
   ```

2. Update tutorial steps:
   ```json
   {
     "type": "dialog",
     "title": {
       "en_US": "Git Commits",
       "de_DE": "Git Commits",
       "es_ES": "Confirmaciones de Git"
     },
     "content": {
       "en_US": ["Learn about commits"],
       "de_DE": ["Lerne über Commits"],
       "es_ES": ["Aprende sobre confirmaciones"]
     }
   }
   ```

### Fallback Strategy

If a locale is not available, the system falls back to:
1. Requested locale (e.g., "de_DE")
2. English ("en_US")
3. First available locale

## Accessibility

### Features

1. **Keyboard Navigation**
   - Tab/Shift+Tab to navigate buttons
   - Enter to confirm actions
   - Escape to close dialogs

2. **Screen Reader Support**
   - ARIA labels on all interactive elements
   - Role attributes for semantic structure
   - Live regions for dynamic updates

3. **Focus Management**
   - Visible focus indicators
   - Focus trapped within modals
   - Focus returned on dialog close

4. **Color Independence**
   - Text alternatives for color-coded information
   - Icons and patterns supplement colors

### Testing Accessibility

```typescript
// Components include ARIA attributes
<DialogContent aria-describedby="tutorial-description">
  <DialogTitle id="tutorial-title">Title</DialogTitle>
  <DialogDescription id="tutorial-description" className="sr-only">
    Description for screen readers
  </DialogDescription>
</DialogContent>
```

## API Reference

### TutorialEngine

```typescript
const engine = new TutorialEngine("userId");

// Initialize and load progress
await engine.initialize();

// Start a level
const level = await loadLevel("intro1");
await engine.startLevel(level.level);

// Navigate steps
engine.next();  // Move to next step
engine.prev();  // Move to previous step

// Get current state
const step = engine.getCurrentStep();
const state = engine.getState();

// Update user state after command
engine.updateState(newGitState, "git commit");

// Validate solution
const result = engine.validateSolution();
if (result.valid) {
  await engine.completeLevel(result);
}

// Get hints
const hint = engine.showHint("en_US");

// Reset level
engine.reset();
```

### LevelStore

```typescript
// Load a level
const result = await loadLevel("intro1");
if (result.success) {
  const level = result.level;
}

// Load a sequence
const seqResult = await loadSequence("intro");

// Get all sequences
const sequences = await getAllSequences();

// Get levels for sequence
const levels = await getLevelsForSequence("intro");

// Clear cache (for testing)
clearCache();
```

### ProgressTracker

```typescript
// Create initial progress
const progress = createInitialProgress("user123", "en_US");

// Load existing progress
const saved = await loadProgress("user123");

// Update completion
const updated = updateLevelProgress(
  progress,
  "intro1",
  commandsUsed: 2,
  optimalCommands: 1,
  hintsUsed: 0
);

// Save progress
await saveProgress(updated);

// Check status
const completed = isLevelCompleted(progress, "intro1");
const unlocked = isSequenceUnlocked(progress, "intro");

// Unlock sequence
const withUnlock = unlockSequence(progress, "rampup");

// Get stats
const stats = getSequenceStats(progress, levelIds);
```

## Testing

### Unit Tests

```bash
# Run tutorial tests
pnpm test src/tutorial

# Run specific test file
pnpm test src/tutorial/__tests__/LevelStore.test.ts
```

### Integration Tests

Test complete level flows:

```typescript
describe('Level Completion', () => {
  it('should complete intro1 level', async () => {
    const engine = new TutorialEngine('test');
    await engine.initialize();
    
    const level = await loadLevel('intro1');
    await engine.startLevel(level.level);
    
    // User executes command
    engine.updateState(newState, 'git commit');
    
    // Validate
    const result = engine.validateSolution();
    expect(result.valid).toBe(true);
  });
});
```

### E2E Tests

Use Playwright to test the UI:

```typescript
test('complete intro1 level', async ({ page }) => {
  await page.goto('/learn');
  await page.click('text=Introduction to Git');
  await page.click('text=Introduction to Commits');
  
  // Wait for tutorial dialog
  await page.waitForSelector('[role="dialog"]');
  await page.click('button:has-text("Next")');
  
  // Enter command
  await page.fill('input[aria-label="Git command"]', 'git commit');
  await page.press('input[aria-label="Git command"]', 'Enter');
  
  // Check completion
  await expect(page.locator('text=Level completed')).toBeVisible();
});
```

## Performance Considerations

1. **Level Caching**: Levels are cached after first load
2. **Lazy Loading**: Levels loaded on-demand
3. **Progress Persistence**: Async save operations don't block UI
4. **IndexedDB**: Faster than localStorage for larger datasets

## Best Practices

### Creating Levels

1. **Start Simple**: Introduce one concept per level
2. **Progressive Difficulty**: Build on previous levels
3. **Clear Goals**: Make success criteria obvious
4. **Good Hints**: Provide progressive hints (don't give away solution immediately)
5. **Localization**: Provide at least English content; placeholders for other languages

### Testing Levels

1. **Test Both Paths**: Optimal solution and non-optimal solutions
2. **Edge Cases**: Test with extra branches, wrong HEAD position, etc.
3. **Hint Quality**: Verify hints are helpful without being too explicit
4. **Accessibility**: Test with keyboard and screen reader

### Validation

1. **Flexible Matching**: Don't require exact commit IDs (they're random)
2. **Structure Over Content**: Compare graph structure, not commit messages
3. **Clear Feedback**: Provide specific errors when validation fails

## Troubleshooting

### Level Won't Load

```typescript
// Check for JSON syntax errors
const result = await loadLevel('intro1');
if (!result.success) {
  console.error('Load error:', result.error);
}
```

### Progress Not Saving

```typescript
// Check IndexedDB support
if (typeof indexedDB === 'undefined') {
  console.warn('IndexedDB not available, using localStorage');
}

// Check save result
const result = await saveProgress(progress);
if (!result.success) {
  console.error('Save error:', result.error);
}
```

### Validation Failing Incorrectly

- Check `flags.compareOnlyMain` if extra branches are causing issues
- Verify goal state commit structure matches expected
- Use `console.log` to inspect actual vs expected states

## Future Enhancements

1. **More Levels**: Expand beyond intro levels (rebase, cherry-pick, etc.)
2. **Custom Levels**: Allow users to create and share levels
3. **Achievements**: Badges and rewards for completion
4. **Leaderboards**: Compare scores with other users (optional)
5. **Interactive Rebase**: Visual interface for interactive rebase operations
6. **Conflict Simulation**: Teach merge conflict resolution
7. **Remote Operations**: Levels covering push, pull, fetch
8. **Advanced Patterns**: Git workflows (gitflow, trunk-based, etc.)

## References

- Git Documentation: https://git-scm.com/doc
- Learn Git Branching (inspiration): https://learngitbranching.js.org/
- WCAG 2.2 Guidelines: https://www.w3.org/WAI/WCAG22/quickref/

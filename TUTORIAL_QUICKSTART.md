# Tutorial System - Quick Start Guide

## For Developers: Using the Tutorial System

### Basic Usage

```typescript
import { 
  getTutorialEngine, 
  loadLevel, 
  TutorialManager 
} from '@/tutorial';

// 1. Get the tutorial engine instance
const engine = getTutorialEngine('user123');
await engine.initialize();

// 2. Load a level
const result = await loadLevel('intro1');
if (result.success) {
  // 3. Start the level
  await engine.startLevel(result.level);
  
  // 4. The engine is now ready to use
  const currentStep = engine.getCurrentStep();
  console.log('Current step:', currentStep?.type);
}
```

### React Integration

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getTutorialEngine, TutorialManager } from '@/tutorial';

export function TutorialPage() {
  const [engine] = useState(() => getTutorialEngine());
  
  useEffect(() => {
    engine.initialize();
  }, [engine]);
  
  return (
    <div>
      <TutorialManager 
        engine={engine}
        locale="en_US"
        onUserStateChange={(state) => {
          // Update your visualization with the new state
          console.log('State changed:', state);
        }}
      />
    </div>
  );
}
```

### Loading Sequences

```typescript
import { getAllSequences, getLevelsForSequence } from '@/tutorial';

// Get all available sequences
const sequences = await getAllSequences();

// Get levels for a specific sequence
const introLevels = await getLevelsForSequence('intro');
console.log('Intro levels:', introLevels.map(l => l.name.en_US));
```

### Progress Tracking

```typescript
import { 
  loadProgress, 
  updateLevelProgress, 
  saveProgress,
  isLevelCompleted 
} from '@/tutorial';

// Load user progress
const progress = await loadProgress('user123');

// Check if level is completed
const completed = isLevelCompleted(progress, 'intro1');

// Update progress after level completion
const updated = updateLevelProgress(
  progress,
  'intro1',
  commandsUsed: 2,
  optimalCommands: 1,
  hintsUsed: 0
);

// Save progress
await saveProgress(updated);
```

### Solution Validation

```typescript
import { validateSolution } from '@/tutorial';
import type { GitState } from '@/cli/types';

// After user executes commands, validate their solution
const userState: GitState = getCurrentGitState();
const result = validateSolution(userState, currentLevel, commandsUsed);

if (result.valid) {
  console.log('Success! Score:', result.score);
  await engine.completeLevel(result);
} else {
  console.log('Not quite. Differences:', result.differences);
}
```

### Hints System

```typescript
// Show a hint to the user
const hint = engine.showHint('en_US');
if (hint) {
  console.log('Hint:', hint);
  // Display hint in your UI
}

// Hints are progressive - each call gets the next hint
const hint2 = engine.showHint('en_US');
```

### Tutorial Navigation

```typescript
// Navigate through tutorial steps
engine.next();  // Move to next step
engine.prev();  // Move to previous step

// Get current state
const state = engine.getState();
console.log('Active:', state.active);
console.log('Current step:', state.currentStepIndex);
console.log('Commands used:', state.commandHistory);

// Reset level to start
engine.reset();
```

## Creating New Levels

### 1. Create Level JSON

```json
{
  "id": "intro4",
  "name": {
    "en_US": "Cherry-Picking Commits"
  },
  "description": {
    "en_US": "Learn to cherry-pick specific commits"
  },
  "difficulty": "intro",
  "order": 4,
  "initialState": {
    "commits": [
      {
        "id": "C0",
        "parents": [],
        "message": "Initial",
        "timestamp": 1700000000000
      },
      {
        "id": "C1",
        "parents": ["C0"],
        "message": "Feature A",
        "timestamp": 1700000001000
      }
    ],
    "branches": [
      {
        "name": "main",
        "target": "C0"
      },
      {
        "name": "feature",
        "target": "C1"
      }
    ],
    "tags": [],
    "head": {
      "type": "branch",
      "name": "main"
    }
  },
  "goalState": {
    // Define the target state
  },
  "tutorialSteps": [
    {
      "type": "dialog",
      "id": "step1",
      "title": {
        "en_US": "Cherry-Pick Intro"
      },
      "content": {
        "en_US": [
          "Cherry-picking allows you to apply a specific commit to your current branch."
        ]
      }
    }
  ],
  "solutionCommands": ["git cherry-pick feature"],
  "hints": [
    {
      "en_US": ["Try using git cherry-pick"]
    }
  ]
}
```

### 2. Add to Sequence

Edit `/levels/sequences/intro.json`:

```json
{
  "id": "intro",
  "levelIds": ["intro1", "intro2", "intro3", "intro4"]
}
```

### 3. Test Your Level

```typescript
import { loadLevel } from '@/tutorial';

const result = await loadLevel('intro4');
if (result.success) {
  console.log('Level loaded successfully!');
} else {
  console.error('Error:', result.error);
}
```

## Testing

```bash
# Run unit tests
pnpm test src/tutorial

# Run specific test file
pnpm test src/tutorial/__tests__/LevelStore.test.ts

# Run E2E tests
pnpm test:e2e tutorial-system

# Run all validation
pnpm validate
```

## Common Patterns

### Listen to State Changes

```typescript
engine.subscribe((state) => {
  console.log('Tutorial state changed:', state);
  
  if (!state.active) {
    console.log('Tutorial completed!');
  }
});
```

### Get Current Score

```typescript
const score = engine.getScore();
if (score) {
  console.log(`Used ${score.used} commands`);
  console.log(`Optimal: ${score.optimal} commands`);
  console.log(`Efficiency: ${Math.round((score.optimal/score.used)*100)}%`);
}
```

### Check Sequence Stats

```typescript
import { getSequenceStats } from '@/tutorial';

const stats = getSequenceStats(progress, ['intro1', 'intro2', 'intro3']);
console.log(`Completed: ${stats.completed}/${stats.total}`);
console.log(`Progress: ${stats.percentage}%`);
```

## API Reference

See full API documentation in `/docs/TUTORIAL_SYSTEM.md`

## Support

- 📚 Full Documentation: `/docs/TUTORIAL_SYSTEM.md`
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

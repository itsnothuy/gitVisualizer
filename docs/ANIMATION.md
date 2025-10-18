# Animation System Documentation

## Overview

The animation system provides a declarative, queue-based architecture for animating Git operations. It mirrors LearnGitBranching's diff-based animation approach with full accessibility support.

## Architecture

### Core Components

1. **State Diffing** (`src/viz/diff/treeCompare.ts`)
   - Compares old and new graph states
   - Generates typed change objects
   - Detects complex operations (merge, rebase, cherry-pick)

2. **AnimationFactory** (`src/viz/anim/AnimationFactory.ts`)
   - Generates animation steps for Git operations
   - Provides methods for all major Git commands
   - Supports curved arc paths for rebase/cherry-pick

3. **AnimationQueue** (`src/viz/anim/AnimationQueue.ts`)
   - Sequential playback of animation scenes
   - Input blocking during animations
   - Priority-based queueing

4. **AnimationEngine** (`src/viz/anim/engine.ts`)
   - Low-level animation playback
   - Uses requestAnimationFrame
   - Respects prefers-reduced-motion

## Diff Types

The diff system generates the following change types:

### Simple Changes

#### CommitAdded
```typescript
{
  type: 'commitAdded',
  nodeId: 'c2',
  parents: ['c1'],
  branchIndex?: 0,
  level?: 1
}
```

#### CommitRemoved
```typescript
{
  type: 'commitRemoved',
  nodeId: 'c2'
}
```

#### BranchAdded
```typescript
{
  type: 'branchAdded',
  branchName: 'feature',
  targetCommit: 'c2'
}
```

#### BranchRemoved
```typescript
{
  type: 'branchRemoved',
  branchName: 'feature'
}
```

#### BranchMoved
```typescript
{
  type: 'branchMoved',
  branchName: 'main',
  oldCommit: 'c1',
  newCommit: 'c2'
}
```

#### HeadMoved
```typescript
{
  type: 'headMoved',
  oldTarget: 'main',
  newTarget: 'feature'
}
```

### Complex Changes

#### Merge
```typescript
{
  type: 'merge',
  mergeCommit: 'c4',
  parents: ['c2', 'c3']
}
```

#### Rebase
```typescript
{
  type: 'rebase',
  oldCommits: ['c4', 'c5'],
  newCommits: ['c6', 'c7'],
  oldBase: 'c1',
  newBase: 'c3'
}
```

#### CherryPick
```typescript
{
  type: 'cherryPick',
  sourceCommit: 'c3',
  newCommit: 'c4',
  targetBase: 'c2'
}
```

## AnimationFactory Methods

### commitBirth(commitId, options)

Animates the creation of a new commit with fade-in and pulse effects.

```typescript
const steps = AnimationFactory.commitBirth('c2', {
  position: { x: 100, y: 200 },
  branchLabel: 'main',
  startTime: 0
});
```

**Generated steps:**
- Fade in commit node (220ms)
- Pulse effect with overshoot (320ms)
- Highlight branch tip if label provided (320ms)

### branchMove(branchLabel, options)

Animates moving a branch pointer (fast-forward, reset).

```typescript
const steps = AnimationFactory.branchMove('main', {
  oldPosition: { x: 100, y: 100 },
  newPosition: { x: 200, y: 200 },
  startTime: 0
});
```

**Generated steps:**
- Move branch label (320ms)
- Fade out old position marker (220ms)

### merge(options)

Animates a merge operation with parent highlighting and dashed arc.

```typescript
const steps = AnimationFactory.merge({
  mergeCommitId: 'c4',
  parent1Id: 'c2',
  parent2Id: 'c3',
  position: { x: 150, y: 200 },
  branchLabel: 'main',
  startTime: 0
});
```

**Generated steps:**
- Highlight both parent commits (220ms)
- Show temporary dashed edge from second parent (120ms fade + 320ms lifetime)
- Fade in merge commit (220ms)
- Update branch label (220ms)

### rebase(options)

Animates rebasing commits with "flying commit" ghost animations.

```typescript
const steps = AnimationFactory.rebase({
  oldCommits: ['c4', 'c5'],
  newCommits: ['c6', 'c7'],
  oldPositions: [{ x: 100, y: 100 }, { x: 100, y: 200 }],
  newPositions: [{ x: 200, y: 100 }, { x: 200, y: 200 }],
  branchLabel: 'feature',
  labelPosition: { x: 200, y: 250 },
  startTime: 0
});
```

**Generated steps (per commit):**
- Show dashed arc path (120ms + 320ms lifetime)
- Create ghost node at old position (120ms fade to 50%)
- Animate ghost along arc (320ms)
- Fade in new commit at target (220ms)
- Fade out ghost (120ms)
- Remove ghost class

### reset(options)

Animates resetting HEAD/branch pointer with commit fade-out.

```typescript
const steps = AnimationFactory.reset({
  affectedCommits: ['c2', 'c3'],
  oldPosition: { x: 200, y: 200 },
  newPosition: { x: 100, y: 100 },
  branchLabel: 'main',
  mode: 'hard', // or 'soft'
  startTime: 0
});
```

**Generated steps:**
- Fade out affected commits (220ms, opacity 0 for hard, 0.4 for soft)
- Move branch label back (320ms)
- Highlight target commit (220ms)

### revert(options)

Animates reverting a commit with dashed arc and special indicator.

```typescript
const steps = AnimationFactory.revert({
  revertedCommitId: 'c2',
  revertCommitId: 'c3',
  position: { x: 100, y: 300 },
  branchLabel: 'main',
  startTime: 0
});
```

**Generated steps:**
- Highlight reverted commit (220ms)
- Show dashed arc (120ms + 320ms lifetime)
- Fade in revert commit (220ms)
- Add 'revert-commit' class for styling
- Update branch label (220ms)

## Arc Path Animation

The factory provides curved SVG path computation for "flying commit" animations:

```typescript
// Compute curved path between two points
const path = AnimationFactory.computeArcPath(
  { x: 0, y: 0 },
  { x: 100, y: 100 },
  0.3 // curvature (0-1, default 0.3)
);
// Returns: "M 0,0 Q 35.35,35.35 100,100"

// Generate animation steps for arc path
const steps = AnimationFactory.arcPathAnimation('c1', path, {
  startTime: 0,
  duration: 320,
  dashArray: '5,5'
});
```

## AnimationQueue Usage

### Basic Queue

```typescript
import { createAnimationQueue } from '@/viz/anim';

// Create queue with SVG element
const queue = createAnimationQueue(svgElement, {
  autoPlay: true,
  onQueueStart: () => console.log('Queue started'),
  onQueueComplete: () => console.log('Queue complete'),
  onSceneStart: (scene) => console.log(`Scene: ${scene.name}`),
  onSceneComplete: (scene) => console.log(`Done: ${scene.name}`),
});

// Enqueue scenes
const scene1 = buildScene('commit', steps1);
const scene2 = buildScene('merge', steps2);

queue.enqueue(scene1);
queue.enqueue(scene2, 10); // With priority

// Control playback
await queue.play();
queue.pause();
queue.resume();
queue.skip(); // Skip current
queue.clear(); // Clear all
```

### Priority Queue

Higher priority numbers play first:

```typescript
queue.enqueue(normalScene);        // No priority (default)
queue.enqueue(importantScene, 10); // Plays first
queue.enqueue(criticalScene, 20);  // Plays before important
```

### Input Blocking

The queue automatically blocks user input during playback:

```typescript
if (queue.isInputBlocked()) {
  // Don't process user interactions
  return;
}
```

### Queue Statistics

```typescript
const stats = queue.getStats();
console.log(stats);
// {
//   queueLength: 3,
//   totalDuration: 1200,
//   state: 'playing',
//   inputBlocked: true
// }
```

## Integration Example

```typescript
import { compareStates, AnimationFactory, createAnimationQueue } from '@/viz/anim';

// 1. Compute diff between states
const diff = compareStates(oldState, newState);

// 2. Generate animations from diff
const animations: AnimStep[] = [];

for (const change of diff.changes) {
  switch (change.type) {
    case 'commitAdded':
      animations.push(...AnimationFactory.commitBirth(change.nodeId, {
        position: getNodePosition(change.nodeId),
        branchLabel: getCurrentBranch(),
      }));
      break;
    
    case 'merge':
      animations.push(...AnimationFactory.merge({
        mergeCommitId: change.mergeCommit,
        parent1Id: change.parents[0],
        parent2Id: change.parents[1],
        position: getNodePosition(change.mergeCommit),
      }));
      break;
    
    // ... handle other change types
  }
}

// 3. Build scene and enqueue
const scene = buildScene('git-operation', animations);
queue.enqueue(scene);
```

## Timing and Easing

### Duration Presets

```typescript
DURATIONS = {
  veryShort: 120,  // Quick transitions
  short: 220,      // Standard animations
  medium: 320,     // Complex operations
  long: 480        // Emphasis animations
}
```

### Easing Functions

```typescript
EASING = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out'
}

// Special easing for overshoot effects
BOUNCE_EASING = 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
SMOOTH_EASING = 'ease-in-out'
```

## Accessibility

### Reduced Motion Support

The system automatically respects `prefers-reduced-motion`:

- Durations collapsed to ≤80ms
- Overshoot effects removed
- Movement animations replaced with opacity changes

```typescript
// Handled automatically by engine
function adjustDuration(duration: number): number {
  if (prefersReducedMotion()) {
    return Math.min(duration, 80);
  }
  return duration;
}
```

### Screen Reader Announcements

Scenes include descriptions for accessibility:

```typescript
const scene = buildScene(
  'commit',
  steps,
  'Creating new commit on main branch' // Screen reader announcement
);
```

### Keyboard Navigation

Input is blocked during animations to prevent accidental interactions:

```typescript
// Check before processing keyboard events
if (queue.isInputBlocked()) {
  event.preventDefault();
  return;
}
```

## Performance Considerations

### Main Thread Optimization

- All animations use `requestAnimationFrame`
- No blocking operations during playback
- Efficient selector queries via cached element references

### Animation Limits

- Target: ≤16ms per frame (60 FPS)
- Short animations (≤480ms) to maintain responsiveness
- Sequential queue prevents animation conflicts

### Memory Management

- Scenes are removed from queue after completion
- Cleanup functions run after each animation
- No memory leaks from canceled animations

## Testing

### Unit Tests

```typescript
describe('AnimationFactory', () => {
  it('should generate commit birth steps', () => {
    const steps = AnimationFactory.commitBirth('c1', {
      position: { x: 100, y: 200 },
    });
    
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.find(s => s.op === 'fade')).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('Queue Integration', () => {
  it('should play scenes sequentially', async () => {
    const queue = createAnimationQueue(svgElement);
    queue.enqueue(scene1);
    queue.enqueue(scene2);
    
    await queue.play();
    
    expect(queue.isEmpty()).toBe(true);
  });
});
```

### E2E Tests

See `e2e/animation.spec.ts` for Playwright tests that verify:
- Animation timing and sequencing
- Accessibility compliance (axe-core)
- Reduced motion support
- Input blocking behavior

## Future Enhancements

1. **Advanced Path Animations**: Support for Bézier curves with multiple control points
2. **Stagger Effects**: Batch animations with offset timing
3. **Spring Physics**: Natural bounce and damping
4. **Gesture Support**: Touch-based animation control
5. **Recording**: Export animations as video/GIF

## References

- [LearnGitBranching Animation System](https://github.com/pcottle/learnGitBranching)
- [WCAG 2.2 Animation Guidelines](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [CSS Easing Functions](https://easings.net/)
- [requestAnimationFrame Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)

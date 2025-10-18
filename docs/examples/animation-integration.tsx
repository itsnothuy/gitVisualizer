/**
 * Example: Integrating AnimationFactory and AnimationQueue with GraphView
 * 
 * This example demonstrates how to:
 * 1. Compare graph states to detect changes
 * 2. Generate animations from changes using AnimationFactory
 * 3. Queue and play animations using AnimationQueue
 * 4. Update the GraphView component with animations
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { 
  AnimationFactory, 
  createAnimationQueue,
  buildScene,
  type GitState 
} from '@/viz/anim';
import { compareStates, type DiffResult } from '@/viz/diff';
import type { AnimScene } from '@/viz/anim/types';

/**
 * Example hook that manages animation queue for a Git graph
 */
export function useGraphAnimations() {
  const queueRef = useRef<ReturnType<typeof createAnimationQueue> | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [currentScene, setCurrentScene] = useState<AnimScene | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize queue when SVG is available
  useEffect(() => {
    if (svgRef.current && !queueRef.current) {
      queueRef.current = createAnimationQueue(svgRef.current, {
        autoPlay: true,
        onQueueStart: () => {
          setIsAnimating(true);
        },
        onQueueComplete: () => {
          setIsAnimating(false);
          setCurrentScene(null);
        },
        onSceneStart: (scene) => {
          setCurrentScene(scene);
        },
        onAnnounce: (message) => {
          // Screen reader announcement
          console.log('Animation:', message);
        },
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      queueRef.current?.clear();
    };
  }, []);

  /**
   * Process a Git state change and animate it
   */
  const animateStateChange = useCallback(
    (oldState: GitState, newState: GitState) => {
      if (!queueRef.current) return;

      // 1. Compute the diff
      const diff = compareStates(oldState, newState);

      // 2. Generate animations from the diff
      const scene = generateSceneFromDiff(diff);

      // 3. Enqueue the scene
      if (scene) {
        queueRef.current.enqueue(scene);
      }
    },
    []
  );

  return {
    svgRef,
    currentScene,
    isAnimating,
    animateStateChange,
    queue: queueRef.current,
  };
}

/**
 * Time gap between sequential animations (in ms)
 */
const ANIMATION_GAP_MS = 200;

/**
 * Generate an animation scene from a diff result
 */
function generateSceneFromDiff(diff: DiffResult): AnimScene | null {
  const steps: ReturnType<typeof AnimationFactory.commitBirth> = [];
  let sceneName = 'state-change';
  let sceneDescription = 'Updating graph state';

  // Process each change in the diff
  for (const change of diff.changes) {
    switch (change.type) {
      case 'commitAdded': {
        sceneName = 'commit';
        sceneDescription = `Creating new commit ${change.nodeId}`;
        
        // Generate commit birth animation
        const commitSteps = AnimationFactory.commitBirth(change.nodeId, {
          position: { x: 0, y: 0 }, // Position would come from layout
          branchLabel: 'main', // Would come from current branch
          startTime: steps.length > 0 ? steps[steps.length - 1].t + ANIMATION_GAP_MS : 0,
        });
        steps.push(...commitSteps);
        break;
      }

      case 'branchMoved': {
        sceneName = 'branch-move';
        sceneDescription = `Moving branch ${change.branchName}`;
        
        // Generate branch move animation
        const moveSteps = AnimationFactory.branchMove(change.branchName, {
          oldPosition: { x: 0, y: 0 }, // Would come from layout
          newPosition: { x: 100, y: 100 }, // Would come from layout
          startTime: steps.length > 0 ? steps[steps.length - 1].t + ANIMATION_GAP_MS : 0,
        });
        steps.push(...moveSteps);
        break;
      }

      case 'merge': {
        sceneName = 'merge';
        sceneDescription = `Merging branches into ${change.mergeCommit}`;
        
        // Generate merge animation
        const mergeSteps = AnimationFactory.merge({
          mergeCommitId: change.mergeCommit,
          parent1Id: change.parents[0],
          parent2Id: change.parents[1],
          position: { x: 0, y: 0 }, // Would come from layout
          branchLabel: 'main',
          startTime: steps.length > 0 ? steps[steps.length - 1].t + ANIMATION_GAP_MS : 0,
        });
        steps.push(...mergeSteps);
        break;
      }

      case 'rebase': {
        sceneName = 'rebase';
        sceneDescription = `Rebasing commits onto new base`;
        
        // Generate rebase animation
        const rebaseSteps = AnimationFactory.rebase({
          oldCommits: change.oldCommits,
          newCommits: change.newCommits,
          oldPositions: change.oldCommits.map(() => ({ x: 0, y: 0 })), // From layout
          newPositions: change.newCommits.map(() => ({ x: 100, y: 0 })), // From layout
          branchLabel: 'feature',
          labelPosition: { x: 100, y: 50 },
          startTime: steps.length > 0 ? steps[steps.length - 1].t + ANIMATION_GAP_MS : 0,
        });
        steps.push(...rebaseSteps);
        break;
      }

      case 'headMoved': {
        sceneName = 'checkout';
        sceneDescription = `Checking out ${change.newTarget}`;
        // HEAD move is typically animated via branch move
        break;
      }

      // Add handlers for other change types...
      default:
        console.log('Unhandled change type:', change.type);
    }
  }

  if (steps.length === 0) {
    return null;
  }

  // Build and return the scene
  return buildScene(sceneName, steps, sceneDescription);
}

/**
 * Example component that uses the animation system
 */
export function AnimatedGraphView() {
  const { svgRef, currentScene, isAnimating, animateStateChange } = useGraphAnimations();
  const [gitState, setGitState] = useState<GitState>({
    nodes: [{ id: 'c1', parents: [] }],
    refs: [{ name: 'main', target: 'c1' }],
    head: 'main',
  });

  /**
   * Simulate a Git commit operation
   */
  const handleCommit = useCallback(() => {
    const oldState = gitState;
    const newState: GitState = {
      nodes: [
        ...oldState.nodes,
        { id: 'c2', parents: ['c1'] },
      ],
      refs: [{ name: 'main', target: 'c2' }],
      head: 'main',
    };

    // Animate the state change
    animateStateChange(oldState, newState);

    // Update state
    setGitState(newState);
  }, [gitState, animateStateChange]);

  /**
   * Simulate a branch creation
   */
  const handleBranchCreate = useCallback(() => {
    const oldState = gitState;
    const newState: GitState = {
      ...oldState,
      refs: [
        ...oldState.refs,
        { name: 'feature', target: oldState.head },
      ],
    };

    animateStateChange(oldState, newState);
    setGitState(newState);
  }, [gitState, animateStateChange]);

  return (
    <div>
      {/* Controls */}
      <div className="controls">
        <button 
          onClick={handleCommit} 
          disabled={isAnimating}
          aria-busy={isAnimating}
        >
          Commit
        </button>
        <button 
          onClick={handleBranchCreate} 
          disabled={isAnimating}
        >
          Create Branch
        </button>
      </div>

      {/* Animation status */}
      {currentScene && (
        <div 
          role="status" 
          aria-live="polite"
          className="animation-status"
        >
          {currentScene.description || currentScene.name}
        </div>
      )}

      {/* Graph SVG */}
      <svg
        ref={svgRef}
        width="100%"
        height="600"
        data-testid="graph-svg"
        data-animating={isAnimating}
      >
        {/* Graph rendering would go here */}
        {gitState.nodes.map((node) => (
          <circle
            key={node.id}
            data-node-id={node.id}
            cx={100}
            cy={100}
            r={20}
            fill="blue"
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Example: Advanced usage with manual queue control
 */
export function ManualQueueControl() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const queueRef = useRef<ReturnType<typeof createAnimationQueue> | null>(null);

  useEffect(() => {
    if (svgRef.current) {
      // Create queue with manual control (no autoPlay)
      queueRef.current = createAnimationQueue(svgRef.current, {
        autoPlay: false,
      });
    }
  }, []);

  const enqueueMultipleOperations = useCallback(() => {
    if (!queueRef.current) return;

    // Enqueue multiple scenes with different priorities
    const commitScene = buildScene('commit', []);
    const mergeScene = buildScene('merge', []);
    const rebaseScene = buildScene('rebase', []);

    queueRef.current.enqueue(commitScene, 5);        // Normal priority
    queueRef.current.enqueue(mergeScene, 10);        // High priority (plays first)
    queueRef.current.enqueue(rebaseScene, 1);        // Low priority

    // Manually start playback
    queueRef.current.play();
  }, []);

  const pauseAnimations = useCallback(() => {
    queueRef.current?.pause();
  }, []);

  const resumeAnimations = useCallback(() => {
    queueRef.current?.resume();
  }, []);

  const skipCurrent = useCallback(() => {
    queueRef.current?.skip();
  }, []);

  const clearQueue = useCallback(() => {
    queueRef.current?.clear();
  }, []);

  return (
    <div>
      <div className="controls">
        <button onClick={enqueueMultipleOperations}>Queue Operations</button>
        <button onClick={pauseAnimations}>Pause</button>
        <button onClick={resumeAnimations}>Resume</button>
        <button onClick={skipCurrent}>Skip Current</button>
        <button onClick={clearQueue}>Clear All</button>
      </div>

      <svg ref={svgRef} width="100%" height="600">
        {/* Graph content */}
      </svg>
    </div>
  );
}

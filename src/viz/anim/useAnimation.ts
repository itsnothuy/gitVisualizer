/**
 * React hook for animation engine integration
 * Provides declarative API for playing animations in React components
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimationEngine } from './engine';
import type { AnimScene, AnimState } from './types';

/**
 * Hook options
 */
export interface UseAnimationOptions {
  /** Callback when animation starts */
  onStart?: (scene: AnimScene) => void;
  /** Callback when animation completes */
  onComplete?: (scene: AnimScene) => void;
  /** Callback when animation is cancelled */
  onCancel?: (scene: AnimScene) => void;
  /** Callback for A11y announcements */
  onAnnounce?: (message: string) => void;
}

/**
 * Hook return value
 */
export interface UseAnimationReturn {
  /** Current animation state */
  state: AnimState;
  /** Check if input is locked */
  isLocked: boolean;
  /** Play an animation scene */
  play: (scene: AnimScene) => Promise<void>;
  /** Pause current animation */
  pause: () => void;
  /** Resume paused animation */
  resume: () => void;
  /** Cancel current animation */
  cancel: () => void;
  /** Reset engine to idle */
  reset: () => void;
  /** Set SVG root element reference */
  setRootElement: (element: SVGSVGElement | null) => void;
}

/**
 * Hook for managing animation engine in React components
 * Automatically handles lifecycle, visibility changes, and cleanup
 */
export function useAnimation(options: UseAnimationOptions = {}): UseAnimationReturn {
  const engineRef = useRef<AnimationEngine | null>(null);
  const [state, setState] = useState<AnimState>('idle');
  const [isLocked, setIsLocked] = useState(false);

  // Initialize engine
  useEffect(() => {
    const { onStart, onComplete, onCancel, onAnnounce } = options;
    
    engineRef.current = new AnimationEngine({
      rootElement: null,
      onStart: (scene) => {
        setState('playing');
        setIsLocked(true);
        onStart?.(scene);
      },
      onComplete: (scene) => {
        setState('idle');
        setIsLocked(false);
        onComplete?.(scene);
      },
      onCancel: (scene) => {
        setState('idle');
        setIsLocked(false);
        onCancel?.(scene);
      },
      onAnnounce,
    });

    return () => {
      engineRef.current?.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle tab visibility changes - pause when hidden, resume when visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!engineRef.current) return;

      if (document.hidden) {
        if (engineRef.current.getState() === 'playing') {
          engineRef.current.pause();
          setState('paused');
        }
      } else {
        if (engineRef.current.getState() === 'paused') {
          engineRef.current.resume();
          setState('playing');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const play = useCallback(async (scene: AnimScene) => {
    if (!engineRef.current) return;
    await engineRef.current.play(scene);
  }, []);

  const pause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.pause();
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.resume();
    setState('playing');
  }, []);

  const cancel = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.cancel();
    setState('idle');
    setIsLocked(false);
  }, []);

  const reset = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.reset();
    setState('idle');
    setIsLocked(false);
  }, []);

  const setRootElement = useCallback((element: SVGSVGElement | null) => {
    if (!engineRef.current) return;
    engineRef.current.setRootElement(element);
  }, []);

  return {
    state,
    isLocked,
    play,
    pause,
    resume,
    cancel,
    reset,
    setRootElement,
  };
}

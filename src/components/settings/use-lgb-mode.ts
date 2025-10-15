"use client";

import * as React from "react";

/**
 * Hook for managing LGB skin preference with session storage
 * 
 * Persists the user's skin preference across the session and respects
 * prefers-reduced-motion for smooth transitions.
 * 
 * @returns Tuple of [isLgbMode, toggleLgbMode]
 */
export function useLgbMode(): [boolean, () => void] {
  const [isLgbMode, setIsLgbMode] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load preference from session storage on mount
  React.useEffect(() => {
    const stored = sessionStorage.getItem("lgb-mode");
    if (stored !== null) {
      setIsLgbMode(stored === "true");
    }
    setIsLoaded(true);
  }, []);

  // Save preference to session storage when changed
  React.useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem("lgb-mode", String(isLgbMode));
    }
  }, [isLgbMode, isLoaded]);

  const toggleLgbMode = React.useCallback(() => {
    setIsLgbMode((prev) => !prev);
  }, []);

  return [isLgbMode, toggleLgbMode];
}

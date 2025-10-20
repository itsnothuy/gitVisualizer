"use client";

/**
 * First Visit Detection Hook
 * 
 * Detects if this is the user's first visit and manages onboarding state.
 * Uses localStorage for persistence.
 */

import { useState, useEffect } from "react";

const STORAGE_KEY = "gitVisualizer.hasSeenOnboarding";

export function useFirstVisit() {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const hasSeenOnboarding = localStorage.getItem(STORAGE_KEY);
      setIsFirstVisit(hasSeenOnboarding !== "true");
    } catch (error) {
      // localStorage might not be available (private mode, etc.)
      console.warn("Failed to check onboarding status:", error);
      setIsFirstVisit(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markOnboardingComplete = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      setIsFirstVisit(false);
    } catch (error) {
      console.warn("Failed to save onboarding status:", error);
    }
  };

  const resetOnboarding = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setIsFirstVisit(true);
    } catch (error) {
      console.warn("Failed to reset onboarding status:", error);
    }
  };

  return {
    isFirstVisit,
    isLoading,
    markOnboardingComplete,
    resetOnboarding,
  };
}

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLgbMode } from "../use-lgb-mode";

describe("useLgbMode Hook", () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
  });

  it("should start with isLgbMode as false by default", () => {
    const { result } = renderHook(() => useLgbMode());
    const [isLgbMode] = result.current;
    
    expect(isLgbMode).toBe(false);
  });

  it("should toggle LGB mode on/off", () => {
    const { result } = renderHook(() => useLgbMode());
    
    // Initially false
    expect(result.current[0]).toBe(false);
    
    // Toggle to true
    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe(true);
    
    // Toggle back to false
    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe(false);
  });

  it("should persist LGB mode to session storage", async () => {
    const { result } = renderHook(() => useLgbMode());
    
    // Toggle to true
    act(() => {
      result.current[1]();
    });
    
    // Wait for effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Check session storage
    expect(sessionStorage.getItem("lgb-mode")).toBe("true");
  });

  it("should load LGB mode from session storage on mount", () => {
    // Set session storage before mounting
    sessionStorage.setItem("lgb-mode", "true");
    
    const { result } = renderHook(() => useLgbMode());
    
    // Should load true from storage
    expect(result.current[0]).toBe(true);
  });

  it("should handle invalid session storage values", () => {
    // Set invalid value
    sessionStorage.setItem("lgb-mode", "invalid");
    
    const { result } = renderHook(() => useLgbMode());
    
    // Should default to false
    expect(result.current[0]).toBe(false);
  });
});

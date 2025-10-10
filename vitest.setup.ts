import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Mock ResizeObserver for react-zoom-pan-pinch
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Cleanup after each test
afterEach(() => {
  cleanup();
});

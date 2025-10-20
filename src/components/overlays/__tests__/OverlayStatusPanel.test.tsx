/**
 * Tests for Overlay Status Panel component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverlayStatusPanel } from "../OverlayStatusPanel";
import type { RateLimitInfo } from "@/lib/overlays";

describe("OverlayStatusPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render provider name", () => {
      render(<OverlayStatusPanel provider="github" />);

      expect(
        screen.getByRole("region", { name: /github overlay status/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /github overlay status/i })
      ).toBeInTheDocument();
    });

    it("should render GitLab provider", () => {
      render(<OverlayStatusPanel provider="gitlab" />);

      expect(
        screen.getByRole("region", { name: /gitlab overlay status/i })
      ).toBeInTheDocument();
    });

    it("should show no rate limit message when not provided", () => {
      render(<OverlayStatusPanel provider="github" />);

      expect(
        screen.getByText(/no rate limit information available/i)
      ).toBeInTheDocument();
    });
  });

  describe("Rate Limit Display", () => {
    it("should display rate limit information", () => {
      const rateLimit: RateLimitInfo = {
        remaining: 4500,
        limit: 5000,
        reset: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      render(<OverlayStatusPanel provider="github" rateLimit={rateLimit} />);

      expect(screen.getByText("4500 / 5000")).toBeInTheDocument();
      expect(screen.getByText("90%")).toBeInTheDocument();
    });

    it("should show correct percentage", () => {
      const rateLimit: RateLimitInfo = {
        remaining: 2500,
        limit: 5000,
        reset: Math.floor(Date.now() / 1000) + 3600,
      };

      render(<OverlayStatusPanel provider="github" rateLimit={rateLimit} />);

      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("should display reset time", () => {
      const rateLimit: RateLimitInfo = {
        remaining: 4500,
        limit: 5000,
        reset: Math.floor(Date.now() / 1000) + 1800, // 30 minutes from now
      };

      render(<OverlayStatusPanel provider="github" rateLimit={rateLimit} />);

      expect(screen.getByText(/in \d+m/)).toBeInTheDocument();
    });
  });

  describe("Progress Bar", () => {
    it("should render progress bar with correct aria attributes", () => {
      const rateLimit: RateLimitInfo = {
        remaining: 3000,
        limit: 5000,
        reset: Math.floor(Date.now() / 1000) + 3600,
      };

      render(<OverlayStatusPanel provider="github" rateLimit={rateLimit} />);

      const progressBar = screen.getByRole("progressbar", {
        name: /rate limit usage/i,
      });
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute("aria-valuenow", "3000");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "5000");
    });
  });

  describe("Last Refresh", () => {
    it("should display last refresh time", () => {
      const lastRefresh = Date.now() - 120000; // 2 minutes ago

      render(
        <OverlayStatusPanel provider="github" lastRefresh={lastRefresh} />
      );

      expect(screen.getByText(/2m ago/)).toBeInTheDocument();
    });

    it("should show seconds for recent refreshes", () => {
      const lastRefresh = Date.now() - 30000; // 30 seconds ago

      render(
        <OverlayStatusPanel provider="github" lastRefresh={lastRefresh} />
      );

      expect(screen.getByText(/30s ago/)).toBeInTheDocument();
    });
  });

  describe("Cache Stats", () => {
    it("should display cache statistics", () => {
      render(<OverlayStatusPanel provider="github" />);

      expect(screen.getByText(/cache entries/i)).toBeInTheDocument();
      expect(screen.getByText(/expired/i)).toBeInTheDocument();
      expect(screen.getByText(/inflight/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      const rateLimit: RateLimitInfo = {
        remaining: 4500,
        limit: 5000,
        reset: Math.floor(Date.now() / 1000) + 3600,
      };

      render(<OverlayStatusPanel provider="github" rateLimit={rateLimit} />);

      const region = screen.getByRole("region");
      expect(region).toHaveAttribute(
        "aria-label",
        "GitHub overlay status"
      );
    });

    it("should have descriptive labels for rate limit", () => {
      const rateLimit: RateLimitInfo = {
        remaining: 4500,
        limit: 5000,
        reset: Math.floor(Date.now() / 1000) + 3600,
      };

      render(<OverlayStatusPanel provider="github" rateLimit={rateLimit} />);

      // Check for aria-label on rate limit display
      const rateLimitText = screen.getByLabelText(
        /4500 of 5000 requests remaining/i
      );
      expect(rateLimitText).toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <OverlayStatusPanel provider="github" className="custom-class" />
      );

      const panel = container.querySelector(".overlay-status-panel");
      expect(panel).toHaveClass("custom-class");
    });
  });
});

/**
 * Overlay Status Panel Component
 * Displays rate limit status and last refresh information for overlays
 * WCAG 2.2 AA compliant with keyboard navigation and screen reader support
 */

"use client";

import { useEffect, useState } from "react";
import type { RateLimitInfo } from "@/lib/overlays";
import { overlayCache } from "@/lib/overlays";

export interface OverlayStatusPanelProps {
  /** Provider name (github, gitlab) */
  provider: "github" | "gitlab";
  /** Current rate limit info */
  rateLimit?: RateLimitInfo | null;
  /** Last refresh timestamp */
  lastRefresh?: number;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Format timestamp as relative time
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) {
    return `${seconds}s ago`;
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else {
    return `${hours}h ago`;
  }
}

/**
 * Format reset time as relative or absolute
 */
function formatResetTime(reset: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = reset - now;

  if (diff <= 0) {
    return "now";
  }

  const minutes = Math.floor(diff / 60);
  const hours = Math.floor(minutes / 60);

  if (minutes < 60) {
    return `in ${minutes}m`;
  } else {
    return `in ${hours}h`;
  }
}

/**
 * Calculate percentage remaining
 */
function calculatePercentage(remaining: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.round((remaining / limit) * 100);
}

/**
 * Get status color based on remaining percentage
 */
function getStatusColor(percentage: number): string {
  if (percentage > 50) return "text-green-600";
  if (percentage > 20) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Overlay Status Panel Component
 */
export function OverlayStatusPanel({
  provider,
  rateLimit,
  lastRefresh,
  className = "",
}: OverlayStatusPanelProps) {
  const [cacheStats, setCacheStats] = useState({
    totalEntries: 0,
    expiredEntries: 0,
    inflightRequests: 0,
  });

  // Update cache stats periodically
  useEffect(() => {
    const updateStats = () => {
      setCacheStats(overlayCache.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const providerName = provider === "github" ? "GitHub" : "GitLab";

  return (
    <div
      className={`overlay-status-panel rounded-lg border border-gray-200 bg-white p-4 ${className}`}
      role="region"
      aria-label={`${providerName} overlay status`}
    >
      <h3 className="mb-3 text-sm font-semibold text-gray-900">
        {providerName} Overlay Status
      </h3>

      {rateLimit && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rate Limit:</span>
            <span
              className={`text-sm font-medium ${getStatusColor(calculatePercentage(rateLimit.remaining, rateLimit.limit))}`}
              aria-label={`${rateLimit.remaining} of ${rateLimit.limit} requests remaining`}
            >
              {rateLimit.remaining} / {rateLimit.limit}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Remaining:</span>
            <span className="text-sm font-medium text-gray-900">
              {calculatePercentage(rateLimit.remaining, rateLimit.limit)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Resets:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatResetTime(rateLimit.reset)}
            </span>
          </div>

          {/* Visual progress bar */}
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-valuenow={rateLimit.remaining}
            aria-valuemin={0}
            aria-valuemax={rateLimit.limit}
            aria-label="Rate limit usage"
          >
            <div
              className={`h-full transition-all duration-300 ${
                calculatePercentage(rateLimit.remaining, rateLimit.limit) > 50
                  ? "bg-green-500"
                  : calculatePercentage(rateLimit.remaining, rateLimit.limit) >
                      20
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{
                width: `${calculatePercentage(rateLimit.remaining, rateLimit.limit)}%`,
              }}
            />
          </div>
        </div>
      )}

      {!rateLimit && (
        <div className="mb-4">
          <span className="text-sm text-gray-500">
            No rate limit information available
          </span>
        </div>
      )}

      {lastRefresh && (
        <div className="mb-4 flex items-center justify-between border-t border-gray-200 pt-3">
          <span className="text-sm text-gray-600">Last Refresh:</span>
          <span className="text-sm font-medium text-gray-900">
            {formatRelativeTime(lastRefresh)}
          </span>
        </div>
      )}

      <div className="space-y-1 border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Cache Entries:</span>
          <span className="text-xs font-medium text-gray-700">
            {cacheStats.totalEntries}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Expired:</span>
          <span className="text-xs font-medium text-gray-700">
            {cacheStats.expiredEntries}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Inflight:</span>
          <span className="text-xs font-medium text-gray-700">
            {cacheStats.inflightRequests}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight logging utility for error reporting.
 * Logs to console and provides a stub for window.reportError.
 */

export interface ErrorContext {
  componentStack?: string;
  digest?: string;
  [key: string]: unknown;
}

/**
 * Log an error with optional context
 */
export function logError(error: Error, context?: ErrorContext): void {
  // Log to console with full details
  console.error("[Error]", error);
  
  if (context) {
    console.error("[Context]", context);
  }

  // Use window.reportError if available (modern browsers)
  if (typeof window !== "undefined" && "reportError" in window) {
    try {
      window.reportError(error);
    } catch (e) {
      // Silently fail if reportError itself throws
      console.warn("Failed to report error:", e);
    }
  }
}

/**
 * Log a warning message
 */
export function logWarning(message: string, context?: Record<string, unknown>): void {
  console.warn("[Warning]", message);
  
  if (context) {
    console.warn("[Context]", context);
  }
}

/**
 * Log an info message
 */
export function logInfo(message: string, context?: Record<string, unknown>): void {
  console.info("[Info]", message);
  
  if (context) {
    console.info("[Context]", context);
  }
}

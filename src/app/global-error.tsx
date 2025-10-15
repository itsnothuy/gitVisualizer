"use client";

import * as React from "react";
import { logError } from "@/lib/logging";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error to the console and window.reportError
    logError(error, {
      digest: error.digest,
      componentStack: (error as Error & { componentStack?: string }).componentStack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold leading-none">
                Application Error
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                A critical error occurred. Please try reloading the page.
              </p>
            </div>
            
            <div 
              className="rounded-md bg-red-50 dark:bg-red-950 p-4" 
              role="alert"
              aria-live="assertive"
            >
              <p className="text-sm text-red-800 dark:text-red-200 font-mono break-words">
                {error.message || "An unexpected error occurred"}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                aria-label="Try again"
              >
                Try again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                aria-label="Go to homepage"
              >
                Go to homepage
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

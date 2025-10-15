"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { logError } from "@/lib/logging";

export default function ErrorBoundary({
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
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An error occurred while rendering this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="rounded-md bg-red-50 dark:bg-red-950 p-4" 
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-red-800 dark:text-red-200 font-mono">
              {error.message || "An unexpected error occurred"}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button 
            onClick={reset}
            variant="default"
            aria-label="Try again"
          >
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            aria-label="Go to homepage"
          >
            Go to homepage
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

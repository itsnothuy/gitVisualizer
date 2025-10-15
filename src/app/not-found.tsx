import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Page Not Found</CardTitle>
          <CardDescription>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="rounded-md bg-yellow-50 dark:bg-yellow-950 p-4" 
            role="status"
            aria-live="polite"
          >
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>404:</strong> This route could not be found.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button asChild variant="default">
            <Link href="/" aria-label="Go to homepage">
              Go to homepage
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/demo" aria-label="View demo">
              View demo
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

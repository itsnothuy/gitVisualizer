"use client";

import Link from "next/link";
import { GitBranch } from "lucide-react";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { ModeSelector } from "@/components/mode/mode-selector";

export function AppHeader() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <div className="container flex h-14 items-center">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:border focus:rounded-md focus:top-2 focus:left-2"
        >
          Skip to main content
        </a>
        <div className="mr-4 flex">
          <Link
            href="/"
            className="mr-6 flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            <GitBranch className="h-6 w-6" aria-hidden="true" />
            <span className="font-bold">Git Visualizer</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <ModeSelector />
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

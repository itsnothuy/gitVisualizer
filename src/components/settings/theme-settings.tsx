"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLgbMode } from "./use-lgb-mode";

/**
 * ThemeSettings Component
 * 
 * Provides UI for toggling the LGB skin mode.
 * Respects prefers-reduced-motion and persists preference per session.
 */
export function ThemeSettings() {
  const [isLgbMode, toggleLgbMode] = useLgbMode();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize the graph visualization theme</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">LGB Mode</h3>
            <p className="text-xs text-muted-foreground">
              Use the LGB color scheme for graph visualization
            </p>
          </div>
          <Button
            variant={isLgbMode ? "default" : "outline"}
            size="sm"
            onClick={toggleLgbMode}
            aria-pressed={isLgbMode}
            aria-label={`LGB mode is ${isLgbMode ? "on" : "off"}. Click to toggle.`}
          >
            {isLgbMode ? "On" : "Off"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

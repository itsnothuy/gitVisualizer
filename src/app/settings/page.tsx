"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { LanguageSwitcher } from "@/components/settings/language-switcher";
import { PerformanceSettings } from "@/components/settings/PerformanceSettings";
import { useTranslation } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.title')}</CardTitle>
          <CardDescription>
            Manage your preferences and application settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <LanguageSwitcher />
          </div>

          <Separator />

          <div className="space-y-4">
            <ThemeToggle />
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Performance</h3>
            <p className="text-sm text-muted-foreground">
              Adjust performance settings to optimize for your use case
            </p>
            <PerformanceSettings variant="inline" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

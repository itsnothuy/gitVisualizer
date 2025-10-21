"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RepositoryPicker } from "@/components/ingestion/repository-picker";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useFirstVisit } from "@/lib/onboarding";
import { useTranslation } from "@/lib/i18n";
import { useRepository } from "@/lib/repository/RepositoryContext";
import { AlertCircleIcon } from "lucide-react";

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isFirstVisit, isLoading: isOnboardingLoading, markOnboardingComplete } = useFirstVisit();
  const { loadRepository, isLoading, error, progress, clearError } = useRepository();
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  // Show onboarding automatically on first visit
  React.useEffect(() => {
    if (!isOnboardingLoading && isFirstVisit) {
      setShowOnboarding(true);
    }
  }, [isFirstVisit, isOnboardingLoading]);

  const handleRepositorySelected = React.useCallback(async (handle: FileSystemDirectoryHandle) => {
    try {
      await loadRepository(handle);
      // Navigate to visualization page after successful load
      router.push('/repo');
    } catch (err) {
      // Error is already handled by the context
      console.error("Repository selection error:", err);
    }
  }, [loadRepository, router]);

  const handleError = React.useCallback((errorMessage: string) => {
    console.error("Repository selection error:", errorMessage);
  }, []);

  const handleOnboardingComplete = () => {
    markOnboardingComplete();
    setShowOnboarding(false);
  };

  return (
    <div className="space-y-6">
      {/* Onboarding Wizard */}
      <OnboardingWizard
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('home.welcome')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('home.tagline')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('home.gettingStarted.title')}</CardTitle>
          <CardDescription>
            {t('home.gettingStarted.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            {t('home.gettingStarted.intro')}
          </p>

          {/* Processing state */}
          {isLoading && progress && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md" role="status">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                    Processing Repository...
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {progress.message} ({progress.percentage}%)
                  </p>
                  {progress.processed !== undefined && progress.total !== undefined && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {progress.processed} / {progress.total} items
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-md" role="alert">
              <div className="flex items-start gap-2">
                <AlertCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                    {t('home.gettingStarted.errorPrefix')}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <RepositoryPicker
              onRepositorySelected={handleRepositorySelected}
              onError={handleError}
            />
            <Button
              variant="outline"
              onClick={() => setShowOnboarding(true)}
            >
              {t('common.learnMore')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

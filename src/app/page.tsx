"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RepositoryPicker } from "@/components/ingestion/repository-picker";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useFirstVisit } from "@/lib/onboarding";
import { useTranslation } from "@/lib/i18n";

export default function Home() {
  const { t } = useTranslation();
  const { isFirstVisit, isLoading, markOnboardingComplete } = useFirstVisit();
  const [selectedRepo, setSelectedRepo] = React.useState<FileSystemDirectoryHandle | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  // Show onboarding automatically on first visit
  React.useEffect(() => {
    if (!isLoading && isFirstVisit) {
      setShowOnboarding(true);
    }
  }, [isFirstVisit, isLoading]);

  const handleRepositorySelected = React.useCallback((handle: FileSystemDirectoryHandle) => {
    setSelectedRepo(handle);
    setError(null);
    console.log("Repository selected:", handle.name);
  }, []);

  const handleError = React.useCallback((errorMessage: string) => {
    setError(errorMessage);
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

          {selectedRepo && (
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-md" role="status">
              <p className="text-sm text-green-800 dark:text-green-200">
                <span className="font-semibold">{t('home.gettingStarted.repositoryConnected')}</span> {selectedRepo.name}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-md" role="alert">
              <p className="text-sm text-red-800 dark:text-red-200">
                <span className="font-semibold">{t('home.gettingStarted.errorPrefix')}</span> {error}
              </p>
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

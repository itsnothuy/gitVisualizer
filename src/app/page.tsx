"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedRepositoryPicker } from "@/components/ingestion/EnhancedRepositoryPicker";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useFirstVisit } from "@/lib/onboarding";
import { useTranslation } from "@/lib/i18n";

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isFirstVisit, isLoading: isOnboardingLoading, markOnboardingComplete } = useFirstVisit();
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  // Show onboarding automatically on first visit
  React.useEffect(() => {
    if (!isOnboardingLoading && isFirstVisit) {
      setShowOnboarding(true);
    }
  }, [isFirstVisit, isOnboardingLoading]);

  const handleRepositoryLoaded = React.useCallback(() => {
    // Navigate to visualization page after successful load
    router.push('/repo');
  }, [router]);

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

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowOnboarding(true)}
            >
              {t('common.learnMore')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Repository Picker */}
      <EnhancedRepositoryPicker
        onRepositoryLoaded={handleRepositoryLoaded}
        onError={handleError}
        showRecentRepositories={true}
      />
    </div>
  );
}

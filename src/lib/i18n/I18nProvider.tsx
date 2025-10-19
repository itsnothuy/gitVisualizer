'use client';

import * as React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { languages, type SupportedLanguage } from './config';

export interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * I18nProvider wraps the app with i18next context
 * Handles initialization and language changes
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    // Initialize i18n if not already initialized
    if (!i18n.isInitialized) {
      i18n.init().then(() => {
        setIsInitialized(true);
      });
    } else {
      setIsInitialized(true);
    }
  }, []);

  React.useEffect(() => {
    // Update document direction when language changes
    const handleLanguageChange = (lng: string) => {
      const language = lng as SupportedLanguage;
      const dir = languages[language]?.dir || 'ltr';
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', lng);
    };

    // Set initial direction
    handleLanguageChange(i18n.language);

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

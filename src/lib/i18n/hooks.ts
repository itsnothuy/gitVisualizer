import { useTranslation as useI18nTranslation } from 'react-i18next';
import i18n, { languages, type SupportedLanguage } from './config';

/**
 * Custom hook for translations
 * Re-exports react-i18next's useTranslation with type safety
 */
export function useTranslation(ns?: string | string[]) {
  return useI18nTranslation(ns);
}

/**
 * Custom hook for language management
 * Provides utilities for changing language and getting language info
 */
export function useLanguage() {
  const { i18n: i18nInstance } = useI18nTranslation();

  const changeLanguage = async (lng: SupportedLanguage) => {
    await i18nInstance.changeLanguage(lng);
  };

  const currentLanguage = i18nInstance.language as SupportedLanguage;
  const currentDir = languages[currentLanguage]?.dir || 'ltr';

  return {
    currentLanguage,
    currentDir,
    changeLanguage,
    languages,
    isRTL: currentDir === 'rtl',
  };
}

/**
 * Get the current language direction (for server-side or outside React components)
 */
export function getLanguageDir(lng?: string): 'ltr' | 'rtl' {
  const language = (lng || i18n.language) as SupportedLanguage;
  return languages[language]?.dir || 'ltr';
}

/**
 * Get localized content from tutorial levels
 * Supports the existing LocalizedContent format used in levels
 */
export function useLocalizedContent<T extends Record<string, unknown>>(
  content: T
): string | string[] {
  const { i18n: i18nInstance } = useI18nTranslation();
  
  // Map i18next language codes to level locale codes
  const localeMap: Record<string, string> = {
    en: 'en_US',
    de: 'de_DE',
    ar: 'ar_SA',
  };

  const i18nLang = i18nInstance.language.split('-')[0]; // Get base language
  const locale = localeMap[i18nLang] || 'en_US';
  
  // Try to get content in current locale, fallback to en_US
  const localizedValue = content[locale] || content['en_US'];
  
  return localizedValue as string | string[];
}

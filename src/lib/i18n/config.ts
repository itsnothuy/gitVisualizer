import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Define supported languages and their properties
export const languages = {
  en: { name: 'English', dir: 'ltr' },
  de: { name: 'Deutsch', dir: 'ltr' },
  ar: { name: 'العربية', dir: 'rtl' },
} as const;

export type SupportedLanguage = keyof typeof languages;

// Initialize i18next
i18n
  .use(HttpBackend) // Load translations via HTTP
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    fallbackLng: 'en',
    supportedLngs: Object.keys(languages),
    debug: process.env.NODE_ENV === 'development',

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'querystring'],
      caches: ['localStorage'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Load translations lazily via HTTP
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },

    react: {
      useSuspense: false, // Disable suspense for Next.js compatibility
    },
  });

export default i18n;

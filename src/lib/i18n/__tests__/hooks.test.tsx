import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Mock translations
const resources = {
  en: {
    translation: {
      common: {
        appName: 'Git Visualizer',
        loading: 'Loading...',
      },
      home: {
        welcome: 'Welcome to Git Visualizer',
        gettingStarted: {
          title: 'Getting Started',
        },
      },
    },
  },
  de: {
    translation: {
      common: {
        appName: 'Git Visualizer',
        loading: 'Laden...',
      },
      home: {
        welcome: 'Willkommen bei Git Visualizer',
        gettingStarted: {
          title: 'Erste Schritte',
        },
      },
    },
  },
  ar: {
    translation: {
      common: {
        appName: 'مُصَوِّر Git',
      },
    },
  },
};

// Initialize test i18n instance
const testI18n = i18n.createInstance();
testI18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    resources,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Wrapper for hooks that require I18nProvider
function wrapper({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>;
}

// Import hooks after setting up test i18n
import { useTranslation, useLanguage, useLocalizedContent } from '../hooks';

describe('i18n hooks', () => {
  beforeAll(async () => {
    // Ensure i18n is initialized
    await testI18n.changeLanguage('en');
  });

  afterEach(async () => {
    // Reset to English after each test
    await testI18n.changeLanguage('en');
  });

  describe('useTranslation', () => {
    it('should return translation function', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });

      expect(result.current.t).toBeDefined();
      expect(typeof result.current.t).toBe('function');
    });

    it('should translate keys correctly', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });

      expect(result.current.t('common.appName')).toBe('Git Visualizer');
      expect(result.current.t('common.loading')).toBe('Loading...');
    });

    it('should handle nested keys', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });

      expect(result.current.t('home.gettingStarted.title')).toBe('Getting Started');
    });

    it('should return key if translation not found', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });

      expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
    });
  });

  describe('useLanguage', () => {
    it('should return current language', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      expect(result.current.currentLanguage).toBeDefined();
      expect(['en', 'de', 'ar']).toContain(result.current.currentLanguage);
    });

    it('should return correct direction for LTR languages', async () => {
      await testI18n.changeLanguage('en');
      const { result } = renderHook(() => useLanguage(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentDir).toBe('ltr');
        expect(result.current.isRTL).toBe(false);
      });
    });

    it('should change language', async () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      expect(result.current.changeLanguage).toBeDefined();

      await result.current.changeLanguage('de');

      await waitFor(() => {
        expect(result.current.currentLanguage).toBe('de');
      });
    });

    it('should update direction when changing to RTL language', async () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      await result.current.changeLanguage('ar');

      await waitFor(() => {
        expect(result.current.currentLanguage).toBe('ar');
        expect(result.current.currentDir).toBe('rtl');
        expect(result.current.isRTL).toBe(true);
      });
    });

    it('should provide available languages', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      expect(result.current.languages).toBeDefined();
      expect(result.current.languages.en).toEqual({ name: 'English', dir: 'ltr' });
      expect(result.current.languages.de).toEqual({ name: 'Deutsch', dir: 'ltr' });
      expect(result.current.languages.ar).toEqual({ name: 'العربية', dir: 'rtl' });
    });
  });

  describe('useLocalizedContent', () => {
    it('should return English content by default', async () => {
      await testI18n.changeLanguage('en');
      
      const { result } = renderHook(
        () => useLocalizedContent({ en_US: 'Hello', de_DE: 'Hallo' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current).toBe('Hello');
      });
    });

    it('should return German content when language is de', async () => {
      await testI18n.changeLanguage('de');
      
      const { result, rerender } = renderHook(
        () => useLocalizedContent({ en_US: 'Hello', de_DE: 'Hallo' }),
        { wrapper }
      );

      // Force re-render to pick up language change
      rerender();

      await waitFor(() => {
        expect(result.current).toBe('Hallo');
      });
    });

    it('should fallback to English if translation not available', async () => {
      await testI18n.changeLanguage('ar');
      
      const { result, rerender } = renderHook(
        () => useLocalizedContent({ en_US: 'Hello', de_DE: 'Hallo' }),
        { wrapper }
      );

      rerender();

      await waitFor(() => {
        expect(result.current).toBe('Hello');
      });
    });

    it('should handle array content', async () => {
      await testI18n.changeLanguage('en');
      
      const { result } = renderHook(
        () => useLocalizedContent({ en_US: ['Line 1', 'Line 2'], de_DE: ['Zeile 1', 'Zeile 2'] }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current).toEqual(['Line 1', 'Line 2']);
      });
    });
  });
});

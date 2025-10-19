'use client';

import * as React from 'react';
import { useLanguage, useTranslation } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

/**
 * Language switcher component for settings
 * Allows users to change the application language
 * Meets WCAG 2.2 AA requirements with proper labels and keyboard support
 */
export function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const { t } = useTranslation();

  const handleLanguageChange = async (value: string) => {
    await changeLanguage(value as keyof typeof languages);
  };

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex items-center space-x-2">
        <Globe className="h-4 w-4" aria-hidden="true" />
        <div>
          <label htmlFor="language-select" className="text-sm font-medium">
            {t('settings.language.label')}
          </label>
          <p className="text-xs text-muted-foreground">
            {t('settings.language.description')}
          </p>
        </div>
      </div>
      <Select
        value={currentLanguage}
        onValueChange={handleLanguageChange}
      >
        <SelectTrigger
          id="language-select"
          className="w-[180px]"
          aria-label={t('settings.language.label')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(languages).map(([code, { name }]) => (
            <SelectItem key={code} value={code}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

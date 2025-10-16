'use client'

import { useEffect, useState } from 'react'

export type Theme = 'default' | 'lgb'

const THEME_STORAGE_KEY = 'git-viz-theme'

/**
 * Hook to manage theme state and persistence
 * Persists theme selection in sessionStorage and applies to <html> element
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('default')
  const [mounted, setMounted] = useState(false)

  // Load theme from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (stored === 'lgb' || stored === 'default') {
      setThemeState(stored)
      applyTheme(stored)
    }
    setMounted(true)
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    sessionStorage.setItem(THEME_STORAGE_KEY, newTheme)
    applyTheme(newTheme)
  }

  return { theme, setTheme, mounted }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  
  if (theme === 'lgb') {
    root.setAttribute('data-theme', 'lgb')
  } else {
    root.removeAttribute('data-theme')
  }
}

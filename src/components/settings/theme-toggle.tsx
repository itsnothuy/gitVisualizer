'use client'

import * as React from 'react'
import { useTheme } from '@/lib/theme/use-theme'
import { Button } from '@/components/ui/button'

/**
 * Theme toggle component for switching between default and LGB mode
 * Meets WCAG 2.2 AA requirements with proper labels and keyboard support
 */
export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme()

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-10 w-24 animate-pulse bg-muted rounded" />
      </div>
    )
  }

  const handleToggle = () => {
    setTheme(theme === 'lgb' ? 'default' : 'lgb')
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">
        LGB Mode
      </span>
      <Button
        variant={theme === 'lgb' ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggle}
        aria-pressed={theme === 'lgb'}
        aria-label={theme === 'lgb' ? 'Disable Learn Git Branching mode' : 'Enable Learn Git Branching mode'}
        data-testid="theme-toggle"
      >
        {theme === 'lgb' ? 'On' : 'Off'}
      </Button>
    </div>
  )
}

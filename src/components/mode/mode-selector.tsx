/**
 * Mode Selector Component
 * Allows switching between Local Repository, Sandbox, and Tutorial modes
 */

'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

export type AppMode = 'local' | 'sandbox' | 'tutorial';

interface ModeSelectorProps {
  className?: string;
}

const modes = [
  { id: 'local' as const, label: 'Local', href: '/', ariaLabel: 'Local repository mode' },
  {
    id: 'sandbox' as const,
    label: 'Sandbox',
    href: '/sandbox',
    ariaLabel: 'Sandbox mode with live command execution',
  },
  {
    id: 'tutorial' as const,
    label: 'Tutorial',
    href: '/demo',
    ariaLabel: 'Tutorial mode with guided lessons',
  },
];

/**
 * Mode selector component for app header
 */
export function ModeSelector({ className }: ModeSelectorProps) {
  const pathname = usePathname();

  // Determine current mode from pathname
  const currentMode = React.useMemo((): AppMode => {
    if (pathname?.startsWith('/sandbox')) return 'sandbox';
    if (pathname?.startsWith('/demo') || pathname?.startsWith('/fixture')) return 'tutorial';
    return 'local';
  }, [pathname]);

  return (
    <div
      className={cn('flex items-center gap-1 p-1 bg-muted rounded-lg', className)}
      role="tablist"
      aria-label="Application mode selector"
    >
      {modes.map((mode) => {
        const isActive = currentMode === mode.id;

        return (
          <Link
            key={mode.id}
            href={mode.href}
            role="tab"
            aria-selected={isActive}
            aria-label={mode.ariaLabel}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-gray-700 hover:text-foreground hover:bg-background/50'
            )}
          >
            {mode.label}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Hook to get current app mode
 */
export function useAppMode(): AppMode {
  const pathname = usePathname();

  return React.useMemo((): AppMode => {
    if (pathname?.startsWith('/sandbox')) return 'sandbox';
    if (pathname?.startsWith('/demo') || pathname?.startsWith('/fixture')) return 'tutorial';
    return 'local';
  }, [pathname]);
}

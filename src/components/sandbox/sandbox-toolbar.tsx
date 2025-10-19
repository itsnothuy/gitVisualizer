/**
 * Sandbox Toolbar Component
 * Additional controls and metadata display for sandbox mode
 */

'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { SandboxSession } from '@/lib/sandbox/SandboxSession';

interface SandboxToolbarProps {
  session: SandboxSession;
}

export function SandboxToolbar({ session }: SandboxToolbarProps) {
  const metadata = session.getMetadata();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Session:</span>{' '}
            <span className="font-semibold">{metadata.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Commands:</span>{' '}
            <span className="font-semibold">{metadata.commandCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Commits:</span>{' '}
            <span className="font-semibold">{metadata.commitCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Branches:</span>{' '}
            <span className="font-semibold">{metadata.branchCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XIcon } from "lucide-react";
import type { GitCommit } from "@/cli/types";
import type { ProcessedRepository } from "@/lib/git/processor";

interface RepositoryInspectorProps {
  selectedCommit: GitCommit | null;
  repository: ProcessedRepository | null;
  onClose: () => void;
}

/**
 * Repository Inspector Component
 * 
 * Displays detailed information about the selected commit.
 * Implements progressive disclosure and keyboard navigation.
 */
export function RepositoryInspector({ 
  selectedCommit, 
  repository, 
  onClose 
}: RepositoryInspectorProps) {
  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCommit) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCommit, onClose]);

  if (!selectedCommit || !repository) {
    return null;
  }

  // Find branches and tags for this commit
  const branches = repository.dag.branches.filter(b => b.target === selectedCommit.id);
  const tags = repository.dag.tags.filter(t => t.target === selectedCommit.id);

  return (
    <aside 
      className="border-l bg-background w-80 flex flex-col"
      role="complementary"
      aria-label="Commit details"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold">Commit Details</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close commit details"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Commit ID */}
          <div>
            <dt className="text-sm font-semibold mb-1">Commit ID</dt>
            <dd className="text-sm font-mono text-muted-foreground break-all">
              {selectedCommit.id}
            </dd>
          </div>

          {/* Message */}
          <div>
            <dt className="text-sm font-semibold mb-1">Message</dt>
            <dd className="text-sm text-muted-foreground whitespace-pre-wrap">
              {selectedCommit.message}
            </dd>
          </div>

          {/* Author */}
          <div>
            <dt className="text-sm font-semibold mb-1">Author</dt>
            <dd className="text-sm text-muted-foreground">
              {selectedCommit.author}
            </dd>
          </div>

          {/* Timestamp */}
          <div>
            <dt className="text-sm font-semibold mb-1">Date</dt>
            <dd className="text-sm text-muted-foreground">
              {new Date(selectedCommit.timestamp).toLocaleString()}
            </dd>
          </div>

          {/* Parents */}
          {selectedCommit.parents && selectedCommit.parents.length > 0 && (
            <div>
              <dt className="text-sm font-semibold mb-1">
                Parent{selectedCommit.parents.length > 1 ? 's' : ''} 
                {selectedCommit.parents.length > 1 && (
                  <span className="text-xs text-muted-foreground ml-1">(merge commit)</span>
                )}
              </dt>
              <dd className="space-y-1">
                {selectedCommit.parents.map((parentId, idx) => (
                  <div key={`${parentId}-${idx}`} className="text-sm font-mono text-muted-foreground break-all">
                    {parentId.substring(0, 8)}...
                  </div>
                ))}
              </dd>
            </div>
          )}

          {/* Branches */}
          {branches.length > 0 && (
            <div>
              <dt className="text-sm font-semibold mb-1">Branches</dt>
              <dd className="flex flex-wrap gap-1">
                {branches.map((branch) => (
                  <span
                    key={branch.name}
                    className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {branch.name}
                  </span>
                ))}
              </dd>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <dt className="text-sm font-semibold mb-1">Tags</dt>
              <dd className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag.name}
                    className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    {tag.name}
                  </span>
                ))}
              </dd>
            </div>
          )}

          {/* Tree */}
          <div>
            <dt className="text-sm font-semibold mb-1">Tree</dt>
            <dd className="text-sm font-mono text-muted-foreground break-all">
              {selectedCommit.tree}
            </dd>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}

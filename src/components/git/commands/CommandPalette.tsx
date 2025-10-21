/**
 * Command Palette Component
 * Provides a searchable command palette for Git operations
 */

'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import type { GitCommandType } from '@/lib/git/commands/CommandSystem';

/**
 * Command option in the palette
 */
export interface CommandOption {
  /** Unique command ID */
  id: string;
  /** Command type */
  type: GitCommandType;
  /** Display label */
  label: string;
  /** Description */
  description: string;
  /** Keyboard shortcut (if any) */
  shortcut?: string;
  /** Icon name */
  icon?: string;
  /** Whether command is enabled */
  enabled?: boolean;
}

/**
 * Command palette props
 */
export interface CommandPaletteProps {
  /** Whether the palette is open */
  isOpen: boolean;
  /** Callback to close the palette */
  onClose: () => void;
  /** Available commands */
  commands: CommandOption[];
  /** Callback when a command is selected */
  onCommandSelect: (option: CommandOption) => void;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Command Palette Component
 * Searchable interface for executing Git commands
 */
export function CommandPalette({
  isOpen,
  onClose,
  commands,
  onCommandSelect,
  placeholder = 'Type a command...',
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter commands based on query
  const filteredCommands = React.useMemo(() => {
    if (!query.trim()) {
      return commands;
    }

    const lowerQuery = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.description.toLowerCase().includes(lowerQuery) ||
        cmd.type.toLowerCase().includes(lowerQuery)
    );
  }, [commands, query]);

  // Reset selection when filtered commands change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredCommands.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onCommandSelect(filteredCommands[selectedIndex]);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onCommandSelect, onClose]
  );

  const handleCommandClick = (command: CommandOption) => {
    if (command.enabled !== false) {
      onCommandSelect(command);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl p-0"
        aria-describedby="command-palette-description"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
          <DialogDescription id="command-palette-description">
            Search and execute Git commands
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Search commands"
              aria-autocomplete="list"
              aria-controls="command-list"
              aria-activedescendant={
                filteredCommands[selectedIndex]
                  ? `command-${filteredCommands[selectedIndex].id}`
                  : undefined
              }
            />
          </div>

          {/* Command List */}
          <div
            id="command-list"
            role="listbox"
            aria-label="Available commands"
            className="max-h-[400px] overflow-y-auto"
          >
            {filteredCommands.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No commands found
              </div>
            ) : (
              filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  id={`command-${command.id}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  aria-disabled={command.enabled === false}
                  onClick={() => handleCommandClick(command)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  } ${command.enabled === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{command.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {command.description}
                    </div>
                  </div>
                  {command.shortcut && (
                    <kbd className="ml-2 rounded bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
                      {command.shortcut}
                    </kbd>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Help Text */}
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            Use arrow keys to navigate, Enter to execute, Escape to close
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Get contextual commands based on repository state
 */
export function getContextualCommands(): CommandOption[] {
  // This would analyze the repository state to provide context-aware commands
  // For now, return a static list of common commands
  return [
    {
      id: 'commit',
      type: 'commit',
      label: 'Commit',
      description: 'Create a new commit with staged changes',
      shortcut: 'Ctrl+Enter',
      enabled: true,
    },
    {
      id: 'branch',
      type: 'branch',
      label: 'Create Branch',
      description: 'Create a new branch from the current HEAD',
      shortcut: 'Ctrl+B',
      enabled: true,
    },
    {
      id: 'checkout',
      type: 'checkout',
      label: 'Switch Branch',
      description: 'Switch to a different branch',
      shortcut: 'Ctrl+Shift+B',
      enabled: true,
    },
    {
      id: 'merge',
      type: 'merge',
      label: 'Merge',
      description: 'Merge another branch into the current branch',
      enabled: true,
    },
    {
      id: 'rebase',
      type: 'rebase',
      label: 'Interactive Rebase',
      description: 'Rebase commits with interactive mode',
      enabled: true,
    },
    {
      id: 'cherry-pick',
      type: 'cherry-pick',
      label: 'Cherry Pick',
      description: 'Apply changes from specific commits',
      enabled: true,
    },
    {
      id: 'reset',
      type: 'reset',
      label: 'Reset',
      description: 'Reset current HEAD to a specific state',
      enabled: true,
    },
    {
      id: 'revert',
      type: 'revert',
      label: 'Revert',
      description: 'Create a new commit that undoes changes',
      enabled: true,
    },
    {
      id: 'tag',
      type: 'tag',
      label: 'Create Tag',
      description: 'Create a new tag at the current commit',
      enabled: true,
    },
    {
      id: 'stash',
      type: 'stash',
      label: 'Stash Changes',
      description: 'Temporarily save uncommitted changes',
      enabled: true,
    },
  ];
}

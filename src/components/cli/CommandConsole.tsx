/**
 * CommandConsole Component
 * Terminal-like interface for entering Git commands with history and output
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { processCommand, type CommandExecutionContext } from '@/cli/processCommand';
import type { GitState } from '@/cli/types';

export interface CommandConsoleProps {
  /** Update state callback */
  onStateChange: (newState: GitState) => void;
  /** Command execution context */
  context: CommandExecutionContext;
  /** Whether console is locked (during animations) */
  locked?: boolean;
  /** Custom className */
  className?: string;
  /** ARIA label */
  'aria-label'?: string;
}

interface OutputLine {
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: number;
}

/**
 * Command Console with history and keyboard navigation
 */
export function CommandConsole({
  onStateChange,
  context,
  locked = false,
  className,
  'aria-label': ariaLabel = 'Git command console',
}: CommandConsoleProps) {
  const [input, setInput] = React.useState('');
  const [history, setHistory] = React.useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [output, setOutput] = React.useState<OutputLine[]>([
    {
      type: 'output',
      content: 'Git Visualizer Command Console. Type a command or "help" for assistance.',
      timestamp: Date.now(),
    },
  ]);
  
  const inputRef = React.useRef<HTMLInputElement>(null);
  const outputRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when output changes
  React.useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input on mount
  React.useEffect(() => {
    if (inputRef.current && !locked) {
      inputRef.current.focus();
    }
  }, [locked]);

  /**
   * Add line to output
   */
  const addOutput = React.useCallback((type: OutputLine['type'], content: string) => {
    setOutput((prev) => [
      ...prev,
      { type, content, timestamp: Date.now() },
    ]);
  }, []);

  /**
   * Handle command submission
   */
  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!input.trim() || locked) return;

      // Add command to output
      addOutput('command', `$ ${input}`);

      // Add to history
      setHistory((prev) => [...prev, input]);
      setHistoryIndex(-1);

      // Execute command
      try {
        const result = processCommand(input, context);

        // Add result to output
        if (result.success) {
          addOutput('output', result.message);
          
          // Update state if command modified it
          if (result.newState) {
            onStateChange(result.newState);
            context.state = result.newState;
          }
        } else {
          addOutput('error', result.message);
        }
      } catch (error) {
        addOutput(
          'error',
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Clear input
      setInput('');
    },
    [input, locked, context, addOutput, onStateChange]
  );

  /**
   * Handle keyboard navigation (up/down for history)
   */
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (locked) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length === 0) return;

        const newIndex =
          historyIndex === -1
            ? history.length - 1
            : Math.max(0, historyIndex - 1);
        
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex === -1) return;

        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setInput('');
        setHistoryIndex(-1);
      }
    },
    [history, historyIndex, locked]
  );

  return (
    <Card
      className={cn('flex flex-col h-96', className)}
      aria-label={ariaLabel}
      role="region"
    >
      <CardHeader className="border-b">
        <CardTitle className="text-base font-mono">Command Console</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Output area */}
        <ScrollArea className="flex-1 p-4">
          <div
            ref={outputRef}
            className="font-mono text-sm space-y-1"
            role="log"
            aria-live="polite"
            aria-atomic="false"
          >
            {output.map((line, index) => (
              <div
                key={`${line.timestamp}-${index}`}
                className={cn(
                  'whitespace-pre-wrap break-words',
                  line.type === 'command' && 'text-primary font-semibold',
                  line.type === 'output' && 'text-foreground',
                  line.type === 'error' && 'text-destructive'
                )}
                role={line.type === 'error' ? 'alert' : undefined}
              >
                {line.content}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          className="border-t p-4 bg-muted/30"
        >
          <div className="flex items-center gap-2">
            <span
              className="text-primary font-mono font-semibold"
              aria-hidden="true"
            >
              $
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={locked}
              className={cn(
                'flex-1 bg-transparent font-mono text-sm outline-none',
                'focus-visible:ring-0 focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'placeholder:text-muted-foreground'
              )}
              placeholder={
                locked
                  ? 'Console locked during animation...'
                  : 'Enter Git command (↑↓ for history, Esc to clear)'
              }
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              aria-label="Git command input"
              aria-describedby="command-help"
            />
          </div>
          <div id="command-help" className="sr-only">
            Enter a Git command. Use up and down arrow keys to navigate command
            history. Press Escape to clear input.
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Hook to manage command console state
 */
export function useCommandConsole(initialState: GitState, sandboxMode = true) {
  const [currentState, setCurrentState] = React.useState(initialState);
  const [locked, setLocked] = React.useState(false);

  const contextRef = React.useRef<CommandExecutionContext>({
    state: currentState,
    history: {
      undoStack: [],
      redoStack: [],
      maxSize: 50,
    },
    sandboxMode,
    onAnimate: () => {
      // Lock console during animation
      setLocked(true);

      // Unlock after animation completes (placeholder timing)
      setTimeout(() => {
        setLocked(false);
      }, 1000); // TODO: Use actual animation duration
    },
  });

  // Update context when state changes
  React.useEffect(() => {
    contextRef.current.state = currentState;
  }, [currentState]);

  return {
    state: currentState,
    setState: setCurrentState,
    context: contextRef.current,
    locked,
  };
}

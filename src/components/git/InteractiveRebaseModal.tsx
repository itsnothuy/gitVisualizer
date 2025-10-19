/**
 * Interactive Rebase Modal
 * Provides UI for git rebase -i operations with drag-and-drop reordering
 */

'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RebaseTodoItem, RebaseOperation } from '@/cli/types';

export interface InteractiveRebaseModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** List of commits to rebase */
  todos: RebaseTodoItem[];
  /** Callback when rebase is confirmed */
  onConfirm: (todos: RebaseTodoItem[]) => void;
  /** Callback when rebase is aborted */
  onAbort: () => void;
}

/**
 * Interactive Rebase Modal Component
 * Allows user to pick, squash, edit, drop commits
 */
export function InteractiveRebaseModal({
  open,
  onClose,
  todos: initialTodos,
  onConfirm,
  onAbort,
}: InteractiveRebaseModalProps) {
  const [todos, setTodos] = React.useState<RebaseTodoItem[]>(initialTodos);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  // Update todos when prop changes
  React.useEffect(() => {
    setTodos(initialTodos);
  }, [initialTodos]);

  const handleOperationChange = (index: number, operation: RebaseOperation) => {
    setTodos((prev) =>
      prev.map((todo, i) =>
        i === index ? { ...todo, operation } : todo
      )
    );
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newTodos = [...todos];
    const draggedItem = newTodos[draggedIndex];
    newTodos.splice(draggedIndex, 1);
    newTodos.splice(index, 0, draggedItem);

    // Update order
    const reordered = newTodos.map((todo, i) => ({ ...todo, order: i }));
    setTodos(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleConfirm = () => {
    onConfirm(todos);
    onClose();
  };

  const handleAbort = () => {
    onAbort();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl"
        aria-describedby="interactive-rebase-description"
      >
        <DialogHeader>
          <DialogTitle>Interactive Rebase</DialogTitle>
          <DialogDescription id="interactive-rebase-description">
            Choose operations for each commit. Drag to reorder commits.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-2" role="list" aria-label="Rebase todo list">
            {todos.map((todo, index) => (
              <div
                key={`${todo.commitId}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 rounded-md border p-3 ${
                  draggedIndex === index
                    ? 'opacity-50'
                    : 'hover:bg-accent cursor-move'
                }`}
                role="listitem"
                aria-label={`Commit ${todo.commitId.slice(0, 7)}: ${todo.message}`}
              >
                <div className="flex-shrink-0 w-24">
                  <select
                    value={todo.operation}
                    onChange={(e) =>
                      handleOperationChange(
                        index,
                        e.target.value as RebaseOperation
                      )
                    }
                    className="w-full rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`Operation for commit ${todo.commitId.slice(0, 7)}`}
                  >
                    <option value="pick">pick</option>
                    <option value="squash">squash</option>
                    <option value="edit">edit</option>
                    <option value="drop">drop</option>
                    <option value="reword">reword</option>
                  </select>
                </div>

                <div className="flex-shrink-0">
                  <code className="text-xs text-muted-foreground">
                    {todo.commitId.slice(0, 7)}
                  </code>
                </div>

                <div className="flex-1 truncate text-sm">
                  {todo.message}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleAbort}
            aria-label="Abort rebase"
          >
            Abort
          </Button>
          <Button
            onClick={handleConfirm}
            aria-label="Start rebase with selected operations"
          >
            Start Rebase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

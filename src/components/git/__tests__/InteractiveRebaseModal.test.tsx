/**
 * Tests for InteractiveRebaseModal component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InteractiveRebaseModal } from '../InteractiveRebaseModal';
import type { RebaseTodoItem } from '@/cli/types';

describe('InteractiveRebaseModal', () => {
  const mockTodos: RebaseTodoItem[] = [
    {
      operation: 'pick',
      commitId: 'abc123',
      message: 'First commit',
      order: 0,
    },
    {
      operation: 'pick',
      commitId: 'def456',
      message: 'Second commit',
      order: 1,
    },
    {
      operation: 'pick',
      commitId: 'ghi789',
      message: 'Third commit',
      order: 2,
    },
  ];

  it('should render modal with todos', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const onAbort = vi.fn();

    render(
      <InteractiveRebaseModal
        open={true}
        onClose={onClose}
        todos={mockTodos}
        onConfirm={onConfirm}
        onAbort={onAbort}
      />
    );

    expect(screen.getByText('Interactive Rebase')).toBeInTheDocument();
    expect(screen.getByText('First commit')).toBeInTheDocument();
    expect(screen.getByText('Second commit')).toBeInTheDocument();
    expect(screen.getByText('Third commit')).toBeInTheDocument();
  });

  it('should allow changing operation for a commit', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const onAbort = vi.fn();

    render(
      <InteractiveRebaseModal
        open={true}
        onClose={onClose}
        todos={mockTodos}
        onConfirm={onConfirm}
        onAbort={onAbort}
      />
    );

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(3);

    // Change first commit operation to squash
    await user.selectOptions(selects[0], 'squash');
    expect(selects[0]).toHaveValue('squash');
  });

  it('should call onConfirm when Start Rebase is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const onAbort = vi.fn();

    render(
      <InteractiveRebaseModal
        open={true}
        onClose={onClose}
        todos={mockTodos}
        onConfirm={onConfirm}
        onAbort={onAbort}
      />
    );

    const startButton = screen.getByText('Start Rebase');
    await user.click(startButton);

    expect(onConfirm).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ commitId: 'abc123' }),
        expect.objectContaining({ commitId: 'def456' }),
        expect.objectContaining({ commitId: 'ghi789' }),
      ])
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onAbort when Abort is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const onAbort = vi.fn();

    render(
      <InteractiveRebaseModal
        open={true}
        onClose={onClose}
        todos={mockTodos}
        onConfirm={onConfirm}
        onAbort={onAbort}
      />
    );

    const abortButton = screen.getByText('Abort');
    await user.click(abortButton);

    expect(onAbort).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('should have accessible labels', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const onAbort = vi.fn();

    render(
      <InteractiveRebaseModal
        open={true}
        onClose={onClose}
        todos={mockTodos}
        onConfirm={onConfirm}
        onAbort={onAbort}
      />
    );

    expect(screen.getByLabelText('Rebase todo list')).toBeInTheDocument();
    expect(screen.getByLabelText(/Commit abc123/)).toBeInTheDocument();
    expect(
      screen.getByLabelText('Start rebase with selected operations')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Abort rebase')).toBeInTheDocument();
  });
});

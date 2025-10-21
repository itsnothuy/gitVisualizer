/**
 * Tests for CommandPalette component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CommandPalette,
  getContextualCommands,
  type CommandOption,
} from '../CommandPalette';

describe('CommandPalette', () => {
  const mockCommands: CommandOption[] = [
    {
      id: 'commit',
      type: 'commit',
      label: 'Commit',
      description: 'Create a new commit',
      enabled: true,
    },
    {
      id: 'branch',
      type: 'branch',
      label: 'Create Branch',
      description: 'Create a new branch',
      enabled: true,
    },
    {
      id: 'merge',
      type: 'merge',
      label: 'Merge',
      description: 'Merge branches',
      enabled: false,
    },
  ];

  it('should render when open', () => {
    const onClose = vi.fn();
    const onCommandSelect = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        onClose={onClose}
        commands={mockCommands}
        onCommandSelect={onCommandSelect}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const onClose = vi.fn();
    const onCommandSelect = vi.fn();

    render(
      <CommandPalette
        isOpen={false}
        onClose={onClose}
        commands={mockCommands}
        onCommandSelect={onCommandSelect}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should display all commands', () => {
    const onClose = vi.fn();
    const onCommandSelect = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        onClose={onClose}
        commands={mockCommands}
        onCommandSelect={onCommandSelect}
      />
    );

    expect(screen.getByText('Commit')).toBeInTheDocument();
    expect(screen.getByText('Create Branch')).toBeInTheDocument();
    expect(screen.getByText('Merge')).toBeInTheDocument();
  });

  it('should filter commands based on search query', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCommandSelect = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        onClose={onClose}
        commands={mockCommands}
        onCommandSelect={onCommandSelect}
      />
    );

    const input = screen.getByPlaceholderText('Type a command...');
    await user.type(input, 'branch');

    expect(screen.getByText('Create Branch')).toBeInTheDocument();
    expect(screen.queryByText('Commit')).not.toBeInTheDocument();
  });

  it('should call onCommandSelect when command is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCommandSelect = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        onClose={onClose}
        commands={mockCommands}
        onCommandSelect={onCommandSelect}
      />
    );

    const commitButton = screen.getByText('Commit').closest('button');
    if (commitButton) {
      await user.click(commitButton);
    }

    expect(onCommandSelect).toHaveBeenCalledWith(mockCommands[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('should not select disabled commands', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCommandSelect = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        onClose={onClose}
        commands={mockCommands}
        onCommandSelect={onCommandSelect}
      />
    );

    const mergeButton = screen.getByText('Merge').closest('button');
    if (mergeButton) {
      await user.click(mergeButton);
    }

    expect(onCommandSelect).not.toHaveBeenCalled();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCommandSelect = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        onClose={onClose}
        commands={mockCommands}
        onCommandSelect={onCommandSelect}
      />
    );

    const input = screen.getByPlaceholderText('Type a command...');

    // Navigate down
    await user.type(input, '{ArrowDown}');
    await user.type(input, '{Enter}');

    expect(onCommandSelect).toHaveBeenCalledWith(mockCommands[1]);
  });

  it('should close on Escape key', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCommandSelect = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        onClose={onClose}
        commands={mockCommands}
        onCommandSelect={onCommandSelect}
      />
    );

    const input = screen.getByPlaceholderText('Type a command...');
    await user.type(input, '{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('should display "No commands found" when no matches', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCommandSelect = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        onClose={onClose}
        commands={mockCommands}
        onCommandSelect={onCommandSelect}
      />
    );

    const input = screen.getByPlaceholderText('Type a command...');
    await user.type(input, 'nonexistent');

    expect(screen.getByText('No commands found')).toBeInTheDocument();
  });

  it('should have accessible labels', () => {
    const onClose = vi.fn();
    const onCommandSelect = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        onClose={onClose}
        commands={mockCommands}
        onCommandSelect={onCommandSelect}
      />
    );

    expect(screen.getByLabelText('Search commands')).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toHaveAttribute(
      'aria-label',
      'Available commands'
    );
  });
});

describe('getContextualCommands', () => {
  it('should return a list of commands', () => {
    const commands = getContextualCommands();

    expect(commands).toBeInstanceOf(Array);
    expect(commands.length).toBeGreaterThan(0);
  });

  it('should include common Git commands', () => {
    const commands = getContextualCommands();

    const commandTypes = commands.map((cmd) => cmd.type);
    expect(commandTypes).toContain('commit');
    expect(commandTypes).toContain('branch');
    expect(commandTypes).toContain('merge');
    expect(commandTypes).toContain('rebase');
  });

  it('should have all required fields', () => {
    const commands = getContextualCommands();

    commands.forEach((cmd) => {
      expect(cmd).toHaveProperty('id');
      expect(cmd).toHaveProperty('type');
      expect(cmd).toHaveProperty('label');
      expect(cmd).toHaveProperty('description');
    });
  });
});

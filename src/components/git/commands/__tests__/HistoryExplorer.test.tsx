/**
 * Tests for HistoryExplorer component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryExplorer } from '../HistoryExplorer';
import type { GitState } from '@/cli/types';

// Helper to create a test state
function createTestState(): GitState {
  const now = Date.now();
  return {
    commits: new Map([
      [
        'commit1',
        {
          id: 'commit1',
          parents: [],
          message: 'Initial commit',
          author: 'Alice',
          timestamp: now - 3000,
        },
      ],
      [
        'commit2',
        {
          id: 'commit2',
          parents: ['commit1'],
          message: 'Second commit',
          author: 'Bob',
          timestamp: now - 2000,
        },
      ],
      [
        'commit3',
        {
          id: 'commit3',
          parents: ['commit2'],
          message: 'Third commit',
          author: 'Charlie',
          timestamp: now - 1000,
        },
      ],
    ]),
    branches: new Map([['main', { name: 'main', target: 'commit3' }]]),
    tags: new Map(),
    head: { type: 'branch', name: 'main' },
  };
}

describe('HistoryExplorer', () => {
  it('should render with commits', () => {
    const state = createTestState();

    render(<HistoryExplorer state={state} />);

    expect(screen.getByText('History Explorer')).toBeInTheDocument();
    expect(screen.getByText('Initial commit')).toBeInTheDocument();
    expect(screen.getByText('Second commit')).toBeInTheDocument();
    expect(screen.getByText('Third commit')).toBeInTheDocument();
  });

  it('should display commit details', () => {
    const state = createTestState();

    render(<HistoryExplorer state={state} />);

    expect(screen.getByText('by Alice')).toBeInTheDocument();
    expect(screen.getByText('by Bob')).toBeInTheDocument();
    expect(screen.getByText('by Charlie')).toBeInTheDocument();
  });

  it('should select commit on click', async () => {
    const user = userEvent.setup();
    const state = createTestState();

    render(<HistoryExplorer state={state} />);

    const commitElement = screen.getByText('Initial commit').closest('div');
    if (commitElement) {
      await user.click(commitElement);
    }

    // Should show Time Travel button when commit is selected
    expect(screen.queryByText('Time Travel')).not.toBeInTheDocument(); // Not visible without onTimeTravel
  });

  it('should call onTimeTravel on double click', async () => {
    const user = userEvent.setup();
    const onTimeTravel = vi.fn();
    const state = createTestState();

    render(<HistoryExplorer state={state} onTimeTravel={onTimeTravel} />);

    const commitElement = screen.getByText('Initial commit').closest('div');
    if (commitElement) {
      await user.dblClick(commitElement);
    }

    expect(onTimeTravel).toHaveBeenCalledWith('commit1');
  });

  it('should show Time Travel button when commit is selected', async () => {
    const user = userEvent.setup();
    const onTimeTravel = vi.fn();
    const state = createTestState();

    render(<HistoryExplorer state={state} onTimeTravel={onTimeTravel} />);

    const commitElement = screen.getByText('Initial commit').closest('div');
    if (commitElement) {
      await user.click(commitElement);
    }

    expect(screen.getByText('Time Travel')).toBeInTheDocument();
  });

  it('should allow starting comparison mode', async () => {
    const user = userEvent.setup();
    const onCompareCommits = vi.fn();
    const state = createTestState();

    render(
      <HistoryExplorer state={state} onCompareCommits={onCompareCommits} />
    );

    // Select first commit
    const commit1 = screen.getByText('Initial commit').closest('div');
    if (commit1) {
      await user.click(commit1);
    }

    // Click Compare button
    const compareButton = screen.getByText('Compare');
    await user.click(compareButton);

    expect(
      screen.getByText('Select another commit to compare')
    ).toBeInTheDocument();
  });

  it('should compare two commits', async () => {
    const user = userEvent.setup();
    const onCompareCommits = vi.fn();
    const state = createTestState();

    render(
      <HistoryExplorer state={state} onCompareCommits={onCompareCommits} />
    );

    // Select first commit
    const commit1 = screen.getByText('Initial commit').closest('div');
    if (commit1) {
      await user.click(commit1);
    }

    // Start comparison
    const compareButton = screen.getByText('Compare');
    await user.click(compareButton);

    // Select second commit
    const commit2 = screen.getByText('Second commit').closest('div');
    if (commit2) {
      await user.click(commit2);
    }

    expect(onCompareCommits).toHaveBeenCalledWith('commit1', 'commit2');
  });

  it('should cancel comparison', async () => {
    const user = userEvent.setup();
    const onCompareCommits = vi.fn();
    const state = createTestState();

    render(
      <HistoryExplorer state={state} onCompareCommits={onCompareCommits} />
    );

    // Start comparison
    const commit1 = screen.getByText('Initial commit').closest('div');
    if (commit1) {
      await user.click(commit1);
    }
    const compareButton = screen.getByText('Compare');
    await user.click(compareButton);

    // Cancel comparison
    const cancelButton = screen.getByText(/Cancel Comparison/);
    await user.click(cancelButton);

    expect(screen.queryByText('Select another commit to compare')).not.toBeInTheDocument();
  });

  it('should change timeline mode', async () => {
    const user = userEvent.setup();
    const state = createTestState();

    render(<HistoryExplorer state={state} />);

    const modeSelect = screen.getByLabelText('Timeline mode');
    await user.selectOptions(modeSelect, 'topological');

    expect(modeSelect).toHaveValue('topological');
  });

  it('should display commit count', () => {
    const state = createTestState();

    render(<HistoryExplorer state={state} />);

    expect(screen.getByText(/Showing 3 of 3 commits/)).toBeInTheDocument();
  });

  it('should handle empty state', () => {
    const state: GitState = {
      commits: new Map(),
      branches: new Map(),
      tags: new Map(),
      head: { type: 'branch', name: 'main' },
    };

    render(<HistoryExplorer state={state} />);

    expect(screen.getByText('No commits found')).toBeInTheDocument();
  });

  it('should limit displayed commits', () => {
    const state = createTestState();

    render(<HistoryExplorer state={state} maxCommits={2} />);

    expect(screen.getByText(/Showing 2 of 3 commits/)).toBeInTheDocument();
  });

  it('should have accessible labels', () => {
    const state = createTestState();

    render(<HistoryExplorer state={state} onTimeTravel={vi.fn()} />);

    expect(screen.getByLabelText('Timeline mode')).toBeInTheDocument();
    expect(screen.getByRole('list')).toHaveAttribute(
      'aria-label',
      'Commit history'
    );
  });
});

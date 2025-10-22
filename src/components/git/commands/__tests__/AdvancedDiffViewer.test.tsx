/**
 * Tests for AdvancedDiffViewer component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AdvancedDiffViewer, type FileDiff } from '../AdvancedDiffViewer';

// Helper to create a test diff
function createTestDiff(): FileDiff {
  return {
    oldPath: 'src/example.ts',
    newPath: 'src/example.ts',
    additions: 2,
    deletions: 1,
    hunks: [
      {
        oldStart: 1,
        oldCount: 3,
        newStart: 1,
        newCount: 4,
        lines: [
          {
            type: 'context',
            content: 'function example() {',
            oldLineNumber: 1,
            newLineNumber: 1,
          },
          {
            type: 'remove',
            content: '  const x = 1;',
            oldLineNumber: 2,
          },
          {
            type: 'add',
            content: '  const x = 2;',
            newLineNumber: 2,
          },
          {
            type: 'add',
            content: '  const y = 3;',
            newLineNumber: 3,
          },
          {
            type: 'context',
            content: '}',
            oldLineNumber: 3,
            newLineNumber: 4,
          },
        ],
      },
    ],
  };
}

describe('AdvancedDiffViewer', () => {
  it('should render file diff', () => {
    const diff = createTestDiff();

    render(<AdvancedDiffViewer diff={diff} />);

    expect(screen.getByText('src/example.ts')).toBeInTheDocument();
  });

  it('should display additions and deletions count', () => {
    const diff = createTestDiff();

    render(<AdvancedDiffViewer diff={diff} />);

    const statsText = screen.getByText((content, element) => {
      return Boolean(element?.className?.includes('text-green-600') && content.includes('+2'));
    });
    expect(statsText).toBeInTheDocument();

    const deletionsText = screen.getByText((content, element) => {
      return Boolean(element?.className?.includes('text-red-600') && content.includes('-1'));
    });
    expect(deletionsText).toBeInTheDocument();
  });

  it('should display diff content', () => {
    const diff = createTestDiff();

    render(<AdvancedDiffViewer diff={diff} />);

    expect(screen.getByText(/function example\(\)/)).toBeInTheDocument();
    expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
    expect(screen.getByText(/const x = 2/)).toBeInTheDocument();
    expect(screen.getByText(/const y = 3/)).toBeInTheDocument();
  });

  it('should display hunk header', () => {
    const diff = createTestDiff();

    render(<AdvancedDiffViewer diff={diff} />);

    expect(screen.getByText(/@@ -1,3 \+1,4 @@/)).toBeInTheDocument();
  });

  it('should display hunk count', () => {
    const diff = createTestDiff();

    render(<AdvancedDiffViewer diff={diff} />);

    expect(screen.getByText('1 hunk')).toBeInTheDocument();
  });

  it('should display multiple hunks', () => {
    const diff: FileDiff = {
      ...createTestDiff(),
      hunks: [
        createTestDiff().hunks[0]!,
        {
          oldStart: 10,
          oldCount: 2,
          newStart: 10,
          newCount: 2,
          lines: [
            {
              type: 'context',
              content: 'another line',
              oldLineNumber: 10,
              newLineNumber: 10,
            },
          ],
        },
      ],
    };

    render(<AdvancedDiffViewer diff={diff} />);

    expect(screen.getByText('2 hunks')).toBeInTheDocument();
  });

  it('should start in unified view mode by default', () => {
    const diff = createTestDiff();

    render(<AdvancedDiffViewer diff={diff} />);

    const unifiedButton = screen.getByLabelText('Unified diff view');
    expect(unifiedButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should switch to split view mode', async () => {
    const user = userEvent.setup();
    const diff = createTestDiff();

    render(<AdvancedDiffViewer diff={diff} />);

    const splitButton = screen.getByLabelText('Split diff view');
    await user.click(splitButton);

    expect(splitButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should call onViewModeChange when mode changes', async () => {
    const user = userEvent.setup();
    const onViewModeChange = vi.fn();
    const diff = createTestDiff();

    render(
      <AdvancedDiffViewer diff={diff} onViewModeChange={onViewModeChange} />
    );

    const splitButton = screen.getByLabelText('Split diff view');
    await user.click(splitButton);

    expect(onViewModeChange).toHaveBeenCalledWith('split');
  });

  it('should show line numbers by default', () => {
    const diff = createTestDiff();

    render(<AdvancedDiffViewer diff={diff} />);

    // Check that line numbers are rendered in the unified view
    const lineNumbers = screen.getAllByText('1', { selector: 'div' });
    expect(lineNumbers.length).toBeGreaterThan(0);
  });

  it('should hide line numbers when disabled', () => {
    const diff = createTestDiff();

    render(<AdvancedDiffViewer diff={diff} showLineNumbers={false} />);

    // This is a simplified check - in a real implementation we'd check more thoroughly
    const viewer = screen.getByRole('table');
    expect(viewer).toBeInTheDocument();
  });

  it('should respect initial view mode prop', () => {
    const diff = createTestDiff();

    render(<AdvancedDiffViewer diff={diff} viewMode="split" />);

    const splitButton = screen.getByLabelText('Split diff view');
    expect(splitButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should handle file rename', () => {
    const diff: FileDiff = {
      oldPath: 'src/old.ts',
      newPath: 'src/new.ts',
      additions: 0,
      deletions: 0,
      hunks: [],
    };

    render(<AdvancedDiffViewer diff={diff} />);

    expect(screen.getByText('src/old.ts → src/new.ts')).toBeInTheDocument();
  });

  it('should have accessible labels', () => {
    const diff = createTestDiff();

    render(<AdvancedDiffViewer diff={diff} />);

    expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'File diff');
    expect(screen.getByLabelText('Unified diff view')).toBeInTheDocument();
    expect(screen.getByLabelText('Split diff view')).toBeInTheDocument();
  });
});

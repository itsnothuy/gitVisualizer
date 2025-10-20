/**
 * Unit tests for IngestDialog component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IngestDialog } from '../ingest-dialog';
import * as capabilities from '@/lib/git/capabilities';

// Mock the capability detection
vi.mock('@/lib/git/capabilities', () => ({
  getBrowserCapabilities: vi.fn(),
  getRecommendedIngestionMethod: vi.fn(),
  getCapabilityMessage: vi.fn(),
  getBrowserName: vi.fn(),
}));

// Mock local git operations
vi.mock('@/lib/git/local', () => ({
  pickLocalRepoDir: vi.fn(),
  isGitRepository: vi.fn(),
}));

// Mock fallback methods
vi.mock('@/lib/git/fallbacks/directory-input', () => ({
  selectDirectoryInput: vi.fn(),
}));

vi.mock('@/lib/git/fallbacks/zip-input', () => ({
  selectZipFile: vi.fn(),
}));

// Mock feature flags
vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn(() => true),
}));

describe('IngestDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(capabilities.getBrowserCapabilities).mockReturnValue({
      fileSystemAccess: true,
      directoryInput: true,
      fileInput: true,
      webWorkers: true,
      indexedDB: true,
    });
    vi.mocked(capabilities.getRecommendedIngestionMethod).mockReturnValue('fsa');
    vi.mocked(capabilities.getCapabilityMessage).mockReturnValue('Chrome supports direct folder access');
    vi.mocked(capabilities.getBrowserName).mockReturnValue('Chrome');
  });

  it('should render the trigger button', () => {
    render(<IngestDialog />);
    
    const button = screen.getByRole('button', { name: /open repository/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('should have proper accessibility attributes on trigger button', () => {
    render(<IngestDialog />);
    
    const button = screen.getByRole('button', { name: /open repository/i });
    expect(button).toHaveAttribute('data-testid', 'open-repository');
    expect(button).toHaveAttribute('aria-label', 'Open repository');
  });

  it('should disable button when no ingestion methods are available', () => {
    vi.mocked(capabilities.getBrowserCapabilities).mockReturnValue({
      fileSystemAccess: false,
      directoryInput: false,
      fileInput: false,
      webWorkers: false,
      indexedDB: false,
    });

    render(<IngestDialog />);
    
    const button = screen.getByRole('button', { name: /open repository/i });
    expect(button).toBeDisabled();
  });

  it('should accept onRepositorySelected callback', () => {
    const callback = vi.fn();
    render(<IngestDialog onRepositorySelected={callback} />);
    
    const button = screen.getByRole('button', { name: /open repository/i });
    expect(button).toBeInTheDocument();
  });

  it('should accept onError callback', () => {
    const callback = vi.fn();
    render(<IngestDialog onError={callback} />);
    
    const button = screen.getByRole('button', { name: /open repository/i });
    expect(button).toBeInTheDocument();
  });
});

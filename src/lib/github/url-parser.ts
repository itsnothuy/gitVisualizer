/**
 * GitHub URL Parser - Extract repository information from GitHub URLs
 * 
 * Supports various GitHub URL formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 * - https://github.com/owner/repo/tree/branch
 */

/**
 * Parsed GitHub URL information
 */
export interface ParsedGitHubUrl {
  /** Repository owner (username or organization) */
  owner: string;
  /** Repository name */
  name: string;
  /** Optional branch name */
  branch?: string;
  /** Optional path within repository */
  path?: string;
}

/**
 * Parse a GitHub URL to extract owner and repository name
 * 
 * @param url GitHub URL in various formats
 * @returns Parsed repository information
 * @throws Error if URL format is invalid
 * 
 * @example
 * ```typescript
 * const parsed = parseGitHubUrl('https://github.com/facebook/react');
 * // { owner: 'facebook', name: 'react' }
 * ```
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl {
  const trimmedUrl = url.trim();
  
  // Pattern 1: HTTPS format - https://github.com/owner/repo[.git][/tree/branch][/path]
  const httpsPattern = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+?)(\.git)?(\/tree\/([^\/]+)(\/(.+))?)?$/;
  const httpsMatch = trimmedUrl.match(httpsPattern);
  
  if (httpsMatch) {
    return {
      owner: httpsMatch[1],
      name: httpsMatch[2],
      branch: httpsMatch[5],
      path: httpsMatch[7],
    };
  }
  
  // Pattern 2: SSH format - git@github.com:owner/repo[.git]
  const sshPattern = /^git@github\.com:([^\/]+)\/([^\/]+?)(\.git)?$/;
  const sshMatch = trimmedUrl.match(sshPattern);
  
  if (sshMatch) {
    return {
      owner: sshMatch[1],
      name: sshMatch[2],
    };
  }
  
  // Pattern 3: Short format - owner/repo
  const shortPattern = /^([^\/]+)\/([^\/]+)$/;
  const shortMatch = trimmedUrl.match(shortPattern);
  
  if (shortMatch && !trimmedUrl.includes('.')) {
    return {
      owner: shortMatch[1],
      name: shortMatch[2],
    };
  }
  
  throw new Error(
    'Invalid GitHub URL format. Supported formats: ' +
    'https://github.com/owner/repo, git@github.com:owner/repo.git, or owner/repo'
  );
}

/**
 * Check if a URL is a valid GitHub URL
 * 
 * @param url URL to validate
 * @returns true if URL is valid GitHub format
 * 
 * @example
 * ```typescript
 * isValidGitHubUrl('https://github.com/facebook/react'); // true
 * isValidGitHubUrl('https://gitlab.com/owner/repo'); // false
 * ```
 */
export function isValidGitHubUrl(url: string): boolean {
  try {
    parseGitHubUrl(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize a GitHub URL to standard HTTPS format
 * 
 * @param url GitHub URL in any supported format
 * @returns Normalized HTTPS URL
 * 
 * @example
 * ```typescript
 * normalizeGitHubUrl('git@github.com:facebook/react.git');
 * // 'https://github.com/facebook/react'
 * ```
 */
export function normalizeGitHubUrl(url: string): string {
  const parsed = parseGitHubUrl(url);
  return `https://github.com/${parsed.owner}/${parsed.name}`;
}

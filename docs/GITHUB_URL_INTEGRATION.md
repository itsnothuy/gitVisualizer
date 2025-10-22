# GitHub URL Integration

## Overview

The GitHub URL Integration feature allows users to visualize any public or private GitHub repository by simply pasting its URL. This eliminates the need for local cloning and makes repository visualization instant and accessible.

## Features

### 🌐 **Multiple URL Format Support**
- Standard HTTPS: `https://github.com/owner/repo`
- HTTPS with .git: `https://github.com/owner/repo.git`
- SSH format: `git@github.com:owner/repo.git`
- Short format: `owner/repo`
- Branch-specific URLs: `https://github.com/owner/repo/tree/branch`

### 🔐 **Private Repository Support**
- Optional GitHub Personal Access Token (PAT) input
- Tokens stored in memory only - never persisted
- Clear privacy notices and warnings
- Works with fine-grained or classic tokens

### 📊 **Progress Feedback**
- Real-time progress indicators
- Phase-based updates (loading, parsing, building, complete)
- Percentage completion tracking
- Detailed status messages

### ⚡ **Performance Features**
- Configurable commit limits (default: 1000)
- Smart pagination support for large repositories
- Rate limit awareness and handling
- Efficient GraphQL queries

### ♿ **Accessibility (WCAG 2.2 AA)**
- Full keyboard navigation (Tab/Shift+Tab)
- Screen reader compatible with ARIA labels
- Clear error messages and recovery instructions
- Progressive enhancement

## Usage

### Basic Usage (Public Repository)

1. Click "Open Repository" button
2. Select the "GitHub URL" tab (default)
3. Paste a GitHub repository URL
4. Click "Visualize Repository"

### Private Repository Access

1. Follow basic usage steps 1-2
2. Paste the repository URL
3. Enter your GitHub Personal Access Token in the token field
4. Click "Visualize Repository"

### Creating a GitHub Token

For private repositories or higher rate limits:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic or fine-grained)
3. Required scopes:
   - `repo` (for private repositories)
   - `read:org` (for organization repositories)
4. Copy the token and paste it into the token field

**Note:** Tokens are stored in memory only and cleared when you close the tab.

## Architecture

### Component Structure

```
src/lib/github/
├── url-parser.ts          # Parse and validate GitHub URLs
├── api-client.ts          # GitHub GraphQL API client
└── processor.ts           # Convert API data to DAG format

src/components/ingestion/
├── GitHubUrlInput.tsx     # URL input component with token support
└── repository-picker.tsx  # Tab-based picker (URL vs Local)

src/lib/repository/
└── RepositoryContext.tsx  # Extended with GitHub URL support
```

### Data Flow

```
User Input (URL) 
  → URL Parser (validate & parse)
  → GitHub API Client (fetch repository data)
  → GitHub Processor (convert to DAG)
  → Repository Context (state management)
  → Visualization Components
```

## API Usage

### Rate Limits

GitHub imposes the following rate limits:
- **Anonymous:** 60 requests/hour
- **Authenticated:** 5,000 requests/hour

The integration automatically:
- Detects rate limit errors
- Displays remaining quota warnings
- Suggests authentication for higher limits

### GraphQL Query

The integration uses a single optimized GraphQL query to fetch:
- Repository metadata
- Default branch commits (configurable limit)
- All branches (up to 100)
- All tags (up to 100)

### Error Handling

Common errors and their handling:

| Error | Handling |
|-------|----------|
| Repository not found (404) | Suggests checking URL or adding token for private repos |
| Authentication failed (401) | Prompts to verify token permissions |
| Rate limit exceeded (403) | Shows reset time and suggests authentication |
| Network errors | Generic error message with retry suggestion |

## Privacy & Security

### Privacy-First Design

✅ **Data stays local:** Repository data fetched directly from GitHub API to your browser
✅ **No server uploads:** No data sent to our servers
✅ **In-memory tokens:** Access tokens never persisted to disk
✅ **Read-only access:** No modifications to your repositories

### Security Considerations

- Tokens are stored in component state (memory only)
- HTTPS-only communication with GitHub API
- Input validation for all URLs
- No token logging or error reporting
- CORS-compliant requests

### CodeQL Security Scan

✅ **Zero vulnerabilities detected** in GitHub integration code

## Testing

### Unit Tests

```bash
# Run all GitHub integration tests
pnpm test src/lib/github/__tests__/

# Results: 32 tests passing
# - URL Parser: 23 tests
# - API Client: 5 tests
# - Processor: 4 tests
```

### Test Coverage

- ✅ URL parsing (all formats)
- ✅ URL validation
- ✅ URL normalization
- ✅ API client initialization
- ✅ GraphQL query construction
- ✅ Rate limit extraction
- ✅ Error handling
- ✅ Data structure validation

### Manual Testing

To test with a real repository:

1. Use a small public repository (e.g., `octocat/Hello-World`)
2. Test different URL formats
3. Test with invalid URLs
4. Test rate limit warnings (make 60+ requests without token)
5. Test private repository with token
6. Test large repository warnings

## Bundle Impact

The GitHub integration adds minimal overhead:

- **URL Parser:** ~3 KB
- **API Client:** ~8 KB
- **Processor:** ~7 KB
- **UI Components:** ~7 KB
- **Total:** ~25 KB gzipped

No additional dependencies required - uses native `fetch` API.

## Browser Compatibility

The GitHub URL integration works in all modern browsers:

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

**Advantage over local folder selection:** Broader browser support since it doesn't rely on File System Access API (which is Chrome/Edge only).

## Future Enhancements

Potential improvements for future iterations:

- [ ] Pagination UI for repositories > 1000 commits
- [ ] Commit filtering by date range
- [ ] Branch selection before fetching
- [ ] Cache repository data in IndexedDB
- [ ] GitLab URL support
- [ ] Bitbucket URL support
- [ ] Export functionality
- [ ] Deep linking to specific commits

## Troubleshooting

### Common Issues

**Issue:** "Repository not found" error for public repository
- **Solution:** Check URL format, ensure repository exists

**Issue:** "Authentication failed" error with token
- **Solution:** Verify token has correct scopes (`repo`, `read:org`)

**Issue:** "Rate limit exceeded" without token
- **Solution:** Wait for rate limit reset or provide a token

**Issue:** Repository takes long to load
- **Solution:** Large repositories are limited to 1000 commits; full history not fetched

**Issue:** Cannot see private repository
- **Solution:** Must provide valid GitHub token with `repo` scope

## References

- [GitHub GraphQL API Documentation](https://docs.github.com/en/graphql)
- [GitHub Rate Limits](https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api)
- [Creating a Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [WCAG 2.2 AA Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)

## License

This feature is part of the Git Visualizer project and follows the same license terms.

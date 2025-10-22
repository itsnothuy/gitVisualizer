# Issue #6: Implement GitHub Repository URL Integration

## 🎯 **Problem Statement**

Users expect to input GitHub repository URLs (like `https://github.com/owner/repo`) rather than select local folders. This is the standard pattern for Git visualization tools and matches user mental models. Currently, users must have repositories cloned locally, which is a significant barrier to adoption.

## 📋 **Scope & Deliverables**

### **Primary Deliverable**
- **GitHub URL Integration System** that allows users to paste any GitHub repository URL and instantly visualize its commit graph

### **Secondary Deliverables**
- GitHub API client with GraphQL integration
- URL parsing and validation
- Rate limiting and caching system
- Enhanced repository picker with URL/Local tabs
- Authentication support for private repositories
- Progressive loading for large repositories

## 🏗️ **Technical Implementation Details**

### **1. GitHub URL Input Component**

**File:** `src/components/ingestion/GitHubUrlInput.tsx`

```typescript
export interface GitHubUrlInputProps {
  onRepositoryLoaded: (repository: ProcessedRepository) => void;
  onError: (error: string) => void;
  onProgress?: (progress: ProcessProgress) => void;
}

export function GitHubUrlInput({
  onRepositoryLoaded,
  onError,
  onProgress
}: GitHubUrlInputProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');

  const handleSubmit = async () => {
    // Parse and validate GitHub URL
    // Load repository via GitHub API
    // Convert to ProcessedRepository format
  };

  return (
    <div className="space-y-4">
      <Input
        type="url"
        placeholder="https://github.com/owner/repository"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Input
        type="password"
        placeholder="GitHub token (optional, for private repos)"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Visualize Repository'}
      </Button>
    </div>
  );
}
```

### **2. GitHub API Client**

**File:** `src/lib/github/api-client.ts`

```typescript
export class GitHubApiClient {
  constructor(private token?: string) {}

  async getRepository(owner: string, name: string): Promise<GitHubRepository> {
    const query = `
      query GetRepository($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          name
          owner { login }
          defaultBranchRef { name }
          isPrivate
          
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 100) {
                  totalCount
                  pageInfo { hasNextPage, endCursor }
                  nodes {
                    oid
                    message
                    author { name, email, date }
                    parents(first: 10) {
                      nodes { oid }
                    }
                  }
                }
              }
            }
          }
          
          refs(refPrefix: "refs/heads/", first: 50) {
            nodes {
              name
              target { oid }
            }
          }
          
          refs(refPrefix: "refs/tags/", first: 50) {
            nodes {
              name
              target { oid }
            }
          }
        }
      }
    `;

    return this.graphqlRequest(query, { owner, name });
  }

  private async graphqlRequest(query: string, variables: any) {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### **3. URL Parser**

**File:** `src/lib/github/url-parser.ts`

```typescript
export interface ParsedGitHubUrl {
  owner: string;
  name: string;
  branch?: string;
  path?: string;
}

export function parseGitHubUrl(url: string): ParsedGitHubUrl {
  const patterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
    /^git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        name: match[2],
        // Extract branch/path if present in URL
      };
    }
  }

  throw new Error('Invalid GitHub URL format');
}

export function isValidGitHubUrl(url: string): boolean {
  try {
    parseGitHubUrl(url);
    return true;
  } catch {
    return false;
  }
}
```

### **4. GitHub Repository Processor**

**File:** `src/lib/github/processor.ts`

```typescript
export async function processGitHubRepository(
  owner: string,
  name: string,
  options: GitHubProcessorOptions = {}
): Promise<ProcessedRepository> {
  const startTime = performance.now();
  const { maxCommits = 1000, onProgress, token } = options;

  onProgress?.({
    phase: "loading",
    percentage: 5,
    message: "Connecting to GitHub..."
  });

  const client = new GitHubApiClient(token);

  try {
    // Fetch repository data
    onProgress?.({
      phase: "parsing",
      percentage: 20,
      message: "Fetching repository information..."
    });

    const repoData = await client.getRepository(owner, name);

    // Convert GitHub data to internal format
    const commits: GitCommit[] = repoData.defaultBranchRef.target.history.nodes.map(
      (commit: any) => ({
        id: commit.oid,
        parents: commit.parents.nodes.map((p: any) => p.oid),
        message: commit.message,
        author: commit.author.name,
        timestamp: new Date(commit.author.date).getTime(),
        tree: commit.oid, // Simplified
      })
    );

    const branches: GitBranch[] = repoData.refs.nodes
      .filter((ref: any) => ref.name !== repoData.defaultBranchRef.name)
      .map((ref: any) => ({
        name: ref.name,
        target: ref.target.oid,
      }));

    // Add default branch
    branches.unshift({
      name: repoData.defaultBranchRef.name,
      target: commits[0]?.id || '',
    });

    const tags: GitTag[] = []; // TODO: Process tags

    onProgress?.({
      phase: "building",
      percentage: 80,
      message: "Building visualization model..."
    });

    // Build DAG model
    const dagNodes = commits.map(commit => ({
      id: commit.id,
      title: commit.message.split('\n')[0],
      ts: commit.timestamp,
      parents: commit.parents,
    }));

    const dag = {
      nodes: dagNodes,
      commits,
      branches,
      tags,
    };

    onProgress?.({
      phase: "complete",
      percentage: 100,
      message: "Repository loaded successfully"
    });

    return {
      metadata: {
        name: `${owner}/${name}`,
        commitCount: commits.length,
        branchCount: branches.length,
        tagCount: tags.length,
        processedAt: new Date(),
        defaultBranch: repoData.defaultBranchRef.name,
        source: 'github',
        url: `https://github.com/${owner}/${name}`,
      },
      dag,
      performance: {
        totalMs: performance.now() - startTime,
        parseMs: 0,
        buildMs: 0,
      },
      warnings: [],
    };
  } catch (error) {
    throw new Error(`Failed to process GitHub repository: ${error.message}`);
  }
}

export interface GitHubProcessorOptions {
  maxCommits?: number;
  onProgress?: (progress: ProcessProgress) => void;
  token?: string;
}
```

### **5. Enhanced Repository Context**

**Update:** `src/lib/repository/RepositoryContext.tsx`

```typescript
export interface RepositoryContextValue {
  // Existing local methods
  loadRepository(handle: FileSystemDirectoryHandle): Promise<void>;
  
  // New GitHub methods
  loadGitHubRepository(owner: string, name: string, token?: string): Promise<void>;
  loadFromUrl(url: string, token?: string): Promise<void>;
  
  // Enhanced state
  repositorySource: 'local' | 'github' | null;
  githubRateLimit: RateLimitStatus | null;
}

// Add to RepositoryProvider implementation
const loadFromUrl = useCallback(async (url: string, token?: string): Promise<void> => {
  console.log("📁 Repository Context: Starting GitHub URL load...", url);
  
  setError(null);
  setProgress(null);
  setCurrentRepository(null);
  setIsLoading(true);

  try {
    const parsed = parseGitHubUrl(url);
    const processed = await processGitHubRepository(parsed.owner, parsed.name, {
      token,
      onProgress: setProgress,
    });

    setCurrentRepository(processed);
    addToRecent(processed, null); // No handle for GitHub repos
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load repository";
    setError(errorMessage);
  } finally {
    setIsLoading(false);
  }
}, [addToRecent]);
```

### **6. Enhanced Repository Picker**

**Update:** `src/components/ingestion/repository-picker.tsx`

```typescript
export function RepositoryPicker({ onRepositorySelected, onError }: RepositoryPickerProps) {
  const [mode, setMode] = useState<'url' | 'local'>('url'); // Default to URL input

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">Open Repository</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Open Git Repository</DialogTitle>
          <DialogDescription>
            Visualize any Git repository by pasting its GitHub URL or selecting a local folder.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={setMode} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">GitHub URL</TabsTrigger>
            <TabsTrigger value="local">Local Folder</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <GitHubUrlInput
              onRepositoryLoaded={onRepositorySelected}
              onError={onError}
            />
          </TabsContent>

          <TabsContent value="local" className="space-y-4">
            {/* Existing local picker logic */}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

## ✅ **Acceptance Criteria**

### **Functional Requirements**
- [ ] **F1:** Parse GitHub repository URLs correctly (https, git, with/without .git)
- [ ] **F2:** Fetch repository data via GitHub GraphQL API
- [ ] **F3:** Support both public and private repositories (with token)
- [ ] **F4:** Convert GitHub API responses to DAG visualization format
- [ ] **F5:** Display commit graph with branches and tags
- [ ] **F6:** Handle rate limiting gracefully with user feedback
- [ ] **F7:** Cache repository data to reduce API calls
- [ ] **F8:** Progressive loading with detailed progress updates
- [ ] **F9:** Error handling for invalid URLs, private repos, network issues
- [ ] **F10:** Deep linking support for repository URLs

### **Performance Requirements**
- [ ] **P1:** Load typical repository (500 commits) within 3 seconds
- [ ] **P2:** Handle large repositories (5k+ commits) with pagination
- [ ] **P3:** Respect GitHub API rate limits (60/hour anonymous, 5000/hour authenticated)
- [ ] **P4:** Cache repository data for 24 hours to reduce API usage
- [ ] **P5:** Provide real-time progress updates during loading

### **User Experience Requirements**
- [ ] **UX1:** URL input is the default option (primary tab)
- [ ] **UX2:** Clear examples of supported URL formats
- [ ] **UX3:** Optional token input for private repository access
- [ ] **UX4:** Rate limit warnings and recovery suggestions
- [ ] **UX5:** Seamless switching between URL and local modes

## 🧪 **Testing Requirements**

### **Unit Tests**
```typescript
describe('GitHub URL Parser', () => {
  test('parses standard GitHub URLs');
  test('handles various URL formats');
  test('rejects invalid URLs');
});

describe('GitHub API Client', () => {
  test('fetches repository data correctly');
  test('handles authentication');
  test('respects rate limits');
});
```

### **Integration Tests**
```typescript
describe('GitHub Repository Processing', () => {
  test('processes public repository end-to-end');
  test('handles private repository with token');
  test('recovers from API failures');
});
```

### **E2E Tests**
```typescript
describe('GitHub URL Integration', () => {
  test('user can paste GitHub URL and see visualization');
  test('error handling for invalid URLs');
  test('private repository authentication flow');
});
```

## 🌐 **Browser Compatibility**

All modern browsers support the GitHub API integration:
- **Chrome/Edge/Firefox/Safari:** Full fetch API and GraphQL support
- **No File System Access API dependency** for URL mode
- **Broader user base** than local folder selection

## 📦 **Bundle Impact**

### **Additional Dependencies**
- No new dependencies required (uses fetch API)
- GraphQL queries as strings (no additional parser needed)
- Total bundle impact: <50KB gzipped

## ♿ **Accessibility Requirements**

### **WCAG 2.2 AA Compliance**
- [ ] **URL input field** with proper labels and validation messages
- [ ] **Progress indicators** announced to screen readers
- [ ] **Error states** with clear recovery instructions
- [ ] **Tab navigation** between URL and local modes
- [ ] **Keyboard shortcuts** for common actions

## 🔐 **Security Considerations**

### **Token Security**
- Tokens stored in memory only (no localStorage persistence)
- Clear warning about token permissions
- Option to use read-only tokens

### **API Security**
- CORS-compliant requests to GitHub API
- Input validation for all URL parameters
- Rate limiting respect to avoid IP blocking

## 🎯 **Definition of Done**

- [ ] All functional requirements implemented and tested
- [ ] GitHub API integration working with public repositories
- [ ] Token authentication working for private repositories
- [ ] Rate limiting handled gracefully
- [ ] Progressive loading with progress indicators
- [ ] Error handling for all failure scenarios
- [ ] Cross-browser compatibility verified
- [ ] A11y compliance verified (100% score)
- [ ] Bundle size within budget (<50KB impact)
- [ ] Documentation complete and reviewed

## 🔄 **Migration Strategy**

### **Backward Compatibility**
- Existing local folder functionality preserved
- GitHub URL becomes primary (default) tab
- Seamless switching between modes

### **User Onboarding**
```typescript
const onboardingSteps = [
  "Paste any GitHub repository URL",
  "Add personal token for private repos (optional)",
  "Watch your repository come to life!"
];
```

## 📊 **Success Metrics**

### **User Adoption**
- **GitHub URL usage:** >80% of users prefer URL input over local folders
- **Repository diversity:** Users visualize 10x more repositories (no local cloning required)
- **Time to visualization:** <30 seconds from URL paste to visualization

### **Technical Performance**
- **API success rate:** >95% successful repository loads
- **Cache hit rate:** >60% for repeated repository views
- **Error recovery rate:** >90% users recover from transient failures

This GitHub URL integration will transform the user experience from "select a folder you happen to have cloned" to "visualize any repository on GitHub instantly" - exactly what users expect! 🚀
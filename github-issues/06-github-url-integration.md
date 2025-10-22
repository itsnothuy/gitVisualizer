# GitHub Repository URL Integration - Comprehensive Implementation Guide

## 🎯 **User Story**
As a user, I want to paste a GitHub repository URL (like `https://github.com/owner/repo`) and instantly see an interactive visualization of the commit graph, branches, and tags, so I can understand the repository structure without cloning it locally.

## 📋 **High-Level Architecture**

### **Input Flow**
```
User enters GitHub URL → Validate URL → Fetch via GitHub API → Process Git data → Visualize DAG
```

### **Components to Implement**
1. **GitHub URL Input Component** - URL validation and parsing
2. **GitHub API Client** - Fetch repository data using GitHub GraphQL/REST API
3. **Remote Repository Processor** - Convert GitHub API responses to DAG format
4. **Enhanced Repository Context** - Support both local and remote repositories
5. **URL-based Routing** - Deep linking with repository URLs

## 🔧 **Implementation Plan**

### **Phase 1: GitHub URL Input & Validation**

**Component: `src/components/ingestion/GitHubUrlInput.tsx`**

```typescript
export interface GitHubUrlInputProps {
  onRepositoryLoaded: (repository: ProcessedRepository) => void;
  onError: (error: string) => void;
}

export function GitHubUrlInput({ onRepositoryLoaded, onError }: GitHubUrlInputProps) {
  // Features:
  // - URL validation (supports github.com, github.enterprise.com)
  // - Repository existence check
  // - Rate limiting awareness
  // - Public/private repository detection
  // - Loading states with progress
}
```

**URL Parsing Logic:**
- `https://github.com/owner/repo` → `{ owner: "owner", name: "repo" }`
- `https://github.com/owner/repo/tree/branch` → `{ owner: "owner", name: "repo", branch: "branch" }`
- `https://github.com/owner/repo.git` → `{ owner: "owner", name: "repo" }`

### **Phase 2: GitHub API Client**

**Service: `src/lib/github/api-client.ts`**

```typescript
export interface GitHubApiClient {
  // Fetch repository metadata
  getRepository(owner: string, name: string): Promise<GitHubRepository>;
  
  // Fetch commit history with pagination
  getCommits(owner: string, name: string, options: CommitOptions): Promise<GitHubCommit[]>;
  
  // Fetch branches and tags
  getBranches(owner: string, name: string): Promise<GitHubBranch[]>;
  getTags(owner: string, name: string): Promise<GitHubTag[]>;
  
  // Check rate limits
  getRateLimit(): Promise<RateLimitStatus>;
}

export interface GitHubRepository {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  commitsCount: number; // estimate
  branches: number;
  tags: number;
}
```

**GitHub GraphQL Queries:**
```graphql
query GetRepository($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    owner { login }
    defaultBranchRef { name }
    isPrivate
    
    # Get commit history
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
    
    # Get branches
    refs(refPrefix: "refs/heads/", first: 50) {
      nodes {
        name
        target { oid }
      }
    }
    
    # Get tags
    refs(refPrefix: "refs/tags/", first: 50) {
      nodes {
        name
        target { oid }
      }
    }
  }
}
```

### **Phase 3: Remote Repository Processor**

**Service: `src/lib/github/processor.ts`**

```typescript
export async function processGitHubRepository(
  owner: string,
  name: string,
  options: GitHubProcessorOptions = {}
): Promise<ProcessedRepository> {
  
  const client = new GitHubApiClient(options.token);
  
  // 1. Fetch repository metadata
  const repo = await client.getRepository(owner, name);
  
  // 2. Fetch commit history (paginated)
  const commits = await client.getCommits(owner, name, {
    maxCommits: options.maxCommits || 1000,
    onProgress: options.onProgress
  });
  
  // 3. Fetch branches and tags
  const [branches, tags] = await Promise.all([
    client.getBranches(owner, name),
    client.getTags(owner, name)
  ]);
  
  // 4. Convert to DAG format
  const dag = buildDagFromGitHubData({
    commits,
    branches, 
    tags,
    defaultBranch: repo.defaultBranch
  });
  
  return {
    metadata: {
      name: repo.fullName,
      commitCount: commits.length,
      branchCount: branches.length,
      tagCount: tags.length,
      processedAt: new Date(),
      defaultBranch: repo.defaultBranch,
      source: 'github',
      url: `https://github.com/${owner}/${name}`
    },
    dag,
    performance: { /* timing metrics */ },
    warnings: [ /* rate limit warnings, incomplete data, etc */ ]
  };
}
```

### **Phase 4: Enhanced Repository Context**

**Update: `src/lib/repository/RepositoryContext.tsx`**

```typescript
export interface RepositoryContextValue {
  // Existing local repository methods
  loadRepository(handle: FileSystemDirectoryHandle): Promise<void>;
  
  // New GitHub repository methods
  loadGitHubRepository(owner: string, name: string, token?: string): Promise<void>;
  loadFromUrl(url: string, token?: string): Promise<void>;
  
  // Enhanced state
  repositorySource: 'local' | 'github' | null;
  githubRateLimit: RateLimitStatus | null;
}
```

### **Phase 5: Enhanced Repository Picker**

**Update: `src/components/ingestion/repository-picker.tsx`**

```typescript
export function RepositoryPicker({ onRepositorySelected, onError }: RepositoryPickerProps) {
  const [mode, setMode] = useState<'url' | 'local'>('url'); // Default to URL
  
  return (
    <Tabs value={mode} onValueChange={setMode}>
      <TabsList>
        <TabsTrigger value="url">GitHub URL</TabsTrigger>
        <TabsTrigger value="local">Local Folder</TabsTrigger>
      </TabsList>
      
      <TabsContent value="url">
        <GitHubUrlInput 
          onRepositoryLoaded={onRepositorySelected}
          onError={onError}
        />
      </TabsContent>
      
      <TabsContent value="local">
        {/* Existing local picker */}
      </TabsContent>
    </Tabs>
  );
}
```

## 🔐 **Authentication Strategy**

### **Option 1: Anonymous Access (Public Repos Only)**
```typescript
// No authentication required
// Rate limit: 60 requests/hour per IP
const client = new GitHubApiClient();
```

### **Option 2: Personal Access Token (Recommended)**
```typescript
// User provides their own token
// Rate limit: 5000 requests/hour
// Access to private repos
const client = new GitHubApiClient(userToken);
```

### **Option 3: GitHub OAuth App (Future)**
```typescript
// Full OAuth flow
// Better UX but requires backend
const client = new GitHubApiClient();
await client.authenticate(); // Opens OAuth popup
```

## 📊 **Performance Considerations**

### **Rate Limiting Strategy**
```typescript
export class RateLimitManager {
  async checkRateLimit(): Promise<RateLimitStatus>;
  async waitForRateLimit(): Promise<void>;
  async optimizeQueries(repository: string): Promise<QueryPlan>;
}
```

### **Data Caching**
```typescript
export class GitHubCache {
  // Cache repository data in IndexedDB
  async cacheRepository(owner: string, name: string, data: ProcessedRepository): Promise<void>;
  async getCachedRepository(owner: string, name: string): Promise<ProcessedRepository | null>;
  async invalidateCache(owner: string, name: string): Promise<void>;
}
```

### **Progressive Loading**
```typescript
// Load repository metadata first
const metadata = await client.getRepository(owner, name);
onProgress({ phase: 'metadata', percentage: 10 });

// Then load commits in batches
const commits = await client.getCommitsPaginated(owner, name, {
  batchSize: 100,
  onBatch: (batch, total) => {
    onProgress({ 
      phase: 'commits', 
      percentage: 10 + (batch / total) * 70 
    });
  }
});
```

## 🧪 **Testing Strategy**

### **Unit Tests**
```typescript
describe('GitHubApiClient', () => {
  test('parses GitHub URLs correctly');
  test('handles rate limiting gracefully');
  test('converts GitHub API responses to DAG format');
  test('handles private repository access');
});
```

### **Integration Tests**
```typescript
describe('GitHub Repository Processing', () => {
  test('processes public repository end-to-end');
  test('handles large repositories with pagination');
  test('recovers from API failures gracefully');
});
```

### **E2E Tests**
```typescript
describe('GitHub URL Input Flow', () => {
  test('user can paste GitHub URL and see visualization');
  test('error handling for invalid URLs');
  test('rate limit warnings and recovery');
});
```

## 🎯 **User Experience Enhancements**

### **URL Examples & Help**
```typescript
const examples = [
  'https://github.com/facebook/react',
  'https://github.com/microsoft/vscode',
  'https://github.com/your-username/your-repo'
];
```

### **Repository Suggestions**
```typescript
// Suggest popular repositories for demo
const popularRepos = [
  { owner: 'facebook', name: 'react', description: 'Popular React library' },
  { owner: 'microsoft', name: 'vscode', description: 'VS Code editor' },
  { owner: 'torvalds', name: 'linux', description: 'Linux kernel' }
];
```

### **Deep Linking**
```typescript
// Support URLs like:
// /repo?url=https://github.com/owner/repo
// /repo/github/owner/repo
// /repo/github/owner/repo/commit/sha
```

## 🚀 **Implementation Priority**

### **MVP (Week 1)**
1. Basic GitHub URL input
2. Anonymous API access for public repos
3. Simple commit history fetching
4. Basic DAG visualization

### **Enhanced (Week 2)**
1. Personal Access Token support
2. Branch and tag visualization
3. Performance optimizations
4. Error handling and recovery

### **Advanced (Week 3)**
1. Repository caching
2. Deep linking
3. Rate limit optimization
4. Private repository support

## 🔄 **Migration Strategy**

### **Backward Compatibility**
- Keep existing local file picker as Tab 2
- Default to GitHub URL input (Tab 1)
- Maintain all existing local processing logic

### **User Guidance**
```typescript
const migrationBanner = (
  <div className="bg-blue-50 p-4 rounded-md mb-4">
    <h3>✨ New: GitHub URL Support!</h3>
    <p>You can now visualize any GitHub repository by pasting its URL. 
       Local folder selection is still available in the "Local Folder" tab.</p>
  </div>
);
```

This comprehensive approach addresses the core user expectation (GitHub URL input) while maintaining existing functionality and providing a clear implementation roadmap.
# Issue #1: Implement Git Repository Processor for Real Repository Visualization

## 🎯 **Problem Statement**

Currently, Git Visualizer can ingest repositories via File System Access API but cannot actually parse and visualize the Git data. Users can select repositories but see no visualization - the core value proposition is missing.

## 📋 **Scope & Deliverables**

### **Primary Deliverable**
- **Git Repository Processor** (`src/lib/git/processor.ts`) that converts real Git repositories to DAG visualization data

### **Secondary Deliverables**
- Repository Context Provider for state management
- Integration with existing ingestion components
- Performance optimizations for large repositories
- Comprehensive test coverage
- Documentation and examples

## 🏗️ **Technical Implementation Details**

### **1. Core Git Repository Processor**

**File:** `src/lib/git/processor.ts`

```typescript
export interface GitRepositoryProcessor {
  // Parse repository from FileSystemDirectoryHandle
  processLocalRepository(handle: FileSystemDirectoryHandle): Promise<ProcessedRepository>;
  
  // Parse repository from IngestResult (ZIP/remote)
  processIngestedRepository(result: IngestResult): Promise<ProcessedRepository>;
  
  // Extract commit history with progress tracking
  extractCommitHistory(options: ExtractOptions): Promise<CommitHistoryResult>;
  
  // Convert Git objects to DAG format
  buildDagModel(commits: GitCommit[], branches: GitBranch[]): DagModel;
}

export interface ProcessedRepository {
  metadata: RepositoryMetadata;
  dag: DagModel;
  performance: PerformanceMetrics;
  warnings: RepositoryWarning[];
}
```

**Core Features:**
- **isomorphic-git integration** for parsing Git objects
- **Incremental processing** with progress callbacks
- **Performance monitoring** (commit count, size estimates)
- **LFS detection** and warnings
- **Branch/tag resolution** 
- **Merge commit handling**
- **Performance guardrails** (auto-fallback for large repos)

### **2. Repository Context Provider**

**File:** `src/lib/repository/RepositoryContext.tsx`

```typescript
export interface RepositoryContextValue {
  currentRepository: ProcessedRepository | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadRepository(handle: FileSystemDirectoryHandle): Promise<void>;
  loadFromIngest(result: IngestResult): Promise<void>;
  clearRepository(): void;
  
  // Performance
  performanceMode: PerformanceMode;
  updatePerformanceMode(mode: PerformanceMode): void;
}
```

### **3. Integration Points**

**Update existing components:**
- `src/components/ingestion/repository-picker.tsx` - add navigation after processing
- `src/components/ingestion/ingest-dialog.tsx` - integrate with processor
- `src/app/page.tsx` - add repository processing flow

## ✅ **Acceptance Criteria**

### **Functional Requirements**
- [ ] **F1:** Parse local Git repositories via File System Access API
- [ ] **F2:** Support ZIP-based repository ingestion
- [ ] **F3:** Extract complete commit history with parent relationships
- [ ] **F4:** Identify all branches and tags
- [ ] **F5:** Convert Git data to compatible `DagNode[]` format
- [ ] **F6:** Handle merge commits correctly (multiple parents)
- [ ] **F7:** Process repositories up to 10k commits within 3 seconds
- [ ] **F8:** Provide progress callbacks for user feedback
- [ ] **F9:** Detect and warn about Git LFS usage
- [ ] **F10:** Auto-enable performance mode for large repositories

### **Performance Requirements**
- [ ] **P1:** Process typical repository (500 commits) within 1 second
- [ ] **P2:** Handle large repository (10k commits) within 5 seconds
- [ ] **P3:** Memory usage stays under 100MB for 5k commits
- [ ] **P4:** Provide incremental loading for repositories >5k commits
- [ ] **P5:** Implement Web Worker for non-blocking processing

### **Error Handling**
- [ ] **E1:** Gracefully handle corrupted repositories
- [ ] **E2:** Provide clear error messages for unsupported Git features
- [ ] **E3:** Handle permission errors with user-friendly messages
- [ ] **E4:** Recover from partial processing failures
- [ ] **E5:** Validate Git repository structure before processing

## 🧪 **Testing Requirements**

### **Unit Tests** (`src/lib/git/__tests__/processor.test.ts`)
```typescript
describe('GitRepositoryProcessor', () => {
  // Core functionality
  test('processes simple repository with linear history');
  test('handles repository with multiple branches');
  test('processes merge commits correctly');
  test('extracts tags and annotated tags');
  test('handles empty repository');
  
  // Performance
  test('processes 1000 commits within time limit');
  test('provides progress callbacks');
  test('handles memory constraints');
  
  // Error cases
  test('handles corrupted repository gracefully');
  test('validates Git repository structure');
  test('handles permission errors');
});
```

### **Integration Tests** (`e2e/repository-processing.spec.ts`)
```typescript
describe('Repository Processing Flow', () => {
  test('complete flow: select repo → process → visualize');
  test('handles various repository structures');
  test('performance mode switching');
  test('error recovery and user feedback');
});
```

### **Performance Tests**
- Benchmark against repositories of various sizes (100, 1k, 5k, 10k commits)
- Memory usage profiling
- Web Worker performance validation
- Bundle size impact analysis

## 🌐 **Cross-Browser Compatibility**

### **Supported Browsers**
- **Chrome 86+** (File System Access API)
- **Edge 86+** (File System Access API)
- **Firefox** (Directory input fallback)
- **Safari** (ZIP upload fallback)

### **E2E Testing Matrix**
```typescript
// e2e/cross-browser-processing.spec.ts
const browsers = ['chromium', 'firefox', 'webkit'];
const testCases = [
  'File System Access API processing',
  'Directory input fallback processing', 
  'ZIP upload processing',
  'Sample repository processing'
];
```

## 📦 **Bundle & Performance Budgets**

### **Bundle Size Limits**
- **isomorphic-git import:** +120KB (acceptable for core functionality)
- **Total processing module:** <150KB gzipped
- **Dynamic imports** for large repository handling

### **Lighthouse Performance Budget**
- **FCP:** <1.5s (unchanged - processing happens after user action)
- **LCP:** <2.5s (no impact on initial page load)
- **CLS:** <0.1 (no layout shifts during processing)
- **TTI:** <3s (processing doesn't block initial interactivity)

## ♿ **Accessibility Requirements**

### **WCAG 2.2 AA Compliance**
- [ ] **Progress indicators** have proper ARIA labels
- [ ] **Error messages** announced to screen readers
- [ ] **Processing status** communicated via `aria-live` regions
- [ ] **Keyboard navigation** preserved during processing
- [ ] **Focus management** maintained through processing flow

### **A11y Testing**
```typescript
// tests/a11y-processing.test.ts
describe('Repository Processing Accessibility', () => {
  test('progress indicators have proper ARIA labels');
  test('error states announced to screen readers');
  test('processing status updates via aria-live');
  test('keyboard navigation during processing');
});
```

## 🔧 **CI/CD Integration**

### **Quality Gates**
```yaml
# .github/workflows/repository-processing.yml
repository-processing-tests:
  - Unit tests with 90%+ coverage
  - Integration tests across browser matrix
  - Performance benchmarks (fail if >20% regression)
  - Bundle size checks
  - A11y audits with axe-core
  - Memory leak detection
```

### **Performance Monitoring**
- Bundle analyzer reports
- Memory usage profiling in CI
- Performance regression detection
- Lighthouse CI integration

## 📚 **Documentation Requirements**

### **API Documentation**
- [ ] **JSDoc comments** for all public interfaces
- [ ] **Usage examples** for common scenarios
- [ ] **Performance guidelines** for large repositories
- [ ] **Error handling guide** with recovery strategies

### **User Documentation**
- [ ] **Repository compatibility guide** (`docs/user-guides/repository-compatibility.md`)
- [ ] **Performance tuning guide** (`docs/user-guides/performance-tuning.md`)
- [ ] **Troubleshooting guide** (`docs/user-guides/troubleshooting.md`)

### **Developer Documentation**
- [ ] **Architecture overview** (`docs/implementation/core/git-processing.md`)
- [ ] **Performance optimization guide** (`docs/implementation/performance/repository-processing.md`)
- [ ] **Testing strategy** (`docs/development/testing-repository-processing.md`)

## 🔗 **Implementation References**

### **isomorphic-git Documentation**
- [Browser Usage Guide](https://isomorphic-git.org/docs/en/browser)
- [git.log API](https://isomorphic-git.org/docs/en/log)
- [git.listBranches API](https://isomorphic-git.org/docs/en/listBranches)
- [git.listTags API](https://isomorphic-git.org/docs/en/listTags)

### **File System Access API**
- [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)
- [Chrome Developers Guide](https://developer.chrome.com/articles/file-system-access/)

### **Performance Best Practices**
- [Web Workers for Non-blocking Processing](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [Memory Management in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)

## 🎯 **Definition of Done**

- [ ] All acceptance criteria met and tested
- [ ] 90%+ unit test coverage
- [ ] Cross-browser E2E tests passing
- [ ] Performance benchmarks within targets
- [ ] A11y audit score 100%
- [ ] Bundle size within budget
- [ ] Documentation complete and reviewed
- [ ] Code review approved by 2+ maintainers
- [ ] CI/CD pipeline integration complete

## 🔄 **Follow-up Issues**

This issue enables:
- **Issue #2:** Repository Visualization Page
- **Issue #3:** Enhanced Performance Modes
- **Issue #4:** Advanced Git Features Support

## 📊 **Success Metrics**

- **User Engagement:** Users can visualize their actual repositories
- **Performance:** 95% of repositories process within 3 seconds
- **Compatibility:** Works across all supported browsers
- **Quality:** Zero critical bugs in first 30 days
- **Accessibility:** 100% WCAG 2.2 AA compliance score
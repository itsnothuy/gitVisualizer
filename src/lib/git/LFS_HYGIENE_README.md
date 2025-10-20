# LFS Hygiene System

## Overview

The LFS Hygiene system provides **privacy-first, local-only** detection and guidance for large binary files in Git repositories. It helps users identify files that would benefit from Git Large File Storage (LFS) and provides actionable remediation steps.

## Key Features

- ✅ **Privacy-First**: All analysis happens locally; no data uploaded
- ✅ **Smart Detection**: Identifies both large files and existing LFS pointers
- ✅ **Actionable Guidance**: Auto-generates `.gitattributes` patterns and commands
- ✅ **Accessibility**: WCAG 2.2 AA compliant UI
- ✅ **Comprehensive Docs**: 11KB guide with best practices

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Repository Ingestion                     │
│  (directory-input.ts, zip-input.ts, local.ts)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  LFS Hygiene Scanner │
          │  (lfs-hygiene.ts)    │
          └──────────┬───────────┘
                     │
          ┌──────────┴───────────┐
          │                      │
          ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│ Pointer         │    │ Size-Based       │
│ Detection       │    │ Analysis         │
│ (LFS v1 spec)   │    │ (50MB, 100MB)    │
└────────┬────────┘    └────────┬─────────┘
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
          ┌──────────────────────┐
          │   Analysis Result     │
          │  (LFSAnalysisResult) │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Warning Banner UI   │
          │ (LFSWarningBanner)   │
          └──────────────────────┘
```

## Module Structure

### Core Module: `lfs-hygiene.ts`

**Exports:**
- `detectLFSPointer()` - Detects Git LFS pointer files
- `analyzeFiles()` - Analyzes files for size and LFS status
- `generateLFSPatterns()` - Creates `.gitattributes` patterns
- `generateLFSCommands()` - Creates `git lfs track` commands
- `formatBytes()` - Human-readable size formatting

**Types:**
- `LFSPointer` - LFS pointer file structure
- `LargeFileInfo` - Information about a large file
- `LFSAnalysisResult` - Complete analysis result
- `LFSAnalysisOptions` - Configuration options

### Integration Points

#### 1. Directory Input (`fallbacks/directory-input.ts`)
```typescript
export async function selectDirectoryInput(
  options: DirectoryInputOptions = {}
): Promise<IngestResult>
```

**New Options:**
- `analyzeLFS?: boolean` - Enable LFS analysis (default: `true`)
- `lfsWarningThreshold?: number` - Warning threshold in bytes (default: 50MB)
- `lfsCriticalThreshold?: number` - Critical threshold in bytes (default: 100MB)

#### 2. ZIP Input (`fallbacks/zip-input.ts`)
```typescript
export async function selectZipFile(
  options: ZipInputOptions = {}
): Promise<IngestResult>
```

Same options as directory input.

#### 3. Result Type (`ingestion-types.ts`)
```typescript
export interface IngestResult {
  files: IngestFile[];
  name: string;
  totalSize: number;
  error?: IngestError;
  lfsAnalysis?: LFSAnalysisResult;  // ← New field
}
```

## LFS Pointer Format

Git LFS replaces large files with small text pointers:

```
version https://git-lfs.github.com/spec/v1
oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393
size 12345
```

**Fields:**
- `version` - Always `https://git-lfs.github.com/spec/v1`
- `oid` - SHA-256 hash of actual file (64 hex chars)
- `size` - Actual file size in bytes

**Detection:**
- Pointer files are typically < 200 bytes
- Must have exactly 3 lines
- OID must be valid SHA-256 hash
- Size must be a positive integer

## Thresholds

| Threshold | Size | Badge | Description |
|-----------|------|-------|-------------|
| **Warning** | 50 MB | ⚠️ Yellow | File is large; consider LFS if it changes frequently |
| **Critical** | 100 MB | 🔴 Red | File is very large; strongly recommend LFS |

These are configurable per ingestion operation.

## Usage Examples

### Basic Usage

```typescript
import { selectDirectoryInput } from '@/lib/git/fallbacks/directory-input';

const result = await selectDirectoryInput();

if (result.lfsAnalysis && result.lfsAnalysis.largeFiles.length > 0) {
  console.log(`Found ${result.lfsAnalysis.largeFiles.length} large files`);
  
  // Group by severity
  const warnings = result.lfsAnalysis.largeFiles.filter(f => f.severity === 'warning');
  const critical = result.lfsAnalysis.largeFiles.filter(f => f.severity === 'critical');
  
  console.log(`⚠️  ${warnings.length} warnings`);
  console.log(`🔴 ${critical.length} critical`);
}
```

### Custom Thresholds

```typescript
const result = await selectDirectoryInput({
  lfsWarningThreshold: 25 * 1024 * 1024,  // 25 MB
  lfsCriticalThreshold: 75 * 1024 * 1024,  // 75 MB
});
```

### Disable Analysis

```typescript
const result = await selectDirectoryInput({
  analyzeLFS: false,
});
// result.lfsAnalysis will be undefined
```

### Display UI Warning

```typescript
import { LFSWarningBanner } from '@/components/git/LFSWarningBanner';

function RepositoryView({ result }: { result: IngestResult }) {
  if (!result.lfsAnalysis || result.lfsAnalysis.largeFiles.length === 0) {
    return null;
  }

  return (
    <LFSWarningBanner
      analysis={result.lfsAnalysis}
      onDismiss={() => console.log('Dismissed')}
      defaultExpanded={true}
    />
  );
}
```

## UI Component: LFSWarningBanner

### Props

```typescript
interface LFSWarningBannerProps {
  analysis: LFSAnalysisResult;
  onDismiss?: () => void;
  defaultExpanded?: boolean;
}
```

### Features

1. **Collapsible Panel**: Expand/collapse with keyboard support
2. **File List**: Shows up to 10 large files with sizes
3. **LFS Status**: Highlights files already tracked by LFS
4. **Remediation**:
   - Auto-generated `.gitattributes` patterns
   - Copy-to-clipboard buttons
   - `git lfs track` commands
5. **Documentation Links**:
   - Git LFS website
   - GitHub LFS docs
   - Internal LFS guide
6. **Accessibility**:
   - `role="alert"` for banner
   - `aria-live="polite"` for non-intrusive updates
   - Keyboard navigation (Tab/Enter/Space)
   - Screen reader announcements

## Testing

### Unit Tests (`__tests__/lfs-hygiene.test.ts`)

**35 tests covering:**
- LFS pointer detection (valid/invalid formats)
- File analysis (thresholds, grouping)
- Pattern generation
- Command generation
- Utility functions
- Edge cases (cross-realm ArrayBuffers, Blobs, etc.)

**Run tests:**
```bash
pnpm test src/lib/git/__tests__/lfs-hygiene.test.ts
```

### E2E Tests (`e2e/lfs-hygiene.spec.ts`)

**Placeholder tests for:**
- UI banner display
- Copy-to-clipboard functionality
- Keyboard navigation
- Accessibility checks
- Privacy (no network requests)

**Note:** Full E2E tests require integration into ingestion UI.

## Performance Considerations

### Analysis Cost

- **Small overhead**: Typically < 100ms for repositories with < 1000 files
- **Scales linearly**: O(n) where n = number of files
- **Pointer detection**: Only reads small files (< 1KB)
- **Optional**: Can be disabled per ingestion

### Optimization Strategies

1. **Skip Analysis**: Disable for very large repositories
   ```typescript
   const result = await selectDirectoryInput({
     analyzeLFS: fileCount < 50000,
   });
   ```

2. **Higher Thresholds**: Reduce false positives
   ```typescript
   const result = await selectDirectoryInput({
     lfsWarningThreshold: 100 * 1024 * 1024,  // 100 MB
   });
   ```

3. **Background Processing**: Analysis happens during ingestion
   - No additional blocking time
   - Results available with IngestResult

## Privacy & Security

### Local-First Design

✅ **No data uploaded**
- All analysis happens in the browser
- File content stays on the device
- No external API calls

✅ **Metadata only**
- Uses file size from File API
- Only reads small LFS pointer files
- No bulk file reading

✅ **No tracking**
- No telemetry
- No analytics
- No fingerprinting

### Security Considerations

- ✅ Input validation on all file paths
- ✅ Safe regex patterns (no ReDoS)
- ✅ Size limits prevent memory issues
- ✅ No eval() or dynamic code execution

## Documentation

### User-Facing

- **LFS Guide** (`/docs/LFS_GUIDE.md`) - Comprehensive 11KB guide
- **Usage Examples** (`/docs/examples/lfs-usage.md`) - Code examples

### Developer

- **This README** - System architecture and API
- **Inline JSDoc** - All public functions documented
- **Type Definitions** - Full TypeScript coverage

## Future Enhancements

### Planned

1. **Skip Large Files**: Option to exclude large files from layout
2. **User Settings**: Persist threshold preferences
3. **E2E Fixtures**: Test repositories with large files
4. **Performance Dashboard**: Show memory usage and timing

### Potential

1. **Git Annex Support**: Detect and handle git-annex files
2. **DVC Integration**: Support for Data Version Control
3. **Batch Migration**: Automated `git lfs migrate` workflow
4. **Size Trend Analysis**: Track large file growth over time

## Troubleshooting

### Issue: Analysis not running

**Check:**
1. Is `analyzeLFS` set to `true`? (default)
2. Are there files in the repository?
3. Check browser console for errors

### Issue: Pointer not detected

**Verify:**
1. File is small (< 1KB)
2. Has exactly 3 lines
3. Version is `https://git-lfs.github.com/spec/v1`
4. OID is 64 hex characters
5. Size is a number

### Issue: UI banner not showing

**Debug:**
1. Check if `result.lfsAnalysis` exists
2. Verify `largeFiles.length > 0`
3. Check if component is rendered
4. Look for console errors

## References

- [Git LFS Website](https://git-lfs.github.com/)
- [Git LFS Spec](https://github.com/git-lfs/git-lfs/blob/main/docs/spec.md)
- [GitHub LFS Docs](https://docs.github.com/en/repositories/working-with-files/managing-large-files)
- [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/)

## Contributing

When modifying the LFS hygiene system:

1. **Run Tests**: `pnpm test src/lib/git`
2. **Type Check**: `pnpm typecheck`
3. **Lint**: `pnpm lint`
4. **Build**: `pnpm build`
5. **Update Docs**: Keep this README and guides in sync
6. **Add Tests**: For new features or bug fixes

## License

Same as parent project.

# LFS Hygiene Usage Examples

This document shows how to use the LFS hygiene detection and warning features.

## Basic Usage

### 1. Ingestion with LFS Analysis

The LFS scanner is automatically enabled by default during repository ingestion:

```typescript
import { selectDirectoryInput } from '@/lib/git/fallbacks/directory-input';

// LFS analysis is enabled by default
const result = await selectDirectoryInput({
  onProgress: (progress) => {
    console.log(`Processing: ${progress.message} (${progress.percentage}%)`);
  },
});

// Check if large files were found
if (result.lfsAnalysis && result.lfsAnalysis.largeFiles.length > 0) {
  console.log(`Found ${result.lfsAnalysis.largeFiles.length} large files`);
  console.log(`Total size: ${result.lfsAnalysis.totalLargeFileSize} bytes`);
}
```

### 2. Custom Thresholds

You can customize the warning and critical thresholds:

```typescript
import { selectDirectoryInput } from '@/lib/git/fallbacks/directory-input';

const result = await selectDirectoryInput({
  analyzeLFS: true,
  lfsWarningThreshold: 25 * 1024 * 1024,  // 25 MB
  lfsCriticalThreshold: 75 * 1024 * 1024,  // 75 MB
});
```

### 3. Disable LFS Analysis

If you don't need LFS analysis:

```typescript
import { selectDirectoryInput } from '@/lib/git/fallbacks/directory-input';

const result = await selectDirectoryInput({
  analyzeLFS: false,
});

// result.lfsAnalysis will be undefined
```

### 4. Direct File Analysis

You can also analyze files directly without ingestion:

```typescript
import { analyzeFiles } from '@/lib/git/lfs-hygiene';

const files = [
  {
    path: 'video/demo.mp4',
    size: 100 * 1024 * 1024, // 100 MB
    content: videoBlob,
  },
  {
    path: 'image/photo.png',
    size: 60 * 1024 * 1024, // 60 MB
    content: imageBlob,
  },
];

const analysis = await analyzeFiles(files, {
  warningThreshold: 50 * 1024 * 1024,  // 50 MB
  criticalThreshold: 100 * 1024 * 1024, // 100 MB
});

console.log(`Large files: ${analysis.largeFiles.length}`);
console.log(`LFS-managed files: ${analysis.lfsFiles.length}`);
```

### 5. Generate LFS Patterns

Generate `.gitattributes` patterns for detected files:

```typescript
import { generateLFSPatterns, generateLFSCommands } from '@/lib/git/lfs-hygiene';

const extensions = ['.mp4', '.png', '.zip'];

// Generate .gitattributes content
const patterns = generateLFSPatterns(extensions);
console.log(patterns);
// Output:
// *.mp4 filter=lfs diff=lfs merge=lfs -text
// *.png filter=lfs diff=lfs merge=lfs -text
// *.zip filter=lfs diff=lfs merge=lfs -text

// Generate git lfs track commands
const commands = generateLFSCommands(extensions);
console.log(commands);
// Output:
// git lfs track "*.mp4"
// git lfs track "*.png"
// git lfs track "*.zip"
```

### 6. Detect LFS Pointers

Check if a file is an LFS pointer:

```typescript
import { detectLFSPointer } from '@/lib/git/lfs-hygiene';

const fileContent = new TextEncoder().encode(
  'version https://git-lfs.github.com/spec/v1\n' +
  'oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393\n' +
  'size 100000000\n'
);

const pointer = await detectLFSPointer(fileContent);

if (pointer?.isValid) {
  console.log(`LFS pointer detected!`);
  console.log(`- OID: ${pointer.oid}`);
  console.log(`- Actual file size: ${pointer.size} bytes`);
}
```

## UI Components

### Display Warning Banner

```typescript
import { LFSWarningBanner } from '@/components/git/LFSWarningBanner';
import { selectDirectoryInput } from '@/lib/git/fallbacks/directory-input';

function IngestionResults() {
  const [result, setResult] = useState<IngestResult | null>(null);

  const handleIngest = async () => {
    const ingestResult = await selectDirectoryInput();
    setResult(ingestResult);
  };

  return (
    <div>
      <button onClick={handleIngest}>Open Repository</button>
      
      {result?.lfsAnalysis && result.lfsAnalysis.largeFiles.length > 0 && (
        <LFSWarningBanner
          analysis={result.lfsAnalysis}
          onDismiss={() => {
            // Handle dismissal (e.g., store preference)
            console.log('Warning dismissed');
          }}
        />
      )}
    </div>
  );
}
```

### Banner with Custom State

```typescript
import { LFSWarningBanner } from '@/components/git/LFSWarningBanner';
import { useState } from 'react';

function RepositoryView({ lfsAnalysis }) {
  const [showBanner, setShowBanner] = useState(true);

  if (!showBanner || !lfsAnalysis || lfsAnalysis.largeFiles.length === 0) {
    return null;
  }

  return (
    <LFSWarningBanner
      analysis={lfsAnalysis}
      defaultExpanded={false}  // Start collapsed
      onDismiss={() => setShowBanner(false)}
    />
  );
}
```

## Analysis Result Structure

The `LFSAnalysisResult` object contains:

```typescript
interface LFSAnalysisResult {
  // All large files detected
  largeFiles: Array<{
    path: string;
    size: number;
    extension: string;
    severity: 'warning' | 'critical';
    lfsPointer?: LFSPointer;  // Present if file is an LFS pointer
  }>;
  
  // Total size of all large files
  totalLargeFileSize: number;
  
  // Subset of largeFiles that are LFS-managed
  lfsFiles: Array<{
    path: string;
    size: number;
    extension: string;
    severity: 'warning' | 'critical';
    lfsPointer: LFSPointer;
  }>;
  
  // Files grouped by extension for easy remediation
  filesByExtension: Record<string, LargeFileInfo[]>;
  
  // Thresholds used for analysis
  warningThreshold: number;
  criticalThreshold: number;
}
```

## Best Practices

### 1. Early Detection

Analyze files as soon as possible during ingestion:

```typescript
const result = await selectDirectoryInput({
  analyzeLFS: true,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
  },
});

// Immediately check for warnings
if (result.lfsAnalysis?.largeFiles.length > 0) {
  showWarningBanner(result.lfsAnalysis);
}
```

### 2. Persist User Preferences

Remember if users dismissed warnings:

```typescript
const DISMISSED_KEY = 'lfs-warning-dismissed';

function shouldShowWarning(repoName: string): boolean {
  const dismissed = localStorage.getItem(DISMISSED_KEY);
  return !dismissed?.includes(repoName);
}

function dismissWarning(repoName: string) {
  const dismissed = localStorage.getItem(DISMISSED_KEY) || '';
  localStorage.setItem(DISMISSED_KEY, `${dismissed},${repoName}`);
}
```

### 3. Progressive Enhancement

Show warnings without blocking the UI:

```typescript
async function ingestRepository() {
  // Start ingestion
  const result = await selectDirectoryInput({
    analyzeLFS: true,
  });
  
  // Show results immediately
  displayRepositoryGraph(result.files);
  
  // Then show LFS warnings (non-blocking)
  if (result.lfsAnalysis?.largeFiles.length > 0) {
    setTimeout(() => {
      showWarningBanner(result.lfsAnalysis);
    }, 500);
  }
}
```

### 4. Performance Considerations

For very large repositories, consider:

```typescript
// Skip LFS analysis for huge repos
const result = await selectDirectoryInput({
  analyzeLFS: fileCount < 50000,  // Only analyze if < 50k files
});

// Or use higher thresholds
const result = await selectDirectoryInput({
  lfsWarningThreshold: 100 * 1024 * 1024,   // 100 MB
  lfsCriticalThreshold: 500 * 1024 * 1024,  // 500 MB
});
```

## Privacy Note

All LFS analysis happens **locally** in the browser:
- No file content is uploaded to any server
- Analysis uses file metadata when possible
- LFS pointer detection reads small text files only
- Respects the privacy-first design of the application

## Additional Resources

- [LFS Guide](/docs/LFS_GUIDE.md) - Comprehensive guide to Git LFS
- [Git LFS Website](https://git-lfs.github.com/) - Official documentation
- [GitHub LFS Docs](https://docs.github.com/en/repositories/working-with-files/managing-large-files) - GitHub-specific guidance

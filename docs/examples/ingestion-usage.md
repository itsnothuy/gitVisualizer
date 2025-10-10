# Repository Ingestion Usage Examples

This document provides practical examples for using the repository ingestion APIs in Git Visualizer.

## Local Repository Access (File System Access API)

### Basic Usage

```typescript
import { pickLocalRepoDir, isGitRepository } from "@/lib/git/local";

async function openLocalRepository() {
  // Prompt user to select a directory
  const result = await pickLocalRepoDir();
  
  if (result.handle) {
    // Validate it's a Git repository
    const isValid = await isGitRepository(result.handle);
    
    if (isValid) {
      console.log("Valid Git repository:", result.handle.name);
      // Proceed with repository operations
    } else {
      console.error("Not a valid Git repository");
    }
  } else if (result.error) {
    console.error("Error:", result.error.message);
  }
}
```

### Error Handling

```typescript
import { pickLocalRepoDir } from "@/lib/git/local";

async function openRepositoryWithErrorHandling() {
  const result = await pickLocalRepoDir();
  
  if (result.error) {
    switch (result.error.type) {
      case "unsupported":
        alert("Your browser does not support the File System Access API. Please use Chrome 86+, Edge 86+, or another compatible browser.");
        break;
      
      case "permission-denied":
        alert("Permission denied. Please grant access to the directory to continue.");
        break;
      
      case "user-cancelled":
        console.log("User cancelled the directory picker");
        break;
      
      default:
        console.error("Unexpected error:", result.error.message);
    }
    return;
  }
  
  // Success - use result.handle
  console.log("Repository opened:", result.handle?.name);
}
```

### Browser Support Detection

```typescript
import { isFileSystemAccessSupported } from "@/lib/git/local";

function checkBrowserSupport() {
  if (!isFileSystemAccessSupported()) {
    console.warn("File System Access API not supported");
    // Show fallback UI or instructions
    return false;
  }
  
  return true;
}
```

## Remote Repository Cloning (isomorphic-git)

### Basic Shallow Clone

```typescript
import { shallowClone } from "@/lib/git/remote";

async function cloneRepository() {
  const result = await shallowClone({
    url: "https://github.com/user/repository",
    depth: 50,
    singleBranch: true,
  });
  
  if (result.error) {
    console.error("Clone failed:", result.error.message);
    return;
  }
  
  console.log("Cloned to:", result.dir);
  console.log("Cloned at:", result.metadata.clonedAt);
  
  // Access the filesystem
  const files = await result.fs.readdir(result.dir);
  console.log("Files:", files);
}
```

### Clone with Progress Tracking

```typescript
import { shallowClone } from "@/lib/git/remote";

async function cloneWithProgress() {
  const result = await shallowClone({
    url: "https://github.com/user/repository",
    depth: 50,
    onProgress: (progress) => {
      console.log(`${progress.phase}: ${progress.loaded}/${progress.total}`);
      
      // Update UI progress bar
      const percentage = (progress.loaded / progress.total) * 100;
      updateProgressBar(percentage);
    },
  });
  
  if (result.error) {
    handleCloneError(result.error);
    return;
  }
  
  console.log("Clone complete!");
}

function updateProgressBar(percentage: number) {
  // Update your UI progress indicator
  document.getElementById("progress")!.style.width = `${percentage}%`;
}
```

### Clone with CORS Proxy

```typescript
import { shallowClone } from "@/lib/git/remote";

async function cloneWithProxy() {
  const result = await shallowClone({
    url: "https://github.com/user/private-repo",
    depth: 50,
    corsProxy: "https://cors.isomorphic-git.org",
  });
  
  if (result.error) {
    if (result.error.type === "cors") {
      console.error("CORS error - proxy required");
      // Show instructions to user about configuring CORS proxy
    }
    return;
  }
  
  console.log("Clone successful");
}
```

### Error Handling for Remote Clones

```typescript
import { shallowClone } from "@/lib/git/remote";

async function cloneWithErrorHandling() {
  const result = await shallowClone({
    url: "https://github.com/user/repository",
    depth: 50,
  });
  
  if (result.error) {
    switch (result.error.type) {
      case "invalid-url":
        alert("Invalid repository URL. Please check the URL and try again.");
        break;
      
      case "network":
        alert("Network error. Please check your connection and try again.");
        break;
      
      case "cors":
        alert("CORS error. This repository requires a CORS proxy. Please configure one or use a repository that allows cross-origin requests.");
        break;
      
      default:
        console.error("Clone failed:", result.error.message);
        if (result.error.originalError) {
          console.error("Original error:", result.error.originalError);
        }
    }
    return;
  }
  
  // Success
  console.log("Repository cloned successfully");
}
```

## React Component Integration

### Using RepositoryPicker Component

```tsx
import { RepositoryPicker } from "@/components/ingestion/repository-picker";

function MyApp() {
  const [repo, setRepo] = useState<FileSystemDirectoryHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleRepoSelected = (handle: FileSystemDirectoryHandle) => {
    setRepo(handle);
    setError(null);
    console.log("Repository selected:", handle.name);
    
    // Proceed with repository operations
    loadRepositoryData(handle);
  };
  
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    console.error("Error:", errorMessage);
  };
  
  return (
    <div>
      <RepositoryPicker
        onRepositorySelected={handleRepoSelected}
        onError={handleError}
      />
      
      {repo && (
        <div>Connected to: {repo.name}</div>
      )}
      
      {error && (
        <div className="error">{error}</div>
      )}
    </div>
  );
}
```

## HTTPS Development Setup

To test File System Access API features locally, you need HTTPS:

```bash
# Start development server with HTTPS
pnpm dev:https

# This will:
# 1. Generate self-signed certificates
# 2. Start Next.js dev server on https://localhost:3000
# 3. Your browser will warn about the certificate - this is safe for local development
```

## Browser Compatibility

| Browser | File System Access API | Notes |
|---------|------------------------|-------|
| Chrome 86+ | ✅ Full Support | Recommended |
| Edge 86+ | ✅ Full Support | Recommended |
| Safari 15.2+ | ⚠️ Partial Support | May require user permission each session |
| Firefox | ❌ Not Supported | Use Chrome/Edge for development |

## Privacy & Security Notes

1. **Local Access**: Directory handles are NOT persisted by default. Users must grant permission each session.
2. **No Upload**: Repository contents NEVER leave the device unless overlays are explicitly enabled.
3. **Read-Only**: Initial access is read-only. Write permission is requested separately if needed.
4. **OPFS Storage**: Remote clones use Origin Private File System (OPFS) for isolation and security.
5. **CORS Proxy**: Required for cloning public repositories that don't allow cross-origin requests.

## Common Issues & Solutions

### Issue: "File System Access API not supported"

**Solution**: Use Chrome 86+, Edge 86+, or another compatible browser.

### Issue: "Permission denied"

**Solution**: User must explicitly grant permission. Clear browser permissions and try again.

### Issue: "CORS error during clone"

**Solution**: Configure a CORS proxy:
```typescript
await shallowClone({
  url: "https://github.com/user/repo",
  corsProxy: "https://cors.isomorphic-git.org"
});
```

### Issue: "Not a valid Git repository"

**Solution**: Ensure the selected directory contains a `.git` folder. Select the repository root, not a subdirectory.

# Git Large File Storage (LFS) Guide

## Overview

Git Large File Storage (LFS) is an extension to Git that improves handling of large files by replacing them with text pointers inside Git, while storing the file contents on a remote server. This guide explains what LFS is, how it works, and best practices for using it with this visualizer.

**Official Resources:**
- [Git LFS Website](https://git-lfs.github.com/)
- [GitHub Docs: Managing Large Files](https://docs.github.com/en/repositories/working-with-files/managing-large-files)
- [GitHub Docs: About Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage)
- [Git LFS Specification](https://github.com/git-lfs/git-lfs/blob/main/docs/spec.md)

## Why Use Git LFS?

### The Problem

Git is optimized for text files and source code. When you commit large binary files (videos, high-resolution images, archives, datasets), several issues arise:

1. **Repository Bloat**: Every version of every large file is stored in the repository's history, making clones and fetches slow
2. **Performance Degradation**: Operations like `git log`, `git blame`, and `git diff` slow down
3. **UI Lockups**: Visualizers and other tools may become unresponsive when processing large files
4. **Storage Costs**: Repository size grows rapidly, consuming disk space and bandwidth

### The Solution

Git LFS replaces large files with small **pointer files** in your repository, while storing the actual file contents on a separate LFS server. This approach:

- ✅ Keeps repository size small and fast
- ✅ Only downloads large files when needed (on checkout)
- ✅ Maintains full version control of large files
- ✅ Works seamlessly with existing Git workflows

## How Git LFS Works

### Pointer File Format

When you track a file with LFS, Git stores a small pointer file instead of the actual content. The pointer file follows this format:

```
version https://git-lfs.github.com/spec/v1
oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393
size 12345
```

**Fields:**
- `version`: Always `https://git-lfs.github.com/spec/v1` for the current spec
- `oid`: SHA-256 hash of the actual file content (prefixed with `sha256:`)
- `size`: Size of the actual file in bytes

### Workflow

1. **Track File Types**: Configure which files to track with LFS (by extension or path)
2. **Add Files**: Add files normally with `git add`
3. **Commit**: LFS automatically replaces tracked files with pointers and uploads content
4. **Clone/Pull**: LFS downloads only the files needed for the current checkout

## Recommended Thresholds

This visualizer uses the following thresholds for detecting large files:

| Threshold | Size | Severity | Recommendation |
|-----------|------|----------|----------------|
| **Warning** | 50 MB | ⚠️ Warning | Consider LFS if the file will change frequently |
| **Critical** | 100 MB | 🔴 Critical | Strongly recommend LFS or alternative storage |

### GitHub Plan Limits

GitHub has per-file size limits that vary by plan:

| Plan | Maximum File Size | Notes |
|------|-------------------|-------|
| Free | 2 GB | Includes LFS files |
| Pro/Team/Enterprise | 5 GB | Higher limits available on request |

**Important:** These are maximum file sizes, not recommended sizes. Even smaller files benefit from LFS if they change frequently.

**Source:** [GitHub Docs: About Large Files on GitHub](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)

## Common File Types for LFS

### Recommended for LFS

These file types are commonly large and benefit from LFS tracking:

**Media:**
- Images: `.psd`, `.ai`, `.sketch`, `.xcf`
- Video: `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`
- Audio: `.wav`, `.flac`, `.aif`, `.aiff`

**Archives:**
- `.zip`, `.tar.gz`, `.rar`, `.7z`

**Datasets & Documents:**
- `.csv`, `.parquet`, `.h5`, `.hdf5`
- `.pdf` (especially large documents)

**Binaries:**
- `.exe`, `.dll`, `.so`, `.dylib`
- `.bin`, `.dat`

**3D & Design:**
- `.obj`, `.fbx`, `.blend`, `.max`
- `.stl`, `.step`

### NOT Recommended for LFS

- Source code (`.js`, `.ts`, `.py`, `.go`, etc.)
- Configuration files (`.json`, `.yaml`, `.toml`)
- Small images used in documentation (< 1 MB)
- Text files of any size

## Setting Up Git LFS

### Installation

**macOS (Homebrew):**
```bash
brew install git-lfs
```

**Windows (Chocolatey):**
```bash
choco install git-lfs
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt-get install git-lfs
```

**Manual:**
Download from [git-lfs.github.com](https://git-lfs.github.com/)

### Initialize in Repository

Run once per repository:

```bash
git lfs install
```

### Track File Types

**Track all files of a specific type:**

```bash
git lfs track "*.psd"
git lfs track "*.mp4"
git lfs track "*.zip"
```

**Track files in a specific directory:**

```bash
git lfs track "datasets/**"
git lfs track "media/videos/*"
```

**Verify tracking:**

```bash
git lfs track
```

This creates or updates `.gitattributes` with patterns like:

```gitattributes
*.psd filter=lfs diff=lfs merge=lfs -text
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.zip filter=lfs diff=lfs merge=lfs -text
```

**Important:** Commit the `.gitattributes` file:

```bash
git add .gitattributes
git commit -m "Configure Git LFS tracking"
```

### Adding LFS Files

After configuring tracking, add files normally:

```bash
git add large-file.psd
git commit -m "Add design file"
git push
```

Git LFS automatically:
1. Uploads the file content to the LFS server
2. Replaces the file with a pointer in the repository

## Migrating Existing Files

If you've already committed large files to your repository, you can migrate them to LFS:

### Option 1: Migrate Recent Commits

Migrate files in recent commits:

```bash
git lfs migrate import --include="*.psd,*.mp4" --everything
```

### Option 2: Clean History

For a more thorough cleanup (rewrites history):

```bash
git lfs migrate import --include="*.psd,*.mp4" --everything
git reflog expire --expire-unreachable=now --all
git gc --prune=now --aggressive
```

**⚠️ Warning:** These commands rewrite Git history. Coordinate with your team and ensure everyone re-clones the repository.

## Using This Visualizer with LFS

### Large File Detection

When you open a repository, the visualizer automatically:

1. **Scans** for files exceeding warning thresholds (50 MB, 100 MB)
2. **Detects** LFS pointer files already tracked
3. **Groups** files by extension for easy remediation
4. **Shows** non-blocking warnings without uploading data

### Warning Indicators

- **⚠️ Yellow Badge**: File > 50 MB (warning threshold)
- **🔴 Red Badge**: File > 100 MB (critical threshold)
- **📦 LFS Icon**: File is already tracked by LFS (pointer file)

### Recommended Actions

When you see warnings:

1. **Review the file list**: Understand which files are large
2. **Copy suggested commands**: Use the auto-generated `.gitattributes` patterns
3. **Set up LFS locally**: Follow the setup steps above
4. **Migrate if needed**: Use `git lfs migrate` for existing files
5. **Re-visualize**: Open the repository again to verify

### Skip Large Files

To improve performance, you can skip large files during visualization:

1. Check "Skip files over X MB" in settings
2. Adjust threshold as needed
3. Large files won't be processed during layout

**Note:** Skipping files excludes them from the visualization but doesn't modify your repository.

## Common Pitfalls

### 1. Not Committing `.gitattributes`

**Problem:** LFS tracking only works when `.gitattributes` is committed.

**Solution:** Always commit `.gitattributes`:
```bash
git add .gitattributes
git commit -m "Configure LFS tracking"
```

### 2. Tracking After Committing

**Problem:** Files committed before LFS tracking was enabled remain as regular Git objects.

**Solution:** Use `git lfs migrate import` to convert existing files.

### 3. Cloning Without LFS Installed

**Problem:** Cloning without `git lfs install` downloads pointer files instead of actual content.

**Solution:**
```bash
git lfs install
git lfs pull
```

### 4. Mixing LFS and Non-LFS Files

**Problem:** Some files with the same extension are in LFS, others aren't.

**Solution:** Be consistent with `.gitattributes` patterns. Use specific paths if needed:
```gitattributes
docs/images/*.png filter=lfs diff=lfs merge=lfs -text
# Small icons remain in Git:
# src/icons/*.png (not tracked by LFS)
```

### 5. Forgetting to Push LFS Content

**Problem:** Git push succeeds, but LFS content isn't uploaded.

**Solution:** LFS upload happens automatically with `git push`. If it fails, check:
```bash
git lfs env  # Verify LFS configuration
git lfs push origin main  # Manually push LFS objects
```

## Privacy & Local-First Processing

This visualizer follows a **privacy-first approach**:

✅ **All analysis happens locally** in your browser
✅ **No repository content is uploaded** to any server
✅ **File size calculations** use metadata only (no file reading unless needed)
✅ **LFS pointer detection** is performed client-side

The visualizer:
- Never sends file content to external services
- Does not require internet access for local repositories
- Processes everything in-browser or via local File System Access API

## Troubleshooting

### Check LFS Status

```bash
git lfs ls-files  # List LFS-tracked files
git lfs status    # Show LFS status
git lfs env       # Show LFS environment
```

### Verify Pointer File

Check if a file is an LFS pointer:

```bash
cat path/to/file
```

If it's an LFS pointer, you'll see:
```
version https://git-lfs.github.com/spec/v1
oid sha256:...
size ...
```

If you see binary content, the file is NOT tracked by LFS.

### Fix Bandwidth Issues

If cloning/fetching is slow due to LFS:

**Clone without LFS content:**
```bash
GIT_LFS_SKIP_SMUDGE=1 git clone <repo-url>
cd <repo>
```

**Download only needed files:**
```bash
git lfs pull --include="path/to/needed/files/*"
```

## Additional Resources

### Official Documentation

- [Git LFS Tutorial](https://github.com/git-lfs/git-lfs/wiki/Tutorial)
- [Git LFS FAQ](https://github.com/git-lfs/git-lfs/wiki/FAQ)
- [GitHub: Configuring Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/configuring-git-large-file-storage)

### GitHub-Specific

- [GitHub: About Storage and Bandwidth Usage](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-storage-and-bandwidth-usage)
- [GitHub: Removing Files from LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/removing-files-from-git-large-file-storage)

### Alternatives to LFS

If LFS doesn't fit your needs:

- **Git Annex**: More flexible but more complex
- **DVC (Data Version Control)**: Specialized for ML datasets
- **Cloud Storage + Links**: Store files externally, commit download scripts

## Support

If you encounter issues with LFS hygiene detection in this visualizer:

1. Check this guide for common pitfalls
2. Verify files with `git lfs ls-files`
3. Review [GitHub LFS docs](https://docs.github.com/en/repositories/working-with-files/managing-large-files)
4. Open an issue in this repository (without uploading sensitive data)

---

**Remember:** Git LFS is a tool, not a requirement. Use it when it makes sense for your workflow, and always keep your team informed when enabling it.

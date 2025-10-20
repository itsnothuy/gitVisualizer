# Sample Git Repositories

This directory contains pre-built sample Git repositories that users can load without needing their own local repositories. These samples are designed to demonstrate various Git workflows and patterns.

## Available Samples

### 1. Linear History (`sample-linear.zip`)
- **Difficulty:** Beginner
- **Commits:** 4
- **Description:** A simple repository with commits in a linear sequence
- **Use Case:** Perfect for understanding basic Git workflow and commit history

### 2. Feature Branches (`sample-branches.zip`)
- **Difficulty:** Intermediate
- **Commits:** 5 (including merge commit)
- **Description:** Demonstrates feature branch workflow with a merge
- **Use Case:** Learn how branches are created and merged back to main

### 3. Complex Merge History (`sample-complex.zip`)
- **Difficulty:** Advanced
- **Commits:** 9 (including multiple merges)
- **Description:** Multiple feature branches with merges and a release tag
- **Use Case:** Explore complex Git workflows with parallel development

## Technical Details

All samples are:
- **Synthetic:** Created specifically for demonstration purposes
- **Self-contained:** Include complete Git history in `.git` directory
- **Zipped:** Compressed for easy loading and distribution
- **Small:** Each under 50KB for fast loading

## Usage

Samples are loaded via the IngestDialog's "Try a Sample" tab. The application automatically:
1. Fetches the ZIP file from `/samples/`
2. Decompresses it in memory using fflate
3. Loads the Git repository from the decompressed files
4. Renders the commit graph

## Creating New Samples

To add a new sample:

```bash
# Create a new Git repo
mkdir sample-name
cd sample-name
git init
git config user.name "Sample User"
git config user.email "sample@example.com"

# Add commits, branches, etc.
echo "content" > file.txt
git add file.txt
git commit -m "Commit message"

# Zip it
cd ..
zip -r sample-name.zip sample-name

# Copy to samples directory
cp sample-name.zip /path/to/public/samples/

# Update samples.json metadata
```

## Privacy & Security

- All samples contain only synthetic data
- No real user information or credentials
- Safe to distribute publicly
- Load entirely in browser memory

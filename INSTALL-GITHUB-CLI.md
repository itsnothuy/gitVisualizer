# GitHub CLI Installation Guide

## 🚀 **Install GitHub CLI (Required)**

### **macOS (Homebrew)**
```bash
brew install gh
```

### **macOS (Manual)**
```bash
# Download and install from GitHub
curl -fsSL https://github.com/cli/cli/releases/latest/download/gh_*_macOS_amd64.tar.gz | tar -xz
sudo mv gh_*/bin/gh /usr/local/bin/
```

### **Verify Installation**
```bash
gh --version
```

## 🔑 **Authentication Setup**

### **Login to GitHub**
```bash
gh auth login
```

**Follow the prompts:**
1. Choose "GitHub.com"
2. Choose "HTTPS" 
3. Choose "Yes" to authenticate Git
4. Choose "Login with a web browser"
5. Copy the code and authenticate in browser

### **Verify Authentication**
```bash
gh auth status
```

## ✅ **Test Repository Access**
```bash
gh repo view itsnothuy/gitVisualizer
```

## 🎯 **Quick Start After Installation**

```bash
# 1. Check everything is working
make -f Makefile.issues check-prerequisites

# 2. Preview issues (safe test)
./gh-issues.sh preview

# 3. Create issues
./gh-issues.sh create

# 4. Check status
./gh-issues.sh status
```

## 🔧 **Alternative: Manual Issue Creation**

If you prefer not to install GitHub CLI, you can manually create issues using the markdown files:

1. Go to: https://github.com/itsnothuy/gitVisualizer/issues/new
2. Copy content from `github-issues/01-git-repository-processor.md`
3. Paste as issue title and body
4. Add labels: `type:enhancement`, `priority:high`, `epic:core`
5. Assign to `@copilot` if available
6. Repeat for all 5 issue files

## 📚 **GitHub CLI Resources**

- **Documentation**: https://cli.github.com/manual/
- **GitHub Releases**: https://github.com/cli/cli/releases
- **Troubleshooting**: https://docs.github.com/en/github-cli/github-cli/troubleshooting
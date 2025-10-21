#!/bin/bash

# =============================================================================
# Production GitHub Issues Creator for Git Visualizer - Copilot Ready
# =============================================================================
#
# This script creates GitHub issues directly from markdown files and assigns
# them to GitHub Copilot for autonomous implementation, following best practices
# from GitHub's official documentation.
#
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated
# - GitHub Copilot Pro/Business/Enterprise plan
# - Write access to repository
# - Copilot coding agent enabled for account/org
#
# Usage:
#   ./scripts/create-copilot-issues.sh [options]
#
# =============================================================================

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly ISSUES_DIR="${PROJECT_ROOT}/github-issues"
readonly REPO_OWNER="itsnothuy"
readonly REPO_NAME="gitVisualizer"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Options
DRY_RUN=false
FORCE_CREATE=false
SKIP_COPILOT_CHECK=false

# Issue definitions with ChatGPT recommended labels
declare -A ISSUES=(
    ["01-git-repository-processor.md"]="Git Repository Processor|area:ingestion,priority:high,type:feature"
    ["02-repository-visualization-page.md"]="Repository Visualization Page|area:viz,ui,type:feature"
    ["03-enhanced-ingestion-flow.md"]="Enhanced Ingestion Flow|area:ingestion,ux,type:feature"
    ["04-advanced-performance-optimization.md"]="Advanced Performance Optimization|area:perf,type:feature"
    ["05-interactive-git-features.md"]="Interactive Git Features|area:commands,education,type:feature"
)

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" >&2
}

success() {
    echo -e "${GREEN}✓${NC} $*"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $*"
}

error() {
    echo -e "${RED}✗${NC} $*" >&2
}

info() {
    echo -e "${CYAN}ℹ${NC} $*"
}

show_help() {
    cat << 'EOF'
Production GitHub Issues Creator for Copilot

USAGE:
    ./scripts/create-copilot-issues.sh [OPTIONS]

OPTIONS:
    --dry-run, -d           Show what would be created without creating
    --force, -f             Force creation even if issues exist
    --skip-copilot-check    Skip Copilot availability validation
    --help, -h              Show this help message

FEATURES:
    ✓ Creates issues directly from markdown files using -F flag
    ✓ Assigns to @copilot immediately on creation using -a flag
    ✓ Uses production-ready labels following GitHub best practices
    ✓ Validates prerequisites and Copilot availability
    ✓ Handles existing issues gracefully
    ✓ Provides detailed progress tracking

ISSUE FILES PROCESSED:
    01-git-repository-processor.md       → area:ingestion,priority:high
    02-repository-visualization-page.md  → area:viz,ui
    03-enhanced-ingestion-flow.md        → area:ingestion,ux
    04-advanced-performance-optimization.md → area:perf
    05-interactive-git-features.md       → area:commands,education

PREREQUISITES:
    - GitHub CLI (gh) installed and authenticated
    - GitHub Copilot Pro/Business/Enterprise plan
    - Write access to repository
    - Copilot coding agent enabled for account/org
    - Repository not opted out of coding agent access

EXAMPLES:
    # Preview what would be created (safe)
    ./scripts/create-copilot-issues.sh --dry-run

    # Create all issues and assign to Copilot
    ./scripts/create-copilot-issues.sh

    # Force recreate existing issues
    ./scripts/create-copilot-issues.sh --force

EOF
}

# =============================================================================
# Validation Functions
# =============================================================================

check_github_cli() {
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) is not installed"
        info "Install it from: https://cli.github.com/"
        info "macOS: brew install gh"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        error "GitHub CLI is not authenticated"
        info "Run: gh auth login"
        exit 1
    fi
    
    success "GitHub CLI is installed and authenticated"
}

check_repository_access() {
    if ! gh repo view "${REPO_OWNER}/${REPO_NAME}" &> /dev/null; then
        error "Cannot access repository ${REPO_OWNER}/${REPO_NAME}"
        info "Make sure the repository exists and you have write access"
        exit 1
    fi
    
    success "Repository ${REPO_OWNER}/${REPO_NAME} is accessible"
}

check_copilot_availability() {
    if [[ "$SKIP_COPILOT_CHECK" == "true" ]]; then
        warning "Skipping Copilot availability check"
        return 0
    fi
    
    info "Checking GitHub Copilot availability..."
    
    # Check if we can assign to @copilot (this will work if Copilot is available)
    # We'll do a test assignment later during actual creation
    
    # Check organization/account Copilot status
    local copilot_info
    if copilot_info=$(gh api user --jq '.copilot' 2>/dev/null); then
        success "GitHub Copilot appears to be available for your account"
    else
        warning "Could not verify Copilot availability"
        info "Issues will be created but Copilot assignment may fail"
        info "Ensure you have:"
        echo "  - GitHub Copilot Pro/Business/Enterprise plan"
        echo "  - Copilot coding agent enabled for your account/org"
        echo "  - Repository not opted out of coding agent access"
    fi
}

validate_issue_files() {
    local missing_files=()
    
    for file in "${!ISSUES[@]}"; do
        local filepath="${ISSUES_DIR}/${file}"
        if [[ ! -f "$filepath" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        error "Missing issue files:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        exit 1
    fi
    
    success "All issue files found in $ISSUES_DIR"
}

# =============================================================================
# Issue Management Functions
# =============================================================================

extract_title_from_file() {
    local file="$1"
    local title
    
    # Try to extract title from first # heading, removing "Issue #N:" prefix
    title=$(grep -m 1 '^# ' "$file" | sed 's/^# *//' | sed 's/Issue #[0-9]*: *//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
    
    if [[ -z "$title" ]]; then
        error "Could not extract title from $file"
        return 1
    fi
    
    echo "$title"
}

issue_exists_by_title() {
    local title="$1"
    gh issue list \
        --repo "${REPO_OWNER}/${REPO_NAME}" \
        --search "\"${title}\" in:title" \
        --json title \
        --jq '.[] | select(.title == "'"$title"'") | .title' | grep -q "."
}

create_issue_from_file() {
    local filename="$1"
    local filepath="${ISSUES_DIR}/${filename}"
    local issue_config="${ISSUES[@]/$filename}"
    
    # Parse issue configuration
    IFS='|' read -r suggested_title labels <<< "${ISSUES[$filename]}"
    
    # Extract actual title from file (more reliable)
    local actual_title
    if ! actual_title=$(extract_title_from_file "$filepath"); then
        error "Failed to extract title from $filename"
        return 1
    fi
    
    # Use extracted title, fallback to suggested
    local title="${actual_title:-$suggested_title}"
    
    info "Processing: $filename"
    info "Title: $title"
    info "Labels: $labels"
    
    # Check if issue already exists
    if issue_exists_by_title "$title" && [[ "$FORCE_CREATE" != "true" ]]; then
        warning "Issue already exists: $title"
        info "Use --force to recreate existing issues"
        return 0
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${PURPLE}[DRY RUN]${NC} Would create issue:"
        echo "  File: $filename"
        echo "  Title: $title"
        echo "  Labels: $labels"
        echo "  Assignee: @copilot"
        echo "  Body: From file $filepath"
        echo
        return 0
    fi
    
    # Create the issue using ChatGPT's recommended approach
    info "Creating issue with GitHub CLI..."
    
    local issue_url
    if issue_url=$(gh issue create \
        --repo "${REPO_OWNER}/${REPO_NAME}" \
        --title "$title" \
        --body-file "$filepath" \
        --label "$labels" \
        --assignee "@copilot" 2>&1); then
        
        success "✅ Created and assigned to Copilot: $title"
        echo "  📋 URL: $issue_url"
        echo "  🏷️  Labels: $labels"
        echo "  🤖 Assignee: @copilot"
        echo
        
        return 0
    else
        error "❌ Failed to create issue: $title"
        echo "  Error details: $issue_url"
        
        # Try to create without Copilot assignment if that fails
        warning "Retrying without Copilot assignment..."
        
        if issue_url=$(gh issue create \
            --repo "${REPO_OWNER}/${REPO_NAME}" \
            --title "$title" \
            --body-file "$filepath" \
            --label "$labels" 2>&1); then
            
            success "✅ Created issue (without Copilot): $title"
            echo "  📋 URL: $issue_url"
            warning "  ⚠️  Copilot assignment failed - you may need to assign manually"
            echo
            
            # Try to assign Copilot after creation
            local issue_number
            issue_number=$(echo "$issue_url" | grep -o '[0-9]\+$')
            
            if [[ -n "$issue_number" ]]; then
                info "Attempting to assign Copilot to issue #$issue_number..."
                if gh issue edit "$issue_number" \
                    --repo "${REPO_OWNER}/${REPO_NAME}" \
                    --add-assignee "@copilot" 2>/dev/null; then
                    success "✅ Successfully assigned Copilot to issue #$issue_number"
                else
                    warning "⚠️  Could not assign Copilot to issue #$issue_number"
                    info "You may need to assign Copilot manually in the GitHub UI"
                fi
            fi
            
            return 0
        else
            error "❌ Complete failure creating issue: $title"
            echo "  Error details: $issue_url"
            return 1
        fi
    fi
}

# =============================================================================
# Main Processing Functions
# =============================================================================

process_all_issues() {
    local success_count=0
    local error_count=0
    local total_count=${#ISSUES[@]}
    
    log "🚀 Processing $total_count issue files for Copilot assignment..."
    echo
    
    # Process issues in dependency order (critical path first)
    local ordered_files=(
        "01-git-repository-processor.md"
        "02-repository-visualization-page.md" 
        "03-enhanced-ingestion-flow.md"
        "04-advanced-performance-optimization.md"
        "05-interactive-git-features.md"
    )
    
    for file in "${ordered_files[@]}"; do
        if [[ -n "${ISSUES[$file]:-}" ]]; then
            if create_issue_from_file "$file"; then
                ((success_count++))
            else
                ((error_count++))
            fi
            
            # Small delay between creates to avoid rate limiting
            [[ "$DRY_RUN" != "true" ]] && sleep 1
        fi
    done
    
    # Summary
    echo
    log "📊 Summary:"
    success "Successfully processed: $success_count/$total_count issues"
    
    if [[ $error_count -gt 0 ]]; then
        error "Failed to process: $error_count/$total_count issues"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "This was a dry run. Use without --dry-run to actually create issues."
    else
        success "🎉 GitHub issues creation completed!"
        echo
        info "Next steps:"
        echo "1. 👀 Visit: https://github.com/${REPO_OWNER}/${REPO_NAME}/issues"
        echo "2. 🤖 Copilot will start working on assigned issues automatically"
        echo "3. 📋 Watch for PRs from copilot/* branches"
        echo "4. 🔍 Review and approve Copilot's work when ready"
        echo
        info "💡 Pro tips for Copilot success:"
        echo "• Ensure CI passes locally: pnpm lint && pnpm test && pnpm build"
        echo "• Keep .github/instructions/*.md files up to date"
        echo "• Review PR templates and contributing guidelines"
        echo "• Monitor Actions tab for Copilot's progress"
    fi
    
    return $error_count
}

# =============================================================================
# Argument Parsing
# =============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run|-d)
                DRY_RUN=true
                shift
                ;;
            --force|-f)
                FORCE_CREATE=true
                shift
                ;;
            --skip-copilot-check)
                SKIP_COPILOT_CHECK=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# =============================================================================
# Main Function
# =============================================================================

main() {
    log "🤖 GitHub Issues Creator for Copilot - Git Visualizer"
    log "Repository: ${REPO_OWNER}/${REPO_NAME}"
    echo
    
    # Parse arguments
    parse_arguments "$@"
    
    # Show configuration
    info "Configuration:"
    echo "  Dry Run: $DRY_RUN"
    echo "  Force Create: $FORCE_CREATE"
    echo "  Skip Copilot Check: $SKIP_COPILOT_CHECK"
    echo "  Issues Directory: $ISSUES_DIR"
    echo
    
    # Validate all prerequisites
    check_github_cli
    check_repository_access
    validate_issue_files
    check_copilot_availability
    
    echo
    
    # Process all issues
    process_all_issues
    
    exit $?
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Only run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
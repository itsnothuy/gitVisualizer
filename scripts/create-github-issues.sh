#!/bin/bash

# =============================================================================
# GitHub Issues Creation Script for Git Visualizer
# =============================================================================
# 
# This script creates GitHub issues from markdown files and assigns them to
# GitHub Copilot for autonomous implementation.
#
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated
# - Repository access with issues creation permissions
# - Copilot available in the organization/repository
#
# Usage:
#   ./scripts/create-github-issues.sh [options]
#
# Options:
#   --dry-run, -d    Show what would be created without actually creating
#   --force, -f      Force creation even if issues already exist
#   --help, -h       Show this help message
#   --assignee USER  Assign to specific user (default: @copilot)
#   --label LABEL    Add custom labels (can be used multiple times)
#   --milestone NUM  Add to milestone number
#   --project NUM    Add to project number
#
# =============================================================================

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly ISSUES_DIR="${PROJECT_ROOT}/github-issues"
readonly REPO_OWNER="itsnothuy"
readonly REPO_NAME="gitVisualizer"
readonly DEFAULT_ASSIGNEE="@copilot"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Default options
DRY_RUN=false
FORCE_CREATE=false
ASSIGNEE="$DEFAULT_ASSIGNEE"
CUSTOM_LABELS=()
MILESTONE=""
PROJECT=""

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" >&2
}

success() {
    echo -e "${GREEN}✓${NC} $*" >&2
}

warning() {
    echo -e "${YELLOW}⚠${NC} $*" >&2
}

error() {
    echo -e "${RED}✗${NC} $*" >&2
}

info() {
    echo -e "${CYAN}ℹ${NC} $*" >&2
}

show_help() {
    cat << 'EOF'
GitHub Issues Creation Script

USAGE:
    ./scripts/create-github-issues.sh [OPTIONS]

OPTIONS:
    --dry-run, -d           Show what would be created without creating
    --force, -f             Force creation even if issues exist
    --help, -h              Show this help message
    --assignee USER         Assign to specific user (default: @copilot)
    --label LABEL           Add custom label (can be used multiple times)
    --milestone NUMBER      Add to milestone number
    --project NUMBER        Add to project number

EXAMPLES:
    # Dry run to see what would be created
    ./scripts/create-github-issues.sh --dry-run
    
    # Create issues and assign to GitHub Copilot
    ./scripts/create-github-issues.sh
    
    # Create with custom assignee and labels
    ./scripts/create-github-issues.sh --assignee @username --label "priority:high" --label "epic:core"
    
    # Force recreation of existing issues
    ./scripts/create-github-issues.sh --force

ISSUE FILES:
    The script looks for markdown files in github-issues/ directory:
    - 01-git-repository-processor.md
    - 02-repository-visualization-page.md
    - 03-enhanced-ingestion-flow.md
    - 04-advanced-performance-optimization.md
    - 05-interactive-git-features.md

PREREQUISITES:
    - GitHub CLI (gh) installed and authenticated
    - Repository access with issues creation permissions
    - GitHub Copilot available in the organization

EOF
}

# =============================================================================
# GitHub CLI Functions
# =============================================================================

check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) is not installed"
        info "Install it from: https://cli.github.com/"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        error "GitHub CLI is not authenticated"
        info "Run: gh auth login"
        exit 1
    fi
    
    success "GitHub CLI is installed and authenticated"
}

check_repository() {
    if ! gh repo view "${REPO_OWNER}/${REPO_NAME}" &> /dev/null; then
        error "Cannot access repository ${REPO_OWNER}/${REPO_NAME}"
        info "Make sure the repository exists and you have access"
        exit 1
    fi
    
    success "Repository ${REPO_OWNER}/${REPO_NAME} is accessible"
}

issue_exists() {
    local title="$1"
    gh issue list --repo "${REPO_OWNER}/${REPO_NAME}" --search "\"${title}\"" --json title --jq '.[].title' | grep -Fxq "$title"
}

get_copilot_availability() {
    # Check if Copilot is available as an assignee
    local copilot_available=false
    
    # Try to find Copilot in the organization members or collaborators
    if gh api "repos/${REPO_OWNER}/${REPO_NAME}/collaborators" --jq '.[].login' | grep -q "copilot\|github-copilot" 2>/dev/null; then
        copilot_available=true
    fi
    
    echo "$copilot_available"
}

create_github_issue() {
    local title="$1"
    local body_file="$2"
    local labels="$3"
    local assignee="$4"
    local milestone="$5"
    local project="$6"
    
    local gh_args=(
        "issue" "create"
        "--repo" "${REPO_OWNER}/${REPO_NAME}"
        "--title" "$title"
        "--body-file" "$body_file"
    )
    
    if [[ -n "$labels" ]]; then
        gh_args+=(--label "$labels")
    fi
    
    if [[ -n "$assignee" && "$assignee" != "@copilot" ]]; then
        gh_args+=(--assignee "$assignee")
    fi
    
    if [[ -n "$milestone" ]]; then
        gh_args+=(--milestone "$milestone")
    fi
    
    if [[ -n "$project" ]]; then
        gh_args+=(--project "$project")
    fi
    
    local issue_url
    issue_url=$(gh "${gh_args[@]}")
    
    # Try to assign to Copilot after creation if requested
    if [[ "$assignee" == "@copilot" ]]; then
        local issue_number
        issue_number=$(echo "$issue_url" | grep -o '[0-9]\+$')
        
        # Attempt Copilot assignment (may fail if not available)
        if ! gh issue edit "$issue_number" --repo "${REPO_OWNER}/${REPO_NAME}" --add-assignee "copilot" 2>/dev/null; then
            warning "Could not assign to @copilot (may not be available in this repository)"
            info "Issue created: $issue_url"
        else
            success "Issue created and assigned to @copilot: $issue_url"
        fi
    else
        success "Issue created: $issue_url"
    fi
    
    echo "$issue_url"
}

# =============================================================================
# Issue Processing Functions
# =============================================================================

extract_issue_metadata() {
    local file="$1"
    local title
    local priority="medium"
    local complexity="high"
    local epic=""
    
    # Extract title from the first # heading
    title=$(grep -m 1 '^# ' "$file" | sed 's/^# //' | sed 's/Issue #[0-9]*: *//')
    
    # Extract metadata from the file content
    if grep -q "Priority.*high\|Critical.*Path\|MUST.*IMPLEMENT" "$file"; then
        priority="high"
    elif grep -q "Priority.*low\|Advanced.*Features\|Optional" "$file"; then
        priority="low"
    fi
    
    if grep -q "Bundle.*Size.*MB\|WebGL\|Canvas\|Performance" "$file"; then
        complexity="high"
        epic="performance"
    elif grep -q "Repository.*Processor\|Git.*Parsing\|Foundation" "$file"; then
        complexity="high"
        epic="core"
    elif grep -q "Visualization\|Rendering\|Layout" "$file"; then
        complexity="high"
        epic="visualization"
    elif grep -q "Interactive\|Commands\|Git.*Features" "$file"; then
        complexity="medium"
        epic="features"
    fi
    
    echo "$title|$priority|$complexity|$epic"
}

generate_issue_labels() {
    local priority="$1"
    local complexity="$2"
    local epic="$3"
    local filename="$4"
    
    local labels=("type:enhancement")
    
    # Add priority label
    labels+=("priority:$priority")
    
    # Add complexity label
    labels+=("complexity:$complexity")
    
    # Add epic label if available
    if [[ -n "$epic" ]]; then
        labels+=("epic:$epic")
    fi
    
    # Add component labels based on filename
    case "$filename" in
        *"repository-processor"*)
            labels+=("component:ingestion" "component:git")
            ;;
        *"visualization"*)
            labels+=("component:visualization" "component:rendering")
            ;;
        *"ingestion-flow"*)
            labels+=("component:ui" "component:workflow")
            ;;
        *"performance"*)
            labels+=("component:performance" "component:optimization")
            ;;
        *"git-features"*)
            labels+=("component:git" "component:interaction")
            ;;
    esac
    
    # Add custom labels
    for label in "${CUSTOM_LABELS[@]}"; do
        labels+=("$label")
    done
    
    # Join labels with comma
    IFS=','
    echo "${labels[*]}"
}

process_issue_file() {
    local file="$1"
    local filename
    filename=$(basename "$file")
    
    info "Processing $filename..."
    
    if [[ ! -f "$file" ]]; then
        warning "File not found: $file"
        return 1
    fi
    
    # Extract metadata
    local metadata
    metadata=$(extract_issue_metadata "$file")
    IFS='|' read -r title priority complexity epic <<< "$metadata"
    
    if [[ -z "$title" ]]; then
        error "Could not extract title from $filename"
        return 1
    fi
    
    info "Issue title: $title"
    info "Priority: $priority | Complexity: $complexity | Epic: $epic"
    
    # Check if issue already exists
    if issue_exists "$title" && [[ "$FORCE_CREATE" != "true" ]]; then
        warning "Issue already exists: $title"
        info "Use --force to recreate existing issues"
        return 0
    fi
    
    # Generate labels
    local labels
    labels=$(generate_issue_labels "$priority" "$complexity" "$epic" "$filename")
    info "Labels: $labels"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${PURPLE}[DRY RUN]${NC} Would create issue:"
        echo "  Title: $title"
        echo "  File: $filename"
        echo "  Labels: $labels"
        echo "  Assignee: $ASSIGNEE"
        if [[ -n "$MILESTONE" ]]; then
            echo "  Milestone: $MILESTONE"
        fi
        if [[ -n "$PROJECT" ]]; then
            echo "  Project: $PROJECT"
        fi
        echo
        return 0
    fi
    
    # Create the issue
    local issue_url
    if issue_url=$(create_github_issue "$title" "$file" "$labels" "$ASSIGNEE" "$MILESTONE" "$PROJECT"); then
        success "Created issue: $title"
        echo "  URL: $issue_url"
        echo
        return 0
    else
        error "Failed to create issue: $title"
        return 1
    fi
}

# =============================================================================
# Main Script Logic
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
            --help|-h)
                show_help
                exit 0
                ;;
            --assignee)
                ASSIGNEE="$2"
                shift 2
                ;;
            --label)
                CUSTOM_LABELS+=("$2")
                shift 2
                ;;
            --milestone)
                MILESTONE="$2"
                shift 2
                ;;
            --project)
                PROJECT="$2"
                shift 2
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

validate_issues_directory() {
    if [[ ! -d "$ISSUES_DIR" ]]; then
        error "Issues directory not found: $ISSUES_DIR"
        exit 1
    fi
    
    local issue_files=(
        "01-git-repository-processor.md"
        "02-repository-visualization-page.md"
        "03-enhanced-ingestion-flow.md"
        "04-advanced-performance-optimization.md"
        "05-interactive-git-features.md"
    )
    
    local missing_files=()
    for file in "${issue_files[@]}"; do
        if [[ ! -f "$ISSUES_DIR/$file" ]]; then
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

main() {
    log "Starting GitHub Issues Creation Script"
    log "Repository: ${REPO_OWNER}/${REPO_NAME}"
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Show configuration
    info "Configuration:"
    echo "  Dry Run: $DRY_RUN"
    echo "  Force Create: $FORCE_CREATE"
    echo "  Assignee: $ASSIGNEE"
    echo "  Custom Labels: ${CUSTOM_LABELS[*]:-none}"
    echo "  Milestone: ${MILESTONE:-none}"
    echo "  Project: ${PROJECT:-none}"
    echo
    
    # Validate prerequisites
    check_gh_cli
    check_repository
    validate_issues_directory
    
    # Check Copilot availability
    if [[ "$ASSIGNEE" == "@copilot" ]]; then
        info "Checking GitHub Copilot availability..."
        if [[ "$(get_copilot_availability)" == "true" ]]; then
            success "GitHub Copilot appears to be available"
        else
            warning "GitHub Copilot may not be available in this repository"
            info "Issues will be created but Copilot assignment may fail"
        fi
    fi
    
    # Process each issue file
    local success_count=0
    local error_count=0
    
    local issue_files=(
        "$ISSUES_DIR/01-git-repository-processor.md"
        "$ISSUES_DIR/02-repository-visualization-page.md"
        "$ISSUES_DIR/03-enhanced-ingestion-flow.md"
        "$ISSUES_DIR/04-advanced-performance-optimization.md"
        "$ISSUES_DIR/05-interactive-git-features.md"
    )
    
    log "Processing ${#issue_files[@]} issue files..."
    echo
    
    for file in "${issue_files[@]}"; do
        if process_issue_file "$file"; then
            ((success_count++))
        else
            ((error_count++))
        fi
    done
    
    # Summary
    echo
    log "Summary:"
    success "Successfully processed: $success_count issues"
    if [[ $error_count -gt 0 ]]; then
        error "Failed to process: $error_count issues"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "This was a dry run. Use without --dry-run to actually create issues."
    else
        success "GitHub issues creation completed!"
        info "Visit: https://github.com/${REPO_OWNER}/${REPO_NAME}/issues"
    fi
    
    exit $error_count
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Only run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
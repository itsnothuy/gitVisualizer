#!/usr/bin/env bash

# =============================================================================
# Bulk GitHub Issues Creator - ChatGPT Style
# =============================================================================
#
# This is the enhanced version of the bulk helper script suggested by ChatGPT
# for creating issues directly from markdown files with proper labels and
# Copilot assignment.
#
# Based on ChatGPT's recommendation with production enhancements.
#
# Usage: ./scripts/bulk-create-issues.sh
#
# =============================================================================

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly ISSUES_DIR="${PROJECT_ROOT}/github-issues"

# Colors
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $*"
}

success() {
    echo -e "${GREEN}✓${NC} $*"
}

error() {
    echo -e "${RED}✗${NC} $*"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $*"
}

main() {
    log "🚀 Bulk GitHub Issues Creator (ChatGPT Style)"
    
    # Change to issues directory
    cd "$ISSUES_DIR" || {
        error "Cannot find issues directory: $ISSUES_DIR"
        exit 1
    }
    
    # Check for issue files
    local issue_files=(0*-*.md)
    if [[ ! -f "${issue_files[0]}" ]]; then
        error "No issue files found matching pattern 0*-*.md"
        exit 1
    fi
    
    log "Found ${#issue_files[@]} issue files to process"
    echo
    
    local success_count=0
    local error_count=0
    
    # Process each markdown file following ChatGPT's approach
    for f in 0*-*.md; do
        log "Processing: $f"
        
        # Extract title from first # line (ChatGPT's method)
        local title
        title=$(head -n1 "$f" | sed 's/^# *//')
        
        if [[ -z "$title" ]]; then
            error "Could not extract title from $f"
            ((error_count++))
            continue
        fi
        
        # Remove "Issue #N:" prefix if present
        title=$(echo "$title" | sed 's/Issue #[0-9]*: *//')
        
        # Determine labels based on filename (ChatGPT's approach with enhancements)
        local labels
        case "$f" in
            *repository-processor*)
                labels="area:ingestion,priority:high,type:feature,epic:core"
                ;;
            *visualization-page*)
                labels="area:viz,ui,type:feature,epic:core"
                ;;
            *ingestion-flow*)
                labels="area:ingestion,ux,type:feature,epic:workflow"
                ;;
            *performance*)
                labels="area:perf,type:feature,epic:performance"
                ;;
            *interactive-git*)
                labels="area:commands,education,type:feature,epic:features"
                ;;
            *)
                labels="triage,type:feature"
                ;;
        esac
        
        echo "  📝 Title: $title"
        echo "  🏷️  Labels: $labels"
        echo "  🤖 Assignee: @copilot"
        
        # Create issue using ChatGPT's exact command structure
        if gh issue create \
            --title "$title" \
            --body-file "$f" \
            --label "$labels" \
            --assignee "@copilot"; then
            
            success "Created issue: $title"
            ((success_count++))
        else
            error "Failed to create issue: $title"
            ((error_count++))
            
            # Try without Copilot assignment as fallback
            warning "Retrying without Copilot assignment..."
            if gh issue create \
                --title "$title" \
                --body-file "$f" \
                --label "$labels"; then
                
                warning "Created without Copilot (assign manually): $title"
                ((success_count++))
            else
                error "Complete failure for: $title"
            fi
        fi
        
        echo
        
        # Rate limiting protection
        sleep 1
    done
    
    # Summary
    echo
    log "📊 Bulk creation summary:"
    success "Successfully created: $success_count issues"
    if [[ $error_count -gt 0 ]]; then
        error "Failed to create: $error_count issues"
    fi
    
    if [[ $success_count -gt 0 ]]; then
        echo
        log "🎉 Issues created! What happens next:"
        echo "1. 🤖 GitHub Copilot will start working on assigned issues"
        echo "2. 📋 Watch for PRs from copilot/* branches"
        echo "3. ⚡ Check Actions tab for Copilot's progress"
        echo "4. 👀 Review PRs when Copilot opens them"
        echo "5. 💬 Leave feedback and iterate with Copilot"
        echo
        log "🔗 View issues: https://github.com/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/issues"
    fi
    
    exit $error_count
}

# Validate prerequisites
if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) not found. Install with: brew install gh"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    error "GitHub CLI not authenticated. Run: gh auth login"
    exit 1
fi

# Run main function
main "$@"
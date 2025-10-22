#!/bin/bash

# =============================================================================
# Enhanced GitHub CLI Commands for Copilot - Based on ChatGPT + Improvements
# =============================================================================
#
# This script contains the enhanced version of ChatGPT's commands with
# production improvements for better Copilot understanding and project management.
#
# Usage: ./create-enhanced-copilot-issues.sh
#
# =============================================================================

set -euo pipefail

# Colors
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# Configuration
readonly REPO="itsnothuy/gitVisualizer"
readonly MILESTONE_CORE="1"      # Core features milestone
readonly MILESTONE_ADVANCED="2"  # Advanced features milestone  
readonly PROJECT="1"             # GitHub Project number

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

info() {
    echo -e "${CYAN}ℹ${NC} $*"
}

# Check prerequisites
check_prerequisites() {
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI not found. Install with: brew install gh"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        error "GitHub CLI not authenticated. Run: gh auth login"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create enhanced issue
create_enhanced_issue() {
    local number="$1"
    local title="$2"
    local file="$3"
    local labels="$4"
    local milestone="$5"
    local description="$6"
    
    log "Creating Issue #$number: $title"
    info "$description"
    
    local issue_url
    if issue_url=$(gh issue create \
        --repo "$REPO" \
        --title "$title" \
        --body-file "$file" \
        --label "$labels" \
        --assignee "@copilot" \
        --milestone "$milestone" \
        --project "$PROJECT" 2>&1); then
        
        success "✅ Created: $title"
        echo "   🔗 URL: $issue_url"
        echo "   🏷️  Labels: $labels"
        echo "   📅 Milestone: $milestone"
        echo "   🤖 Assigned to: @copilot"
        echo
        return 0
    else
        error "❌ Failed to create: $title"
        echo "   Error: $issue_url"
        
        # Try without milestone/project as fallback
        warning "Retrying with basic options..."
        if issue_url=$(gh issue create \
            --repo "$REPO" \
            --title "$title" \
            --body-file "$file" \
            --label "$labels" \
            --assignee "@copilot" 2>&1); then
            
            warning "⚠️  Created with basic options: $title"
            echo "   🔗 URL: $issue_url"
            return 0
        else
            error "❌ Complete failure: $title"
            return 1
        fi
    fi
}

main() {
    echo -e "${BLUE}🚀 Enhanced GitHub Issues Creator for Copilot${NC}"
    echo -e "${CYAN}Based on ChatGPT's recommendations + production improvements${NC}"
    echo
    
    check_prerequisites
    
    log "Creating 5 comprehensive issues for Git Visualizer..."
    echo
    
    local success_count=0
    local error_count=0
    
    # # Issue #1: Git Repository Processor (Critical Path)
    # if create_enhanced_issue \
    #     "1" \
    #     "Git Repository Processor" \
    #     "github-issues/01-git-repository-processor.md" \
    #     "area:ingestion,priority:high,type:feature,epic:core,status:ready,complexity:high" \
    #     "$MILESTONE_CORE" \
    #     "Foundation for all Git operations - must implement first"; then
    #     ((success_count++))
    # else
    #     ((error_count++))
    # fi
    
    # sleep 2  # Rate limiting
    
    # # Issue #2: Repository Visualization Page (Depends on #1)
    # if create_enhanced_issue \
    #     "2" \
    #     "Repository Visualization Page" \
    #     "github-issues/02-repository-visualization-page.md" \
    #     "area:viz,area:ui,priority:high,type:feature,epic:core,status:ready,complexity:high" \
    #     "$MILESTONE_CORE" \
    #     "Core user interface - depends on Issue #1"; then
    #     ((success_count++))
    # else
    #     ((error_count++))
    # fi
    
    # sleep 2  # Rate limiting
    
    # # Issue #3: Enhanced Ingestion Flow (Depends on #1, #2)
    # if create_enhanced_issue \
    #     "3" \
    #     "Enhanced Ingestion Flow" \
    #     "github-issues/03-enhanced-ingestion-flow.md" \
    #     "area:ingestion,area:ux,priority:medium,type:feature,epic:workflow,status:ready,complexity:medium" \
    #     "$MILESTONE_CORE" \
    #     "Complete user workflow - depends on Issues #1 and #2"; then
    #     ((success_count++))
    # else
    #     ((error_count++))
    # fi
    
    # sleep 2  # Rate limiting
    
    # # Issue #4: Advanced Performance Optimization (Advanced Feature)
    # if create_enhanced_issue \
    #     "4" \
    #     "Advanced Performance Optimization" \
    #     "github-issues/04-advanced-performance-optimization.md" \
    #     "area:perf,area:rendering,priority:low,type:feature,epic:performance,status:ready,complexity:high" \
    #     "$MILESTONE_ADVANCED" \
    #     "Advanced feature - implement after core is working"; then
    #     ((success_count++))
    # else
    #     ((error_count++))
    # fi
    
    # sleep 2  # Rate limiting
    
    # Issue #5: Interactive Git Features (Advanced Feature)
    if create_enhanced_issue \
        "5" \
        "Interactive Git Features" \
        "github-issues/05-interactive-git-features.md" \
        "area:commands,area:interaction,priority:low,type:feature,epic:features,status:ready,complexity:medium" \
        "$MILESTONE_ADVANCED" \
        "Advanced feature - implement after core is working"; then
        ((success_count++))
    else
        ((error_count++))
    fi
    
    # Summary
    echo
    log "📊 Creation Summary:"
    success "Successfully created: $success_count/5 issues"
    if [[ $error_count -gt 0 ]]; then
        error "Failed to create: $error_count/5 issues"
    fi
    
    if [[ $success_count -gt 0 ]]; then
        echo
        log "🎉 Issues created with enhanced configuration!"
        echo
        info "🚀 What's enhanced vs ChatGPT's version:"
        echo "  ✅ Explicit repository specification"
        echo "  ✅ Comprehensive labeling (6-7 labels vs 2-3)"
        echo "  ✅ Milestone organization (Core vs Advanced)"
        echo "  ✅ GitHub Projects integration"
        echo "  ✅ Implementation dependency tracking"
        echo "  ✅ Status and complexity indicators"
        echo
        info "🤖 Next steps:"
        echo "  1. Visit: https://github.com/$REPO/issues"
        echo "  2. Watch GitHub Actions for Copilot activity"
        echo "  3. Review PRs from copilot/* branches"
        echo "  4. Monitor milestone progress"
        echo
        info "🎯 Implementation order:"
        echo "  📍 Milestone 1 (Core): Issues #1-3 (critical path)"
        echo "  📍 Milestone 2 (Advanced): Issues #4-5 (after core)"
        echo
        success "🎉 Copilot will start working on these issues automatically!"
    fi
    
    exit $error_count
}

# Show help if requested
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    cat << 'EOF'
Enhanced GitHub Issues Creator for Copilot

This script creates 5 comprehensive GitHub issues using an enhanced version
of ChatGPT's recommended commands, with improvements for better Copilot
understanding and project management.

ENHANCEMENTS OVER CHATGPT'S VERSION:
  ✅ Explicit repository specification
  ✅ Comprehensive labeling strategy  
  ✅ Milestone organization (Core vs Advanced)
  ✅ GitHub Projects integration
  ✅ Implementation dependency tracking
  ✅ Status and complexity indicators
  ✅ Error handling and fallbacks
  ✅ Rate limiting protection

USAGE:
  ./create-enhanced-copilot-issues.sh

PREREQUISITES:
  - GitHub CLI installed and authenticated
  - GitHub Copilot Pro/Business/Enterprise plan
  - Write access to itsnothuy/gitVisualizer repository

CREATED ISSUES:
  #1: Git Repository Processor (Core, High Priority)
  #2: Repository Visualization Page (Core, High Priority)  
  #3: Enhanced Ingestion Flow (Core, Medium Priority)
  #4: Advanced Performance Optimization (Advanced, Low Priority)
  #5: Interactive Git Features (Advanced, Low Priority)

EOF
    exit 0
fi

# Run main function
main "$@"
#!/bin/bash

# =============================================================================
# GitHub Labels Setup for Git Visualizer Project
# =============================================================================
#
# This script creates all the custom labels needed for the enhanced GitHub
# issues system. Run this BEFORE running create-enhanced-copilot-issues.sh
#
# Usage: ./setup-github-labels.sh
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

# Create a label if it doesn't exist
create_label() {
    local name="$1"
    local color="$2"
    local description="$3"
    
    if gh label list --repo "$REPO" --limit 100 | grep -q "^$name"; then
        info "Label '$name' already exists"
        return 0
    fi
    
    if gh label create "$name" --color "$color" --description "$description" --repo "$REPO" 2>/dev/null; then
        success "Created label: $name"
        return 0
    else
        error "Failed to create label: $name"
        return 1
    fi
}

main() {
    echo -e "${BLUE}🏷️  GitHub Labels Setup for Git Visualizer${NC}"
    echo -e "${CYAN}Creating custom labels for enhanced issue management${NC}"
    echo
    
    check_prerequisites
    
    log "Creating labels for repository: $REPO"
    echo
    
    local success_count=0
    local error_count=0
    
    # Area Labels (Blue spectrum)
    info "Creating Area labels..."
    create_label "area:ingestion" "0366d6" "Repository ingestion and Git processing" && ((success_count++)) || ((error_count++))
    create_label "area:viz" "1f77b4" "Visualization and rendering components" && ((success_count++)) || ((error_count++))
    create_label "area:ui" "5bc0de" "User interface and components" && ((success_count++)) || ((error_count++))
    create_label "area:ux" "87ceeb" "User experience and interaction design" && ((success_count++)) || ((error_count++))
    create_label "area:perf" "2e86ab" "Performance optimization and monitoring" && ((success_count++)) || ((error_count++))
    create_label "area:rendering" "4a90e2" "Rendering engine and graphics" && ((success_count++)) || ((error_count++))
    create_label "area:commands" "3498db" "Git command system and operations" && ((success_count++)) || ((error_count++))
    create_label "area:interaction" "74b9ff" "Interactive features and user input" && ((success_count++)) || ((error_count++))
    echo
    
    # Priority Labels (Traffic light colors)
    info "Creating Priority labels..."
    create_label "priority:high" "d73a49" "High priority - implement first" && ((success_count++)) || ((error_count++))
    create_label "priority:medium" "fbca04" "Medium priority - implement after high" && ((success_count++)) || ((error_count++))
    create_label "priority:low" "28a745" "Low priority - implement when time allows" && ((success_count++)) || ((error_count++))
    echo
    
    # Type Labels (Purple spectrum)
    info "Creating Type labels..."
    create_label "type:feature" "8b5cf6" "New feature implementation" && ((success_count++)) || ((error_count++))
    create_label "type:enhancement" "a855f7" "Enhancement to existing feature" && ((success_count++)) || ((error_count++))
    create_label "type:bugfix" "c084fc" "Bug fix or correction" && ((success_count++)) || ((error_count++))
    create_label "type:refactor" "d8b4fe" "Code refactoring and cleanup" && ((success_count++)) || ((error_count++))
    echo
    
    # Epic Labels (Orange spectrum)
    info "Creating Epic labels..."
    create_label "epic:core" "f97316" "Core functionality epic" && ((success_count++)) || ((error_count++))
    create_label "epic:workflow" "fb923c" "User workflow epic" && ((success_count++)) || ((error_count++))
    create_label "epic:performance" "fdba74" "Performance optimization epic" && ((success_count++)) || ((error_count++))
    create_label "epic:features" "fed7aa" "Advanced features epic" && ((success_count++)) || ((error_count++))
    echo
    
    # Status Labels (Green spectrum)
    info "Creating Status labels..."
    create_label "status:ready" "22c55e" "Ready for implementation" && ((success_count++)) || ((error_count++))
    create_label "status:in-progress" "65a30d" "Currently being worked on" && ((success_count++)) || ((error_count++))
    create_label "status:blocked" "dc2626" "Blocked by dependencies" && ((success_count++)) || ((error_count++))
    create_label "status:review" "16a34a" "Under review" && ((success_count++)) || ((error_count++))
    echo
    
    # Complexity Labels (Gray spectrum)
    info "Creating Complexity labels..."
    create_label "complexity:low" "9ca3af" "Low complexity - quick implementation" && ((success_count++)) || ((error_count++))
    create_label "complexity:medium" "6b7280" "Medium complexity - moderate effort" && ((success_count++)) || ((error_count++))
    create_label "complexity:high" "374151" "High complexity - significant effort" && ((success_count++)) || ((error_count++))
    echo
    
    # Copilot-specific Labels
    info "Creating Copilot-specific labels..."
    create_label "copilot:assigned" "7c3aed" "Assigned to GitHub Copilot" && ((success_count++)) || ((error_count++))
    create_label "copilot:ready" "a855f7" "Ready for Copilot assignment" && ((success_count++)) || ((error_count++))
    echo
    
    # Summary
    log "📊 Label Creation Summary:"
    success "Successfully created: $success_count labels"
    if [[ $error_count -gt 0 ]]; then
        error "Failed to create: $error_count labels"
    fi
    
    if [[ $success_count -gt 20 ]]; then
        echo
        log "🎉 Labels setup complete!"
        echo
        info "✅ Created comprehensive labeling system:"
        echo "  🏷️  8 Area labels (blue spectrum)"
        echo "  🚦 3 Priority labels (traffic light colors)"
        echo "  📋 4 Type labels (purple spectrum)"
        echo "  📚 4 Epic labels (orange spectrum)"
        echo "  ⏳ 4 Status labels (green spectrum)"
        echo "  🧩 3 Complexity labels (gray spectrum)"
        echo "  🤖 2 Copilot labels (purple spectrum)"
        echo
        info "🚀 Next step:"
        echo "  Run: ./create-enhanced-copilot-issues.sh"
        echo
        success "Your repository is now ready for enhanced issue management!"
    else
        warning "Some labels failed to create. Check the errors above and retry if needed."
    fi
    
    exit $error_count
}

# Show help if requested
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    cat << 'EOF'
GitHub Labels Setup for Git Visualizer

This script creates all the custom labels needed for the enhanced GitHub
issues system with comprehensive labeling strategy.

LABELS CREATED:
  Area Labels (8):     area:ingestion, area:viz, area:ui, area:ux, 
                       area:perf, area:rendering, area:commands, area:interaction
  Priority Labels (3): priority:high, priority:medium, priority:low
  Type Labels (4):     type:feature, type:enhancement, type:bugfix, type:refactor
  Epic Labels (4):     epic:core, epic:workflow, epic:performance, epic:features
  Status Labels (4):   status:ready, status:in-progress, status:blocked, status:review
  Complexity (3):      complexity:low, complexity:medium, complexity:high
  Copilot Labels (2):  copilot:assigned, copilot:ready

USAGE:
  ./setup-github-labels.sh

PREREQUISITES:
  - GitHub CLI installed and authenticated
  - Write access to itsnothuy/gitVisualizer repository

AFTER RUNNING:
  Run ./create-enhanced-copilot-issues.sh to create issues with these labels

EOF
    exit 0
fi

# Run main function
main "$@"
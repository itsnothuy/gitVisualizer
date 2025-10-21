#!/bin/bash

# =============================================================================
# Quick GitHub Issues CLI - Git Visualizer
# =============================================================================
#
# Simple wrapper script for quick issue management
#
# Usage:
#   ./gh-issues.sh [command]
#
# Commands:
#   create      Create all issues and assign to Copilot
#   preview     Preview what issues would be created
#   list        List all issues
#   status      Show implementation status
#   assign      Assign issues to Copilot
#   monitor     Monitor issue progress
#   help        Show detailed help
#
# =============================================================================

set -euo pipefail

# Colors
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_help() {
    cat << 'EOF'
Quick GitHub Issues CLI - Git Visualizer

USAGE:
    ./gh-issues.sh [COMMAND]

COMMANDS:
    create      Create all GitHub issues and assign to Copilot (recommended)
    copilot     Create issues optimized for Copilot with ChatGPT's approach
    bulk        Bulk create using ChatGPT's simple helper script
    preview     Preview what issues would be created (safe)
    list        List all project issues
    status      Show detailed implementation status dashboard
    assign      Assign core issues to GitHub Copilot
    monitor     Monitor issue progress in real-time
    help        Show this help message

EXAMPLES:
    # Safe preview of what would be created
    ./gh-issues.sh preview

    # Create all issues optimized for Copilot (RECOMMENDED)
    ./gh-issues.sh copilot

    # Create issues using ChatGPT's bulk approach
    ./gh-issues.sh bulk

    # Standard creation with full management
    ./gh-issues.sh create

    # Check current status
    ./gh-issues.sh status

    # Monitor progress
    ./gh-issues.sh monitor

COPILOT INTEGRATION:
    The 'copilot' and 'bulk' commands follow GitHub's official recommendations
    for assigning issues directly to @copilot using -a flag and -F for file
    content, exactly as suggested by ChatGPT and GitHub documentation.

FULL FEATURES:
    For advanced issue management, use:
    - make -f Makefile.issues help
    - ./scripts/create-copilot-issues.sh --help
    - ./scripts/create-github-issues.sh --help
    - ./scripts/manage-github-issues.sh --help

EOF
}

main() {
    local command="${1:-help}"
    
    case "$command" in
        create)
            echo -e "${BLUE}🚀 Creating GitHub issues and assigning to Copilot...${NC}"
            make -f Makefile.issues create-issues
            ;;
        copilot)
            echo -e "${BLUE}🤖 Creating GitHub issues optimized for Copilot (RECOMMENDED)...${NC}"
            ./scripts/create-copilot-issues.sh
            ;;
        bulk)
            echo -e "${BLUE}⚡ Bulk creating issues using ChatGPT's approach...${NC}"
            ./scripts/bulk-create-issues.sh
            ;;
        preview)
            echo -e "${CYAN}👀 Previewing GitHub issues creation...${NC}"
            echo -e "${CYAN}Using Copilot-optimized preview...${NC}"
            ./scripts/create-copilot-issues.sh --dry-run
            ;;
        list)
            echo -e "${BLUE}📋 Listing all project issues...${NC}"
            make -f Makefile.issues list-issues
            ;;
        status)
            echo -e "${BLUE}📊 Git Visualizer Implementation Status...${NC}"
            make -f Makefile.issues status
            ;;
        assign)
            echo -e "${BLUE}👤 Assigning core issues to GitHub Copilot...${NC}"
            make -f Makefile.issues assign-copilot
            ;;
        monitor)
            echo -e "${BLUE}📈 Starting issue monitoring...${NC}"
            make -f Makefile.issues monitor
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${YELLOW}Unknown command: $command${NC}"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Check prerequisites quickly
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠ GitHub CLI not found. Install from: https://cli.github.com/${NC}"
    exit 1
fi

if ! command -v make &> /dev/null; then
    echo -e "${YELLOW}⚠ Make not found. Please install make.${NC}"
    exit 1
fi

main "$@"
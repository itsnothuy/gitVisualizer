#!/bin/bash

# =============================================================================
# GitHub Issues Management Script for Git Visualizer
# =============================================================================
#
# This script provides management utilities for the GitHub issues created
# for the Git Visualizer project implementation.
#
# Usage:
#   ./scripts/manage-github-issues.sh [command] [options]
#
# Commands:
#   list       List all issues with their status
#   status     Show detailed status of implementation progress
#   assign     Assign issues to users or Copilot
#   update     Update issue labels, milestones, or projects
#   close      Close completed issues
#   reopen     Reopen closed issues
#   comment    Add comments to issues
#   monitor    Monitor issue progress and changes
#
# =============================================================================

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
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

# Issue tracking
readonly CORE_ISSUES=(
    "Git Repository Processor"
    "Repository Visualization Page"
    "Enhanced Repository Ingestion Flow"
)

readonly ADVANCED_ISSUES=(
    "Advanced Performance Optimization"
    "Comprehensive Interactive Git Features"
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
GitHub Issues Management Script

USAGE:
    ./scripts/manage-github-issues.sh [COMMAND] [OPTIONS]

COMMANDS:
    list                    List all project issues with status
    status                  Show detailed implementation progress
    assign USER [ISSUES]    Assign issues to user or @copilot
    update [OPTIONS]        Update issue properties
    close [ISSUES]          Close completed issues
    reopen [ISSUES]         Reopen closed issues
    comment TEXT [ISSUES]   Add comment to issues
    monitor                 Monitor issue progress continuously

LIST OPTIONS:
    --state STATE          Filter by state (open, closed, all)
    --assignee USER        Filter by assignee
    --label LABEL          Filter by label
    --milestone NUMBER     Filter by milestone
    --sort FIELD           Sort by (created, updated, comments)

UPDATE OPTIONS:
    --add-label LABEL      Add label to issues
    --remove-label LABEL   Remove label from issues
    --milestone NUMBER     Set milestone
    --project NUMBER       Add to project

EXAMPLES:
    # List all open issues
    ./scripts/manage-github-issues.sh list

    # Show implementation status
    ./scripts/manage-github-issues.sh status

    # Assign core issues to Copilot
    ./scripts/manage-github-issues.sh assign @copilot "Git Repository Processor"

    # Add priority label to performance issue
    ./scripts/manage-github-issues.sh update --add-label "priority:high" "Advanced Performance"

    # Monitor progress in real-time
    ./scripts/manage-github-issues.sh monitor

EOF
}

# =============================================================================
# GitHub API Functions
# =============================================================================

check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) is not installed"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        error "GitHub CLI is not authenticated"
        exit 1
    fi
}

get_issues() {
    local state="${1:-open}"
    local assignee="${2:-}"
    local label="${3:-}"
    local milestone="${4:-}"
    local sort="${5:-created}"
    
    local search_query=""
    
    # Build search query
    if [[ -n "$assignee" ]]; then
        search_query+=" assignee:$assignee"
    fi
    
    if [[ -n "$label" ]]; then
        search_query+=" label:\"$label\""
    fi
    
    if [[ -n "$milestone" ]]; then
        search_query+=" milestone:$milestone"
    fi
    
    gh issue list \
        --repo "${REPO_OWNER}/${REPO_NAME}" \
        --state "$state" \
        --search "$search_query" \
        --json number,title,state,assignees,labels,milestone,updatedAt,comments \
        --jq '.[] | {
            number: .number,
            title: .title,
            state: .state,
            assignees: [.assignees[].login] | join(","),
            labels: [.labels[].name] | join(","),
            milestone: .milestone.title // "none",
            updated: .updatedAt,
            comments: .comments
        }'
}

get_issue_by_title() {
    local title="$1"
    gh issue list \
        --repo "${REPO_OWNER}/${REPO_NAME}" \
        --search "\"$title\"" \
        --json number,title,state \
        --jq '.[] | select(.title | contains("'"$title"'")) | .number' \
        | head -1
}

assign_issue() {
    local issue_number="$1"
    local assignee="$2"
    
    if [[ "$assignee" == "@copilot" ]]; then
        assignee="copilot"
    fi
    
    gh issue edit "$issue_number" \
        --repo "${REPO_OWNER}/${REPO_NAME}" \
        --add-assignee "$assignee"
}

update_issue_labels() {
    local issue_number="$1"
    local action="$2"  # add or remove
    local label="$3"
    
    case "$action" in
        add)
            gh issue edit "$issue_number" \
                --repo "${REPO_OWNER}/${REPO_NAME}" \
                --add-label "$label"
            ;;
        remove)
            gh issue edit "$issue_number" \
                --repo "${REPO_OWNER}/${REPO_NAME}" \
                --remove-label "$label"
            ;;
    esac
}

close_issue() {
    local issue_number="$1"
    local reason="${2:-completed}"
    
    gh issue close "$issue_number" \
        --repo "${REPO_OWNER}/${REPO_NAME}" \
        --reason "$reason"
}

reopen_issue() {
    local issue_number="$1"
    
    gh issue reopen "$issue_number" \
        --repo "${REPO_OWNER}/${REPO_NAME}"
}

add_issue_comment() {
    local issue_number="$1"
    local comment="$2"
    
    gh issue comment "$issue_number" \
        --repo "${REPO_OWNER}/${REPO_NAME}" \
        --body "$comment"
}

# =============================================================================
# Display Functions
# =============================================================================

format_issue_row() {
    local issue_json="$1"
    local number title state assignees labels milestone
    
    number=$(echo "$issue_json" | jq -r '.number')
    title=$(echo "$issue_json" | jq -r '.title' | cut -c1-50)
    state=$(echo "$issue_json" | jq -r '.state')
    assignees=$(echo "$issue_json" | jq -r '.assignees')
    labels=$(echo "$issue_json" | jq -r '.labels')
    milestone=$(echo "$issue_json" | jq -r '.milestone')
    
    # Color code state
    local state_color
    case "$state" in
        open) state_color="${GREEN}$state${NC}" ;;
        closed) state_color="${RED}$state${NC}" ;;
        *) state_color="$state" ;;
    esac
    
    # Truncate long fields
    [[ ${#assignees} -gt 15 ]] && assignees="${assignees:0:12}..."
    [[ ${#labels} -gt 25 ]] && labels="${labels:0:22}..."
    [[ ${#milestone} -gt 15 ]] && milestone="${milestone:0:12}..."
    
    printf "%-4s %-52s %-8s %-17s %-27s %-15s\n" \
        "#$number" "$title" "$state_color" "$assignees" "$labels" "$milestone"
}

display_issues_table() {
    local issues="$1"
    
    if [[ -z "$issues" ]]; then
        warning "No issues found"
        return
    fi
    
    echo
    printf "%-4s %-52s %-8s %-17s %-27s %-15s\n" \
        "NUM" "TITLE" "STATE" "ASSIGNEES" "LABELS" "MILESTONE"
    printf "%s\n" "$(printf '─%.0s' {1..125})"
    
    echo "$issues" | while IFS= read -r issue; do
        format_issue_row "$issue"
    done
    echo
}

calculate_progress() {
    local total_issues open_issues closed_issues
    
    total_issues=$(gh issue list --repo "${REPO_OWNER}/${REPO_NAME}" --state all --json number | jq '. | length')
    open_issues=$(gh issue list --repo "${REPO_OWNER}/${REPO_NAME}" --state open --json number | jq '. | length')
    closed_issues=$(gh issue list --repo "${REPO_OWNER}/${REPO_NAME}" --state closed --json number | jq '. | length')
    
    local progress_percent=0
    if [[ $total_issues -gt 0 ]]; then
        progress_percent=$((closed_issues * 100 / total_issues))
    fi
    
    echo "$total_issues|$open_issues|$closed_issues|$progress_percent"
}

display_status_dashboard() {
    local progress_info
    progress_info=$(calculate_progress)
    IFS='|' read -r total open closed percent <<< "$progress_info"
    
    echo
    echo -e "${BLUE}=== Git Visualizer Implementation Status ===${NC}"
    echo
    echo -e "📊 ${CYAN}Overall Progress:${NC} $closed/$total issues completed (${percent}%)"
    echo -e "🟢 ${GREEN}Closed:${NC} $closed issues"
    echo -e "🟡 ${YELLOW}Open:${NC} $open issues"
    echo
    
    # Core issues status
    echo -e "${PURPLE}🎯 Core Implementation (Critical Path):${NC}"
    for issue_title in "${CORE_ISSUES[@]}"; do
        local issue_data
        issue_data=$(gh issue list --repo "${REPO_OWNER}/${REPO_NAME}" --search "\"$issue_title\"" --json number,state,assignees --jq '.[0]')
        
        if [[ "$issue_data" != "null" ]]; then
            local state assignees
            state=$(echo "$issue_data" | jq -r '.state')
            assignees=$(echo "$issue_data" | jq -r '[.assignees[].login] | join(", ")')
            
            local status_icon
            case "$state" in
                open) status_icon="🟡" ;;
                closed) status_icon="✅" ;;
                *) status_icon="❓" ;;
            esac
            
            printf "  %s %-45s [%s]" "$status_icon" "$issue_title" "$state"
            [[ -n "$assignees" ]] && printf " → %s" "$assignees"
            echo
        else
            printf "  ❌ %-45s [not found]\n" "$issue_title"
        fi
    done
    
    echo
    echo -e "${CYAN}🚀 Advanced Features:${NC}"
    for issue_title in "${ADVANCED_ISSUES[@]}"; do
        local issue_data
        issue_data=$(gh issue list --repo "${REPO_OWNER}/${REPO_NAME}" --search "\"$issue_title\"" --json number,state,assignees --jq '.[0]')
        
        if [[ "$issue_data" != "null" ]]; then
            local state assignees
            state=$(echo "$issue_data" | jq -r '.state')
            assignees=$(echo "$issue_data" | jq -r '[.assignees[].login] | join(", ")')
            
            local status_icon
            case "$state" in
                open) status_icon="🟡" ;;
                closed) status_icon="✅" ;;
                *) status_icon="❓" ;;
            esac
            
            printf "  %s %-45s [%s]" "$status_icon" "$issue_title" "$state"
            [[ -n "$assignees" ]] && printf " → %s" "$assignees"
            echo
        else
            printf "  ❌ %-45s [not found]\n" "$issue_title"
        fi
    done
    
    echo
    
    # Recent activity
    echo -e "${YELLOW}📈 Recent Activity:${NC}"
    gh issue list \
        --repo "${REPO_OWNER}/${REPO_NAME}" \
        --state all \
        --limit 5 \
        --json number,title,state,updatedAt \
        --jq '.[] | "  #\(.number) \(.title | .[0:40])... [\(.state)] (updated: \(.updatedAt | strptime("%Y-%m-%dT%H:%M:%SZ") | strftime("%Y-%m-%d %H:%M")))"'
    
    echo
}

monitor_issues() {
    local last_check
    last_check=$(date +%s)
    
    info "Starting issue monitoring... (Press Ctrl+C to stop)"
    echo
    
    while true; do
        # Check for updates since last check
        local recent_updates
        recent_updates=$(gh issue list \
            --repo "${REPO_OWNER}/${REPO_NAME}" \
            --state all \
            --json number,title,state,updatedAt \
            --jq --arg since "$last_check" '
                .[] | select((.updatedAt | strptime("%Y-%m-%dT%H:%M:%SZ")) > ($since | tonumber))
            ')
        
        if [[ -n "$recent_updates" ]]; then
            log "Issue updates detected:"
            echo "$recent_updates" | jq -r '"  #\(.number) \(.title) [\(.state)]"'
            echo
        fi
        
        last_check=$(date +%s)
        sleep 30
    done
}

# =============================================================================
# Command Handlers
# =============================================================================

cmd_list() {
    local state="open"
    local assignee=""
    local label=""
    local milestone=""
    local sort="created"
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --state)
                state="$2"
                shift 2
                ;;
            --assignee)
                assignee="$2"
                shift 2
                ;;
            --label)
                label="$2"
                shift 2
                ;;
            --milestone)
                milestone="$2"
                shift 2
                ;;
            --sort)
                sort="$2"
                shift 2
                ;;
            *)
                error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    log "Fetching issues with state: $state"
    local issues
    issues=$(get_issues "$state" "$assignee" "$label" "$milestone" "$sort")
    display_issues_table "$issues"
}

cmd_status() {
    display_status_dashboard
}

cmd_assign() {
    local assignee="$1"
    shift
    local issue_titles=("$@")
    
    if [[ -z "$assignee" ]]; then
        error "Assignee is required"
        exit 1
    fi
    
    if [[ ${#issue_titles[@]} -eq 0 ]]; then
        error "At least one issue title is required"
        exit 1
    fi
    
    for title in "${issue_titles[@]}"; do
        local issue_number
        issue_number=$(get_issue_by_title "$title")
        
        if [[ -n "$issue_number" ]]; then
            if assign_issue "$issue_number" "$assignee"; then
                success "Assigned issue #$issue_number ($title) to $assignee"
            else
                error "Failed to assign issue #$issue_number"
            fi
        else
            error "Issue not found: $title"
        fi
    done
}

cmd_update() {
    local add_labels=()
    local remove_labels=()
    local milestone=""
    local project=""
    local issue_titles=()
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --add-label)
                add_labels+=("$2")
                shift 2
                ;;
            --remove-label)
                remove_labels+=("$2")
                shift 2
                ;;
            --milestone)
                milestone="$2"
                shift 2
                ;;
            --project)
                project="$2"
                shift 2
                ;;
            *)
                issue_titles+=("$1")
                shift
                ;;
        esac
    done
    
    if [[ ${#issue_titles[@]} -eq 0 ]]; then
        error "At least one issue title is required"
        exit 1
    fi
    
    for title in "${issue_titles[@]}"; do
        local issue_number
        issue_number=$(get_issue_by_title "$title")
        
        if [[ -n "$issue_number" ]]; then
            # Add labels
            for label in "${add_labels[@]}"; do
                update_issue_labels "$issue_number" "add" "$label"
                success "Added label '$label' to issue #$issue_number"
            done
            
            # Remove labels
            for label in "${remove_labels[@]}"; do
                update_issue_labels "$issue_number" "remove" "$label"
                success "Removed label '$label' from issue #$issue_number"
            done
            
            # Set milestone
            if [[ -n "$milestone" ]]; then
                gh issue edit "$issue_number" --repo "${REPO_OWNER}/${REPO_NAME}" --milestone "$milestone"
                success "Set milestone '$milestone' for issue #$issue_number"
            fi
            
            # Add to project
            if [[ -n "$project" ]]; then
                gh issue edit "$issue_number" --repo "${REPO_OWNER}/${REPO_NAME}" --project "$project"
                success "Added issue #$issue_number to project $project"
            fi
        else
            error "Issue not found: $title"
        fi
    done
}

cmd_close() {
    local issue_titles=("$@")
    
    if [[ ${#issue_titles[@]} -eq 0 ]]; then
        error "At least one issue title is required"
        exit 1
    fi
    
    for title in "${issue_titles[@]}"; do
        local issue_number
        issue_number=$(get_issue_by_title "$title")
        
        if [[ -n "$issue_number" ]]; then
            if close_issue "$issue_number" "completed"; then
                success "Closed issue #$issue_number ($title)"
            else
                error "Failed to close issue #$issue_number"
            fi
        else
            error "Issue not found: $title"
        fi
    done
}

cmd_comment() {
    local comment="$1"
    shift
    local issue_titles=("$@")
    
    if [[ -z "$comment" ]]; then
        error "Comment text is required"
        exit 1
    fi
    
    if [[ ${#issue_titles[@]} -eq 0 ]]; then
        error "At least one issue title is required"
        exit 1
    fi
    
    for title in "${issue_titles[@]}"; do
        local issue_number
        issue_number=$(get_issue_by_title "$title")
        
        if [[ -n "$issue_number" ]]; then
            if add_issue_comment "$issue_number" "$comment"; then
                success "Added comment to issue #$issue_number ($title)"
            else
                error "Failed to add comment to issue #$issue_number"
            fi
        else
            error "Issue not found: $title"
        fi
    done
}

cmd_monitor() {
    monitor_issues
}

# =============================================================================
# Main Script Logic
# =============================================================================

main() {
    local command="${1:-list}"
    shift || true
    
    check_gh_cli
    
    case "$command" in
        list)
            cmd_list "$@"
            ;;
        status)
            cmd_status "$@"
            ;;
        assign)
            cmd_assign "$@"
            ;;
        update)
            cmd_update "$@"
            ;;
        close)
            cmd_close "$@"
            ;;
        reopen)
            cmd_reopen "$@"
            ;;
        comment)
            cmd_comment "$@"
            ;;
        monitor)
            cmd_monitor "$@"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Only run main if script is executed directly  
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
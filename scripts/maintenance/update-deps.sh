#!/bin/bash
# ============================================
# ERP System - Update Dependencies Script
# ============================================
#
# Description:
#   Safely updates dependencies with testing and rollback
#   capabilities.
#
# Usage:
#   ./scripts/maintenance/update-deps.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   --check                 Only check for updates, don't apply
#   --major                 Include major version updates
#   --interactive           Interactive update selection
#   --test                  Run tests after updating
#   --commit                Create git commit with changes
#   --dry-run               Show what would be done
#   -v, --verbose           Show detailed output
#
# Example:
#   ./scripts/maintenance/update-deps.sh --check
#   ./scripts/maintenance/update-deps.sh --test --commit
#
# Author: ERP System Team
# ============================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Default options
CHECK_ONLY=false
INCLUDE_MAJOR=false
INTERACTIVE=false
RUN_TESTS=false
CREATE_COMMIT=false
DRY_RUN=false
VERBOSE=false

# ============================================
# FUNCTIONS
# ============================================

log() {
    local level=$1
    shift
    case $level in
        INFO)    echo -e "${BLUE}ℹ${NC} $*" ;;
        SUCCESS) echo -e "${GREEN}✓${NC} $*" ;;
        WARN)    echo -e "${YELLOW}⚠${NC} $*" ;;
        ERROR)   echo -e "${RED}✗${NC} $*" ;;
        DEBUG)   [[ "$VERBOSE" == true ]] && echo -e "${DIM}  $*${NC}" ;;
    esac
}

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  --check                 Only check for updates"
    echo "  --major                 Include major version updates"
    echo "  --interactive           Interactive selection"
    echo "  --test                  Run tests after updating"
    echo "  --commit                Create git commit"
    echo "  --dry-run               Show what would be done"
    echo "  -v, --verbose           Show detailed output"
}

check_updates() {
    log INFO "Checking for outdated dependencies..."
    echo ""
    
    pnpm outdated 2>/dev/null || true
    
    echo ""
}

backup_lockfile() {
    log INFO "Backing up lockfile..."
    
    cp pnpm-lock.yaml "pnpm-lock.yaml.backup-$(date +%Y%m%d-%H%M%S)"
    
    log SUCCESS "Lockfile backed up"
}

update_dependencies() {
    log INFO "Updating dependencies..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would run: pnpm update"
        return 0
    fi
    
    local update_flags=""
    
    if [[ "$INCLUDE_MAJOR" == true ]]; then
        update_flags="--latest"
    fi
    
    if [[ "$INTERACTIVE" == true ]]; then
        update_flags="$update_flags --interactive"
    fi
    
    pnpm update $update_flags
    
    log SUCCESS "Dependencies updated"
}

run_type_check() {
    log INFO "Running type check..."
    
    if pnpm type-check; then
        log SUCCESS "Type check passed"
        return 0
    else
        log ERROR "Type check failed"
        return 1
    fi
}

run_lint() {
    log INFO "Running linter..."
    
    if pnpm lint; then
        log SUCCESS "Lint passed"
        return 0
    else
        log WARN "Lint issues found"
        return 0
    fi
}

run_tests() {
    if [[ "$RUN_TESTS" != true ]]; then
        return 0
    fi
    
    log INFO "Running tests..."
    
    if pnpm test; then
        log SUCCESS "Tests passed"
        return 0
    else
        log ERROR "Tests failed"
        return 1
    fi
}

rollback() {
    log WARN "Rolling back changes..."
    
    # Find most recent backup
    local backup=$(ls -t pnpm-lock.yaml.backup-* 2>/dev/null | head -n1)
    
    if [[ -n "$backup" ]]; then
        mv "$backup" pnpm-lock.yaml
        pnpm install --frozen-lockfile
        log SUCCESS "Rolled back to previous lockfile"
    else
        log ERROR "No backup found for rollback"
        exit 1
    fi
}

create_commit() {
    if [[ "$CREATE_COMMIT" != true ]]; then
        return 0
    fi
    
    log INFO "Creating git commit..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would create commit"
        return 0
    fi
    
    # Check if there are changes
    if git diff --quiet pnpm-lock.yaml; then
        log INFO "No changes to commit"
        return 0
    fi
    
    # Get updated packages summary
    local summary=$(pnpm outdated 2>/dev/null | head -20 || echo "Dependencies updated")
    
    git add pnpm-lock.yaml package.json */package.json 2>/dev/null || true
    git commit -m "chore(deps): update dependencies

Updated packages via pnpm update.

$summary"
    
    log SUCCESS "Commit created"
}

print_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║              Dependency Update Complete! 📦                ║${NC}"
    echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log INFO "Run 'pnpm install' in CI/CD to apply changes"
    echo ""
}

# ============================================
# PARSE ARGUMENTS
# ============================================

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_usage
            exit 0
            ;;
        --check)
            CHECK_ONLY=true
            shift
            ;;
        --major)
            INCLUDE_MAJOR=true
            shift
            ;;
        --interactive)
            INTERACTIVE=true
            shift
            ;;
        --test)
            RUN_TESTS=true
            shift
            ;;
        --commit)
            CREATE_COMMIT=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            log ERROR "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# ============================================
# MAIN
# ============================================

main() {
    echo ""
    echo -e "${BOLD}${BLUE}ERP System - Dependency Update${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # Check only mode
    if [[ "$CHECK_ONLY" == true ]]; then
        check_updates
        exit 0
    fi
    
    # Backup lockfile
    backup_lockfile
    
    # Update dependencies
    update_dependencies
    
    # Run checks
    if ! run_type_check; then
        rollback
        exit 1
    fi
    
    run_lint
    
    if ! run_tests; then
        rollback
        exit 1
    fi
    
    # Create commit
    create_commit
    
    # Summary
    print_summary
}

main


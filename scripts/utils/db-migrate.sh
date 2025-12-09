#!/bin/bash
# ============================================
# ERP System - Database Migration Script
# ============================================
#
# Description:
#   Wrapper for Prisma database migrations with backup
#   and rollback capabilities.
#
# Usage:
#   ./scripts/utils/db-migrate.sh [COMMAND] [OPTIONS]
#
# Commands:
#   up          Apply pending migrations (default)
#   down        Rollback last migration
#   status      Show migration status
#   reset       Reset database and reapply all migrations
#   generate    Generate migration from schema changes
#
# Options:
#   -h, --help      Show this help message
#   --backup        Create backup before migrating
#   --dry-run       Show what would be done
#   -v, --verbose   Show detailed output
#
# Example:
#   ./scripts/utils/db-migrate.sh up --backup
#   ./scripts/utils/db-migrate.sh generate --name add_new_field
#
# Author: ERP System Team
# ============================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DATABASE_PKG="$PROJECT_ROOT/packages/database"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Default options
COMMAND="up"
BACKUP=false
DRY_RUN=false
VERBOSE=false
MIGRATION_NAME=""

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
    esac
}

print_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  up          Apply pending migrations (default)"
    echo "  down        Rollback last migration"
    echo "  status      Show migration status"
    echo "  reset       Reset database and reapply migrations"
    echo "  generate    Generate migration from schema changes"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  --backup            Create backup before migrating"
    echo "  --dry-run           Show what would be done"
    echo "  --name <name>       Migration name (for generate)"
    echo "  -v, --verbose       Show detailed output"
}

create_backup() {
    if [[ "$BACKUP" != true ]]; then
        return 0
    fi
    
    log INFO "Creating backup before migration..."
    "$SCRIPT_DIR/../maintenance/backup-db.sh" --verbose || log WARN "Backup failed, continuing..."
}

migrate_up() {
    log INFO "Applying pending migrations..."
    
    cd "$DATABASE_PKG"
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would run: npx prisma migrate deploy"
        npx prisma migrate status
        return 0
    fi
    
    # Generate client first
    npx prisma generate
    
    # Apply migrations
    npx prisma migrate deploy
    
    log SUCCESS "Migrations applied successfully"
}

migrate_down() {
    log WARN "Rolling back last migration..."
    
    cd "$DATABASE_PKG"
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would rollback last migration"
        return 0
    fi
    
    # Prisma doesn't have built-in rollback, so we need to use db push with reset
    # This is a simplified approach - in production, use explicit down migrations
    log WARN "Prisma doesn't support automatic rollback. Consider using db push --force-reset for development."
    log INFO "For production, create explicit down migration files."
    
    npx prisma migrate status
}

migrate_status() {
    log INFO "Migration status:"
    
    cd "$DATABASE_PKG"
    npx prisma migrate status
}

migrate_reset() {
    log WARN "Resetting database..."
    
    cd "$DATABASE_PKG"
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would reset database"
        return 0
    fi
    
    # Confirm action
    echo ""
    echo -e "${RED}${BOLD}WARNING: This will DELETE all data!${NC}"
    read -p "Type 'RESET' to confirm: " confirm
    
    if [[ "$confirm" != "RESET" ]]; then
        log INFO "Reset cancelled"
        return 0
    fi
    
    npx prisma migrate reset --force
    
    log SUCCESS "Database reset complete"
}

migrate_generate() {
    if [[ -z "$MIGRATION_NAME" ]]; then
        log ERROR "Migration name required. Use --name <name>"
        exit 1
    fi
    
    log INFO "Generating migration: $MIGRATION_NAME"
    
    cd "$DATABASE_PKG"
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would generate migration: $MIGRATION_NAME"
        return 0
    fi
    
    npx prisma migrate dev --name "$MIGRATION_NAME"
    
    log SUCCESS "Migration generated: $MIGRATION_NAME"
}

# ============================================
# PARSE ARGUMENTS
# ============================================

# First argument is command if it doesn't start with -
if [[ $# -gt 0 ]] && [[ ! "$1" =~ ^- ]]; then
    COMMAND="$1"
    shift
fi

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_usage
            exit 0
            ;;
        --backup)
            BACKUP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --name)
            MIGRATION_NAME="$2"
            shift 2
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
    echo -e "${BOLD}${BLUE}ERP System - Database Migration${NC}"
    echo ""
    
    # Create backup if requested
    create_backup
    
    # Execute command
    case $COMMAND in
        up)
            migrate_up
            ;;
        down)
            migrate_down
            ;;
        status)
            migrate_status
            ;;
        reset)
            migrate_reset
            ;;
        generate)
            migrate_generate
            ;;
        *)
            log ERROR "Unknown command: $COMMAND"
            print_usage
            exit 1
            ;;
    esac
    
    echo ""
}

main


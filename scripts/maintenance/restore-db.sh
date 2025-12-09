#!/bin/bash
# ============================================
# ERP System - Database Restore Script
# ============================================
#
# Description:
#   Restores database from backup file with safety checks
#   and optional pre-restore backup.
#
# Usage:
#   ./scripts/maintenance/restore-db.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -f, --file <path>       Backup file to restore (required)
#   -l, --list              List available backups
#   --no-backup             Don't create backup before restore
#   --force                 Skip confirmation prompt
#   -v, --verbose           Show detailed output
#
# Example:
#   ./scripts/maintenance/restore-db.sh --file backups/erp_db_20241207.sql.gz
#   ./scripts/maintenance/restore-db.sh --list
#
# Author: ERP System Team
# ============================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Default options
BACKUP_FILE=""
LIST_ONLY=false
CREATE_BACKUP=true
FORCE=false
VERBOSE=false

# Database config
DB_USER="${DB_USER:-erp_user}"
DB_NAME="${DB_NAME:-erp_database}"

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
    echo "Usage: $0 --file <backup_file> [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -f, --file <path>       Backup file to restore"
    echo "  -l, --list              List available backups"
    echo "  --no-backup             Don't create backup before restore"
    echo "  --force                 Skip confirmation prompt"
    echo "  -v, --verbose           Show detailed output"
}

list_backups() {
    log INFO "Available backups in $BACKUP_DIR:"
    echo ""
    
    if [[ ! -d "$BACKUP_DIR" ]] || [[ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]]; then
        log WARN "No backups found"
        return 0
    fi
    
    echo "┌────┬──────────────────────────────────────────┬──────────┬─────────────────────┐"
    echo "│ #  │ Filename                                 │ Size     │ Date                │"
    echo "├────┼──────────────────────────────────────────┼──────────┼─────────────────────┤"
    
    local i=1
    for file in "$BACKUP_DIR"/erp_db_*.sql*; do
        if [[ -f "$file" ]]; then
            local name=$(basename "$file")
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -c %y "$file" 2>/dev/null | cut -d'.' -f1 || stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$file" 2>/dev/null)
            printf "│ %-2d │ %-40s │ %8s │ %19s │\n" "$i" "$name" "$size" "$date"
            ((i++))
        fi
    done
    
    echo "└────┴──────────────────────────────────────────┴──────────┴─────────────────────┘"
    echo ""
}

select_backup() {
    list_backups
    
    echo "Enter the number of the backup to restore (or 'q' to quit):"
    read -p "> " selection
    
    if [[ "$selection" == "q" ]]; then
        log INFO "Cancelled"
        exit 0
    fi
    
    local i=1
    for file in "$BACKUP_DIR"/erp_db_*.sql*; do
        if [[ -f "$file" ]] && [[ "$i" == "$selection" ]]; then
            BACKUP_FILE="$file"
            return 0
        fi
        ((i++))
    done
    
    log ERROR "Invalid selection"
    exit 1
}

confirm_restore() {
    if [[ "$FORCE" == true ]]; then
        return 0
    fi
    
    echo ""
    echo -e "${RED}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}${BOLD}║                      ⚠  WARNING  ⚠                         ║${NC}"
    echo -e "${RED}${BOLD}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${RED}${BOLD}║  This will REPLACE all data in the database!               ║${NC}"
    echo -e "${RED}${BOLD}║  Backup file: $(basename "$BACKUP_FILE")${NC}"
    echo -e "${RED}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    read -p "Type 'RESTORE' to confirm: " response
    if [[ "$response" != "RESTORE" ]]; then
        log INFO "Restore cancelled"
        exit 0
    fi
}

create_pre_restore_backup() {
    if [[ "$CREATE_BACKUP" != true ]]; then
        log WARN "Skipping pre-restore backup"
        return 0
    fi
    
    log INFO "Creating backup before restore..."
    
    local pre_backup="$BACKUP_DIR/pre-restore-$TIMESTAMP.sql"
    mkdir -p "$BACKUP_DIR"
    
    if docker-compose exec -T postgres pg_dump -U "$DB_USER" -d "$DB_NAME" > "$pre_backup" 2>/dev/null; then
        gzip -f "$pre_backup"
        log SUCCESS "Pre-restore backup: ${pre_backup}.gz"
    else
        log WARN "Could not create pre-restore backup (database may be empty)"
    fi
}

get_record_counts() {
    local label=$1
    
    log INFO "$label record counts:"
    
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT 'Tenants: ' || COUNT(*) FROM tenants
        UNION ALL SELECT 'Users: ' || COUNT(*) FROM users
        UNION ALL SELECT 'Products: ' || COUNT(*) FROM products
        UNION ALL SELECT 'Orders: ' || COUNT(*) FROM orders
        UNION ALL SELECT 'Invoices: ' || COUNT(*) FROM invoices;
    " 2>/dev/null | grep -v "^$" | while read line; do
        echo "  $line"
    done
}

restore_database() {
    log INFO "Restoring database from: $(basename "$BACKUP_FILE")"
    
    local restore_file="$BACKUP_FILE"
    local temp_file=""
    
    # Decompress if needed
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        log INFO "Decompressing backup..."
        temp_file=$(mktemp)
        gunzip -c "$BACKUP_FILE" > "$temp_file"
        restore_file="$temp_file"
    fi
    
    # Get before counts
    get_record_counts "Before" || true
    
    log INFO "Dropping existing data..."
    
    # Drop and recreate
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO $DB_USER;
    " 2>/dev/null || true
    
    log INFO "Restoring data..."
    
    local start_time=$(date +%s)
    
    if docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" < "$restore_file" 2>/dev/null; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log SUCCESS "Database restored in ${duration}s"
    else
        log ERROR "Restore failed"
        # Cleanup temp file
        [[ -n "$temp_file" ]] && rm -f "$temp_file"
        exit 1
    fi
    
    # Cleanup temp file
    [[ -n "$temp_file" ]] && rm -f "$temp_file"
    
    # Get after counts
    get_record_counts "After"
}

print_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║              Restore Complete! ✓                           ║${NC}"
    echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Restored From:${NC} $(basename "$BACKUP_FILE")"
    echo ""
    echo -e "${BOLD}Next Steps:${NC}"
    echo "  1. Verify the data in the application"
    echo "  2. Run any pending migrations: pnpm db:migrate"
    echo "  3. Clear Redis cache if needed"
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
        -f|--file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -l|--list)
            LIST_ONLY=true
            shift
            ;;
        --no-backup)
            CREATE_BACKUP=false
            shift
            ;;
        --force)
            FORCE=true
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
    echo -e "${BOLD}${BLUE}ERP System - Database Restore${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # List mode
    if [[ "$LIST_ONLY" == true ]]; then
        list_backups
        exit 0
    fi
    
    # Interactive selection if no file specified
    if [[ -z "$BACKUP_FILE" ]]; then
        select_backup
    fi
    
    # Validate backup file
    if [[ ! -f "$BACKUP_FILE" ]]; then
        log ERROR "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    # Confirm restore
    confirm_restore
    
    # Create pre-restore backup
    create_pre_restore_backup
    
    # Restore database
    restore_database
    
    # Summary
    print_summary
}

main


#!/bin/bash
# ============================================
# ERP System - Database Backup Script
# ============================================
#
# Description:
#   Creates timestamped database backups with compression.
#   Supports local storage and optional cloud upload.
#
# Usage:
#   ./scripts/maintenance/backup-db.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -o, --output <dir>      Output directory (default: ./backups)
#   -k, --keep <days>       Keep backups for N days (default: 7)
#   --upload                Upload to cloud storage (S3/GCS)
#   --no-compress           Don't compress backup
#   --tables <list>         Backup specific tables only
#   -v, --verbose           Show detailed output
#
# Example:
#   ./scripts/maintenance/backup-db.sh
#   ./scripts/maintenance/backup-db.sh --keep 30 --upload
#   ./scripts/maintenance/backup-db.sh --tables "users,orders,invoices"
#
# Author: ERP System Team
# ============================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
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
OUTPUT_DIR="$PROJECT_ROOT/backups"
KEEP_DAYS=7
UPLOAD=false
COMPRESS=true
TABLES=""
VERBOSE=false

# Database config from environment
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
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
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -o, --output <dir>      Output directory (default: ./backups)"
    echo "  -k, --keep <days>       Keep backups for N days (default: 7)"
    echo "  --upload                Upload to cloud storage"
    echo "  --no-compress           Don't compress backup"
    echo "  --tables <list>         Backup specific tables only"
    echo "  -v, --verbose           Show detailed output"
}

check_prerequisites() {
    log INFO "Checking prerequisites..."
    
    # Check if running in Docker or direct connection
    if docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
        log DEBUG "Using Docker PostgreSQL"
        USE_DOCKER=true
    else
        log DEBUG "Using direct PostgreSQL connection"
        USE_DOCKER=false
        
        if ! command -v pg_dump &> /dev/null; then
            log ERROR "pg_dump is not installed"
            exit 1
        fi
    fi
}

create_backup() {
    log INFO "Creating database backup..."
    
    mkdir -p "$OUTPUT_DIR"
    
    local backup_file="$OUTPUT_DIR/erp_db_$TIMESTAMP.sql"
    local start_time=$(date +%s)
    
    # Build pg_dump command
    local dump_cmd="pg_dump -U $DB_USER -d $DB_NAME"
    
    if [[ -n "$TABLES" ]]; then
        for table in $(echo "$TABLES" | tr ',' ' '); do
            dump_cmd="$dump_cmd -t $table"
        done
        log INFO "Backing up specific tables: $TABLES"
    fi
    
    # Execute backup
    if [[ "$USE_DOCKER" == true ]]; then
        docker-compose exec -T postgres $dump_cmd > "$backup_file" 2>/dev/null
    else
        PGPASSWORD="${DB_PASSWORD:-}" $dump_cmd -h "$DB_HOST" -p "$DB_PORT" > "$backup_file"
    fi
    
    if [[ ! -s "$backup_file" ]]; then
        log ERROR "Backup file is empty"
        rm -f "$backup_file"
        exit 1
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local size=$(du -h "$backup_file" | cut -f1)
    
    log SUCCESS "Backup created: $backup_file ($size in ${duration}s)"
    
    # Compress if enabled
    if [[ "$COMPRESS" == true ]]; then
        compress_backup "$backup_file"
    fi
    
    echo "$backup_file"
}

compress_backup() {
    local backup_file=$1
    
    log INFO "Compressing backup..."
    
    if gzip -f "$backup_file"; then
        local compressed_file="${backup_file}.gz"
        local size=$(du -h "$compressed_file" | cut -f1)
        log SUCCESS "Compressed: $compressed_file ($size)"
        echo "$compressed_file"
    else
        log WARN "Compression failed, keeping uncompressed backup"
    fi
}

upload_backup() {
    local backup_file=$1
    
    if [[ "$UPLOAD" != true ]]; then
        return 0
    fi
    
    log INFO "Uploading backup to cloud storage..."
    
    # Check for AWS CLI
    if command -v aws &> /dev/null && [[ -n "${AWS_S3_BUCKET:-}" ]]; then
        log INFO "Uploading to S3: $AWS_S3_BUCKET"
        aws s3 cp "$backup_file" "s3://$AWS_S3_BUCKET/backups/$(basename "$backup_file")"
        log SUCCESS "Uploaded to S3"
        return 0
    fi
    
    # Check for GCS
    if command -v gsutil &> /dev/null && [[ -n "${GCS_BUCKET:-}" ]]; then
        log INFO "Uploading to GCS: $GCS_BUCKET"
        gsutil cp "$backup_file" "gs://$GCS_BUCKET/backups/$(basename "$backup_file")"
        log SUCCESS "Uploaded to GCS"
        return 0
    fi
    
    log WARN "No cloud storage configured, skipping upload"
}

cleanup_old_backups() {
    log INFO "Cleaning up backups older than $KEEP_DAYS days..."
    
    local count=0
    
    while IFS= read -r file; do
        if [[ -f "$file" ]]; then
            log DEBUG "Removing: $file"
            rm -f "$file"
            ((count++))
        fi
    done < <(find "$OUTPUT_DIR" -name "erp_db_*.sql*" -mtime +"$KEEP_DAYS" 2>/dev/null)
    
    if [[ $count -gt 0 ]]; then
        log SUCCESS "Removed $count old backup(s)"
    else
        log INFO "No old backups to remove"
    fi
}

list_backups() {
    log INFO "Available backups:"
    echo ""
    echo "┌──────────────────────────────────────────┬──────────┬─────────────────────┐"
    echo "│ Filename                                 │ Size     │ Date                │"
    echo "├──────────────────────────────────────────┼──────────┼─────────────────────┤"
    
    for file in "$OUTPUT_DIR"/erp_db_*.sql*; do
        if [[ -f "$file" ]]; then
            local name=$(basename "$file")
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || stat -f %Sm -t %Y-%m-%d "$file" 2>/dev/null)
            printf "│ %-40s │ %8s │ %19s │\n" "$name" "$size" "$date"
        fi
    done
    
    echo "└──────────────────────────────────────────┴──────────┴─────────────────────┘"
    echo ""
}

print_summary() {
    local backup_file=$1
    
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║              Backup Complete! 💾                            ║${NC}"
    echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Backup Details:${NC}"
    echo "  File:       $(basename "$backup_file")"
    echo "  Location:   $OUTPUT_DIR"
    echo "  Size:       $(du -h "$backup_file" 2>/dev/null | cut -f1 || echo "N/A")"
    echo "  Retention:  $KEEP_DAYS days"
    echo ""
    echo -e "${BOLD}Restore Command:${NC}"
    echo "  ./scripts/maintenance/restore-db.sh --file $backup_file"
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
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -k|--keep)
            KEEP_DAYS="$2"
            shift 2
            ;;
        --upload)
            UPLOAD=true
            shift
            ;;
        --no-compress)
            COMPRESS=false
            shift
            ;;
        --tables)
            TABLES="$2"
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
    echo -e "${BOLD}${BLUE}ERP System - Database Backup${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    check_prerequisites
    
    # Create backup
    local backup_file=$(create_backup)
    
    # Handle compression result
    if [[ "$COMPRESS" == true ]] && [[ -f "${backup_file}.gz" ]]; then
        backup_file="${backup_file}.gz"
    fi
    
    # Upload if enabled
    upload_backup "$backup_file"
    
    # Cleanup old backups
    cleanup_old_backups
    
    # List available backups
    list_backups
    
    # Summary
    print_summary "$backup_file"
}

main


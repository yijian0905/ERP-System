#!/bin/bash
# ============================================
# ERP System - Log Rotation Script
# ============================================
#
# Description:
#   Rotates and compresses log files, maintaining a clean
#   log directory structure.
#
# Usage:
#   ./scripts/maintenance/rotate-logs.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -d, --dir <path>        Log directory (default: ./logs)
#   -k, --keep <days>       Keep logs for N days (default: 30)
#   -c, --compress          Compress rotated logs (default: true)
#   --dry-run               Show what would be done
#   -v, --verbose           Show detailed output
#
# Example:
#   ./scripts/maintenance/rotate-logs.sh
#   ./scripts/maintenance/rotate-logs.sh --keep 14 --dry-run
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
LOG_DIR="$PROJECT_ROOT/logs"
KEEP_DAYS=30
COMPRESS=true
DRY_RUN=false
VERBOSE=false

# Stats
ROTATED_COUNT=0
DELETED_COUNT=0
COMPRESSED_COUNT=0
SPACE_FREED=0

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
    echo "  -d, --dir <path>        Log directory (default: ./logs)"
    echo "  -k, --keep <days>       Keep logs for N days (default: 30)"
    echo "  -c, --compress          Compress rotated logs"
    echo "  --dry-run               Show what would be done"
    echo "  -v, --verbose           Show detailed output"
}

get_file_size() {
    local file=$1
    stat -c %s "$file" 2>/dev/null || stat -f %z "$file" 2>/dev/null || echo 0
}

compress_old_logs() {
    log INFO "Compressing logs older than 1 day..."
    
    while IFS= read -r file; do
        if [[ -f "$file" ]] && [[ ! "$file" == *.gz ]]; then
            local size=$(get_file_size "$file")
            
            if [[ "$DRY_RUN" == true ]]; then
                log DEBUG "[DRY RUN] Would compress: $file"
            else
                if gzip "$file" 2>/dev/null; then
                    ((COMPRESSED_COUNT++))
                    log DEBUG "Compressed: $file"
                fi
            fi
        fi
    done < <(find "$LOG_DIR" -name "*.log" -mtime +1 2>/dev/null)
    
    log SUCCESS "Compressed $COMPRESSED_COUNT log file(s)"
}

delete_old_logs() {
    log INFO "Deleting logs older than $KEEP_DAYS days..."
    
    while IFS= read -r file; do
        if [[ -f "$file" ]]; then
            local size=$(get_file_size "$file")
            
            if [[ "$DRY_RUN" == true ]]; then
                log DEBUG "[DRY RUN] Would delete: $file"
            else
                rm -f "$file"
                ((DELETED_COUNT++))
                SPACE_FREED=$((SPACE_FREED + size))
                log DEBUG "Deleted: $file"
            fi
        fi
    done < <(find "$LOG_DIR" -name "*.log*" -mtime +"$KEEP_DAYS" 2>/dev/null)
    
    log SUCCESS "Deleted $DELETED_COUNT old log file(s)"
}

rotate_large_logs() {
    local max_size=$((100 * 1024 * 1024)) # 100MB
    
    log INFO "Rotating logs larger than 100MB..."
    
    while IFS= read -r file; do
        if [[ -f "$file" ]] && [[ ! "$file" == *.gz ]]; then
            local size=$(get_file_size "$file")
            
            if [[ $size -gt $max_size ]]; then
                local timestamp=$(date +%Y%m%d-%H%M%S)
                local rotated="${file}.${timestamp}"
                
                if [[ "$DRY_RUN" == true ]]; then
                    log DEBUG "[DRY RUN] Would rotate: $file ($(numfmt --to=iec $size))"
                else
                    mv "$file" "$rotated"
                    touch "$file"
                    ((ROTATED_COUNT++))
                    log DEBUG "Rotated: $file -> $rotated"
                    
                    if [[ "$COMPRESS" == true ]]; then
                        gzip "$rotated" 2>/dev/null && ((COMPRESSED_COUNT++))
                    fi
                fi
            fi
        fi
    done < <(find "$LOG_DIR" -name "*.log" -type f 2>/dev/null)
    
    log SUCCESS "Rotated $ROTATED_COUNT large log file(s)"
}

clean_empty_dirs() {
    log INFO "Cleaning empty directories..."
    
    find "$LOG_DIR" -type d -empty -delete 2>/dev/null || true
    
    log SUCCESS "Empty directories cleaned"
}

show_log_stats() {
    log INFO "Log directory statistics:"
    echo ""
    
    if [[ -d "$LOG_DIR" ]]; then
        local total_size=$(du -sh "$LOG_DIR" 2>/dev/null | cut -f1 || echo "0")
        local file_count=$(find "$LOG_DIR" -type f 2>/dev/null | wc -l)
        local oldest=$(find "$LOG_DIR" -type f -printf '%T+ %p\n' 2>/dev/null | sort | head -1 | cut -d' ' -f2 || echo "N/A")
        local newest=$(find "$LOG_DIR" -type f -printf '%T+ %p\n' 2>/dev/null | sort -r | head -1 | cut -d' ' -f2 || echo "N/A")
        
        echo "  Total size:   $total_size"
        echo "  File count:   $file_count"
        echo "  Oldest:       $(basename "$oldest" 2>/dev/null || echo "N/A")"
        echo "  Newest:       $(basename "$newest" 2>/dev/null || echo "N/A")"
    else
        echo "  Log directory does not exist"
    fi
    echo ""
}

print_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║              Log Rotation Complete! 📝                      ║${NC}"
    echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Summary:${NC}"
    echo "  Rotated:     $ROTATED_COUNT file(s)"
    echo "  Compressed:  $COMPRESSED_COUNT file(s)"
    echo "  Deleted:     $DELETED_COUNT file(s)"
    
    if [[ $SPACE_FREED -gt 0 ]]; then
        echo "  Space freed: $(numfmt --to=iec $SPACE_FREED 2>/dev/null || echo "$SPACE_FREED bytes")"
    fi
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
        -d|--dir)
            LOG_DIR="$2"
            shift 2
            ;;
        -k|--keep)
            KEEP_DAYS="$2"
            shift 2
            ;;
        -c|--compress)
            COMPRESS=true
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
    echo -e "${BOLD}${BLUE}ERP System - Log Rotation${NC}"
    echo ""
    
    if [[ "$DRY_RUN" == true ]]; then
        log WARN "Running in DRY RUN mode - no changes will be made"
    fi
    
    if [[ ! -d "$LOG_DIR" ]]; then
        log INFO "Log directory does not exist: $LOG_DIR"
        mkdir -p "$LOG_DIR"
        log SUCCESS "Created log directory"
    fi
    
    # Show current stats
    show_log_stats
    
    # Rotate large logs
    rotate_large_logs
    
    # Compress old logs
    if [[ "$COMPRESS" == true ]]; then
        compress_old_logs
    fi
    
    # Delete old logs
    delete_old_logs
    
    # Clean empty directories
    clean_empty_dirs
    
    # Show updated stats
    show_log_stats
    
    # Summary
    print_summary
}

main


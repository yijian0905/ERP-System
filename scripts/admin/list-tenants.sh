#!/bin/bash
# ============================================
# ERP System - List Tenants Script
# ============================================
#
# Description:
#   Lists all tenants with their details including tier,
#   status, and license information.
#
# Usage:
#   ./scripts/admin/list-tenants.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -t, --tier <tier>       Filter by tier: L1, L2, L3
#   -s, --status <status>   Filter by status: active, expired, suspended
#   --csv                   Output as CSV
#   --json                  Output as JSON
#   -v, --verbose           Show detailed output
#
# Example:
#   ./scripts/admin/list-tenants.sh
#   ./scripts/admin/list-tenants.sh --tier L2 --csv
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
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Default options
TIER_FILTER=""
STATUS_FILTER=""
OUTPUT_CSV=false
OUTPUT_JSON=false
VERBOSE=false

# ============================================
# FUNCTIONS
# ============================================

log() {
    [[ "$OUTPUT_CSV" == true ]] || [[ "$OUTPUT_JSON" == true ]] && return
    local level=$1
    shift
    case $level in
        INFO)    echo -e "${BLUE}ℹ${NC} $*" ;;
        SUCCESS) echo -e "${GREEN}✓${NC} $*" ;;
        WARN)    echo -e "${YELLOW}⚠${NC} $*" ;;
        ERROR)   echo -e "${RED}✗${NC} $*" >&2 ;;
    esac
}

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -t, --tier <tier>       Filter by tier: L1, L2, L3"
    echo "  -s, --status <status>   Filter by status: ACTIVE, EXPIRED, SUSPENDED"
    echo "  --csv                   Output as CSV"
    echo "  --json                  Output as JSON"
    echo "  -v, --verbose           Show detailed output"
}

build_query() {
    local where_clause=""
    
    if [[ -n "$TIER_FILTER" ]]; then
        where_clause="WHERE t.tier = '$TIER_FILTER'"
    fi
    
    if [[ -n "$STATUS_FILTER" ]]; then
        if [[ -n "$where_clause" ]]; then
            where_clause="$where_clause AND t.status = '$STATUS_FILTER'"
        else
            where_clause="WHERE t.status = '$STATUS_FILTER'"
        fi
    fi
    
    echo "
        SELECT 
            t.id,
            t.name,
            t.slug,
            t.tier,
            t.status,
            t.created_at,
            COALESCE(l.expires_at::text, 'N/A') as license_expires,
            (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as user_count,
            (SELECT COUNT(*) FROM products p WHERE p.tenant_id = t.id) as product_count
        FROM tenants t
        LEFT JOIN licenses l ON l.tenant_id = t.id AND l.is_active = true
        $where_clause
        ORDER BY t.created_at DESC;
    "
}

output_table() {
    local query=$(build_query)
    
    echo ""
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║                                      Tenant List                                               ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    docker-compose exec -T postgres psql -U erp_user -d erp_database -c "
        $query
    " 2>/dev/null
    
    echo ""
    
    # Show summary
    local total=$(docker-compose exec -T postgres psql -U erp_user -d erp_database -t -c "SELECT COUNT(*) FROM tenants" 2>/dev/null | tr -d ' ')
    local active=$(docker-compose exec -T postgres psql -U erp_user -d erp_database -t -c "SELECT COUNT(*) FROM tenants WHERE status = 'ACTIVE'" 2>/dev/null | tr -d ' ')
    
    echo -e "${BOLD}Summary:${NC}"
    echo "  Total tenants: $total"
    echo "  Active: $active"
    echo ""
}

output_csv() {
    local query=$(build_query)
    
    echo "id,name,slug,tier,status,created_at,license_expires,user_count,product_count"
    
    docker-compose exec -T postgres psql -U erp_user -d erp_database -t -A -F',' -c "$query" 2>/dev/null
}

output_json() {
    local query=$(build_query)
    
    docker-compose exec -T postgres psql -U erp_user -d erp_database -t -c "
        SELECT json_agg(row_to_json(t)) FROM (
            $query
        ) t;
    " 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "[]"
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
        -t|--tier)
            TIER_FILTER="$2"
            shift 2
            ;;
        -s|--status)
            STATUS_FILTER="$2"
            shift 2
            ;;
        --csv)
            OUTPUT_CSV=true
            shift
            ;;
        --json)
            OUTPUT_JSON=true
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
    cd "$PROJECT_ROOT"
    
    if [[ "$OUTPUT_CSV" == true ]]; then
        output_csv
    elif [[ "$OUTPUT_JSON" == true ]]; then
        output_json
    else
        output_table
    fi
}

main


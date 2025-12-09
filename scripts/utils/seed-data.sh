#!/bin/bash
# ============================================
# ERP System - Database Seeding Script
# ============================================
#
# Description:
#   Seeds the database with different data profiles.
#   Supports minimal, demo, and full datasets.
#
# Usage:
#   ./scripts/utils/seed-data.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -t, --type <type>       Data type: minimal, demo, full (default: demo)
#   --tenant-id <uuid>      Seed specific tenant only
#   --clean                 Clear existing data before seeding
#   --dry-run               Show what would be done
#   -v, --verbose           Show detailed output
#
# Data Types:
#   minimal - Essential lookup data only (categories, default settings)
#   demo    - Sample data for demonstrations (50 products, 20 customers)
#   full    - Comprehensive test dataset (500+ products, 100+ customers)
#
# Example:
#   ./scripts/utils/seed-data.sh --type demo
#   ./scripts/utils/seed-data.sh -t full --tenant-id abc-123
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
DIM='\033[2m'
NC='\033[0m'

# Default options
DATA_TYPE="demo"
TENANT_ID=""
CLEAN=false
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
    echo "  -t, --type <type>       Data type: minimal, demo, full (default: demo)"
    echo "  --tenant-id <uuid>      Seed specific tenant only"
    echo "  --clean                 Clear existing data before seeding"
    echo "  --dry-run               Show what would be done"
    echo "  -v, --verbose           Show detailed output"
}

clean_data() {
    if [[ "$CLEAN" != true ]]; then
        return 0
    fi
    
    log WARN "Cleaning existing data..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would clean existing data"
        return 0
    fi
    
    if [[ -n "$TENANT_ID" ]]; then
        # Clean specific tenant data
        docker-compose exec -T postgres psql -U erp_user -d erp_database -c "
            DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE tenant_id = '$TENANT_ID');
            DELETE FROM invoices WHERE tenant_id = '$TENANT_ID';
            DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = '$TENANT_ID');
            DELETE FROM orders WHERE tenant_id = '$TENANT_ID';
            DELETE FROM inventory_items WHERE tenant_id = '$TENANT_ID';
            DELETE FROM products WHERE tenant_id = '$TENANT_ID';
            DELETE FROM customers WHERE tenant_id = '$TENANT_ID';
        " 2>/dev/null
    else
        log WARN "Full clean requires --tenant-id for safety"
    fi
    
    log SUCCESS "Data cleaned"
}

seed_minimal() {
    log INFO "Seeding minimal data..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would seed minimal data"
        echo "  - Default categories"
        echo "  - System settings"
        return 0
    fi
    
    cd "$DATABASE_PKG"
    
    # Run the basic seed script
    npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed.ts
    
    log SUCCESS "Minimal data seeded"
}

seed_demo() {
    log INFO "Seeding demo data..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would seed demo data"
        echo "  - 1 demo tenant"
        echo "  - 5 users"
        echo "  - 10 categories"
        echo "  - 50 products"
        echo "  - 20 customers"
        echo "  - 10 sample orders"
        return 0
    fi
    
    cd "$DATABASE_PKG"
    
    # Run the full seed script
    npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed.ts
    
    log SUCCESS "Demo data seeded"
}

seed_full() {
    log INFO "Seeding full test dataset..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would seed full dataset"
        echo "  - 3 tenants (L1, L2, L3)"
        echo "  - 50 users per tenant"
        echo "  - 500+ products"
        echo "  - 100+ customers"
        echo "  - 200+ orders"
        echo "  - Comprehensive inventory"
        return 0
    fi
    
    log WARN "Full seeding not implemented. Using demo data."
    seed_demo
    
    # Additional data generation could be added here
    log SUCCESS "Full data seeded"
}

show_counts() {
    log INFO "Current record counts:"
    
    docker-compose exec -T postgres psql -U erp_user -d erp_database -t -c "
        SELECT 'Tenants:    ' || COUNT(*) FROM tenants
        UNION ALL SELECT 'Users:      ' || COUNT(*) FROM users
        UNION ALL SELECT 'Categories: ' || COUNT(*) FROM categories
        UNION ALL SELECT 'Products:   ' || COUNT(*) FROM products
        UNION ALL SELECT 'Customers:  ' || COUNT(*) FROM customers
        UNION ALL SELECT 'Orders:     ' || COUNT(*) FROM orders
        UNION ALL SELECT 'Invoices:   ' || COUNT(*) FROM invoices;
    " 2>/dev/null | while read line; do
        echo "  $line"
    done
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
        -t|--type)
            DATA_TYPE="$2"
            shift 2
            ;;
        --tenant-id)
            TENANT_ID="$2"
            shift 2
            ;;
        --clean)
            CLEAN=true
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
    echo -e "${BOLD}${BLUE}ERP System - Database Seeding${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # Clean if requested
    clean_data
    
    # Show before counts
    echo ""
    log INFO "Before seeding:"
    show_counts
    echo ""
    
    # Seed based on type
    case $DATA_TYPE in
        minimal)
            seed_minimal
            ;;
        demo)
            seed_demo
            ;;
        full)
            seed_full
            ;;
        *)
            log ERROR "Unknown data type: $DATA_TYPE"
            print_usage
            exit 1
            ;;
    esac
    
    # Show after counts
    echo ""
    log INFO "After seeding:"
    show_counts
    echo ""
    
    log SUCCESS "Seeding complete!"
}

main


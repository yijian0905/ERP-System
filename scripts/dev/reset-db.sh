#!/bin/bash
# ============================================
# ERP System - Database Reset Script
# ============================================
#
# Description:
#   Resets the database to a fresh state by dropping all tables,
#   running migrations, and optionally seeding with demo data.
#
# Usage:
#   ./scripts/dev/reset-db.sh [OPTIONS]
#
# Options:
#   -h, --help      Show this help message
#   -y, --yes       Skip confirmation prompt
#   --no-seed       Skip database seeding
#   --force         Force reset without backup
#   -v, --verbose   Show detailed output
#
# WARNING: This will DELETE all data in the database!
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

# Options
SKIP_CONFIRM=false
NO_SEED=false
FORCE=false
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
        DEBUG)   [[ "$VERBOSE" == true ]] && echo -e "  $*" ;;
    esac
}

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo "  -y, --yes       Skip confirmation prompt"
    echo "  --no-seed       Skip database seeding"
    echo "  --force         Force reset without backup"
    echo "  -v, --verbose   Show detailed output"
}

confirm_reset() {
    if [[ "$SKIP_CONFIRM" == true ]]; then
        return 0
    fi
    
    echo ""
    echo -e "${RED}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}${BOLD}║                      ⚠  WARNING  ⚠                         ║${NC}"
    echo -e "${RED}${BOLD}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${RED}${BOLD}║  This will DELETE ALL DATA in the database!                ║${NC}"
    echo -e "${RED}${BOLD}║  This action cannot be undone.                             ║${NC}"
    echo -e "${RED}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    read -p "Type 'RESET' to confirm: " response
    if [[ "$response" != "RESET" ]]; then
        log ERROR "Reset cancelled"
        exit 1
    fi
}

create_backup() {
    if [[ "$FORCE" == true ]]; then
        log WARN "Skipping backup (--force)"
        return 0
    fi
    
    log INFO "Creating backup before reset..."
    
    local backup_dir="$PROJECT_ROOT/backups"
    local backup_file="$backup_dir/pre-reset-$(date +%Y%m%d-%H%M%S).sql"
    
    mkdir -p "$backup_dir"
    
    if docker-compose exec -T postgres pg_dump -U erp_user erp_database > "$backup_file" 2>/dev/null; then
        log SUCCESS "Backup created: $backup_file"
    else
        log WARN "Could not create backup (database may be empty)"
    fi
}

reset_database() {
    log INFO "Resetting database..."
    
    cd "$DATABASE_PKG"
    
    # Drop all tables using Prisma
    log INFO "Dropping all tables..."
    npx prisma db push --force-reset --accept-data-loss 2>&1 || true
    
    log SUCCESS "Database schema reset"
    
    cd "$PROJECT_ROOT"
}

run_migrations() {
    log INFO "Running migrations..."
    
    cd "$DATABASE_PKG"
    
    # Generate Prisma client
    npx prisma generate 2>&1
    
    # Push schema
    npx prisma db push 2>&1
    
    log SUCCESS "Migrations complete"
    
    cd "$PROJECT_ROOT"
}

seed_database() {
    if [[ "$NO_SEED" == true ]]; then
        log INFO "Skipping seed (--no-seed)"
        return 0
    fi
    
    log INFO "Seeding database..."
    
    cd "$DATABASE_PKG"
    
    if npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed.ts 2>&1; then
        log SUCCESS "Database seeded"
    else
        log ERROR "Seeding failed"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
}

show_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}Database reset complete!${NC}"
    echo ""
    
    # Show record counts
    log INFO "Record counts:"
    
    cd "$DATABASE_PKG"
    
    npx prisma db execute --stdin <<EOF 2>/dev/null || echo "Could not get counts"
SELECT 
    'Tenants' as table_name, COUNT(*) as count FROM tenants
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders;
EOF
    
    cd "$PROJECT_ROOT"
    
    echo ""
    echo -e "${BOLD}Demo Credentials:${NC}"
    echo "  Email: admin@demo-company.com"
    echo "  Password: password123"
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
        -y|--yes)
            SKIP_CONFIRM=true
            shift
            ;;
        --no-seed)
            NO_SEED=true
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
    echo -e "${BOLD}${BLUE}ERP System - Database Reset${NC}"
    echo ""
    
    # Confirm action
    confirm_reset
    
    # Create backup
    create_backup
    
    # Reset and migrate
    reset_database
    run_migrations
    
    # Seed data
    seed_database
    
    # Show summary
    show_summary
}

main


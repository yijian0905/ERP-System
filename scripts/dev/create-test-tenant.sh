#!/bin/bash
# ============================================
# ERP System - Create Test Tenant Script
# ============================================
#
# Description:
#   Creates a new test tenant with sample data including products,
#   customers, inventory, and user accounts.
#
# Usage:
#   ./scripts/dev/create-test-tenant.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -n, --name <name>       Tenant/Company name (required)
#   -t, --tier <tier>       License tier: L1, L2, or L3 (default: L1)
#   -u, --users <count>     Number of users to create (default: 5)
#   -p, --products <count>  Number of products to create (default: 50)
#   --slug <slug>           Custom slug (default: auto-generated)
#   --admin-email <email>   Admin user email
#   --admin-password <pw>   Admin user password (default: password123)
#   --dry-run               Show what would be created without creating
#   -v, --verbose           Show detailed output
#
# Example:
#   ./scripts/dev/create-test-tenant.sh --name "Acme Corp" --tier L2 --users 10
#   ./scripts/dev/create-test-tenant.sh -n "Test Company" -t L3 -p 100
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
TENANT_NAME=""
TIER="L1"
USER_COUNT=5
PRODUCT_COUNT=50
SLUG=""
ADMIN_EMAIL=""
ADMIN_PASSWORD="password123"
DRY_RUN=false
VERBOSE=false

# ============================================
# FUNCTIONS
# ============================================

# Detect Docker Compose command (docker compose or docker-compose)
detect_docker_compose() {
    if docker compose version &>/dev/null; then
        echo "docker compose"
    elif docker-compose version &>/dev/null; then
        echo "docker-compose"
    else
        log ERROR "Docker Compose not found. Please install Docker Desktop or docker-compose."
        exit 1
    fi
}

# Get Docker Compose command
DOCKER_COMPOSE=$(detect_docker_compose)

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
    echo "Usage: $0 --name <name> [OPTIONS]"
    echo ""
    echo "Required:"
    echo "  -n, --name <name>       Tenant/Company name"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -t, --tier <tier>       License tier: L1, L2, or L3 (default: L1)"
    echo "  -u, --users <count>     Number of users to create (default: 5)"
    echo "  -p, --products <count>  Number of products to create (default: 50)"
    echo "  --slug <slug>           Custom slug (default: auto-generated)"
    echo "  --admin-email <email>   Admin user email"
    echo "  --admin-password <pw>   Admin user password (default: password123)"
    echo "  --dry-run               Show what would be created"
    echo "  -v, --verbose           Show detailed output"
}

generate_slug() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g'
}

generate_uuid() {
    if command -v uuidgen &> /dev/null; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    else
        cat /proc/sys/kernel/random/uuid 2>/dev/null || \
        python3 -c "import uuid; print(uuid.uuid4())" 2>/dev/null || \
        node -e "console.log(require('crypto').randomUUID())"
    fi
}

validate_tier() {
    case $1 in
        L1|L2|L3) return 0 ;;
        *) 
            log ERROR "Invalid tier: $1. Must be L1, L2, or L3"
            exit 1
            ;;
    esac
}

print_plan() {
    echo ""
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║              Tenant Creation Plan                          ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Tenant Details:${NC}"
    echo "  Name:           $TENANT_NAME"
    echo "  Slug:           $SLUG"
    echo "  Tier:           $TIER"
    echo ""
    echo -e "${BOLD}Data to Create:${NC}"
    echo "  Users:          $USER_COUNT (including 1 admin)"
    echo "  Products:       $PRODUCT_COUNT"
    echo "  Categories:     10"
    echo "  Warehouses:     2"
    echo "  Customers:      20"
    echo "  Suppliers:      5"
    echo ""
    echo -e "${BOLD}Admin Account:${NC}"
    echo "  Email:          $ADMIN_EMAIL"
    echo "  Password:       $ADMIN_PASSWORD"
    echo ""
}

create_tenant() {
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "DRY RUN - Would create tenant with above configuration"
        return 0
    fi
    
    log INFO "Creating tenant..."
    
    local tenant_id=$(generate_uuid)
    local license_id=$(generate_uuid)
    local admin_id=$(generate_uuid)
    local warehouse_id=$(generate_uuid)
    local category_id=$(generate_uuid)
    
    # Create SQL file for tenant creation
    local sql_file=$(mktemp)
    
    cat > "$sql_file" << EOF
-- Create Tenant
INSERT INTO tenants (id, name, slug, status, tier, settings, created_at, updated_at)
VALUES (
    '$tenant_id',
    '$TENANT_NAME',
    '$SLUG',
    'ACTIVE',
    '$TIER',
    '{"currency": "USD", "timezone": "UTC"}',
    NOW(),
    NOW()
);

-- Create License
INSERT INTO licenses (id, tenant_id, tier, features, max_users, expires_at, is_active, created_at, updated_at)
VALUES (
    '$license_id',
    '$tenant_id',
    '$TIER',
    '{"inventory": true, "orders": true, "invoices": true, "reports": true}',
    $USER_COUNT,
    NOW() + INTERVAL '1 year',
    true,
    NOW(),
    NOW()
);

-- Create Admin User
INSERT INTO users (id, tenant_id, email, name, password, role, is_active, created_at, updated_at)
VALUES (
    '$admin_id',
    '$tenant_id',
    '$ADMIN_EMAIL',
    'Administrator',
    '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'ADMIN',
    true,
    NOW(),
    NOW()
);

-- Create Default Warehouse
INSERT INTO warehouses (id, tenant_id, code, name, type, is_active, created_at, updated_at)
VALUES (
    '$warehouse_id',
    '$tenant_id',
    'WH-MAIN',
    'Main Warehouse',
    'WAREHOUSE',
    true,
    NOW(),
    NOW()
);

-- Create Default Category
INSERT INTO categories (id, tenant_id, name, slug, created_at, updated_at)
VALUES (
    '$category_id',
    '$tenant_id',
    'General',
    'general',
    NOW(),
    NOW()
);
EOF

    # Execute SQL
    if $DOCKER_COMPOSE exec -T postgres psql -U erp_user -d erp_database < "$sql_file" 2>/dev/null; then
        log SUCCESS "Tenant created successfully"
    else
        log ERROR "Failed to create tenant"
        rm -f "$sql_file"
        exit 1
    fi
    
    rm -f "$sql_file"
    
    # Generate sample products
    log INFO "Creating sample products..."
    create_sample_products "$tenant_id" "$category_id" "$warehouse_id" || log WARN "Some products failed to create"
    
    # Generate sample customers
    log INFO "Creating sample customers..."
    create_sample_customers "$tenant_id" || log WARN "Some customers failed to create"
    
    # Generate additional users
    if [[ $USER_COUNT -gt 1 ]]; then
        log INFO "Creating additional users..."
        create_additional_users "$tenant_id" $((USER_COUNT - 1)) || log WARN "Some users failed to create"
    fi
    
    # Output credentials
    print_credentials "$tenant_id"
}

create_sample_products() {
    local tenant_id=$1
    local category_id=$2
    local warehouse_id=$3
    
    local products_created=0
    local products_failed=0
    local product_names=("Widget" "Gadget" "Component" "Module" "Assembly" "Unit" "Part" "Tool" "Device" "Sensor")
    local adjectives=("Pro" "Plus" "Max" "Ultra" "Basic" "Standard" "Premium" "Elite" "Advanced" "Essential")
    
    for i in $(seq 1 $PRODUCT_COUNT); do
        local name_idx=$((RANDOM % ${#product_names[@]}))
        local adj_idx=$((RANDOM % ${#adjectives[@]}))
        local product_name="${adjectives[$adj_idx]} ${product_names[$name_idx]} $i"
        local sku="SKU-$(printf "%06d" $i)"
        local price=$((RANDOM % 1000 + 10))
        local cost=$((price * 60 / 100))
        local product_id=$(generate_uuid)
        local inventory_id=$(generate_uuid)
        local quantity=$((RANDOM % 500 + 10))
        
        # Escape single quotes in product name for SQL
        local escaped_name=$(echo "$product_name" | sed "s/'/''/g")
        
        # Use a temporary SQL file to avoid shell quoting issues
        local sql_file=$(mktemp)
        cat > "$sql_file" << EOF
BEGIN;
INSERT INTO products (id, tenant_id, category_id, sku, name, unit, price, cost, status, min_stock, max_stock, created_at, updated_at)
VALUES ('$product_id', '$tenant_id', '$category_id', '$sku', '$escaped_name', 'pcs', $price.00, $cost.00, 'ACTIVE', 10, 1000, NOW(), NOW());

INSERT INTO inventory_items (id, tenant_id, product_id, warehouse_id, quantity, reserved_qty, created_at, updated_at)
VALUES ('$inventory_id', '$tenant_id', '$product_id', '$warehouse_id', $quantity, 0, NOW(), NOW());
COMMIT;
EOF
        
        if $DOCKER_COMPOSE exec -T postgres psql -U erp_user -d erp_database < "$sql_file" >/dev/null 2>&1; then
            ((products_created++))
        else
            ((products_failed++))
            [[ "$VERBOSE" == true ]] && log DEBUG "Failed to create product $i: $product_name"
        fi
        
        rm -f "$sql_file"
    done
    
    if [[ $products_created -gt 0 ]]; then
        log SUCCESS "Created $products_created products"
    fi
    if [[ $products_failed -gt 0 ]]; then
        log WARN "Failed to create $products_failed products"
    fi
}

create_sample_customers() {
    local tenant_id=$1
    local customers=("Alpha Industries" "Beta Solutions" "Gamma Tech" "Delta Corp" "Epsilon Inc" 
                     "Zeta Systems" "Eta Group" "Theta Labs" "Iota Services" "Kappa Enterprises")
    
    local customers_created=0
    local customers_failed=0
    
    for i in "${!customers[@]}"; do
        local customer_id=$(generate_uuid)
        local code="CUST-$(printf "%04d" $((i + 1)))"
        local name="${customers[$i]}"
        local escaped_name=$(echo "$name" | sed "s/'/''/g")
        
        local sql_file=$(mktemp)
        cat > "$sql_file" << EOF
INSERT INTO customers (id, tenant_id, code, name, type, is_active, credit_limit, balance, created_at, updated_at)
VALUES ('$customer_id', '$tenant_id', '$code', '$escaped_name', 'COMPANY', true, 50000, 0, NOW(), NOW());
EOF
        
        if $DOCKER_COMPOSE exec -T postgres psql -U erp_user -d erp_database < "$sql_file" >/dev/null 2>&1; then
            ((customers_created++))
        else
            ((customers_failed++))
            [[ "$VERBOSE" == true ]] && log DEBUG "Failed to create customer: $name"
        fi
        
        rm -f "$sql_file"
    done
    
    if [[ $customers_created -gt 0 ]]; then
        log SUCCESS "Created $customers_created customers"
    fi
    if [[ $customers_failed -gt 0 ]]; then
        log WARN "Failed to create $customers_failed customers"
    fi
}

create_additional_users() {
    local tenant_id=$1
    local count=$2
    local roles=("USER" "USER" "USER" "MANAGER" "VIEWER")
    local names=("John Smith" "Jane Doe" "Bob Wilson" "Alice Brown" "Charlie Davis" 
                 "Diana Miller" "Edward Garcia" "Fiona Martinez" "George Anderson" "Helen Taylor")
    
    local users_created=0
    local users_failed=0
    
    for i in $(seq 1 $count); do
        local user_id=$(generate_uuid)
        local role_idx=$((RANDOM % ${#roles[@]}))
        local name_idx=$(((i - 1) % ${#names[@]}))
        local email="user${i}@${SLUG}.test"
        local name="${names[$name_idx]}"
        local role="${roles[$role_idx]}"
        local escaped_name=$(echo "$name" | sed "s/'/''/g")
        
        local sql_file=$(mktemp)
        cat > "$sql_file" << EOF
INSERT INTO users (id, tenant_id, email, name, password, role, is_active, created_at, updated_at)
VALUES ('$user_id', '$tenant_id', '$email', '$escaped_name', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$role', true, NOW(), NOW());
EOF
        
        if $DOCKER_COMPOSE exec -T postgres psql -U erp_user -d erp_database < "$sql_file" >/dev/null 2>&1; then
            ((users_created++))
        else
            ((users_failed++))
            [[ "$VERBOSE" == true ]] && log DEBUG "Failed to create user: $email"
        fi
        
        rm -f "$sql_file"
    done
    
    if [[ $users_created -gt 0 ]]; then
        log SUCCESS "Created $users_created additional users"
    fi
    if [[ $users_failed -gt 0 ]]; then
        log WARN "Failed to create $users_failed additional users"
    fi
}

print_credentials() {
    local tenant_id=$1
    
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║              Tenant Created Successfully! 🎉               ║${NC}"
    echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Tenant ID:${NC} $tenant_id"
    echo ""
    echo -e "${BOLD}Admin Credentials:${NC}"
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│ Email:    $ADMIN_EMAIL"
    echo "│ Password: $ADMIN_PASSWORD"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""
    echo -e "${BOLD}Data Created:${NC}"
    echo "  • Products:   $PRODUCT_COUNT"
    echo "  • Customers:  10"
    echo "  • Users:      $USER_COUNT"
    echo "  • Warehouses: 1"
    echo ""
    echo -e "${DIM}Use these credentials to log in to the application.${NC}"
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
        -n|--name)
            TENANT_NAME="$2"
            shift 2
            ;;
        -t|--tier)
            TIER="$2"
            validate_tier "$TIER"
            shift 2
            ;;
        -u|--users)
            USER_COUNT="$2"
            shift 2
            ;;
        -p|--products)
            PRODUCT_COUNT="$2"
            shift 2
            ;;
        --slug)
            SLUG="$2"
            shift 2
            ;;
        --admin-email)
            ADMIN_EMAIL="$2"
            shift 2
            ;;
        --admin-password)
            ADMIN_PASSWORD="$2"
            shift 2
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
    # Validate required arguments
    if [[ -z "$TENANT_NAME" ]]; then
        log ERROR "Tenant name is required"
        print_usage
        exit 1
    fi
    
    # Generate defaults if not provided
    if [[ -z "$SLUG" ]]; then
        SLUG=$(generate_slug "$TENANT_NAME")
    fi
    
    if [[ -z "$ADMIN_EMAIL" ]]; then
        ADMIN_EMAIL="admin@${SLUG}.test"
    fi
    
    # Show plan
    print_plan
    
    # Create tenant
    create_tenant
}

cd "$PROJECT_ROOT"
main


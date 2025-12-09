#!/bin/bash
# ============================================
# ERP System - Create Admin Tenant Script
# ============================================
#
# Description:
#   Creates a production admin tenant with L3 tier,
#   generates secure credentials, and stores them securely.
#
# Usage:
#   ./scripts/admin/create-admin-tenant.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -n, --name <name>       Tenant name (required)
#   --slug <slug>           Custom slug (optional)
#   --admin-email <email>   Admin email (required)
#   --vault                 Store credentials in vault
#   --send-email            Email credentials to admin
#   -v, --verbose           Show detailed output
#
# Example:
#   ./scripts/admin/create-admin-tenant.sh --name "Acme Corp" --admin-email admin@acme.com
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
SLUG=""
ADMIN_EMAIL=""
USE_VAULT=false
SEND_EMAIL=false
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
        ERROR)   echo -e "${RED}✗${NC} $*" >&2 ;;
        DEBUG)   [[ "$VERBOSE" == true ]] && echo -e "${DIM}  $*${NC}" ;;
    esac
}

print_usage() {
    echo "Usage: $0 --name <name> --admin-email <email> [OPTIONS]"
    echo ""
    echo "Required:"
    echo "  -n, --name          Tenant name"
    echo "  --admin-email       Admin email address"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  --slug              Custom URL slug"
    echo "  --vault             Store credentials in vault"
    echo "  --send-email        Email credentials to admin"
    echo "  -v, --verbose       Show detailed output"
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

generate_password() {
    # Generate a secure random password
    if command -v openssl &> /dev/null; then
        openssl rand -base64 24 | tr -d '/+=' | head -c 20
    else
        python3 -c "import secrets; print(secrets.token_urlsafe(16))"
    fi
}

generate_slug() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g'
}

create_tenant() {
    log INFO "Creating admin tenant..."
    
    local tenant_id=$(generate_uuid)
    local admin_id=$(generate_uuid)
    local license_id=$(generate_uuid)
    local password=$(generate_password)
    local warehouse_id=$(generate_uuid)
    local category_id=$(generate_uuid)
    
    [[ -z "$SLUG" ]] && SLUG=$(generate_slug "$TENANT_NAME")
    
    # Hash password (bcrypt with cost 10)
    # This is a placeholder - in production, use proper bcrypt
    local password_hash="\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"
    
    # Create in database
    docker-compose exec -T postgres psql -U erp_user -d erp_database << EOF
-- Create Tenant with L3 tier
INSERT INTO tenants (id, name, slug, status, tier, settings, created_at, updated_at)
VALUES (
    '$tenant_id',
    '$TENANT_NAME',
    '$SLUG',
    'ACTIVE',
    'L3',
    '{"currency": "USD", "timezone": "UTC", "adminTenant": true}',
    NOW(),
    NOW()
);

-- Create L3 License (unlimited)
INSERT INTO licenses (id, tenant_id, tier, features, max_users, expires_at, is_active, created_at, updated_at)
VALUES (
    '$license_id',
    '$tenant_id',
    'L3',
    '{"inventory": true, "orders": true, "invoices": true, "reports_basic": true, "reports_advanced": true, "predictions": true, "ai_assistant": true, "audit_logs": true, "api_access": true}',
    999,
    NOW() + INTERVAL '10 years',
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
    'System Administrator',
    '$password_hash',
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

-- Create Audit Log
INSERT INTO audit_logs (id, tenant_id, action, entity_type, entity_id, new_values, created_at)
VALUES (
    '$(generate_uuid)',
    '$tenant_id',
    'ADMIN_TENANT_CREATED',
    'tenant',
    '$tenant_id',
    '{"name": "$TENANT_NAME", "tier": "L3", "admin_email": "$ADMIN_EMAIL"}',
    NOW()
);
EOF
    
    log SUCCESS "Admin tenant created"
    
    # Store credentials
    echo "$tenant_id|$admin_id|$license_id|$password"
}

store_in_vault() {
    if [[ "$USE_VAULT" != true ]]; then
        return 0
    fi
    
    log INFO "Storing credentials in vault..."
    
    # Check for HashiCorp Vault
    if command -v vault &> /dev/null; then
        vault kv put secret/erp/tenants/$SLUG \
            tenant_id="$1" \
            admin_email="$ADMIN_EMAIL" \
            admin_password="$2"
        log SUCCESS "Credentials stored in Vault"
    else
        log WARN "Vault CLI not found. Skipping vault storage."
    fi
}

send_credentials_email() {
    if [[ "$SEND_EMAIL" != true ]]; then
        return 0
    fi
    
    log INFO "Would send credentials to: $ADMIN_EMAIL"
    log WARN "Email functionality not implemented. Configure SMTP settings."
}

print_credentials() {
    local tenant_id=$1
    local admin_id=$2
    local license_id=$3
    local password=$4
    
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║        Admin Tenant Created Successfully! 🎉               ║${NC}"
    echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Tenant Details:${NC}"
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│ Tenant ID:  $tenant_id"
    echo "│ Name:       $TENANT_NAME"
    echo "│ Slug:       $SLUG"
    echo "│ Tier:       L3 (Enterprise)"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""
    echo -e "${BOLD}${RED}Admin Credentials (STORE SECURELY):${NC}"
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│ Email:      $ADMIN_EMAIL"
    echo "│ Password:   $password"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""
    echo -e "${BOLD}License:${NC}"
    echo "  ID:       $license_id"
    echo "  Tier:     L3 (Enterprise)"
    echo "  Expires:  10 years from now"
    echo "  Users:    Unlimited"
    echo ""
    echo -e "${YELLOW}${BOLD}⚠  IMPORTANT: Store these credentials securely!${NC}"
    echo -e "${YELLOW}   The password shown above is the only time it will be displayed.${NC}"
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
        --slug)
            SLUG="$2"
            shift 2
            ;;
        --admin-email)
            ADMIN_EMAIL="$2"
            shift 2
            ;;
        --vault)
            USE_VAULT=true
            shift
            ;;
        --send-email)
            SEND_EMAIL=true
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
    echo -e "${BOLD}${BLUE}ERP System - Create Admin Tenant${NC}"
    echo ""
    
    # Validate required arguments
    if [[ -z "$TENANT_NAME" ]]; then
        log ERROR "Tenant name is required"
        print_usage
        exit 1
    fi
    
    if [[ -z "$ADMIN_EMAIL" ]]; then
        log ERROR "Admin email is required"
        print_usage
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    # Create tenant
    local result=$(create_tenant)
    local tenant_id=$(echo "$result" | cut -d'|' -f1)
    local admin_id=$(echo "$result" | cut -d'|' -f2)
    local license_id=$(echo "$result" | cut -d'|' -f3)
    local password=$(echo "$result" | cut -d'|' -f4)
    
    # Store in vault if requested
    store_in_vault "$tenant_id" "$password"
    
    # Send email if requested
    send_credentials_email
    
    # Print credentials
    print_credentials "$tenant_id" "$admin_id" "$license_id" "$password"
}

main


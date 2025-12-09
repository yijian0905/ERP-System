#!/bin/bash
# ============================================
# ERP System - Generate Production License
# ============================================
#
# Description:
#   Generates production license keys with full validation
#   and database storage.
#
# Usage:
#   ./scripts/admin/generate-license.sh [OPTIONS]
#
# Options:
#   -h, --help                Show this help message
#   -t, --tenant-id <uuid>    Tenant ID (required)
#   --tier <tier>             License tier: L1, L2, L3 (required)
#   -e, --expires <date>      Expiration date: YYYY-MM-DD (default: 1 year)
#   -u, --max-users <count>   Maximum users
#   --features <json>         Custom features JSON
#   --email <email>           Email license to customer
#   -v, --verbose             Show detailed output
#
# Example:
#   ./scripts/admin/generate-license.sh --tenant-id abc-123 --tier L2
#   ./scripts/admin/generate-license.sh -t def-456 --tier L3 --max-users 100
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
TENANT_ID=""
TIER=""
EXPIRES=""
MAX_USERS=""
FEATURES=""
EMAIL=""
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
    echo "Usage: $0 --tenant-id <uuid> --tier <tier> [OPTIONS]"
    echo ""
    echo "Required:"
    echo "  -t, --tenant-id <uuid>    Tenant ID"
    echo "  --tier <tier>             License tier: L1, L2, L3"
    echo ""
    echo "Options:"
    echo "  -h, --help                Show this help message"
    echo "  -e, --expires <date>      Expiration date: YYYY-MM-DD"
    echo "  -u, --max-users <count>   Maximum users"
    echo "  --features <json>         Custom features JSON"
    echo "  --email <email>           Email license to customer"
    echo "  -v, --verbose             Show detailed output"
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

validate_tenant() {
    log INFO "Validating tenant..."
    
    local exists=$(docker-compose exec -T postgres psql -U erp_user -d erp_database -t -c \
        "SELECT COUNT(*) FROM tenants WHERE id = '$TENANT_ID'" 2>/dev/null | tr -d ' ')
    
    if [[ "$exists" == "0" ]]; then
        log ERROR "Tenant not found: $TENANT_ID"
        exit 1
    fi
    
    # Get tenant info
    local tenant_info=$(docker-compose exec -T postgres psql -U erp_user -d erp_database -t -c \
        "SELECT name, tier FROM tenants WHERE id = '$TENANT_ID'" 2>/dev/null)
    
    log SUCCESS "Tenant verified: $tenant_info"
}

get_tier_defaults() {
    case $TIER in
        L1)
            [[ -z "$MAX_USERS" ]] && MAX_USERS=5
            [[ -z "$FEATURES" ]] && FEATURES='{"inventory":true,"orders":true,"invoices":true,"reports_basic":true}'
            ;;
        L2)
            [[ -z "$MAX_USERS" ]] && MAX_USERS=25
            [[ -z "$FEATURES" ]] && FEATURES='{"inventory":true,"orders":true,"invoices":true,"reports_basic":true,"reports_advanced":true,"predictions":true,"multi_warehouse":true}'
            ;;
        L3)
            [[ -z "$MAX_USERS" ]] && MAX_USERS=999
            [[ -z "$FEATURES" ]] && FEATURES='{"inventory":true,"orders":true,"invoices":true,"reports_basic":true,"reports_advanced":true,"predictions":true,"multi_warehouse":true,"ai_assistant":true,"audit_logs":true,"api_access":true}'
            ;;
    esac
    
    [[ -z "$EXPIRES" ]] && EXPIRES=$(date -d "+1 year" +%Y-%m-%d 2>/dev/null || date -v+1y +%Y-%m-%d)
}

generate_license() {
    local license_id=$(generate_uuid)
    
    log INFO "Generating license..."
    
    # Create license in database
    docker-compose exec -T postgres psql -U erp_user -d erp_database -c "
        INSERT INTO licenses (id, tenant_id, tier, features, max_users, expires_at, is_active, created_at, updated_at)
        VALUES (
            '$license_id',
            '$TENANT_ID',
            '$TIER',
            '$FEATURES'::jsonb,
            $MAX_USERS,
            '${EXPIRES}T23:59:59Z'::timestamp,
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT DO NOTHING;
        
        -- Update tenant tier
        UPDATE tenants SET tier = '$TIER', updated_at = NOW() WHERE id = '$TENANT_ID';
    " 2>/dev/null
    
    # Generate license key (JWT-like structure)
    local payload=$(cat << EOF
{
    "license_id": "$license_id",
    "tenant_id": "$TENANT_ID",
    "tier": "$TIER",
    "max_users": $MAX_USERS,
    "features": $FEATURES,
    "issued_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "expires_at": "${EXPIRES}T23:59:59Z",
    "issuer": "erp-system-prod"
}
EOF
)
    
    local payload_b64=$(echo -n "$payload" | base64 | tr -d '\n' | tr '+/' '-_' | tr -d '=')
    local signature=$(echo -n "$payload_b64" | sha256sum | cut -d' ' -f1 | head -c 43)
    local license_key="ERP-$TIER-${payload_b64:0:20}.${signature:0:20}"
    
    log SUCCESS "License generated: $license_id"
    
    echo "$license_id|$license_key"
}

create_audit_log() {
    local license_id=$1
    
    docker-compose exec -T postgres psql -U erp_user -d erp_database -c "
        INSERT INTO audit_logs (id, tenant_id, action, entity_type, entity_id, new_values, created_at)
        VALUES (
            '$(generate_uuid)',
            '$TENANT_ID',
            'LICENSE_GENERATED',
            'license',
            '$license_id',
            '{\"tier\": \"$TIER\", \"max_users\": $MAX_USERS, \"expires\": \"$EXPIRES\"}'::jsonb,
            NOW()
        );
    " 2>/dev/null || log DEBUG "Could not create audit log"
}

send_email() {
    if [[ -z "$EMAIL" ]]; then
        return 0
    fi
    
    log INFO "Would send license to: $EMAIL"
    log WARN "Email sending not implemented. Configure SMTP settings."
}

print_license_info() {
    local license_id=$1
    local license_key=$2
    
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║              License Generated Successfully! 🔑            ║${NC}"
    echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}License Details:${NC}"
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│ License ID: $license_id"
    echo "│ Tenant ID:  $TENANT_ID"
    echo "│ Tier:       $TIER"
    echo "│ Max Users:  $MAX_USERS"
    echo "│ Expires:    $EXPIRES"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""
    echo -e "${BOLD}License Key:${NC}"
    echo -e "${CYAN}$license_key${NC}"
    echo ""
    echo -e "${BOLD}Features:${NC}"
    echo "$FEATURES" | python3 -m json.tool 2>/dev/null || echo "$FEATURES"
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
        -t|--tenant-id)
            TENANT_ID="$2"
            shift 2
            ;;
        --tier)
            TIER="$2"
            shift 2
            ;;
        -e|--expires)
            EXPIRES="$2"
            shift 2
            ;;
        -u|--max-users)
            MAX_USERS="$2"
            shift 2
            ;;
        --features)
            FEATURES="$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
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
    echo -e "${BOLD}${BLUE}ERP System - Production License Generator${NC}"
    echo ""
    
    # Validate required arguments
    if [[ -z "$TENANT_ID" ]]; then
        log ERROR "Tenant ID is required"
        print_usage
        exit 1
    fi
    
    if [[ -z "$TIER" ]]; then
        log ERROR "Tier is required"
        print_usage
        exit 1
    fi
    
    case $TIER in
        L1|L2|L3) ;;
        *)
            log ERROR "Invalid tier: $TIER. Must be L1, L2, or L3"
            exit 1
            ;;
    esac
    
    cd "$PROJECT_ROOT"
    
    # Validate tenant
    validate_tenant
    
    # Get tier defaults
    get_tier_defaults
    
    # Generate license
    local result=$(generate_license)
    local license_id=$(echo "$result" | cut -d'|' -f1)
    local license_key=$(echo "$result" | cut -d'|' -f2)
    
    # Create audit log
    create_audit_log "$license_id"
    
    # Send email if requested
    send_email
    
    # Print license info
    print_license_info "$license_id" "$license_key"
}

main


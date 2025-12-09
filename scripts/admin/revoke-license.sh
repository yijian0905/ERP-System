#!/bin/bash
# ============================================
# ERP System - Revoke License Script
# ============================================
#
# Description:
#   Revokes a license key, preventing further use.
#
# Usage:
#   ./scripts/admin/revoke-license.sh [OPTIONS]
#
# Options:
#   -h, --help                Show this help message
#   -l, --license-id <uuid>   License ID to revoke
#   -t, --tenant-id <uuid>    Revoke all licenses for tenant
#   --notify                  Send notification to customer
#   --reason <reason>         Reason for revocation
#   -v, --verbose             Show detailed output
#
# Example:
#   ./scripts/admin/revoke-license.sh --license-id abc-123
#   ./scripts/admin/revoke-license.sh --tenant-id def-456 --reason "Non-payment"
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
NC='\033[0m'

# Default options
LICENSE_ID=""
TENANT_ID=""
NOTIFY=false
REASON=""
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
    esac
}

print_usage() {
    echo "Usage: $0 --license-id <uuid> | --tenant-id <uuid> [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help                Show this help message"
    echo "  -l, --license-id <uuid>   License ID to revoke"
    echo "  -t, --tenant-id <uuid>    Revoke all licenses for tenant"
    echo "  --notify                  Send notification to customer"
    echo "  --reason <reason>         Reason for revocation"
    echo "  -v, --verbose             Show detailed output"
}

generate_uuid() {
    cat /proc/sys/kernel/random/uuid 2>/dev/null || \
    python3 -c "import uuid; print(uuid.uuid4())" 2>/dev/null || \
    node -e "console.log(require('crypto').randomUUID())"
}

confirm_revocation() {
    echo ""
    echo -e "${RED}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}${BOLD}║                      ⚠  WARNING  ⚠                         ║${NC}"
    echo -e "${RED}${BOLD}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${RED}${BOLD}║  This will REVOKE the license(s)!                          ║${NC}"
    echo -e "${RED}${BOLD}║  The customer will lose access to licensed features.       ║${NC}"
    echo -e "${RED}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    read -p "Type 'REVOKE' to confirm: " response
    if [[ "$response" != "REVOKE" ]]; then
        log INFO "Revocation cancelled"
        exit 0
    fi
}

revoke_by_id() {
    log INFO "Revoking license: $LICENSE_ID"
    
    # Get license info before revocation
    local license_info=$(docker-compose exec -T postgres psql -U erp_user -d erp_database -t -c \
        "SELECT tenant_id, tier FROM licenses WHERE id = '$LICENSE_ID'" 2>/dev/null)
    
    if [[ -z "$license_info" ]]; then
        log ERROR "License not found: $LICENSE_ID"
        exit 1
    fi
    
    # Revoke license
    docker-compose exec -T postgres psql -U erp_user -d erp_database -c "
        UPDATE licenses 
        SET is_active = false, updated_at = NOW() 
        WHERE id = '$LICENSE_ID';
    " 2>/dev/null
    
    log SUCCESS "License revoked: $LICENSE_ID"
    
    # Create audit log
    create_audit_log "$LICENSE_ID" "$(echo $license_info | cut -d'|' -f1 | tr -d ' ')"
}

revoke_by_tenant() {
    log INFO "Revoking all licenses for tenant: $TENANT_ID"
    
    # Count licenses
    local count=$(docker-compose exec -T postgres psql -U erp_user -d erp_database -t -c \
        "SELECT COUNT(*) FROM licenses WHERE tenant_id = '$TENANT_ID' AND is_active = true" 2>/dev/null | tr -d ' ')
    
    if [[ "$count" == "0" ]]; then
        log WARN "No active licenses found for tenant: $TENANT_ID"
        return 0
    fi
    
    log INFO "Found $count active license(s)"
    
    # Revoke all licenses
    docker-compose exec -T postgres psql -U erp_user -d erp_database -c "
        UPDATE licenses 
        SET is_active = false, updated_at = NOW() 
        WHERE tenant_id = '$TENANT_ID';
        
        UPDATE tenants 
        SET status = 'SUSPENDED', updated_at = NOW() 
        WHERE id = '$TENANT_ID';
    " 2>/dev/null
    
    log SUCCESS "Revoked $count license(s) for tenant"
    
    # Create audit log
    create_audit_log "" "$TENANT_ID"
}

create_audit_log() {
    local license_id=$1
    local tenant_id=$2
    
    docker-compose exec -T postgres psql -U erp_user -d erp_database -c "
        INSERT INTO audit_logs (id, tenant_id, action, entity_type, entity_id, new_values, created_at)
        VALUES (
            '$(generate_uuid)',
            '$tenant_id',
            'LICENSE_REVOKED',
            'license',
            '${license_id:-null}',
            '{\"reason\": \"${REASON:-No reason provided}\"}'::jsonb,
            NOW()
        );
    " 2>/dev/null || log WARN "Could not create audit log"
}

send_notification() {
    if [[ "$NOTIFY" != true ]]; then
        return 0
    fi
    
    log INFO "Would send revocation notification"
    log WARN "Email notifications not implemented"
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
        -l|--license-id)
            LICENSE_ID="$2"
            shift 2
            ;;
        -t|--tenant-id)
            TENANT_ID="$2"
            shift 2
            ;;
        --notify)
            NOTIFY=true
            shift
            ;;
        --reason)
            REASON="$2"
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
    echo -e "${BOLD}${BLUE}ERP System - License Revocation${NC}"
    echo ""
    
    if [[ -z "$LICENSE_ID" ]] && [[ -z "$TENANT_ID" ]]; then
        log ERROR "Either --license-id or --tenant-id is required"
        print_usage
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    # Confirm action
    confirm_revocation
    
    # Revoke
    if [[ -n "$LICENSE_ID" ]]; then
        revoke_by_id
    else
        revoke_by_tenant
    fi
    
    # Send notification
    send_notification
    
    echo ""
    log SUCCESS "Revocation complete"
    echo ""
}

main


#!/bin/bash
# ============================================
# ERP System - Generate Test License Script
# ============================================
#
# Description:
#   Generates test license keys for development and testing purposes.
#   Licenses are stored in the licenses/test/ directory.
#
# Usage:
#   ./scripts/dev/generate-test-license.sh [OPTIONS]
#
# Options:
#   -h, --help                Show this help message
#   -t, --tenant-id <uuid>    Tenant ID (required)
#   --tier <tier>             License tier: L1, L2, or L3 (default: L1)
#   -e, --expires <date>      Expiration date: YYYY-MM-DD (default: 1 year)
#   -u, --max-users <count>   Maximum users (default: based on tier)
#   --features <json>         Custom features JSON
#   -o, --output <file>       Output file path
#   --json                    Output as JSON only (for scripting)
#   -v, --verbose             Show detailed output
#
# Example:
#   ./scripts/dev/generate-test-license.sh --tenant-id abc-123 --tier L2
#   ./scripts/dev/generate-test-license.sh -t def-456 --tier L3 --expires 2025-12-31
#
# Author: ERP System Team
# ============================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LICENSES_DIR="$PROJECT_ROOT/licenses/test"

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
TIER="L1"
EXPIRES=""
MAX_USERS=""
FEATURES=""
OUTPUT_FILE=""
JSON_ONLY=false
VERBOSE=false

# ============================================
# FUNCTIONS
# ============================================

log() {
    [[ "$JSON_ONLY" == true ]] && return
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
    echo "Usage: $0 --tenant-id <uuid> [OPTIONS]"
    echo ""
    echo "Required:"
    echo "  -t, --tenant-id <uuid>    Tenant ID"
    echo ""
    echo "Options:"
    echo "  -h, --help                Show this help message"
    echo "  --tier <tier>             License tier: L1, L2, or L3 (default: L1)"
    echo "  -e, --expires <date>      Expiration date: YYYY-MM-DD (default: 1 year)"
    echo "  -u, --max-users <count>   Maximum users (default: based on tier)"
    echo "  --features <json>         Custom features JSON"
    echo "  -o, --output <file>       Output file path"
    echo "  --json                    Output as JSON only"
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

validate_tenant_id() {
    local tenant_id=$1
    
    # Check UUID format
    if [[ ! "$tenant_id" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
        log ERROR "Invalid tenant ID format. Must be a valid UUID."
        exit 1
    fi
    
    # Check if tenant exists in database
    local exists=$(docker-compose exec -T postgres psql -U erp_user -d erp_database -t -c \
        "SELECT COUNT(*) FROM tenants WHERE id = '$tenant_id'" 2>/dev/null | tr -d ' ')
    
    if [[ "$exists" == "0" ]]; then
        log WARN "Tenant ID not found in database. Proceeding anyway for test purposes."
    else
        log DEBUG "Tenant ID verified in database"
    fi
}

get_default_max_users() {
    case $1 in
        L1) echo 5 ;;
        L2) echo 25 ;;
        L3) echo 999 ;;
        *) echo 5 ;;
    esac
}

get_default_features() {
    case $1 in
        L1)
            echo '{"inventory":true,"orders":true,"invoices":true,"reports_basic":true}'
            ;;
        L2)
            echo '{"inventory":true,"orders":true,"invoices":true,"reports_basic":true,"reports_advanced":true,"predictions":true,"multi_warehouse":true}'
            ;;
        L3)
            echo '{"inventory":true,"orders":true,"invoices":true,"reports_basic":true,"reports_advanced":true,"predictions":true,"multi_warehouse":true,"ai_assistant":true,"audit_logs":true,"api_access":true,"custom_integrations":true}'
            ;;
        *) echo '{}' ;;
    esac
}

generate_license_key() {
    # Create a JWT-like structure (simplified for testing)
    local header='{"alg":"HS256","typ":"JWT"}'
    local payload=$(cat << EOF
{
    "license_id": "$(generate_uuid)",
    "tenant_id": "$TENANT_ID",
    "tier": "$TIER",
    "max_users": $MAX_USERS,
    "features": $FEATURES,
    "issued_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "expires_at": "${EXPIRES}T23:59:59Z",
    "issuer": "erp-system-dev"
}
EOF
)
    
    # Base64 encode (simplified - in production use proper JWT signing)
    local header_b64=$(echo -n "$header" | base64 | tr -d '\n' | tr '+/' '-_' | tr -d '=')
    local payload_b64=$(echo -n "$payload" | base64 | tr -d '\n' | tr '+/' '-_' | tr -d '=')
    
    # Generate a pseudo-signature (for testing only)
    local signature=$(echo -n "${header_b64}.${payload_b64}" | sha256sum | cut -d' ' -f1 | head -c 43)
    local signature_b64=$(echo -n "$signature" | base64 | tr -d '\n' | tr '+/' '-_' | tr -d '=')
    
    echo "${header_b64}.${payload_b64}.${signature_b64}"
}

save_license() {
    local license_key=$1
    local license_id=$(generate_uuid)
    local timestamp=$(date +%Y%m%d-%H%M%S)
    
    mkdir -p "$LICENSES_DIR"
    
    # Determine output file
    if [[ -z "$OUTPUT_FILE" ]]; then
        OUTPUT_FILE="$LICENSES_DIR/license-${TENANT_ID:0:8}-$timestamp.json"
    fi
    
    # Create license JSON
    local license_json=$(cat << EOF
{
    "license_id": "$license_id",
    "license_key": "$license_key",
    "tenant_id": "$TENANT_ID",
    "tier": "$TIER",
    "max_users": $MAX_USERS,
    "features": $FEATURES,
    "issued_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "expires_at": "${EXPIRES}T23:59:59Z",
    "environment": "test",
    "notes": "Generated for testing purposes only"
}
EOF
)
    
    echo "$license_json" > "$OUTPUT_FILE"
    
    if [[ "$JSON_ONLY" == true ]]; then
        echo "$license_json"
    else
        log SUCCESS "License saved to: $OUTPUT_FILE"
    fi
}

store_in_database() {
    local license_key=$1
    local license_id=$(generate_uuid)
    
    # Store in database
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
        ON CONFLICT (id) DO NOTHING;
    " 2>/dev/null && log SUCCESS "License stored in database" || log WARN "Could not store in database"
}

print_license_info() {
    [[ "$JSON_ONLY" == true ]] && return
    
    local license_key=$1
    
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║              License Generated Successfully! 🔑            ║${NC}"
    echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}License Details:${NC}"
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│ Tenant ID:   $TENANT_ID"
    echo "│ Tier:        $TIER"
    echo "│ Max Users:   $MAX_USERS"
    echo "│ Expires:     $EXPIRES"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""
    echo -e "${BOLD}License Key:${NC}"
    echo -e "${DIM}(Use this key in API requests or configuration)${NC}"
    echo ""
    echo -e "${CYAN}$license_key${NC}"
    echo ""
    echo -e "${BOLD}Features:${NC}"
    echo "$FEATURES" | python3 -m json.tool 2>/dev/null || echo "$FEATURES"
    echo ""
    
    if [[ -n "$OUTPUT_FILE" ]]; then
        echo -e "${DIM}Saved to: $OUTPUT_FILE${NC}"
        echo ""
    fi
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
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --json)
            JSON_ONLY=true
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
    if [[ -z "$TENANT_ID" ]]; then
        log ERROR "Tenant ID is required"
        print_usage
        exit 1
    fi
    
    # Validate tier
    case $TIER in
        L1|L2|L3) ;;
        *) 
            log ERROR "Invalid tier: $TIER. Must be L1, L2, or L3"
            exit 1
            ;;
    esac
    
    # Set defaults
    if [[ -z "$EXPIRES" ]]; then
        EXPIRES=$(date -d "+1 year" +%Y-%m-%d 2>/dev/null || date -v+1y +%Y-%m-%d)
    fi
    
    if [[ -z "$MAX_USERS" ]]; then
        MAX_USERS=$(get_default_max_users "$TIER")
    fi
    
    if [[ -z "$FEATURES" ]]; then
        FEATURES=$(get_default_features "$TIER")
    fi
    
    # Validate tenant
    validate_tenant_id "$TENANT_ID"
    
    log INFO "Generating license for tenant: $TENANT_ID"
    
    # Generate license
    local license_key=$(generate_license_key)
    
    # Save license
    save_license "$license_key"
    
    # Store in database
    store_in_database "$license_key"
    
    # Print info
    print_license_info "$license_key"
}

cd "$PROJECT_ROOT"
main


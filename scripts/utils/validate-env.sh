#!/bin/bash
# ============================================
# ERP System - Environment Validation
# ============================================
#
# Description:
#   Validates environment variables and configuration files.
#   Checks required variables, format, and connectivity.
#
# Usage:
#   ./scripts/utils/validate-env.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -e, --env <env>         Environment: dev, staging, prod (default: dev)
#   --check-db              Test database connectivity
#   --check-redis           Test Redis connectivity
#   -v, --verbose           Show detailed output
#
# Exit Codes:
#   0 - All validations passed
#   1 - One or more validations failed
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
ENVIRONMENT="dev"
CHECK_DB=false
CHECK_REDIS=false
VERBOSE=false

# Validation results
ERRORS=0
WARNINGS=0

# Required variables per environment
declare -A REQUIRED_VARS=(
    [DATABASE_URL]="all"
    [JWT_SECRET]="all"
    [JWT_REFRESH_SECRET]="all"
    [LICENSE_ENCRYPTION_KEY]="all"
    [REDIS_URL]="staging,prod"
    [CORS_ORIGIN]="prod"
)

# Optional but recommended
declare -A RECOMMENDED_VARS=(
    [LOG_LEVEL]="Log level (debug, info, warn, error)"
    [RATE_LIMIT_MAX]="Rate limit per minute"
)

# ============================================
# FUNCTIONS
# ============================================

log() {
    local level=$1
    shift
    case $level in
        INFO)    echo -e "${BLUE}ℹ${NC} $*" ;;
        SUCCESS) echo -e "${GREEN}✓${NC} $*" ;;
        WARN)    echo -e "${YELLOW}⚠${NC} $*"; ((WARNINGS++)) ;;
        ERROR)   echo -e "${RED}✗${NC} $*"; ((ERRORS++)) ;;
        DEBUG)   [[ "$VERBOSE" == true ]] && echo -e "${DIM}  $*${NC}" ;;
    esac
}

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -e, --env <env>         Environment: dev, staging, prod (default: dev)"
    echo "  --check-db              Test database connectivity"
    echo "  --check-redis           Test Redis connectivity"
    echo "  -v, --verbose           Show detailed output"
}

get_env_file() {
    local env=$1
    local api_env="$PROJECT_ROOT/apps/api/.env"
    
    if [[ "$env" == "prod" ]] && [[ -f "$PROJECT_ROOT/apps/api/.env.production" ]]; then
        api_env="$PROJECT_ROOT/apps/api/.env.production"
    elif [[ "$env" == "staging" ]] && [[ -f "$PROJECT_ROOT/apps/api/.env.staging" ]]; then
        api_env="$PROJECT_ROOT/apps/api/.env.staging"
    fi
    
    echo "$api_env"
}

load_env() {
    local env_file=$1
    
    if [[ ! -f "$env_file" ]]; then
        log ERROR "Environment file not found: $env_file"
        return 1
    fi
    
    log INFO "Loading: $env_file"
    
    # Export variables from file
    set -a
    source "$env_file"
    set +a
    
    return 0
}

validate_required() {
    local env_file=$1
    
    log INFO "Checking required variables..."
    echo ""
    
    for var in "${!REQUIRED_VARS[@]}"; do
        local envs="${REQUIRED_VARS[$var]}"
        local required=false
        
        if [[ "$envs" == "all" ]] || [[ "$envs" == *"$ENVIRONMENT"* ]]; then
            required=true
        fi
        
        local value="${!var:-}"
        
        if [[ "$required" == true ]]; then
            if [[ -z "$value" ]]; then
                log ERROR "$var is required but not set"
            else
                log SUCCESS "$var is set"
                validate_format "$var" "$value"
            fi
        else
            if [[ -n "$value" ]]; then
                log DEBUG "$var is set (optional)"
            fi
        fi
    done
}

validate_format() {
    local var=$1
    local value=$2
    
    case $var in
        DATABASE_URL)
            if [[ ! "$value" =~ ^postgres(ql)?:// ]]; then
                log WARN "$var should start with postgresql://"
            fi
            ;;
        REDIS_URL)
            if [[ ! "$value" =~ ^redis(s)?:// ]]; then
                log WARN "$var should start with redis://"
            fi
            ;;
        JWT_SECRET|JWT_REFRESH_SECRET|LICENSE_ENCRYPTION_KEY)
            if [[ ${#value} -lt 32 ]]; then
                log WARN "$var should be at least 32 characters (current: ${#value})"
            fi
            ;;
        CORS_ORIGIN)
            if [[ "$ENVIRONMENT" == "prod" ]] && [[ "$value" == "*" ]]; then
                log WARN "$var should not be '*' in production"
            fi
            ;;
        LOG_LEVEL)
            if [[ ! "$value" =~ ^(debug|info|warn|error)$ ]]; then
                log WARN "$var should be one of: debug, info, warn, error"
            fi
            ;;
    esac
}

validate_recommended() {
    log INFO "Checking recommended variables..."
    echo ""
    
    for var in "${!RECOMMENDED_VARS[@]}"; do
        local desc="${RECOMMENDED_VARS[$var]}"
        local value="${!var:-}"
        
        if [[ -z "$value" ]]; then
            log WARN "$var is not set ($desc)"
        else
            log SUCCESS "$var is set"
        fi
    done
}

check_database() {
    if [[ "$CHECK_DB" != true ]]; then
        return 0
    fi
    
    log INFO "Testing database connectivity..."
    
    if docker-compose exec -T postgres pg_isready -U "${DB_USER:-erp_user}" -d "${DB_NAME:-erp_database}" &> /dev/null; then
        log SUCCESS "Database connection successful"
    else
        log ERROR "Database connection failed"
    fi
}

check_redis() {
    if [[ "$CHECK_REDIS" != true ]]; then
        return 0
    fi
    
    log INFO "Testing Redis connectivity..."
    
    if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        log SUCCESS "Redis connection successful"
    else
        log ERROR "Redis connection failed"
    fi
}

check_web_env() {
    local web_env="$PROJECT_ROOT/apps/web/.env"
    
    log INFO "Checking frontend environment..."
    echo ""
    
    if [[ ! -f "$web_env" ]]; then
        log WARN "Frontend .env file not found: $web_env"
        return 0
    fi
    
    # Check VITE_ prefixed variables
    if ! grep -q "^VITE_API_BASE_URL=" "$web_env"; then
        log ERROR "VITE_API_BASE_URL is required in web/.env"
    else
        log SUCCESS "VITE_API_BASE_URL is set"
    fi
}

print_summary() {
    echo ""
    echo -e "${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║              Environment Validation Summary                ║${NC}"
    echo -e "${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Environment:${NC} $ENVIRONMENT"
    echo ""
    
    if [[ $ERRORS -eq 0 ]] && [[ $WARNINGS -eq 0 ]]; then
        echo -e "${GREEN}${BOLD}Status: VALID ✓${NC}"
        echo "All environment variables are properly configured."
    elif [[ $ERRORS -eq 0 ]]; then
        echo -e "${YELLOW}${BOLD}Status: VALID with warnings${NC}"
        echo "  Warnings: $WARNINGS"
    else
        echo -e "${RED}${BOLD}Status: INVALID${NC}"
        echo "  Errors:   $ERRORS"
        echo "  Warnings: $WARNINGS"
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
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --check-db)
            CHECK_DB=true
            shift
            ;;
        --check-redis)
            CHECK_REDIS=true
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
    echo -e "${BOLD}${BLUE}ERP System - Environment Validation${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # Get and load env file
    local env_file=$(get_env_file "$ENVIRONMENT")
    load_env "$env_file" || true
    
    echo ""
    
    # Validate API environment
    validate_required "$env_file"
    echo ""
    
    validate_recommended
    echo ""
    
    # Validate web environment
    check_web_env
    echo ""
    
    # Connectivity checks
    check_database
    check_redis
    
    # Summary
    print_summary
    
    # Exit with appropriate code
    if [[ $ERRORS -gt 0 ]]; then
        exit 1
    fi
    exit 0
}

main


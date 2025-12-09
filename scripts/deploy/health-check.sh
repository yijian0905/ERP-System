#!/bin/bash
# ============================================
# ERP System - Health Check Script
# ============================================
#
# Description:
#   Comprehensive health verification for all ERP services.
#   Checks endpoints, database, cache, and SSL certificates.
#
# Usage:
#   ./scripts/deploy/health-check.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -e, --env <env>         Environment: dev, staging, prod (default: dev)
#   -u, --url <url>         Custom API URL
#   --json                  Output as JSON
#   --timeout <seconds>     Request timeout (default: 10)
#   -v, --verbose           Show detailed output
#
# Exit Codes:
#   0 - All checks passed
#   1 - One or more checks failed
#
# Example:
#   ./scripts/deploy/health-check.sh --env prod
#   ./scripts/deploy/health-check.sh -u https://api.example.com --json
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
ENVIRONMENT="dev"
API_URL=""
JSON_OUTPUT=false
TIMEOUT=10
VERBOSE=false

# Health check results
declare -A RESULTS
declare -A RESPONSE_TIMES
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# ============================================
# FUNCTIONS
# ============================================

log() {
    [[ "$JSON_OUTPUT" == true ]] && return
    local level=$1
    shift
    case $level in
        INFO)    echo -e "${BLUE}ℹ${NC} $*" ;;
        SUCCESS) echo -e "${GREEN}✓${NC} $*" ;;
        WARN)    echo -e "${YELLOW}⚠${NC} $*" ;;
        ERROR)   echo -e "${RED}✗${NC} $*" ;;
        DEBUG)   [[ "$VERBOSE" == true ]] && echo -e "${DIM}  $*${NC}" ;;
        STEP)    echo -e "\n${BOLD}${CYAN}→ $*${NC}" ;;
    esac
}

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -e, --env <env>         Environment: dev, staging, prod (default: dev)"
    echo "  -u, --url <url>         Custom API URL"
    echo "  --json                  Output as JSON"
    echo "  --timeout <seconds>     Request timeout (default: 10)"
    echo "  -v, --verbose           Show detailed output"
}

get_urls() {
    case $ENVIRONMENT in
        dev)
            API_URL="${API_URL:-http://localhost:3000}"
            FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
            ;;
        staging)
            API_URL="${API_URL:-https://api.staging.erp-system.com}"
            FRONTEND_URL="${FRONTEND_URL:-https://staging.erp-system.com}"
            ;;
        prod)
            API_URL="${API_URL:-https://api.erp-system.com}"
            FRONTEND_URL="${FRONTEND_URL:-https://erp-system.com}"
            ;;
    esac
}

check_endpoint() {
    local name=$1
    local url=$2
    local expected_status="${3:-200}"
    
    ((TOTAL_CHECKS++))
    
    log DEBUG "Checking $name: $url"
    
    local start_time=$(date +%s%N)
    local response
    local status
    
    if response=$(curl -sf -w "\n%{http_code}" --connect-timeout "$TIMEOUT" "$url" 2>/dev/null); then
        status=$(echo "$response" | tail -n1)
        local body=$(echo "$response" | sed '$d')
    else
        status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout "$TIMEOUT" "$url" 2>/dev/null || echo "000")
    fi
    
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    
    RESPONSE_TIMES[$name]=$duration
    
    if [[ "$status" == "$expected_status" ]]; then
        RESULTS[$name]="passed"
        ((PASSED_CHECKS++))
        log SUCCESS "$name: OK (${duration}ms)"
        return 0
    else
        RESULTS[$name]="failed"
        ((FAILED_CHECKS++))
        log ERROR "$name: FAILED (HTTP $status, expected $expected_status)"
        return 1
    fi
}

check_database() {
    local name="Database"
    ((TOTAL_CHECKS++))
    
    log DEBUG "Checking database connection..."
    
    local start_time=$(date +%s%N)
    
    if docker-compose exec -T postgres pg_isready -U erp_user -d erp_database &> /dev/null; then
        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 ))
        
        RESULTS[$name]="passed"
        RESPONSE_TIMES[$name]=$duration
        ((PASSED_CHECKS++))
        log SUCCESS "$name: OK (${duration}ms)"
        return 0
    else
        RESULTS[$name]="failed"
        RESPONSE_TIMES[$name]=0
        ((FAILED_CHECKS++))
        log ERROR "$name: FAILED (Connection refused)"
        return 1
    fi
}

check_redis() {
    local name="Redis"
    ((TOTAL_CHECKS++))
    
    log DEBUG "Checking Redis connection..."
    
    local start_time=$(date +%s%N)
    
    if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 ))
        
        RESULTS[$name]="passed"
        RESPONSE_TIMES[$name]=$duration
        ((PASSED_CHECKS++))
        log SUCCESS "$name: OK (${duration}ms)"
        return 0
    else
        RESULTS[$name]="failed"
        RESPONSE_TIMES[$name]=0
        ((FAILED_CHECKS++))
        log ERROR "$name: FAILED (Connection refused)"
        return 1
    fi
}

check_ssl() {
    local name=$1
    local host=$2
    
    ((TOTAL_CHECKS++))
    
    log DEBUG "Checking SSL certificate for $host..."
    
    if [[ "$host" == "localhost" ]] || [[ "$host" =~ ^http:// ]]; then
        RESULTS[$name]="skipped"
        RESPONSE_TIMES[$name]=0
        log WARN "$name: Skipped (HTTP only)"
        return 0
    fi
    
    # Extract hostname
    host=$(echo "$host" | sed 's|https://||' | sed 's|/.*||')
    
    local expiry
    expiry=$(echo | openssl s_client -connect "$host:443" -servername "$host" 2>/dev/null | \
        openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    if [[ -z "$expiry" ]]; then
        RESULTS[$name]="failed"
        RESPONSE_TIMES[$name]=0
        ((FAILED_CHECKS++))
        log ERROR "$name: FAILED (Could not get certificate)"
        return 1
    fi
    
    local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry" +%s 2>/dev/null || echo 0)
    local now_epoch=$(date +%s)
    local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))
    
    if [[ $days_left -lt 0 ]]; then
        RESULTS[$name]="failed"
        ((FAILED_CHECKS++))
        log ERROR "$name: EXPIRED"
        return 1
    elif [[ $days_left -lt 30 ]]; then
        RESULTS[$name]="warning"
        ((PASSED_CHECKS++))
        log WARN "$name: Expires in $days_left days"
        return 0
    else
        RESULTS[$name]="passed"
        ((PASSED_CHECKS++))
        log SUCCESS "$name: Valid ($days_left days remaining)"
        return 0
    fi
}

check_dns() {
    local name=$1
    local host=$2
    
    ((TOTAL_CHECKS++))
    
    # Extract hostname
    host=$(echo "$host" | sed 's|https://||' | sed 's|http://||' | sed 's|/.*||')
    
    if [[ "$host" == "localhost" ]] || [[ "$host" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        RESULTS[$name]="skipped"
        log WARN "$name: Skipped (local address)"
        return 0
    fi
    
    log DEBUG "Checking DNS for $host..."
    
    if host "$host" &> /dev/null || nslookup "$host" &> /dev/null 2>&1; then
        RESULTS[$name]="passed"
        ((PASSED_CHECKS++))
        log SUCCESS "$name: OK"
        return 0
    else
        RESULTS[$name]="failed"
        ((FAILED_CHECKS++))
        log ERROR "$name: FAILED (Could not resolve)"
        return 1
    fi
}

output_json() {
    local json='{'
    json+='"environment":"'"$ENVIRONMENT"'",'
    json+='"timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'",'
    json+='"summary":{'
    json+='"total":'"$TOTAL_CHECKS"','
    json+='"passed":'"$PASSED_CHECKS"','
    json+='"failed":'"$FAILED_CHECKS"'}'
    json+=',"checks":{'
    
    local first=true
    for check in "${!RESULTS[@]}"; do
        if [[ "$first" != true ]]; then
            json+=','
        fi
        first=false
        json+='"'"$check"'":{'
        json+='"status":"'"${RESULTS[$check]}"'"'
        if [[ -n "${RESPONSE_TIMES[$check]:-}" ]]; then
            json+=',"responseTime":'"${RESPONSE_TIMES[$check]}"
        fi
        json+='}'
    done
    
    json+='},'
    json+='"healthy":'
    if [[ $FAILED_CHECKS -eq 0 ]]; then
        json+='true'
    else
        json+='false'
    fi
    json+='}'
    
    echo "$json" | python3 -m json.tool 2>/dev/null || echo "$json"
}

print_summary() {
    [[ "$JSON_OUTPUT" == true ]] && return
    
    echo ""
    echo -e "${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║              Health Check Summary                          ║${NC}"
    echo -e "${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Environment:${NC} $ENVIRONMENT"
    echo -e "${BOLD}Timestamp:${NC}   $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo ""
    echo -e "${BOLD}Results:${NC}"
    echo "┌────────────────────┬──────────┬──────────────┐"
    echo "│ Check              │ Status   │ Response Time│"
    echo "├────────────────────┼──────────┼──────────────┤"
    
    for check in "${!RESULTS[@]}"; do
        local status="${RESULTS[$check]}"
        local time="${RESPONSE_TIMES[$check]:-0}"
        local status_color
        
        case $status in
            passed)  status_color="${GREEN}PASS${NC}" ;;
            failed)  status_color="${RED}FAIL${NC}" ;;
            warning) status_color="${YELLOW}WARN${NC}" ;;
            skipped) status_color="${DIM}SKIP${NC}" ;;
        esac
        
        printf "│ %-18s │ %s     │ %10sms │\n" "$check" "$status_color" "$time"
    done
    
    echo "└────────────────────┴──────────┴──────────────┘"
    echo ""
    echo -e "${BOLD}Summary:${NC} $PASSED_CHECKS/$TOTAL_CHECKS passed"
    
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        echo -e "${RED}${BOLD}Status: UNHEALTHY${NC}"
    else
        echo -e "${GREEN}${BOLD}Status: HEALTHY${NC}"
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
        -u|--url)
            API_URL="$2"
            shift 2
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --timeout)
            TIMEOUT="$2"
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
    cd "$PROJECT_ROOT"
    
    get_urls
    
    [[ "$JSON_OUTPUT" != true ]] && echo -e "\n${BOLD}${BLUE}ERP System - Health Check${NC}\n"
    
    # API Health Checks
    log STEP "API Endpoints"
    check_endpoint "API Health" "$API_URL/health" "200" || true
    
    # Infrastructure Checks
    log STEP "Infrastructure"
    check_database || true
    check_redis || true
    
    # DNS Checks (for non-dev environments)
    if [[ "$ENVIRONMENT" != "dev" ]]; then
        log STEP "DNS Resolution"
        check_dns "API DNS" "$API_URL" || true
    fi
    
    # SSL Checks (for non-dev environments)
    if [[ "$ENVIRONMENT" != "dev" ]]; then
        log STEP "SSL Certificates"
        check_ssl "API SSL" "$API_URL" || true
    fi
    
    # Output results
    if [[ "$JSON_OUTPUT" == true ]]; then
        output_json
    else
        print_summary
    fi
    
    # Exit with appropriate code
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

main


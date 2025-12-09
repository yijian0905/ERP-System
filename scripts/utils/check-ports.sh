#!/bin/bash
# ============================================
# ERP System - Port Availability Check
# ============================================
#
# Description:
#   Checks if required ports are available for ERP services.
#   Shows which process is using each port if occupied.
#
# Usage:
#   ./scripts/utils/check-ports.sh [OPTIONS]
#
# Options:
#   -h, --help      Show this help message
#   -k, --kill      Kill processes using required ports
#   -v, --verbose   Show detailed output
#
# Exit Codes:
#   0 - All ports available
#   1 - One or more ports in use
#
# Author: ERP System Team
# ============================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Required ports
declare -A PORTS=(
    [5173]="Frontend (Vite)"
    [3000]="API (Fastify)"
    [8000]="AI Service"
    [5432]="PostgreSQL"
    [6379]="Redis"
    [11434]="Ollama"
)

# Options
KILL_PROCESSES=false
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
    esac
}

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo "  -k, --kill      Kill processes using required ports"
    echo "  -v, --verbose   Show detailed output"
}

check_port() {
    local port=$1
    local service=$2
    
    # Check if port is in use
    local pid=""
    local process=""
    
    if command -v lsof &> /dev/null; then
        pid=$(lsof -t -i ":$port" 2>/dev/null | head -n1 || true)
        if [[ -n "$pid" ]]; then
            process=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
        fi
    elif command -v ss &> /dev/null; then
        local result=$(ss -tlnp "sport = :$port" 2>/dev/null | tail -n1)
        if [[ -n "$result" ]]; then
            pid=$(echo "$result" | grep -oP 'pid=\K[0-9]+' || echo "")
            process=$(echo "$result" | grep -oP 'users:\(\("\K[^"]+' || echo "unknown")
        fi
    elif command -v netstat &> /dev/null; then
        local result=$(netstat -tlnp 2>/dev/null | grep ":$port " | head -n1)
        if [[ -n "$result" ]]; then
            pid=$(echo "$result" | awk '{print $7}' | cut -d'/' -f1)
            process=$(echo "$result" | awk '{print $7}' | cut -d'/' -f2)
        fi
    fi
    
    if [[ -n "$pid" ]]; then
        echo "IN_USE|$pid|$process"
    else
        echo "AVAILABLE"
    fi
}

kill_process_on_port() {
    local port=$1
    local pid=$2
    
    if [[ "$KILL_PROCESSES" != true ]]; then
        return 0
    fi
    
    log WARN "Killing process $pid on port $port..."
    
    if kill -15 "$pid" 2>/dev/null; then
        sleep 1
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null || true
        fi
        log SUCCESS "Process killed"
        return 0
    else
        log ERROR "Failed to kill process $pid"
        return 1
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
        -k|--kill)
            KILL_PROCESSES=true
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
    echo -e "${BOLD}${BLUE}ERP System - Port Availability Check${NC}"
    echo ""
    
    local conflicts=0
    
    echo "┌───────┬─────────────────────┬────────────┬─────────────────────────┐"
    echo "│ Port  │ Service             │ Status     │ Process                 │"
    echo "├───────┼─────────────────────┼────────────┼─────────────────────────┤"
    
    for port in "${!PORTS[@]}"; do
        local service="${PORTS[$port]}"
        local result=$(check_port "$port" "$service")
        
        if [[ "$result" == "AVAILABLE" ]]; then
            printf "│ %-5s │ %-19s │ ${GREEN}%-10s${NC} │ %-23s │\n" "$port" "$service" "Available" "-"
        else
            local pid=$(echo "$result" | cut -d'|' -f2)
            local process=$(echo "$result" | cut -d'|' -f3)
            printf "│ %-5s │ %-19s │ ${RED}%-10s${NC} │ %-23s │\n" "$port" "$service" "In Use" "$process (PID: $pid)"
            ((conflicts++))
            
            if [[ "$KILL_PROCESSES" == true ]]; then
                kill_process_on_port "$port" "$pid"
            fi
        fi
    done
    
    echo "└───────┴─────────────────────┴────────────┴─────────────────────────┘"
    echo ""
    
    if [[ $conflicts -eq 0 ]]; then
        log SUCCESS "All ports are available!"
        exit 0
    else
        log ERROR "$conflicts port(s) are in use"
        echo ""
        echo -e "${BOLD}To free ports:${NC}"
        echo "  1. Stop the conflicting services manually"
        echo "  2. Or run: $0 --kill"
        echo ""
        exit 1
    fi
}

main


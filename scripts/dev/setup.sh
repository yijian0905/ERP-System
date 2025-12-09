#!/bin/bash
# ============================================
# ERP System - Development Environment Setup
# ============================================
# 
# Description:
#   Complete first-time setup for developers. This script checks prerequisites,
#   installs dependencies, configures environment, and starts all services.
#
# Usage:
#   ./scripts/dev/setup.sh [OPTIONS]
#
# Options:
#   -h, --help          Show this help message
#   -y, --yes           Skip all confirmation prompts
#   -s, --skip-docker   Skip Docker services (useful if already running)
#   --no-seed           Skip database seeding
#   -v, --verbose       Show detailed output
#
# Example:
#   ./scripts/dev/setup.sh
#   ./scripts/dev/setup.sh --yes --verbose
#
# Author: ERP System Team
# ============================================

set -euo pipefail

# ============================================
# CONFIGURATION
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/setup-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Default options
SKIP_PROMPTS=false
SKIP_DOCKER=false
NO_SEED=false
VERBOSE=false

# ============================================
# HELPER FUNCTIONS
# ============================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Log to file
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    # Log to console with colors
    case $level in
        INFO)    echo -e "${BLUE}ℹ${NC} $message" ;;
        SUCCESS) echo -e "${GREEN}✓${NC} $message" ;;
        WARN)    echo -e "${YELLOW}⚠${NC} $message" ;;
        ERROR)   echo -e "${RED}✗${NC} $message" ;;
        DEBUG)   [[ "$VERBOSE" == true ]] && echo -e "${DIM}  $message${NC}" ;;
        STEP)    echo -e "\n${BOLD}${CYAN}→ $message${NC}" ;;
    esac
}

print_header() {
    echo -e "\n${BOLD}${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           ERP System - Development Setup                   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -y, --yes           Skip all confirmation prompts"
    echo "  -s, --skip-docker   Skip Docker services"
    echo "  --no-seed           Skip database seeding"
    echo "  -v, --verbose       Show detailed output"
}

confirm() {
    if [[ "$SKIP_PROMPTS" == true ]]; then
        return 0
    fi
    
    local prompt="$1"
    local default="${2:-y}"
    
    if [[ "$default" == "y" ]]; then
        prompt="$prompt [Y/n]: "
    else
        prompt="$prompt [y/N]: "
    fi
    
    read -p "$prompt" -r response
    response=${response:-$default}
    
    [[ "$response" =~ ^[Yy]$ ]]
}

spinner() {
    local pid=$1
    local message="${2:-Processing}"
    local spin='-\|/'
    local i=0
    
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) %4 ))
        printf "\r${BLUE}${spin:$i:1}${NC} $message..."
        sleep 0.1
    done
    printf "\r"
}

check_command() {
    local cmd=$1
    local name="${2:-$cmd}"
    local required="${3:-true}"
    
    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>/dev/null | head -n1 || echo "unknown")
        log DEBUG "$name: $version"
        return 0
    else
        if [[ "$required" == true ]]; then
            log ERROR "$name is not installed"
            return 1
        else
            log WARN "$name is not installed (optional)"
            return 0
        fi
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
        -y|--yes)
            SKIP_PROMPTS=true
            shift
            ;;
        -s|--skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --no-seed)
            NO_SEED=true
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
# MAIN SETUP PROCESS
# ============================================

main() {
    print_header
    
    cd "$PROJECT_ROOT"
    log INFO "Project root: $PROJECT_ROOT"
    log INFO "Log file: $LOG_FILE"
    
    # Step 1: Check Prerequisites
    log STEP "Checking prerequisites"
    check_prerequisites
    
    # Step 2: Install Dependencies
    log STEP "Installing dependencies"
    install_dependencies
    
    # Step 3: Configure Environment
    log STEP "Configuring environment"
    configure_environment
    
    # Step 4: Start Docker Services
    if [[ "$SKIP_DOCKER" != true ]]; then
        log STEP "Starting Docker services"
        start_docker_services
    else
        log INFO "Skipping Docker services (--skip-docker)"
    fi
    
    # Step 5: Setup Database
    log STEP "Setting up database"
    setup_database
    
    # Step 6: Seed Data
    if [[ "$NO_SEED" != true ]]; then
        log STEP "Seeding database"
        seed_database
    else
        log INFO "Skipping database seed (--no-seed)"
    fi
    
    # Step 7: Final Checks
    log STEP "Running final checks"
    run_final_checks
    
    # Success!
    print_success
}

check_prerequisites() {
    local errors=0
    
    # Required tools
    log INFO "Checking required tools..."
    
    check_command "node" "Node.js" true || ((errors++))
    check_command "pnpm" "pnpm" true || ((errors++))
    check_command "docker" "Docker" true || ((errors++))
    check_command "git" "Git" true || ((errors++))
    
    # Check Node version
    if command -v node &> /dev/null; then
        local node_version=$(node -v | sed 's/v//' | cut -d. -f1)
        if [[ "$node_version" -lt 20 ]]; then
            log ERROR "Node.js version 20+ required (found v$node_version)"
            ((errors++))
        else
            log SUCCESS "Node.js v$node_version detected"
        fi
    fi
    
    # Check Docker running
    if command -v docker &> /dev/null; then
        if docker info &> /dev/null; then
            log SUCCESS "Docker is running"
        else
            log ERROR "Docker is not running. Please start Docker Desktop."
            ((errors++))
        fi
    fi
    
    # Check pnpm version
    if command -v pnpm &> /dev/null; then
        local pnpm_version=$(pnpm -v | cut -d. -f1)
        if [[ "$pnpm_version" -lt 8 ]]; then
            log WARN "pnpm version 8+ recommended (found v$pnpm_version)"
        else
            log SUCCESS "pnpm v$pnpm_version detected"
        fi
    fi
    
    # Optional tools
    log INFO "Checking optional tools..."
    check_command "python3" "Python 3" false
    check_command "ollama" "Ollama (for AI features)" false
    
    if [[ $errors -gt 0 ]]; then
        log ERROR "Prerequisites check failed with $errors error(s)"
        echo ""
        echo "Please install missing dependencies and try again."
        echo ""
        echo "Installation guides:"
        echo "  Node.js: https://nodejs.org/"
        echo "  pnpm: npm install -g pnpm"
        echo "  Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    log SUCCESS "All prerequisites met"
}

install_dependencies() {
    log INFO "Installing pnpm dependencies..."
    
    if pnpm install --frozen-lockfile 2>&1 | tee -a "$LOG_FILE"; then
        log SUCCESS "Dependencies installed successfully"
    else
        log WARN "Frozen lockfile failed, trying regular install..."
        pnpm install 2>&1 | tee -a "$LOG_FILE"
        log SUCCESS "Dependencies installed"
    fi
}

configure_environment() {
    log INFO "Configuring environment files..."
    
    # API .env
    local api_env="$PROJECT_ROOT/apps/api/.env"
    local api_env_example="$PROJECT_ROOT/apps/api/env.example.txt"
    
    if [[ -f "$api_env" ]]; then
        if confirm "  API .env already exists. Overwrite?"; then
            cp "$api_env_example" "$api_env"
            log SUCCESS "API .env overwritten"
        else
            log INFO "Keeping existing API .env"
        fi
    else
        if [[ -f "$api_env_example" ]]; then
            cp "$api_env_example" "$api_env"
            log SUCCESS "Created API .env from example"
        else
            # Create default .env
            cat > "$api_env" << 'EOF'
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL=postgresql://erp_user:erp_password@localhost:5432/erp_database

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=dev-jwt-secret-change-in-production-32chars
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-prod-32ch

# License
LICENSE_ENCRYPTION_KEY=dev-license-key-change-in-prod-32ch

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
EOF
            log SUCCESS "Created default API .env"
        fi
    fi
    
    # Web .env
    local web_env="$PROJECT_ROOT/apps/web/.env"
    
    if [[ ! -f "$web_env" ]]; then
        cat > "$web_env" << 'EOF'
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=ERP System
EOF
        log SUCCESS "Created Web .env"
    else
        log INFO "Web .env already exists"
    fi
}

start_docker_services() {
    log INFO "Starting PostgreSQL and Redis..."
    
    # Check if containers are already running
    if docker ps --format '{{.Names}}' | grep -q "erp-postgres\|erp-redis"; then
        log INFO "Some containers are already running"
        if confirm "  Stop and restart containers?"; then
            docker-compose down 2>&1 | tee -a "$LOG_FILE"
        else
            log INFO "Using existing containers"
            return 0
        fi
    fi
    
    # Start services
    docker-compose up -d postgres redis 2>&1 | tee -a "$LOG_FILE"
    
    # Wait for PostgreSQL to be ready
    log INFO "Waiting for PostgreSQL to be ready..."
    local max_attempts=30
    local attempt=0
    
    while ! docker-compose exec -T postgres pg_isready -U erp_user -d erp_database &> /dev/null; do
        attempt=$((attempt + 1))
        if [[ $attempt -ge $max_attempts ]]; then
            log ERROR "PostgreSQL failed to start after ${max_attempts} attempts"
            exit 1
        fi
        sleep 1
        printf "\r  Waiting... ($attempt/$max_attempts)"
    done
    printf "\r"
    
    log SUCCESS "PostgreSQL is ready"
    
    # Check Redis
    if docker-compose exec -T redis redis-cli ping &> /dev/null; then
        log SUCCESS "Redis is ready"
    else
        log WARN "Redis may not be fully ready"
    fi
}

setup_database() {
    log INFO "Generating Prisma client..."
    pnpm db:generate 2>&1 | tee -a "$LOG_FILE"
    log SUCCESS "Prisma client generated"
    
    log INFO "Pushing database schema..."
    pnpm db:push 2>&1 | tee -a "$LOG_FILE"
    log SUCCESS "Database schema applied"
}

seed_database() {
    log INFO "Seeding database with demo data..."
    
    cd "$PROJECT_ROOT/packages/database"
    if pnpm exec ts-node --compiler-options '{"module":"commonjs"}' prisma/seed.ts 2>&1 | tee -a "$LOG_FILE"; then
        log SUCCESS "Database seeded successfully"
    else
        log WARN "Database seeding had issues (may already be seeded)"
    fi
    cd "$PROJECT_ROOT"
}

run_final_checks() {
    log INFO "Running type check..."
    if pnpm type-check 2>&1 | tee -a "$LOG_FILE"; then
        log SUCCESS "Type check passed"
    else
        log WARN "Type check had issues"
    fi
}

print_success() {
    echo ""
    echo -e "${GREEN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                   Setup Complete! 🎉                       ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${BOLD}Next Steps:${NC}"
    echo ""
    echo "  1. Start the development servers:"
    echo -e "     ${CYAN}pnpm dev${NC}"
    echo ""
    echo "  2. Open the application:"
    echo -e "     Frontend: ${CYAN}http://localhost:5173${NC}"
    echo -e "     API:      ${CYAN}http://localhost:3000${NC}"
    echo -e "     API Docs: ${CYAN}http://localhost:3000/docs${NC}"
    echo ""
    echo -e "${BOLD}Demo Credentials:${NC}"
    echo ""
    echo "  ┌──────────┬──────────────────────────┬──────────────┐"
    echo "  │ Role     │ Email                    │ Password     │"
    echo "  ├──────────┼──────────────────────────┼──────────────┤"
    echo "  │ Admin    │ admin@demo-company.com   │ password123  │"
    echo "  │ Manager  │ manager@demo-company.com │ password123  │"
    echo "  └──────────┴──────────────────────────┴──────────────┘"
    echo ""
    echo -e "${BOLD}Useful Commands:${NC}"
    echo ""
    echo "  pnpm dev          - Start all development servers"
    echo "  pnpm build        - Build all packages"
    echo "  pnpm db:studio    - Open Prisma Studio"
    echo "  pnpm db:reset     - Reset database"
    echo ""
    echo -e "${DIM}Log file: $LOG_FILE${NC}"
    echo ""
}

# ============================================
# RUN MAIN
# ============================================

main "$@"


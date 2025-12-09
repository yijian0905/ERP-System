#!/bin/bash
# ============================================
# ERP System - Docker Compose Deployment
# ============================================
#
# Description:
#   Full Docker Compose deployment script with support for
#   multiple environments, migrations, and health checks.
#
# Usage:
#   ./scripts/deploy/docker-deploy.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -e, --env <env>         Environment: dev, staging, prod (default: dev)
#   -b, --build             Force rebuild of images
#   -m, --migrate           Run database migrations
#   -s, --seed              Seed database with demo data
#   -p, --pull              Pull latest images before deploy
#   --dry-run               Show what would be done without doing it
#   --rollback              Rollback to previous deployment
#   --skip-health           Skip health checks after deployment
#   -v, --verbose           Show detailed output
#
# Example:
#   ./scripts/deploy/docker-deploy.sh --env prod --build --migrate
#   ./scripts/deploy/docker-deploy.sh -e staging -b -m -s
#
# Author: ERP System Team
# ============================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs/deploy"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/deploy-$TIMESTAMP.log"

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
BUILD=false
MIGRATE=false
SEED=false
PULL=false
DRY_RUN=false
ROLLBACK=false
SKIP_HEALTH=false
VERBOSE=false

# Docker compose files
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"

# ============================================
# FUNCTIONS
# ============================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p "$LOG_DIR"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
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
    echo "║           ERP System - Docker Deployment                   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -e, --env <env>         Environment: dev, staging, prod (default: dev)"
    echo "  -b, --build             Force rebuild of images"
    echo "  -m, --migrate           Run database migrations"
    echo "  -s, --seed              Seed database with demo data"
    echo "  -p, --pull              Pull latest images"
    echo "  --dry-run               Show what would be done"
    echo "  --rollback              Rollback to previous deployment"
    echo "  --skip-health           Skip health checks"
    echo "  -v, --verbose           Show detailed output"
}

validate_environment() {
    case $1 in
        dev|staging|prod) return 0 ;;
        *)
            log ERROR "Invalid environment: $1. Must be dev, staging, or prod"
            exit 1
            ;;
    esac
}

check_prerequisites() {
    log INFO "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log ERROR "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log ERROR "Docker daemon is not running"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log ERROR "Docker Compose is not installed"
        exit 1
    fi
    
    log SUCCESS "Prerequisites met"
}

get_compose_command() {
    if docker compose version &> /dev/null 2>&1; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

get_compose_files() {
    local files="-f $COMPOSE_FILE"
    
    if [[ "$ENVIRONMENT" == "prod" ]] && [[ -f "$PROJECT_ROOT/$COMPOSE_PROD_FILE" ]]; then
        files="$files -f $COMPOSE_PROD_FILE"
    fi
    
    echo "$files"
}

validate_env_files() {
    log INFO "Validating environment files..."
    
    local env_file="$PROJECT_ROOT/apps/api/.env"
    
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        env_file="$PROJECT_ROOT/apps/api/.env.production"
    fi
    
    if [[ ! -f "$env_file" ]]; then
        log WARN "Environment file not found: $env_file"
        
        if [[ "$ENVIRONMENT" == "prod" ]]; then
            log ERROR "Production environment file is required"
            exit 1
        fi
    else
        log SUCCESS "Environment file found"
        
        # Validate required variables
        local required_vars=("DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET")
        local missing=0
        
        for var in "${required_vars[@]}"; do
            if ! grep -q "^$var=" "$env_file" 2>/dev/null; then
                log WARN "Missing required variable: $var"
                ((missing++))
            fi
        done
        
        if [[ $missing -gt 0 ]] && [[ "$ENVIRONMENT" == "prod" ]]; then
            log ERROR "Missing required environment variables for production"
            exit 1
        fi
    fi
}

backup_current_state() {
    log INFO "Backing up current deployment state..."
    
    local backup_dir="$PROJECT_ROOT/.deploy-backups"
    mkdir -p "$backup_dir"
    
    local compose_cmd=$(get_compose_command)
    local compose_files=$(get_compose_files)
    
    # Save current container states
    $compose_cmd $compose_files ps --format json > "$backup_dir/containers-$TIMESTAMP.json" 2>/dev/null || true
    
    # Save current image digests
    docker images --format "{{.Repository}}:{{.Tag}} {{.Digest}}" | grep "erp" > "$backup_dir/images-$TIMESTAMP.txt" 2>/dev/null || true
    
    log DEBUG "Backup saved to $backup_dir"
}

stop_services() {
    log INFO "Stopping existing services..."
    
    local compose_cmd=$(get_compose_command)
    local compose_files=$(get_compose_files)
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would run: $compose_cmd $compose_files down"
        return 0
    fi
    
    $compose_cmd $compose_files down --remove-orphans 2>&1 | tee -a "$LOG_FILE"
    
    log SUCCESS "Services stopped"
}

pull_images() {
    if [[ "$PULL" != true ]]; then
        return 0
    fi
    
    log INFO "Pulling latest images..."
    
    local compose_cmd=$(get_compose_command)
    local compose_files=$(get_compose_files)
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would run: $compose_cmd $compose_files pull"
        return 0
    fi
    
    $compose_cmd $compose_files pull 2>&1 | tee -a "$LOG_FILE"
    
    log SUCCESS "Images pulled"
}

build_images() {
    if [[ "$BUILD" != true ]]; then
        return 0
    fi
    
    log INFO "Building images..."
    
    local compose_cmd=$(get_compose_command)
    local compose_files=$(get_compose_files)
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would run: $compose_cmd $compose_files build"
        return 0
    fi
    
    $compose_cmd $compose_files build --parallel 2>&1 | tee -a "$LOG_FILE"
    
    log SUCCESS "Images built"
}

start_infrastructure() {
    log INFO "Starting infrastructure services (database, redis)..."
    
    local compose_cmd=$(get_compose_command)
    local compose_files=$(get_compose_files)
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would start postgres and redis"
        return 0
    fi
    
    $compose_cmd $compose_files up -d postgres redis 2>&1 | tee -a "$LOG_FILE"
    
    # Wait for database to be ready
    log INFO "Waiting for database..."
    local max_attempts=30
    local attempt=0
    
    while ! docker-compose exec -T postgres pg_isready -U erp_user -d erp_database &> /dev/null; do
        attempt=$((attempt + 1))
        if [[ $attempt -ge $max_attempts ]]; then
            log ERROR "Database failed to start"
            exit 1
        fi
        sleep 1
    done
    
    log SUCCESS "Infrastructure services ready"
}

run_migrations() {
    if [[ "$MIGRATE" != true ]]; then
        return 0
    fi
    
    log INFO "Running database migrations..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would run database migrations"
        return 0
    fi
    
    cd "$PROJECT_ROOT/packages/database"
    
    npx prisma generate 2>&1 | tee -a "$LOG_FILE"
    npx prisma db push 2>&1 | tee -a "$LOG_FILE"
    
    cd "$PROJECT_ROOT"
    
    log SUCCESS "Migrations complete"
}

run_seed() {
    if [[ "$SEED" != true ]]; then
        return 0
    fi
    
    log INFO "Seeding database..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would seed database"
        return 0
    fi
    
    cd "$PROJECT_ROOT/packages/database"
    
    npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed.ts 2>&1 | tee -a "$LOG_FILE" || log WARN "Seeding had issues"
    
    cd "$PROJECT_ROOT"
    
    log SUCCESS "Seeding complete"
}

start_application() {
    log INFO "Starting application services..."
    
    local compose_cmd=$(get_compose_command)
    local compose_files=$(get_compose_files)
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would start all services"
        return 0
    fi
    
    $compose_cmd $compose_files up -d 2>&1 | tee -a "$LOG_FILE"
    
    log SUCCESS "Application services started"
}

run_health_checks() {
    if [[ "$SKIP_HEALTH" == true ]]; then
        log INFO "Skipping health checks"
        return 0
    fi
    
    log INFO "Running health checks..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would run health checks"
        return 0
    fi
    
    local max_attempts=30
    local attempt=0
    local healthy=false
    
    while [[ $attempt -lt $max_attempts ]]; do
        attempt=$((attempt + 1))
        
        # Check API health
        if curl -sf http://localhost:3000/health &> /dev/null; then
            log SUCCESS "API is healthy"
            healthy=true
            break
        fi
        
        log DEBUG "Waiting for API... ($attempt/$max_attempts)"
        sleep 2
    done
    
    if [[ "$healthy" != true ]]; then
        log ERROR "Health check failed after $max_attempts attempts"
        log WARN "Check logs with: docker-compose logs api"
        return 1
    fi
    
    log SUCCESS "All health checks passed"
}

perform_rollback() {
    log WARN "Performing rollback..."
    
    local backup_dir="$PROJECT_ROOT/.deploy-backups"
    
    if [[ ! -d "$backup_dir" ]] || [[ -z "$(ls -A $backup_dir 2>/dev/null)" ]]; then
        log ERROR "No backup found for rollback"
        exit 1
    fi
    
    # Find most recent backup
    local latest_backup=$(ls -t "$backup_dir"/images-*.txt 2>/dev/null | head -n1)
    
    if [[ -z "$latest_backup" ]]; then
        log ERROR "No image backup found"
        exit 1
    fi
    
    log INFO "Found backup: $latest_backup"
    log WARN "Rollback functionality requires manual intervention"
    log INFO "1. Stop current containers: docker-compose down"
    log INFO "2. Restore previous images from backup"
    log INFO "3. Restart services: docker-compose up -d"
    
    exit 1
}

print_deployment_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║              Deployment Complete! 🚀                        ║${NC}"
    echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Environment:${NC} $ENVIRONMENT"
    echo -e "${BOLD}Timestamp:${NC}   $TIMESTAMP"
    echo ""
    echo -e "${BOLD}Services:${NC}"
    
    local compose_cmd=$(get_compose_command)
    local compose_files=$(get_compose_files)
    $compose_cmd $compose_files ps 2>/dev/null || true
    
    echo ""
    echo -e "${BOLD}URLs:${NC}"
    
    case $ENVIRONMENT in
        dev)
            echo "  Frontend: http://localhost:5173"
            echo "  API:      http://localhost:3000"
            echo "  API Docs: http://localhost:3000/docs"
            ;;
        staging)
            echo "  Frontend: https://staging.erp-system.com"
            echo "  API:      https://api.staging.erp-system.com"
            ;;
        prod)
            echo "  Frontend: https://erp-system.com"
            echo "  API:      https://api.erp-system.com"
            ;;
    esac
    
    echo ""
    echo -e "${DIM}Log file: $LOG_FILE${NC}"
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
            validate_environment "$ENVIRONMENT"
            shift 2
            ;;
        -b|--build)
            BUILD=true
            shift
            ;;
        -m|--migrate)
            MIGRATE=true
            shift
            ;;
        -s|--seed)
            SEED=true
            shift
            ;;
        -p|--pull)
            PULL=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --skip-health)
            SKIP_HEALTH=true
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
    print_header
    
    cd "$PROJECT_ROOT"
    
    if [[ "$ROLLBACK" == true ]]; then
        perform_rollback
        exit 0
    fi
    
    log STEP "Pre-deployment checks"
    check_prerequisites
    validate_env_files
    
    log STEP "Backup current state"
    backup_current_state
    
    log STEP "Stop existing services"
    stop_services
    
    log STEP "Pull/Build images"
    pull_images
    build_images
    
    log STEP "Start infrastructure"
    start_infrastructure
    
    log STEP "Database setup"
    run_migrations
    run_seed
    
    log STEP "Start application"
    start_application
    
    log STEP "Health checks"
    run_health_checks
    
    print_deployment_summary
}

main


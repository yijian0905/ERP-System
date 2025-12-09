#!/bin/bash
# ============================================
# ERP System - Build Docker Images
# ============================================
#
# Description:
#   Builds all Docker images with proper tagging, versioning,
#   and optional push to container registry.
#
# Usage:
#   ./scripts/deploy/build-images.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -t, --tag <tag>         Image tag (default: git commit hash)
#   -v, --version <ver>     Semantic version (e.g., 1.0.0)
#   -r, --registry <url>    Container registry URL
#   -p, --push              Push to registry after build
#   --platform <platform>   Build platform (linux/amd64,linux/arm64)
#   --no-cache              Build without cache
#   --api-only              Build only API image
#   --web-only              Build only web image
#   --verbose               Show detailed output
#
# Example:
#   ./scripts/deploy/build-images.sh --tag latest --push
#   ./scripts/deploy/build-images.sh -v 1.2.3 -r ghcr.io/org/erp -p
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
TAG=""
VERSION=""
REGISTRY=""
PUSH=false
PLATFORM="linux/amd64"
NO_CACHE=false
API_ONLY=false
WEB_ONLY=false
VERBOSE=false

# Image names
API_IMAGE="erp-api"
WEB_IMAGE="erp-web"
AI_IMAGE="erp-ai-service"

# Build stats
declare -A BUILD_TIMES
declare -A IMAGE_SIZES

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
        DEBUG)   [[ "$VERBOSE" == true ]] && echo -e "${DIM}  $*${NC}" ;;
        STEP)    echo -e "\n${BOLD}${CYAN}→ $*${NC}" ;;
    esac
}

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -t, --tag <tag>         Image tag (default: git commit hash)"
    echo "  -v, --version <ver>     Semantic version (e.g., 1.0.0)"
    echo "  -r, --registry <url>    Container registry URL"
    echo "  -p, --push              Push to registry after build"
    echo "  --platform <platform>   Build platform (default: linux/amd64)"
    echo "  --no-cache              Build without cache"
    echo "  --api-only              Build only API image"
    echo "  --web-only              Build only web image"
    echo "  --verbose               Show detailed output"
}

get_git_hash() {
    git rev-parse --short HEAD 2>/dev/null || echo "unknown"
}

get_git_branch() {
    git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"
}

get_image_size() {
    local image=$1
    docker images "$image" --format "{{.Size}}" 2>/dev/null | head -n1 || echo "unknown"
}

build_image() {
    local name=$1
    local dockerfile=$2
    local context=$3
    local start_time=$(date +%s)
    
    log INFO "Building $name..."
    
    local full_tag="$name:$TAG"
    local cache_flag=""
    
    if [[ "$NO_CACHE" == true ]]; then
        cache_flag="--no-cache"
    fi
    
    local platform_flag=""
    if [[ -n "$PLATFORM" ]]; then
        platform_flag="--platform $PLATFORM"
    fi
    
    # Build command
    local build_cmd="docker build $cache_flag $platform_flag"
    build_cmd="$build_cmd -t $full_tag"
    
    # Add version tag if specified
    if [[ -n "$VERSION" ]]; then
        build_cmd="$build_cmd -t $name:$VERSION"
    fi
    
    # Add latest tag
    build_cmd="$build_cmd -t $name:latest"
    
    # Add registry tags if specified
    if [[ -n "$REGISTRY" ]]; then
        build_cmd="$build_cmd -t $REGISTRY/$full_tag"
        if [[ -n "$VERSION" ]]; then
            build_cmd="$build_cmd -t $REGISTRY/$name:$VERSION"
        fi
        build_cmd="$build_cmd -t $REGISTRY/$name:latest"
    fi
    
    build_cmd="$build_cmd -f $dockerfile $context"
    
    log DEBUG "Running: $build_cmd"
    
    if eval "$build_cmd"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        BUILD_TIMES[$name]=$duration
        IMAGE_SIZES[$name]=$(get_image_size "$full_tag")
        log SUCCESS "$name built in ${duration}s (${IMAGE_SIZES[$name]})"
    else
        log ERROR "Failed to build $name"
        return 1
    fi
}

build_api() {
    local dockerfile="$PROJECT_ROOT/Dockerfile.api"
    
    # Create Dockerfile if it doesn't exist
    if [[ ! -f "$dockerfile" ]]; then
        log INFO "Creating API Dockerfile..."
        cat > "$dockerfile" << 'EOF'
# ERP System - API Dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @erp/database generate
RUN pnpm --filter @erp/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
EOF
    fi
    
    build_image "$API_IMAGE" "$dockerfile" "$PROJECT_ROOT"
}

build_web() {
    local dockerfile="$PROJECT_ROOT/Dockerfile.web"
    
    # Create Dockerfile if it doesn't exist
    if [[ ! -f "$dockerfile" ]]; then
        log INFO "Creating Web Dockerfile..."
        cat > "$dockerfile" << 'EOF'
# ERP System - Web Dockerfile
FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @erp/web build

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf 2>/dev/null || true
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
    fi
    
    build_image "$WEB_IMAGE" "$dockerfile" "$PROJECT_ROOT"
}

build_ai_service() {
    local dockerfile="$PROJECT_ROOT/apps/ai-service/Dockerfile"
    
    if [[ ! -d "$PROJECT_ROOT/apps/ai-service" ]]; then
        log WARN "AI service directory not found, skipping"
        return 0
    fi
    
    # Create Dockerfile if it doesn't exist
    if [[ ! -f "$dockerfile" ]]; then
        log INFO "Creating AI Service Dockerfile..."
        mkdir -p "$PROJECT_ROOT/apps/ai-service"
        cat > "$dockerfile" << 'EOF'
# ERP System - AI Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
    fi
    
    if [[ -d "$PROJECT_ROOT/apps/ai-service" ]]; then
        build_image "$AI_IMAGE" "$dockerfile" "$PROJECT_ROOT/apps/ai-service"
    fi
}

push_images() {
    if [[ "$PUSH" != true ]]; then
        return 0
    fi
    
    log STEP "Pushing images to registry"
    
    if [[ -z "$REGISTRY" ]]; then
        log WARN "No registry specified, skipping push"
        return 0
    fi
    
    local images=("$API_IMAGE" "$WEB_IMAGE")
    
    if [[ -d "$PROJECT_ROOT/apps/ai-service" ]]; then
        images+=("$AI_IMAGE")
    fi
    
    for image in "${images[@]}"; do
        if [[ "$API_ONLY" == true ]] && [[ "$image" != "$API_IMAGE" ]]; then
            continue
        fi
        if [[ "$WEB_ONLY" == true ]] && [[ "$image" != "$WEB_IMAGE" ]]; then
            continue
        fi
        
        log INFO "Pushing $image..."
        
        docker push "$REGISTRY/$image:$TAG" 2>&1 || log WARN "Failed to push $image:$TAG"
        
        if [[ -n "$VERSION" ]]; then
            docker push "$REGISTRY/$image:$VERSION" 2>&1 || true
        fi
        
        docker push "$REGISTRY/$image:latest" 2>&1 || true
        
        log SUCCESS "$image pushed"
    done
}

print_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║              Build Complete! 🐳                            ║${NC}"
    echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Build Details:${NC}"
    echo "  Tag:      $TAG"
    [[ -n "$VERSION" ]] && echo "  Version:  $VERSION"
    [[ -n "$REGISTRY" ]] && echo "  Registry: $REGISTRY"
    echo "  Platform: $PLATFORM"
    echo ""
    echo -e "${BOLD}Images Built:${NC}"
    echo "┌──────────────────┬────────────┬────────────┐"
    echo "│ Image            │ Time       │ Size       │"
    echo "├──────────────────┼────────────┼────────────┤"
    
    for image in "${!BUILD_TIMES[@]}"; do
        printf "│ %-16s │ %8ss │ %10s │\n" "$image" "${BUILD_TIMES[$image]}" "${IMAGE_SIZES[$image]}"
    done
    
    echo "└──────────────────┴────────────┴────────────┘"
    echo ""
    
    if [[ "$PUSH" == true ]] && [[ -n "$REGISTRY" ]]; then
        echo -e "${BOLD}Pushed to:${NC} $REGISTRY"
        echo ""
    fi
    
    echo -e "${BOLD}Usage:${NC}"
    echo "  docker run -p 3000:3000 $API_IMAGE:$TAG"
    echo "  docker run -p 80:80 $WEB_IMAGE:$TAG"
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
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -p|--push)
            PUSH=true
            shift
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --api-only)
            API_ONLY=true
            shift
            ;;
        --web-only)
            WEB_ONLY=true
            shift
            ;;
        --verbose)
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
    
    # Set default tag from git hash
    if [[ -z "$TAG" ]]; then
        TAG=$(get_git_hash)
    fi
    
    echo ""
    echo -e "${BOLD}${BLUE}ERP System - Docker Image Builder${NC}"
    echo ""
    
    log STEP "Building Docker images"
    
    local start_time=$(date +%s)
    
    # Build API
    if [[ "$WEB_ONLY" != true ]]; then
        build_api
    fi
    
    # Build Web
    if [[ "$API_ONLY" != true ]]; then
        build_web
    fi
    
    # Build AI Service (if exists and not specific build)
    if [[ "$API_ONLY" != true ]] && [[ "$WEB_ONLY" != true ]]; then
        build_ai_service
    fi
    
    # Push to registry
    push_images
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    print_summary
    
    log SUCCESS "Total build time: ${total_time}s"
}

main


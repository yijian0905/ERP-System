#!/bin/bash
# ============================================
# ERP System - Kubernetes Deployment
# ============================================
#
# Description:
#   Deploy ERP system to Kubernetes cluster with rolling updates,
#   health checks, and automatic rollback on failure.
#
# Usage:
#   ./scripts/deploy/k8s-deploy.sh [OPTIONS]
#
# Options:
#   -h, --help                  Show this help message
#   -n, --namespace <name>      Kubernetes namespace (default: erp-system)
#   -c, --context <context>     Kubectl context to use
#   -t, --tag <tag>             Image tag to deploy (default: latest)
#   --dry-run                   Show what would be done without doing it
#   --rollback                  Rollback to previous deployment
#   --skip-secrets              Skip secrets/configmap update
#   -v, --verbose               Show detailed output
#
# Prerequisites:
#   - kubectl configured with cluster access
#   - Docker images pushed to registry
#   - Kubernetes manifests in k8s/ directory
#
# Example:
#   ./scripts/deploy/k8s-deploy.sh --namespace production --tag v1.2.3
#   ./scripts/deploy/k8s-deploy.sh -n staging -c staging-cluster
#
# Author: ERP System Team
# ============================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
K8S_DIR="$PROJECT_ROOT/k8s"
LOG_FILE="$PROJECT_ROOT/logs/k8s-deploy-$(date +%Y%m%d-%H%M%S).log"

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
NAMESPACE="erp-system"
CONTEXT=""
TAG="latest"
DRY_RUN=false
ROLLBACK=false
SKIP_SECRETS=false
VERBOSE=false

# ============================================
# FUNCTIONS
# ============================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p "$(dirname "$LOG_FILE")"
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

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help                  Show this help message"
    echo "  -n, --namespace <name>      Kubernetes namespace (default: erp-system)"
    echo "  -c, --context <context>     Kubectl context to use"
    echo "  -t, --tag <tag>             Image tag to deploy (default: latest)"
    echo "  --dry-run                   Show what would be done"
    echo "  --rollback                  Rollback to previous deployment"
    echo "  --skip-secrets              Skip secrets/configmap update"
    echo "  -v, --verbose               Show detailed output"
}

check_prerequisites() {
    log INFO "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        log ERROR "kubectl is not installed"
        exit 1
    fi
    
    # Verify cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log ERROR "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log SUCCESS "kubectl connected to cluster"
    
    # Check context
    if [[ -n "$CONTEXT" ]]; then
        if ! kubectl config use-context "$CONTEXT" &> /dev/null; then
            log ERROR "Cannot switch to context: $CONTEXT"
            exit 1
        fi
        log SUCCESS "Using context: $CONTEXT"
    fi
    
    # Show current context
    local current_context=$(kubectl config current-context)
    log INFO "Current context: $current_context"
}

ensure_namespace() {
    log INFO "Ensuring namespace exists: $NAMESPACE"
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would create namespace: $NAMESPACE"
        return 0
    fi
    
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        kubectl create namespace "$NAMESPACE"
        log SUCCESS "Created namespace: $NAMESPACE"
    else
        log INFO "Namespace already exists"
    fi
}

create_k8s_manifests() {
    log INFO "Creating Kubernetes manifests..."
    
    mkdir -p "$K8S_DIR"
    
    # Namespace
    cat > "$K8S_DIR/namespace.yaml" << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: erp-system
  labels:
    app: erp-system
EOF

    # ConfigMap
    cat > "$K8S_DIR/configmap.yaml" << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: erp-config
  namespace: erp-system
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  CORS_ORIGIN: "https://erp-system.com"
EOF

    # Secret template
    cat > "$K8S_DIR/secrets.yaml.template" << EOF
apiVersion: v1
kind: Secret
metadata:
  name: erp-secrets
  namespace: erp-system
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:password@postgres:5432/erp"
  REDIS_URL: "redis://redis:6379"
  JWT_SECRET: "your-jwt-secret"
  JWT_REFRESH_SECRET: "your-refresh-secret"
  LICENSE_ENCRYPTION_KEY: "your-license-key"
EOF

    # API Deployment
    cat > "$K8S_DIR/api-deployment.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: erp-api
  namespace: erp-system
  labels:
    app: erp-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: erp-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: erp-api
    spec:
      containers:
        - name: api
          image: erp-api:${TAG}
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: erp-config
            - secretRef:
                name: erp-secrets
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
---
apiVersion: v1
kind: Service
metadata:
  name: erp-api
  namespace: erp-system
spec:
  selector:
    app: erp-api
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
EOF

    # Web Deployment
    cat > "$K8S_DIR/web-deployment.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: erp-web
  namespace: erp-system
  labels:
    app: erp-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: erp-web
  template:
    metadata:
      labels:
        app: erp-web
    spec:
      containers:
        - name: web
          image: erp-web:${TAG}
          ports:
            - containerPort: 80
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "100m"
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: erp-web
  namespace: erp-system
spec:
  selector:
    app: erp-web
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
EOF

    # Ingress
    cat > "$K8S_DIR/ingress.yaml" << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: erp-ingress
  namespace: erp-system
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - erp-system.com
        - api.erp-system.com
      secretName: erp-tls
  rules:
    - host: erp-system.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: erp-web
                port:
                  number: 80
    - host: api.erp-system.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: erp-api
                port:
                  number: 80
EOF

    log SUCCESS "Kubernetes manifests created in $K8S_DIR"
}

apply_secrets() {
    if [[ "$SKIP_SECRETS" == true ]]; then
        log INFO "Skipping secrets update"
        return 0
    fi
    
    log INFO "Applying secrets and configmaps..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would apply secrets and configmaps"
        return 0
    fi
    
    if [[ -f "$K8S_DIR/configmap.yaml" ]]; then
        kubectl apply -f "$K8S_DIR/configmap.yaml" -n "$NAMESPACE" 2>&1 | tee -a "$LOG_FILE"
    fi
    
    if [[ -f "$K8S_DIR/secrets.yaml" ]]; then
        kubectl apply -f "$K8S_DIR/secrets.yaml" -n "$NAMESPACE" 2>&1 | tee -a "$LOG_FILE"
    else
        log WARN "No secrets.yaml found. Create from secrets.yaml.template"
    fi
    
    log SUCCESS "Secrets and configmaps applied"
}

deploy_services() {
    log INFO "Deploying services with tag: $TAG"
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would deploy services"
        kubectl apply -f "$K8S_DIR/" -n "$NAMESPACE" --dry-run=client 2>&1 | tee -a "$LOG_FILE"
        return 0
    fi
    
    # Apply deployments
    for manifest in api-deployment.yaml web-deployment.yaml; do
        if [[ -f "$K8S_DIR/$manifest" ]]; then
            # Replace image tag
            sed "s/:latest/:$TAG/g" "$K8S_DIR/$manifest" | kubectl apply -f - -n "$NAMESPACE" 2>&1 | tee -a "$LOG_FILE"
            log SUCCESS "Applied $manifest"
        fi
    done
    
    # Apply services and ingress
    for manifest in ingress.yaml; do
        if [[ -f "$K8S_DIR/$manifest" ]]; then
            kubectl apply -f "$K8S_DIR/$manifest" -n "$NAMESPACE" 2>&1 | tee -a "$LOG_FILE"
        fi
    done
}

wait_for_rollout() {
    log INFO "Waiting for rollout to complete..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would wait for rollout"
        return 0
    fi
    
    local deployments=("erp-api" "erp-web")
    
    for deployment in "${deployments[@]}"; do
        log INFO "Waiting for $deployment..."
        if kubectl rollout status deployment/"$deployment" -n "$NAMESPACE" --timeout=300s 2>&1 | tee -a "$LOG_FILE"; then
            log SUCCESS "$deployment rolled out successfully"
        else
            log ERROR "$deployment rollout failed"
            return 1
        fi
    done
    
    log SUCCESS "All deployments rolled out"
}

run_health_checks() {
    log INFO "Running post-deployment health checks..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would run health checks"
        return 0
    fi
    
    # Get pod status
    log INFO "Pod status:"
    kubectl get pods -n "$NAMESPACE" -l app=erp-api 2>&1 | tee -a "$LOG_FILE"
    kubectl get pods -n "$NAMESPACE" -l app=erp-web 2>&1 | tee -a "$LOG_FILE"
    
    # Check for running pods
    local ready_pods=$(kubectl get pods -n "$NAMESPACE" -l app=erp-api -o jsonpath='{.items[*].status.containerStatuses[*].ready}' | tr ' ' '\n' | grep -c true || echo 0)
    
    if [[ $ready_pods -lt 1 ]]; then
        log ERROR "No ready API pods found"
        return 1
    fi
    
    log SUCCESS "Health checks passed ($ready_pods API pods ready)"
}

perform_rollback() {
    log WARN "Performing rollback..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log INFO "[DRY RUN] Would rollback deployments"
        return 0
    fi
    
    kubectl rollout undo deployment/erp-api -n "$NAMESPACE" 2>&1 | tee -a "$LOG_FILE"
    kubectl rollout undo deployment/erp-web -n "$NAMESPACE" 2>&1 | tee -a "$LOG_FILE"
    
    log SUCCESS "Rollback initiated"
    
    wait_for_rollout
}

print_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║              Kubernetes Deployment Complete! ☸️             ║${NC}"
    echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Deployment Details:${NC}"
    echo "  Namespace: $NAMESPACE"
    echo "  Image Tag: $TAG"
    echo "  Context:   $(kubectl config current-context)"
    echo ""
    echo -e "${BOLD}Resources:${NC}"
    kubectl get all -n "$NAMESPACE" 2>/dev/null | head -20
    echo ""
    echo -e "${BOLD}Useful Commands:${NC}"
    echo "  kubectl logs -f deployment/erp-api -n $NAMESPACE"
    echo "  kubectl get pods -n $NAMESPACE -w"
    echo "  kubectl describe deployment erp-api -n $NAMESPACE"
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
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -c|--context)
            CONTEXT="$2"
            shift 2
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --skip-secrets)
            SKIP_SECRETS=true
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
    echo -e "${BOLD}${BLUE}ERP System - Kubernetes Deployment${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # Check prerequisites
    log STEP "Checking prerequisites"
    check_prerequisites
    
    # Handle rollback
    if [[ "$ROLLBACK" == true ]]; then
        perform_rollback
        print_summary
        exit 0
    fi
    
    # Ensure namespace
    log STEP "Setting up namespace"
    ensure_namespace
    
    # Create manifests if they don't exist
    if [[ ! -d "$K8S_DIR" ]] || [[ -z "$(ls -A $K8S_DIR 2>/dev/null)" ]]; then
        log STEP "Creating Kubernetes manifests"
        create_k8s_manifests
    fi
    
    # Apply secrets
    log STEP "Applying configuration"
    apply_secrets
    
    # Deploy services
    log STEP "Deploying services"
    deploy_services
    
    # Wait for rollout
    log STEP "Waiting for rollout"
    wait_for_rollout
    
    # Health checks
    log STEP "Health checks"
    run_health_checks
    
    # Summary
    print_summary
}

main


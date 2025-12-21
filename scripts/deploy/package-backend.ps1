# Backend Deployment Package Script
# This script packages all necessary files for backend deployment
# Usage: .\scripts\deploy\package-backend.ps1

param(
    [string]$OutputDir = ".\deploy-package",
    [switch]$SkipAI = $false,
    [switch]$SkipAPI = $false
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Step { param($msg) Write-Host "[STEP] " -ForegroundColor Cyan -NoNewline; Write-Host $msg }
function Write-Success { param($msg) Write-Host "[OK] " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Info { param($msg) Write-Host "[INFO] " -ForegroundColor Yellow -NoNewline; Write-Host $msg }
function Write-Err { param($msg) Write-Host "[ERROR] " -ForegroundColor Red -NoNewline; Write-Host $msg }

# Get script and project root directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Item "$ScriptDir\..\..").FullName

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  ERP Backend Deployment Packager" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Timestamp for package name
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$PackageName = "erp-backend-$Timestamp"
$TempDir = Join-Path $env:TEMP $PackageName
$OutputPath = Join-Path $ProjectRoot $OutputDir

# Clean up any existing temp directory
if (Test-Path $TempDir) {
    Remove-Item -Recurse -Force $TempDir
}

# Create directories
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null

Write-Step "Creating deployment package..."
Write-Info "Source: $ProjectRoot"
Write-Info "Output: $OutputPath"
Write-Host ""

# ============================================
# Copy root configuration files
# ============================================
Write-Step "Copying root configuration files..."

$RootFiles = @(
    "package.json",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    "docker-compose.yml",
    "turbo.json",
    ".prettierrc"
)

foreach ($file in $RootFiles) {
    $sourcePath = Join-Path $ProjectRoot $file
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath -Destination $TempDir
        Write-Success "  $file"
    }
}

# ============================================
# Copy packages directory (shared dependencies)
# ============================================
Write-Step "Copying shared packages..."

$PackagesDir = Join-Path $ProjectRoot "packages"
$TempPackagesDir = Join-Path $TempDir "packages"
New-Item -ItemType Directory -Path $TempPackagesDir -Force | Out-Null

$Packages = @("config", "database", "logger", "shared-types")

foreach ($pkg in $Packages) {
    $sourcePkg = Join-Path $PackagesDir $pkg
    $destPkg = Join-Path $TempPackagesDir $pkg
    
    if (Test-Path $sourcePkg) {
        # Create destination directory
        New-Item -ItemType Directory -Path $destPkg -Force | Out-Null
        
        # Copy all files except node_modules and dist
        Get-ChildItem -Path $sourcePkg -Recurse | Where-Object {
            $_.FullName -notmatch "node_modules" -and
            $_.FullName -notmatch "\\dist\\" -and
            $_.Name -ne "dist"
        } | ForEach-Object {
            $relativePath = $_.FullName.Substring($sourcePkg.Length + 1)
            $destPath = Join-Path $destPkg $relativePath
            
            if ($_.PSIsContainer) {
                New-Item -ItemType Directory -Path $destPath -Force | Out-Null
            } else {
                $destDir = Split-Path -Parent $destPath
                if (!(Test-Path $destDir)) {
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                }
                Copy-Item $_.FullName -Destination $destPath
            }
        }
        Write-Success "  packages/$pkg"
    }
}

# ============================================
# Copy API service
# ============================================
if (-not $SkipAPI) {
    Write-Step "Copying API service (apps/api)..."
    
    $ApiSource = Join-Path $ProjectRoot "apps\api"
    $ApiDest = Join-Path $TempDir "apps\api"
    New-Item -ItemType Directory -Path $ApiDest -Force | Out-Null
    
    # Files to copy from API root
    $ApiRootFiles = @(
        "package.json",
        "tsconfig.json",
        "env.example.txt",
        ".eslintrc.cjs"
    )
    
    foreach ($file in $ApiRootFiles) {
        $sourcePath = Join-Path $ApiSource $file
        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath -Destination $ApiDest
        }
    }
    
    # Copy src directory
    $ApiSrcSource = Join-Path $ApiSource "src"
    $ApiSrcDest = Join-Path $ApiDest "src"
    if (Test-Path $ApiSrcSource) {
        Copy-Item -Path $ApiSrcSource -Destination $ApiSrcDest -Recurse
        Write-Success "  apps/api/src"
    }
    
    # Copy scripts directory if exists
    $ApiScriptsSource = Join-Path $ApiSource "scripts"
    $ApiScriptsDest = Join-Path $ApiDest "scripts"
    if (Test-Path $ApiScriptsSource) {
        Copy-Item -Path $ApiScriptsSource -Destination $ApiScriptsDest -Recurse
        Write-Success "  apps/api/scripts"
    }
    
    Write-Success "  API service packaged"
}

# ============================================
# Copy AI service
# ============================================
if (-not $SkipAI) {
    Write-Step "Copying AI service (apps/ai-service)..."
    
    $AiSource = Join-Path $ProjectRoot "apps\ai-service"
    $AiDest = Join-Path $TempDir "apps\ai-service"
    New-Item -ItemType Directory -Path $AiDest -Force | Out-Null
    
    # Files to copy from AI root
    $AiRootFiles = @(
        "Dockerfile",
        "requirements.txt",
        "env.example.txt",
        "README.md",
        ".gitignore"
    )
    
    foreach ($file in $AiRootFiles) {
        $sourcePath = Join-Path $AiSource $file
        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath -Destination $AiDest
        }
    }
    
    # Copy app directory (Python source code)
    $AiAppSource = Join-Path $AiSource "app"
    $AiAppDest = Join-Path $AiDest "app"
    if (Test-Path $AiAppSource) {
        Copy-Item -Path $AiAppSource -Destination $AiAppDest -Recurse
        Write-Success "  apps/ai-service/app"
    }
    
    Write-Success "  AI service packaged"
}

# ============================================
# Create Dockerfile for API service
# ============================================
Write-Step "Creating API Dockerfile..."

$ApiDockerfile = @"
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
RUN pnpm --filter @erp/api build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

# Copy package files for production install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

# Copy Prisma files
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/apps/api

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
"@

$ApiDockerfilePath = Join-Path $TempDir "apps\api\Dockerfile"
$ApiDockerfile | Out-File -FilePath $ApiDockerfilePath -Encoding utf8
Write-Success "  Dockerfile created for API service"

# ============================================
# Create deployment README
# ============================================
Write-Step "Creating deployment documentation..."

$DeployReadme = @"
# ERP Backend Deployment Package

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Contents

- `apps/api/` - Node.js API Service (Fastify)
- `apps/ai-service/` - Python AI Service (FastAPI)
- `packages/` - Shared packages (database, logger, shared-types, config)
- `docker-compose.yml` - Docker orchestration

## Quick Start with Docker

1. **Upload this package to your server**

2. **Create environment files:**
   ``````bash
   cp apps/api/env.example.txt apps/api/.env
   cp apps/ai-service/env.example.txt apps/ai-service/.env
   ``````

3. **Edit the .env files with production values**

4. **Start the services:**
   ``````bash
   # Start PostgreSQL and Redis first
   docker-compose up -d postgres redis

   # Wait for databases to be ready, then start API
   docker-compose up -d api

   # Optionally start AI service (requires --profile ai)
   docker-compose --profile ai up -d ai-service
   ``````

## Manual Deployment (Without Docker)

### API Service (Node.js)

``````bash
cd apps/api

# Install pnpm if not installed
npm install -g pnpm@9.14.2

# Go back to root and install dependencies
cd ../..
pnpm install

# Build the project
pnpm build

# Start the API service
cd apps/api
pnpm start
``````

### AI Service (Python)

``````bash
cd apps/ai-service

# Create virtual environment
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate
# Or on Windows
# .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the service
uvicorn app.main:app --host 0.0.0.0 --port 8000
``````

## Environment Variables

### API Service (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | production |
| DATABASE_URL | PostgreSQL connection | postgresql://user:pass@host:5432/db |
| REDIS_URL | Redis connection | redis://host:6379 |
| JWT_SECRET | JWT signing key | (generate secure key) |
| JWT_REFRESH_SECRET | Refresh token key | (generate secure key) |
| LICENSE_ENCRYPTION_KEY | License encryption | (32+ chars) |
| LHDN_ENCRYPTION_KEY | LHDN API encryption | (64 hex chars) |
| AI_SERVICE_URL | AI service URL | http://ai-service:8000 |

### AI Service (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 8000 |
| ENVIRONMENT | Environment | production |
| DATABASE_URL | PostgreSQL connection | postgresql://user:pass@host:5432/db |
| REDIS_URL | Redis connection | redis://host:6379 |
| CORS_ORIGINS | Allowed origins | https://your-domain.com |

## Ports

- API Service: 3000
- AI Service: 8000
- PostgreSQL: 5432
- Redis: 6379

## Health Checks

- API: GET http://localhost:3000/health
- AI: GET http://localhost:8000/health
"@

$DeployReadmePath = Join-Path $TempDir "DEPLOY_README.md"
$DeployReadme | Out-File -FilePath $DeployReadmePath -Encoding utf8
Write-Success "  DEPLOY_README.md created"

# ============================================
# Create ZIP archive
# ============================================
Write-Step "Creating ZIP archive..."

$ZipPath = Join-Path $OutputPath "$PackageName.zip"

# Remove existing zip if exists
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

# Create ZIP
Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipPath -CompressionLevel Optimal

Write-Success "  Archive created: $ZipPath"

# ============================================
# Calculate package size
# ============================================
$ZipSize = (Get-Item $ZipPath).Length
$ZipSizeMB = [math]::Round($ZipSize / 1MB, 2)

# ============================================
# Cleanup
# ============================================
Write-Step "Cleaning up temporary files..."
Remove-Item -Recurse -Force $TempDir
Write-Success "  Cleanup complete"

# ============================================
# Summary
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Package Created Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  File: " -NoNewline; Write-Host $ZipPath -ForegroundColor Cyan
Write-Host "  Size: " -NoNewline; Write-Host "$ZipSizeMB MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Upload the ZIP file to your server"
Write-Host "  2. Extract: unzip $PackageName.zip"
Write-Host "  3. Follow DEPLOY_README.md for setup instructions"
Write-Host ""

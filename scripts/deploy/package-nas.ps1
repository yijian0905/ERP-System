# Synology NAS Backend Deployment Package Script
# This script packages only essential files for NAS deployment
# Excludes: README, env.example.txt, and other non-essential files

param(
    [string]$OutputDir = ".\deploy-package"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Step { param($msg) Write-Host "[STEP] " -ForegroundColor Cyan -NoNewline; Write-Host $msg }
function Write-Success { param($msg) Write-Host "[OK] " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Info { param($msg) Write-Host "[INFO] " -ForegroundColor Yellow -NoNewline; Write-Host $msg }

# Generate secure random strings
function New-SecureString {
    param([int]$Length = 32)
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    $result = -join ((1..$Length) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    return $result
}

function New-HexString {
    param([int]$Length = 64)
    $chars = '0123456789abcdef'
    $result = -join ((1..$Length) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    return $result
}

# Get project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Item "$ScriptDir\..\..").FullName

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  ERP NAS Deployment Package" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Timestamp and paths
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$PackageName = "erp-backend-nas-$Timestamp"
$TempDir = Join-Path $env:TEMP $PackageName
$OutputPath = Join-Path $ProjectRoot $OutputDir

# Clean up
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }

# Create directories
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null

Write-Step "Creating NAS deployment package..."
Write-Info "Source: $ProjectRoot"
Write-Info "Output: $OutputPath"
Write-Host ""

# ============================================
# Generate Security Keys
# ============================================
Write-Step "Generating security keys..."
$JWT_SECRET = New-SecureString -Length 48
$JWT_REFRESH_SECRET = New-SecureString -Length 48
$LICENSE_KEY = New-SecureString -Length 48
$LHDN_KEY = New-HexString -Length 64
Write-Success "  Security keys generated"

# ============================================
# Copy root configuration (essential only)
# ============================================
Write-Step "Copying root configuration..."

$RootFiles = @(
    "package.json",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    "docker-compose.yml",
    "turbo.json"
)

foreach ($file in $RootFiles) {
    $sourcePath = Join-Path $ProjectRoot $file
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath -Destination $TempDir
        Write-Success "  $file"
    }
}

# ============================================
# Copy shared packages (essential files only)
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
        New-Item -ItemType Directory -Path $destPkg -Force | Out-Null
        
        # Copy essential files only (exclude README, examples, etc.)
        Get-ChildItem -Path $sourcePkg -Recurse | Where-Object {
            $_.FullName -notmatch "node_modules" -and
            $_.FullName -notmatch "\\dist\\" -and
            $_.FullName -notmatch "\\generated\\" -and
            $_.Name -ne "dist" -and
            $_.Name -ne "generated" -and
            $_.Name -notmatch "README" -and
            $_.Name -notmatch "\.example\." -and
            $_.Name -ne "env.example.txt" -and
            $_.Name -notmatch "\.md$" -and
            $_.Name -notmatch "\.turbo"
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
# Copy API service (essential files only)
# ============================================
Write-Step "Copying API service..."

$ApiSource = Join-Path $ProjectRoot "apps\api"
$ApiDest = Join-Path $TempDir "apps\api"
New-Item -ItemType Directory -Path $ApiDest -Force | Out-Null

# Copy essential API files
$ApiEssentialFiles = @("package.json", "tsconfig.json", "Dockerfile", ".eslintrc.cjs")
foreach ($file in $ApiEssentialFiles) {
    $sourcePath = Join-Path $ApiSource $file
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath -Destination $ApiDest
    }
}

# Copy src directory
$ApiSrcSource = Join-Path $ApiSource "src"
if (Test-Path $ApiSrcSource) {
    Copy-Item -Path $ApiSrcSource -Destination (Join-Path $ApiDest "src") -Recurse
}

Write-Success "  apps/api"

# ============================================
# Copy AI service (essential files only)
# ============================================
Write-Step "Copying AI service..."

$AiSource = Join-Path $ProjectRoot "apps\ai-service"
$AiDest = Join-Path $TempDir "apps\ai-service"
New-Item -ItemType Directory -Path $AiDest -Force | Out-Null

# Copy essential AI files
$AiEssentialFiles = @("Dockerfile", "requirements.txt")
foreach ($file in $AiEssentialFiles) {
    $sourcePath = Join-Path $AiSource $file
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath -Destination $AiDest
    }
}

# Copy app directory
$AiAppSource = Join-Path $AiSource "app"
if (Test-Path $AiAppSource) {
    Copy-Item -Path $AiAppSource -Destination (Join-Path $AiDest "app") -Recurse
}

Write-Success "  apps/ai-service"

# ============================================
# Create pre-configured .env files
# ============================================
Write-Step "Creating pre-configured .env files..."

# API .env
$ApiEnv = @"
# ERP API Service - Production Configuration
# Pre-configured for Synology NAS Docker deployment

PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Database (Docker internal network)
DATABASE_URL=postgresql://erp_user:erp_password@postgres:5432/erp_database

# Redis (Docker internal network)
REDIS_URL=redis://redis:6379

# JWT Security Keys (auto-generated)
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# CORS - Allow all origins for desktop app
CORS_ORIGIN=*

# AI Services (Docker internal network)
AI_SERVICE_URL=http://ai-service:8000
OLLAMA_API_URL=http://ollama:11434

# Encryption Keys (auto-generated)
LICENSE_ENCRYPTION_KEY=$LICENSE_KEY
LHDN_ENCRYPTION_KEY=$LHDN_KEY

# Logging
LOG_LEVEL=info
"@

$ApiEnvPath = Join-Path $ApiDest ".env"
$ApiEnv | Out-File -FilePath $ApiEnvPath -Encoding utf8 -NoNewline
Write-Success "  apps/api/.env"

# AI Service .env
$AiEnv = @"
# ERP AI Service - Production Configuration
# Pre-configured for Synology NAS Docker deployment

PORT=8000
HOST=0.0.0.0
ENVIRONMENT=production

# Database (Docker internal network)
DATABASE_URL=postgresql://erp_user:erp_password@postgres:5432/erp_database

# Redis (Docker internal network)
REDIS_URL=redis://redis:6379

# CORS - Allow all origins
CORS_ORIGINS=*

# Logging
LOG_LEVEL=info

# Model settings
MODEL_CACHE_TTL=3600
PREDICTION_TIMEOUT=30
"@

$AiEnvPath = Join-Path $AiDest ".env"
$AiEnv | Out-File -FilePath $AiEnvPath -Encoding utf8 -NoNewline
Write-Success "  apps/ai-service/.env"

# Database .env
$DbEnv = @"
# Database Package - Production Configuration
DATABASE_URL=postgresql://erp_user:erp_password@postgres:5432/erp_database
"@

$DbEnvPath = Join-Path $TempPackagesDir "database\.env"
$DbEnv | Out-File -FilePath $DbEnvPath -Encoding utf8 -NoNewline
Write-Success "  packages/database/.env"

# ============================================
# Create NAS-specific docker-compose override
# ============================================
Write-Step "Creating docker-compose configuration..."

$DockerComposeNas = @"
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: erp-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: erp_password
      POSTGRES_DB: erp_database
    ports:
      - '5433:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U erp_user -d erp_database']
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: erp-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  # API Service (Node.js/Fastify)
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: erp-api
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
    env_file:
      - ./apps/api/.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # AI Service (Python/FastAPI)
  ai-service:
    build:
      context: ./apps/ai-service
      dockerfile: Dockerfile
    container_name: erp-ai-service
    restart: unless-stopped
    ports:
      - '8000:8000'
    env_file:
      - ./apps/ai-service/.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: erp-network
"@

$DockerComposePath = Join-Path $TempDir "docker-compose.yml"
$DockerComposeNas | Out-File -FilePath $DockerComposePath -Encoding utf8 -NoNewline -Force
Write-Success "  docker-compose.yml (NAS optimized)"

# ============================================
# Create deployment instructions
# ============================================
Write-Step "Creating deployment instructions..."

$DeployInstructions = @"
# ERP 後端 Synology NAS 部署指南

## 快速部署

### 1. 上傳並解壓
```bash
# 上傳 ZIP 到 NAS 後
unzip erp-backend-nas-*.zip -d /volume1/docker/erp
cd /volume1/docker/erp
```

### 2. 啟動服務
```bash
docker-compose up -d
```

### 3. 檢查服務狀態
```bash
docker-compose ps
```

### 4. 驗證 API
```bash
curl http://localhost:3000/health
curl http://localhost:8000/health
```

## 服務端口

| 服務 | 端口 | 說明 |
|------|------|------|
| API | 3000 | 主要後端 API |
| AI Service | 8000 | AI 預測服務 |
| PostgreSQL | 5433 | 資料庫 (外部) |
| Redis | 6379 | 緩存 |

## 桌面應用配置

在啟動 Electron 桌面應用前設置：
```batch
set ERP_API_URL=http://NAS-IP:3000
```

## 常用命令

```bash
# 查看日誌
docker-compose logs -f api
docker-compose logs -f ai-service

# 重啟服務
docker-compose restart

# 停止服務
docker-compose down

# 重建並啟動
docker-compose up -d --build
```
"@

$InstructionsPath = Join-Path $TempDir "DEPLOY.md"
$DeployInstructions | Out-File -FilePath $InstructionsPath -Encoding utf8 -NoNewline
Write-Success "  DEPLOY.md"

# ============================================
# Create ZIP archive
# ============================================
Write-Step "Creating ZIP archive..."

$ZipPath = Join-Path $OutputPath "$PackageName.zip"

if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipPath -CompressionLevel Optimal
Write-Success "  Archive created"

# ============================================
# Cleanup
# ============================================
Write-Step "Cleaning up..."
Remove-Item -Recurse -Force $TempDir
Write-Success "  Cleanup complete"

# ============================================
# Summary
# ============================================
$ZipSize = (Get-Item $ZipPath).Length
$ZipSizeMB = [math]::Round($ZipSize / 1MB, 2)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Package Created Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  File: " -NoNewline; Write-Host $ZipPath -ForegroundColor Cyan
Write-Host "  Size: " -NoNewline; Write-Host "$ZipSizeMB MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Included Services:" -ForegroundColor Yellow
Write-Host "    - API Service (Node.js/Fastify)"
Write-Host "    - AI Service (Python/FastAPI)"
Write-Host "    - PostgreSQL Database"
Write-Host "    - Redis Cache"
Write-Host ""
Write-Host "  Pre-configured .env files: YES" -ForegroundColor Green
Write-Host "  Ready for immediate deployment!" -ForegroundColor Green
Write-Host ""

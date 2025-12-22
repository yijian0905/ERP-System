# ============================================================
# ERP Desktop App - Preview Mode Launcher
# ============================================================
# This script builds the web app and runs the desktop app in 
# preview mode without needing a web dev server running.
# ============================================================

param(
    [string]$ApiUrl = "http://100.120.133.59:3000",
    [switch]$SkipWebBuild,
    [switch]$Help
)

# Colors for output
function Write-Step($message) {
    Write-Host "`n[STEP] " -ForegroundColor Cyan -NoNewline
    Write-Host $message
}

function Write-Success($message) {
    Write-Host "[OK] " -ForegroundColor Green -NoNewline
    Write-Host $message
}

function Write-Error($message) {
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $message
}

function Write-Info($message) {
    Write-Host "[INFO] " -ForegroundColor Yellow -NoNewline
    Write-Host $message
}

# Show help
if ($Help) {
    Write-Host @"

ERP Desktop Preview Mode Launcher
=================================

Usage:
  .\preview-desktop.ps1 [options]

Options:
  -ApiUrl <url>      Set the backend API URL (default: http://100.120.133.59:3000)
  -SkipWebBuild      Skip rebuilding the web app (use existing build)
  -Help              Show this help message

Examples:
  .\preview-desktop.ps1                                    # Use default NAS API
  .\preview-desktop.ps1 -ApiUrl "http://localhost:3000"    # Use local API
  .\preview-desktop.ps1 -SkipWebBuild                      # Skip web build
  .\preview-desktop.ps1 -ApiUrl "http://192.168.1.100:3000" -SkipWebBuild

"@
    exit 0
}

# Get script and project directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
Set-Location $ProjectRoot

Write-Host @"

============================================================
     ERP Desktop App - Preview Mode Launcher
============================================================
  API URL: $ApiUrl
  Skip Web Build: $SkipWebBuild
============================================================

"@ -ForegroundColor Cyan

# Step 1: Build web app (unless skipped)
if (-not $SkipWebBuild) {
    Write-Step "Building web application..."
    
    $buildResult = pnpm --filter @erp/web build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Web build failed!"
        Write-Host $buildResult
        exit 1
    }
    Write-Success "Web app built successfully"
} else {
    Write-Info "Skipping web build (using existing build)"
}

# Step 2: Copy web build to desktop renderer
Write-Step "Copying web files to desktop renderer..."

$webDist = Join-Path $ProjectRoot "apps\web\dist"
$desktopRenderer = Join-Path $ProjectRoot "apps\desktop\dist\renderer"

if (-not (Test-Path $webDist)) {
    Write-Error "Web build not found at $webDist"
    Write-Error "Please run without -SkipWebBuild first"
    exit 1
}

# Remove existing renderer directory
if (Test-Path $desktopRenderer) {
    Remove-Item -Path $desktopRenderer -Recurse -Force
}

# Create and copy
New-Item -ItemType Directory -Path $desktopRenderer -Force | Out-Null
Copy-Item -Path "$webDist\*" -Destination $desktopRenderer -Recurse -Force

Write-Success "Web files copied to desktop/dist/renderer"

# Step 3: Build desktop main and preload
Write-Step "Building Electron main and preload..."

$desktopBuildResult = pnpm --filter @erp/desktop build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Desktop build failed!"
    Write-Host $desktopBuildResult
    exit 1
}
Write-Success "Desktop app built successfully"

# Step 4: Set environment and run preview
Write-Step "Starting desktop app in preview mode..."

$env:ERP_API_URL = $ApiUrl
Write-Info "ERP_API_URL set to: $ApiUrl"

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "  Desktop app starting..." -ForegroundColor Green
Write-Host "  API Backend: $ApiUrl" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Green

# Run preview
pnpm --filter @erp/desktop preview

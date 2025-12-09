# ERP System - Login Diagnostic Script
# This script checks the database for login-related issues

Write-Host "=== ERP System Login Database Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
Set-Location $ProjectRoot

# Check if Docker is running
Write-Host "1. Checking Docker..." -ForegroundColor Yellow
try {
    $containers = docker compose ps --format "{{.Name}}" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Docker Compose not running or error" -ForegroundColor Red
        Write-Host "   Run: docker compose up -d" -ForegroundColor Gray
        exit 1
    }
    Write-Host "   ✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Docker not available" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Checking Users in Database..." -ForegroundColor Yellow
Write-Host ""

$userQuery = @"
SELECT 
    u.email,
    u.name,
    u.role,
    u.is_active as user_active,
    LEFT(u.password, 20) || '...' as password_preview,
    t.name as tenant_name,
    t.status as tenant_status
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.deleted_at IS NULL
ORDER BY u.created_at DESC
LIMIT 10;
"@

$result = docker compose exec -T postgres psql -U erp_user -d erp_database -c $userQuery 2>&1
Write-Host $result

Write-Host ""
Write-Host "3. Checking Email Case..." -ForegroundColor Yellow

$emailQuery = @"
SELECT 
    email,
    email = LOWER(email) as is_lowercase
FROM users
WHERE deleted_at IS NULL;
"@

$result = docker compose exec -T postgres psql -U erp_user -d erp_database -c $emailQuery 2>&1
Write-Host $result

Write-Host ""
Write-Host "4. Checking Tenant Licenses..." -ForegroundColor Yellow

$licenseQuery = @"
SELECT 
    t.name,
    t.slug,
    t.status as tenant_status,
    l.tier as license_tier,
    l.is_active as license_active
FROM tenants t
LEFT JOIN licenses l ON t.id = l.tenant_id
ORDER BY t.created_at DESC
LIMIT 10;
"@

$result = docker compose exec -T postgres psql -U erp_user -d erp_database -c $licenseQuery 2>&1
Write-Host $result

Write-Host ""
Write-Host "=== Diagnostic Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Common Issues:" -ForegroundColor Yellow
Write-Host "  1. user_active = f (false) -> User is disabled" -ForegroundColor White
Write-Host "  2. tenant_status != ACTIVE -> Tenant is not active" -ForegroundColor White
Write-Host "  3. is_lowercase = f -> Email case mismatch" -ForegroundColor White
Write-Host "  4. password_preview is empty -> Password hash failed" -ForegroundColor White
Write-Host ""


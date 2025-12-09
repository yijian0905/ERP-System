# Check specific user login status
param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

Write-Host "=== Checking User Login Status ===" -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor Yellow
Write-Host ""

$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
Set-Location $ProjectRoot

$lowerEmail = $Email.ToLower().Trim()

Write-Host "1. Checking user in database..." -ForegroundColor Yellow

$userQuery = @"
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.is_active,
    u.deleted_at IS NOT NULL as is_deleted,
    LENGTH(u.password) as password_length,
    LEFT(u.password, 30) as password_preview,
    SUBSTRING(u.password, 1, 1) as first_char,
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    t.status as tenant_status,
    t.tier as tenant_tier,
    (SELECT COUNT(*) FROM licenses l WHERE l.tenant_id = t.id AND l.is_active = true) as active_license_count
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE LOWER(u.email) = '$lowerEmail'
  AND u.deleted_at IS NULL;
"@

$result = docker compose exec -T postgres psql -U erp_user -d erp_database -c $userQuery 2>&1
Write-Host $result
Write-Host ""

Write-Host "2. Checking if password hash is valid bcrypt format..." -ForegroundColor Yellow

$hashCheckQuery = @"
SELECT 
    email,
    password LIKE '$2a$%' OR password LIKE '$2b$%' as is_bcrypt_format,
    LENGTH(password) >= 60 as has_min_length,
    password !~ '[[:cntrl:]]' as has_no_control_chars
FROM users
WHERE LOWER(email) = '$lowerEmail'
  AND deleted_at IS NULL;
"@

$result = docker compose exec -T postgres psql -U erp_user -d erp_database -c $hashCheckQuery 2>&1
Write-Host $result
Write-Host ""

Write-Host "3. Testing password hash with Node.js..." -ForegroundColor Yellow

# Get the password hash from database
$hashQuery = "SELECT password FROM users WHERE LOWER(email) = '$lowerEmail' AND deleted_at IS NULL;"
$hashResult = docker compose exec -T postgres psql -U erp_user -d erp_database -t -c $hashQuery 2>&1 | Where-Object { $_ -match '\$2[ab]\$' }

if ($hashResult) {
    $hash = ($hashResult -split '\s+')[0].Trim()
    Write-Host "   Found hash: $($hash.Substring(0, 30))..." -ForegroundColor Gray
    
    # Test with Node.js
    $testScript = @"
const bcrypt = require('bcryptjs');
const hash = '$hash';
const password = 'password123';

bcrypt.compare(password, hash)
  .then(result => {
    console.log('Password match:', result);
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
"@
    
    $tempFile = [System.IO.Path]::GetTempFileName() + ".js"
    $testScript | Out-File -FilePath $tempFile -Encoding UTF8
    
    Write-Host "   Testing password 'password123' against hash..." -ForegroundColor Gray
    $testResult = cd "$ProjectRoot\apps\api" ; node $tempFile 2>&1
    Write-Host "   Result: $testResult" -ForegroundColor $(if ($LASTEXITCODE -eq 0) { "Green" } else { "Red" })
    
    Remove-Item $tempFile -ErrorAction SilentlyContinue
} else {
    Write-Host "   ✗ Could not extract valid hash from database" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Diagnostic Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Common Issues:" -ForegroundColor Yellow
Write-Host "  • is_active = f → User is disabled" -ForegroundColor White
Write-Host "  • tenant_status != ACTIVE → Tenant is not active" -ForegroundColor White
Write-Host "  • is_bcrypt_format = f → Password hash is invalid" -ForegroundColor White
Write-Host "  • has_no_control_chars = f → Hash contains control characters (ANSI codes)" -ForegroundColor White
Write-Host "  • active_license_count = 0 → No active license for tenant" -ForegroundColor White
Write-Host ""


# Login Diagnostic Script
# This script helps diagnose login issues

Write-Host "=== ERP System Login Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# Check if servers are running
Write-Host "1. Checking if servers are running..." -ForegroundColor Yellow

# Check Frontend (Vite)
Write-Host "   - Frontend (Port 5173): " -NoNewline
try {
    $frontend = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:5173" -Method Head -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ RUNNING" -ForegroundColor Green
} catch {
    Write-Host "✗ NOT RUNNING" -ForegroundColor Red
}

# Check Backend (Fastify)
Write-Host "   - Backend (Port 3000): " -NoNewline
try {
    $backend = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ RUNNING" -ForegroundColor Green
    Write-Host "     Response: $($backend.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ NOT RUNNING" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Testing login endpoint..." -ForegroundColor Yellow

try {
    $body = @{
        email = "admin@demo-company.com"
        password = "password123"
    } | ConvertTo-Json

    Write-Host "   Request: POST http://localhost:3000/auth/login" -ForegroundColor Gray
    Write-Host "   Body: $body" -ForegroundColor Gray
    
    $response = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/auth/login" -Method Post -Headers @{
        "Content-Type" = "application/json"
        "Origin" = "http://localhost:5173"
    } -Body $body -TimeoutSec 5 -ErrorAction Stop

    Write-Host "   ✓ Login endpoint responded: $($response.StatusCode)" -ForegroundColor Green
    $jsonResponse = $response.Content | ConvertFrom-Json
    if ($jsonResponse.success) {
        Write-Host "   ✓ Login successful!" -ForegroundColor Green
        Write-Host "     User: $($jsonResponse.data.user.email)" -ForegroundColor Gray
        Write-Host "     Role: $($jsonResponse.data.user.role)" -ForegroundColor Gray
        Write-Host "     Tier: $($jsonResponse.data.user.tier)" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ Login failed: $($jsonResponse.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Login endpoint error" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "     Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "3. Testing Vite proxy..." -ForegroundColor Yellow

try {
    $body = @{
        email = "admin@demo-company.com"
        password = "password123"
    } | ConvertTo-Json

    Write-Host "   Request: POST http://localhost:5173/auth/login (via Vite proxy)" -ForegroundColor Gray
    
    $response = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:5173/auth/login" -Method Post -Headers @{
        "Content-Type" = "application/json"
    } -Body $body -TimeoutSec 5 -ErrorAction Stop

    Write-Host "   ✓ Vite proxy working: $($response.StatusCode)" -ForegroundColor Green
    $jsonResponse = $response.Content | ConvertFrom-Json
    if ($jsonResponse.success) {
        Write-Host "   ✓ Login via proxy successful!" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Login via proxy failed: $($jsonResponse.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Vite proxy error" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Diagnostic Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open browser console (F12) and try logging in" -ForegroundColor White
Write-Host "2. Check for [LOGIN] and [API-CLIENT] log messages in the console" -ForegroundColor White
Write-Host "3. Check backend logs in the terminal running 'pnpm dev'" -ForegroundColor White
Write-Host "4. Look for [AUTH] log messages in the backend output" -ForegroundColor White
Write-Host ""

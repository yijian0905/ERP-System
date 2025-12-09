# Quick Backend Check Script

Write-Host "Checking Backend API..." -ForegroundColor Cyan

# Check if port 3000 is listening
$port3000 = netstat -ano | Select-String ":3000"
if ($port3000) {
    Write-Host "✓ Port 3000 is LISTENING" -ForegroundColor Green
    Write-Host $port3000
} else {
    Write-Host "✗ Port 3000 is NOT listening" -ForegroundColor Red
}

Write-Host ""
Write-Host "Trying to start backend manually..." -ForegroundColor Yellow
Write-Host "Command: cd apps/api && pnpm dev" -ForegroundColor Gray
Write-Host ""
Write-Host "If you see errors below, that's the problem:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

Set-Location "apps\api"
& pnpm dev

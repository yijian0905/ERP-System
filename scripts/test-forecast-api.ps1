# PowerShell script to test forecasting API integration
# Tests the connection between backend API and Python AI service

param(
    [string]$ApiUrl = "http://localhost:3000",
    [string]$AiServiceUrl = "http://localhost:8000",
    [string]$Token = ""
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing Forecasting API Integration" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Colors
$GREEN = "Green"
$RED = "Red"
$YELLOW = "Yellow"
$GRAY = "Gray"

# Test 1: Check AI Service Health
Write-Host "1. Testing AI Service Health..." -ForegroundColor $YELLOW
try {
    $response = Invoke-WebRequest -Uri "$AiServiceUrl/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ AI Service is running" -ForegroundColor $GREEN
        Write-Host "   Response: $($response.Content)" -ForegroundColor $GRAY
    }
} catch {
    Write-Host "   ❌ AI Service is not responding" -ForegroundColor $RED
    Write-Host "   Error: $_" -ForegroundColor $RED
    Write-Host ""
    Write-Host "   Make sure AI service is running:" -ForegroundColor $YELLOW
    Write-Host "   cd apps/ai-service" -ForegroundColor $GRAY
    Write-Host "   uvicorn app.main:app --reload --port 8000" -ForegroundColor $GRAY
    exit 1
}
Write-Host ""

# Test 2: Check Backend API Health
Write-Host "2. Testing Backend API Health..." -ForegroundColor $YELLOW
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend API is running" -ForegroundColor $GREEN
    }
} catch {
    Write-Host "   ❌ Backend API is not responding" -ForegroundColor $RED
    Write-Host "   Error: $_" -ForegroundColor $RED
    Write-Host ""
    Write-Host "   Make sure backend API is running:" -ForegroundColor $YELLOW
    Write-Host "   cd apps/api" -ForegroundColor $GRAY
    Write-Host "   pnpm dev" -ForegroundColor $GRAY
    exit 1
}
Write-Host ""

# Test 3: Check Forecasting Health Endpoint (requires auth)
if ($Token) {
    Write-Host "3. Testing Forecasting Health Endpoint..." -ForegroundColor $YELLOW
    try {
        $headers = @{
            "Authorization" = "Bearer $Token"
            "Content-Type" = "application/json"
        }
        $response = Invoke-WebRequest -Uri "$ApiUrl/api/v1/forecasting/health" -Method Get -Headers $headers -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            Write-Host "   ✅ Forecasting health check passed" -ForegroundColor $GREEN
            Write-Host "   AI Service Available: $($data.data.available)" -ForegroundColor $GRAY
            Write-Host "   Service URL: $($data.data.service_url)" -ForegroundColor $GRAY
        }
    } catch {
        Write-Host "   ⚠️  Forecasting health check failed (may need authentication)" -ForegroundColor $YELLOW
        Write-Host "   Error: $_" -ForegroundColor $GRAY
    }
    Write-Host ""
}

# Test 4: Test AI Service Forecast Endpoint Directly
Write-Host "4. Testing AI Service Forecast Endpoint..." -ForegroundColor $YELLOW
try {
    $body = @{
        product_id = "550e8400-e29b-41d4-a716-446655440000"
        tenant_id = "550e8400-e29b-41d4-a716-446655440001"
        forecast_days = 30
        include_confidence = $false
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$AiServiceUrl/api/v1/forecast/demand" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30 -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   ✅ AI Service forecast endpoint is working" -ForegroundColor $GREEN
        Write-Host "   Forecast Days: $($data.forecast_days)" -ForegroundColor $GRAY
        Write-Host "   Predictions Count: $($data.predictions.Count)" -ForegroundColor $GRAY
    }
} catch {
    Write-Host "   ❌ AI Service forecast endpoint failed" -ForegroundColor $RED
    Write-Host "   Error: $_" -ForegroundColor $RED
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Basic connectivity tests completed" -ForegroundColor $GREEN
Write-Host ""
Write-Host "Next steps:" -ForegroundColor $YELLOW
Write-Host "1. Make sure both services are running:" -ForegroundColor $GRAY
Write-Host "   - Backend API: $ApiUrl" -ForegroundColor $GRAY
Write-Host "   - AI Service: $AiServiceUrl" -ForegroundColor $GRAY
Write-Host ""
Write-Host "2. Test with authentication token:" -ForegroundColor $GRAY
Write-Host "   .\scripts\test-forecast-api.ps1 -Token 'your-jwt-token'" -ForegroundColor $GRAY
Write-Host ""
Write-Host "3. Check environment variables:" -ForegroundColor $GRAY
Write-Host "   AI_SERVICE_URL should be set in apps/api/.env" -ForegroundColor $GRAY

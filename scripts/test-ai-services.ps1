# PowerShell script to test AI services
# Tests both Python AI Service (L2+) and Ollama (L3)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing ERP AI Services" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$allOk = $true

# Test Python AI Service
Write-Host "1. Testing Python AI Service (L2+)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Python AI Service is running" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Python AI Service is not responding" -ForegroundColor Red
    Write-Host "   Make sure the service is running on http://localhost:8000" -ForegroundColor Gray
    Write-Host "   Start with: docker-compose --profile ai up -d ai-service" -ForegroundColor Gray
    Write-Host "   Or locally: uvicorn app.main:app --reload --port 8000" -ForegroundColor Gray
    $allOk = $false
}
Write-Host ""

# Test Ollama
Write-Host "2. Testing Ollama (L3)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Ollama is running" -ForegroundColor Green
    
    try {
        $models = $response.Content | ConvertFrom-Json
        if ($models.models) {
            Write-Host "   Available models:" -ForegroundColor Gray
            foreach ($model in $models.models) {
                Write-Host "   - $($model.name)" -ForegroundColor Gray
            }
        } else {
            Write-Host "   (No models found)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   (Unable to parse model list)" -ForegroundColor Yellow
    }
    
    # Test a simple generation
    Write-Host ""
    Write-Host "   Testing model generation..." -ForegroundColor Gray
    try {
        $body = @{
            model = "llama2"
            prompt = "Hello"
            stream = $false
        } | ConvertTo-Json
        
        $genResponse = Invoke-WebRequest -Uri "http://localhost:11434/api/generate" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
        Write-Host "   ✅ Model generation test passed" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Model generation test failed (may need to pull a model)" -ForegroundColor Yellow
        Write-Host "   Run: docker exec -it erp-ollama ollama pull llama2" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Ollama is not responding" -ForegroundColor Red
    Write-Host "   Make sure Ollama is running on http://localhost:11434" -ForegroundColor Gray
    Write-Host "   Start with: docker-compose --profile ai up -d ollama" -ForegroundColor Gray
    $allOk = $false
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if ($allOk) {
    Write-Host "✅ All AI services are operational" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some AI services are not running" -ForegroundColor Red
    exit 1
}



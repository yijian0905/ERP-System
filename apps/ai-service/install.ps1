# PowerShell script to install AI service dependencies on Windows
# This script handles Python 3.13 compatibility issues with scikit-learn

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Installing ERP AI Service Dependencies" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
Write-Host "Python: $pythonVersion" -ForegroundColor Gray

# Upgrade pip
Write-Host ""
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install scikit-learn first (using pre-built wheels to avoid compilation)
Write-Host ""
Write-Host "Installing scikit-learn (pre-built wheel)..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

try {
    # Try to install latest scikit-learn (should have Python 3.13 support)
    pip install --only-binary :all: scikit-learn --upgrade
    Write-Host "✅ scikit-learn installed successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Pre-built wheel not available, trying regular install..." -ForegroundColor Yellow
    pip install scikit-learn --upgrade
}

# Install other dependencies
Write-Host ""
Write-Host "Installing other dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verify installation
Write-Host "Verifying installation..." -ForegroundColor Yellow
try {
    python -c "import sklearn; print(f'scikit-learn version: {sklearn.__version__}')"
    python -c "import fastapi; print(f'FastAPI version: {fastapi.__version__}')"
    Write-Host "✅ All packages installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Some packages may not be installed correctly" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy env.example.txt to .env and configure" -ForegroundColor Gray
Write-Host "2. Run: uvicorn app.main:app --reload --port 8000" -ForegroundColor Gray



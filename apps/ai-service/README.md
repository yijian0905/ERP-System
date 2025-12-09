# 🤖 ERP AI Service

Python FastAPI microservice providing predictive analytics for the ERP system (L2+ tier features).

## Features

- **Demand Forecasting**: Predict future product demand using time series analysis
- **Stock Optimization**: Calculate optimal reorder points and order quantities
- **Seasonal Pattern Analysis**: Identify trends and seasonal patterns in sales data

## Quick Start

### Development

**Windows (PowerShell):**

```powershell
# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies (handles Python 3.13 compatibility)
.\install.ps1

# Or manually:
pip install --only-binary :all: scikit-learn
pip install -r requirements.txt

# Copy environment file
Copy-Item env.example.txt .env

# Run service
uvicorn app.main:app --reload --port 8000
```

**Linux/Mac:**

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example.txt .env

# Run service
uvicorn app.main:app --reload --port 8000
```

> 💡 **Windows 用戶注意**：如果遇到 scikit-learn 編譯錯誤，請參考 [Windows 安裝指南](INSTALL_WINDOWS.md)

### Docker

```bash
# Build image
docker build -t erp-ai-service .

# Run container
docker run -p 8000:8000 --env-file .env erp-ai-service
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Endpoints

- `GET /health` - Health check
- `GET /ready` - Readiness check
- `POST /api/v1/forecast/demand` - Demand forecasting
- `POST /api/v1/forecast/stock-optimization` - Stock optimization
- `POST /api/v1/forecast/seasonal-patterns` - Seasonal analysis

## Development

See the main [AI Setup Guide](../../docs/ai-setup-guide.md) for detailed setup instructions.


# 🤖 AI 服務設置指南 (AI Setup Guide)

本指南將幫助您設置 ERP 系統的 AI 功能，包括 L2 層級的預測分析（Predictive Analytics）和 L3 層級的 AI 聊天助手（AI Chat Assistant）。

---

## 📋 目錄

- [概述](#概述)
- [L2 層級：Python AI 服務（預測分析）](#l2-層級python-ai-服務預測分析)
- [L3 層級：Ollama 聊天助手](#l3-層級ollama-聊天助手)
- [驗證設置](#驗證設置)
- [故障排除](#故障排除)

---

## 概述

ERP 系統包含兩個 AI 服務：

| 服務 | 層級 | 技術 | 用途 |
|------|------|------|------|
| **Python AI Service** | L2+ | FastAPI + Scikit-learn | 需求預測、庫存優化 |
| **Ollama** | L3 | Ollama LLM | 自然語言查詢和洞察 |

### 系統架構

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │
┌──────▼──────┐
│  API Server │
│  (Fastify)  │
└───┬──────┬──┘
    │      │
    │      └─────────────┐
    │                    │
┌───▼────┐      ┌────────▼─────┐
│ Python │      │    Ollama    │
│  AI    │      │   (L3 only)  │
│Service │      │              │
│(L2+)   │      └──────────────┘
└────────┘
```

---

## L2 層級：Python AI 服務（預測分析）

### 前置需求

- **Python 3.10+**
- **pip** 或 **conda**
- **Docker**（可選，用於容器化部署）

### 方法 1：本地開發設置

#### 步驟 1：創建虛擬環境

```bash
# 進入 ai-service 目錄
cd apps/ai-service

# 創建虛擬環境
python -m venv venv

# 啟動虛擬環境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

#### 步驟 2：安裝依賴

**Windows 用戶（Python 3.13）：**

如果遇到 scikit-learn 編譯錯誤，請先安裝預編譯版本：

```powershell
# 升級 pip
python -m pip install --upgrade pip

# 安裝預編譯的 scikit-learn（避免編譯錯誤）
pip install --only-binary :all: scikit-learn

# 然後安裝其他依賴
pip install -r requirements.txt
```

**Linux/Mac 或 Python 3.11/3.12：**

```bash
# 安裝 Python 依賴
pip install -r requirements.txt
```

> 💡 **提示**：如果仍有問題，請參考 [Windows 安裝指南](../apps/ai-service/INSTALL_WINDOWS.md)

#### 步驟 3：配置環境變數

創建 `apps/ai-service/.env` 文件：

```env
# AI Service Configuration
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=development

# Database (for fetching historical data)
DATABASE_URL=postgresql://erp_user:erp_password@localhost:5432/erp_database

# Redis (for caching predictions)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

#### 步驟 4：啟動服務

```bash
# 開發模式（自動重載）
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

# 或使用生產模式
uvicorn app.main:app --port 8000 --host 0.0.0.0 --workers 4
```

服務將在 `http://localhost:8000` 啟動。

#### 步驟 5：驗證服務

```bash
# 檢查健康狀態
curl http://localhost:8000/health

# 查看 API 文檔
# 瀏覽器打開: http://localhost:8000/docs
```

### 方法 2：Docker 設置

#### 步驟 1：使用 Docker Compose

更新 `docker-compose.yml` 以包含 AI 服務：

```yaml
  # Python AI Service (L2+)
  ai-service:
    build:
      context: ./apps/ai-service
      dockerfile: Dockerfile
    container_name: erp-ai-service
    restart: unless-stopped
    ports:
      - '8000:8000'
    environment:
      - PORT=8000
      - HOST=0.0.0.0
      - DATABASE_URL=postgresql://erp_user:erp_password@postgres:5432/erp_database
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    profiles:
      - ai  # Only start with --profile ai
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health']
      interval: 30s
      timeout: 10s
      retries: 3
```

#### 步驟 2：啟動服務

```bash
# 啟動 AI 服務（包含 postgres 和 redis）
docker-compose --profile ai up -d ai-service

# 查看日誌
docker-compose logs -f ai-service
```

### API 端點

AI 服務提供以下主要端點：

| 端點 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 健康檢查 |
| `/api/v1/forecast/demand` | POST | 需求預測 |
| `/api/v1/forecast/stock-optimization` | POST | 庫存優化建議 |
| `/api/v1/forecast/seasonal-patterns` | POST | 季節性模式分析 |
| `/docs` | GET | Swagger API 文檔 |

### 範例請求

> **💡 提示：** 我們提供了一個 PowerShell 測試腳本，可以一次性測試所有 forecast API 端點：
> ```powershell
> # 從專案根目錄執行
> .\scripts\test-forecast-api.ps1
> 
> # 或使用自訂參數
> .\scripts\test-forecast-api.ps1 -ProductId "your-uuid" -TenantId "your-uuid" -ForecastDays 60 -IncludeConfidence
> ```

#### Bash/Linux/Mac

```bash
# 需求預測
curl -X POST http://localhost:8000/api/v1/forecast/demand \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "uuid-here",
    "tenant_id": "uuid-here",
    "forecast_days": 30,
    "include_confidence": true
  }'
```

#### PowerShell (Windows)

在 PowerShell 中，`curl` 是 `Invoke-WebRequest` 的別名，語法不同。使用以下任一方法：

**方法 1：使用 `curl.exe`（推薦）**

```powershell
# 使用 Windows 內建的 curl.exe（Windows 10+）
curl.exe -X POST http://localhost:8000/api/v1/forecast/demand `
  -H "Content-Type: application/json" `
  -d '{\"product_id\": \"uuid-here\", \"tenant_id\": \"uuid-here\", \"forecast_days\": 30, \"include_confidence\": true}'
```

**方法 2：使用 `Invoke-RestMethod`（推薦，更適合 JSON API）**

```powershell
# 使用 Invoke-RestMethod（自動解析 JSON 響應）
$body = @{
    product_id = "uuid-here"
    tenant_id = "uuid-here"
    forecast_days = 30
    include_confidence = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/forecast/demand" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

**方法 3：使用 `Invoke-WebRequest`**

```powershell
# 使用 Invoke-WebRequest
$body = @{
    product_id = "uuid-here"
    tenant_id = "uuid-here"
    forecast_days = 30
    include_confidence = $true
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/forecast/demand" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body

# 解析 JSON 響應
$response.Content | ConvertFrom-Json
```

---

## L3 層級：Ollama 聊天助手

### 前置需求

- **Docker**（推薦）
- 或直接安裝 [Ollama](https://ollama.ai/download)

### 方法 1：Docker 設置（推薦）

#### 步驟 1：啟動 Ollama 容器

```bash
# 使用 Docker Compose（已配置）
docker-compose --profile ai up -d ollama

# 驗證容器運行
docker-compose ps ollama
```

#### 步驟 2：下載模型

```bash
# 進入容器
docker exec -it erp-ollama ollama pull llama2

# 或使用其他模型
docker exec -it erp-ollama ollama pull mistral
docker exec -it erp-ollama ollama pull codellama
```

**推薦模型：**
- `llama2` - 通用對話（7B，較快）
- `mistral` - 更好的推理能力（7B）
- `codellama` - 代碼相關查詢（7B/13B）
- `llama2:13b` - 更強能力但更慢

#### 步驟 3：驗證設置

```bash
# 測試 Ollama API
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

### 方法 2：本地安裝

#### Windows

1. 下載安裝程序：https://ollama.ai/download
2. 運行安裝程序
3. 在 PowerShell 中：

```powershell
# 拉取模型
ollama pull llama2

# 測試
ollama run llama2
```

#### Linux/Mac

```bash
# 安裝
curl -fsSL https://ollama.ai/install.sh | sh

# 拉取模型
ollama pull llama2

# 測試
ollama run llama2
```

### 配置後端連接

確保 `apps/api/.env` 包含：

```env
# Ollama API URL
OLLAMA_API_URL=http://localhost:11434

# 可選：指定默認模型
OLLAMA_MODEL=llama2

# 超時設置（秒）
OLLAMA_TIMEOUT=60
```

### API 端點（後端）

後端將提供以下端點與 Ollama 交互：

| 端點 | 方法 | 描述 |
|------|------|------|
| `/api/v1/ai/chat` | POST | 發送聊天消息 |
| `/api/v1/ai/chat/stream` | POST | 流式聊天響應 |
| `/api/v1/ai/insights` | POST | 獲取業務洞察 |

### 範例請求

#### Bash/Linux/Mac

```bash
# 聊天查詢
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are my top selling products this month?",
    "context": {
      "tenant_id": "uuid-here"
    }
  }'
```

#### PowerShell (Windows)

**方法 1：使用 `curl.exe`**

```powershell
curl.exe -X POST http://localhost:3000/api/v1/ai/chat `
  -H "Authorization: Bearer <token>" `
  -H "Content-Type: application/json" `
  -d '{\"message\": \"What are my top selling products this month?\", \"context\": {\"tenant_id\": \"uuid-here\"}}'
```

**方法 2：使用 `Invoke-RestMethod`（推薦）**

```powershell
$headers = @{
    Authorization = "Bearer <token>"
    "Content-Type" = "application/json"
}

$body = @{
    message = "What are my top selling products this month?"
    context = @{
        tenant_id = "uuid-here"
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/ai/chat" `
  -Method Post `
  -Headers $headers `
  -Body $body
```

---

## 驗證設置

### 檢查清單

#### L2 服務（Python AI）

- [ ] Python 3.10+ 已安裝
- [ ] 虛擬環境已創建並激活
- [ ] 依賴已安裝（`pip install -r requirements.txt`）
- [ ] 服務運行在 `http://localhost:8000`
- [ ] `/health` 端點返回 `200 OK`
- [ ] API 文檔可訪問：`http://localhost:8000/docs`
- [ ] 後端環境變數 `AI_SERVICE_URL` 已設置

#### L3 服務（Ollama）

- [ ] Ollama 容器運行或本地安裝完成
- [ ] 至少一個模型已下載（如 `llama2`）
- [ ] Ollama API 可訪問：`http://localhost:11434`
- [ ] 測試請求成功返回響應
- [ ] 後端環境變數 `OLLAMA_API_URL` 已設置

### 測試腳本

創建 `scripts/test-ai-services.sh`：

```bash
#!/bin/bash

echo "Testing AI Services..."

# Test Python AI Service
echo "1. Testing Python AI Service..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Python AI Service is running"
else
    echo "❌ Python AI Service is not responding"
fi

# Test Ollama
echo "2. Testing Ollama..."
if curl -f http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running"
    # List models
    echo "   Available models:"
    curl -s http://localhost:11434/api/tags | jq -r '.models[].name'
else
    echo "❌ Ollama is not responding"
fi

echo "Done!"
```

運行測試：

#### Bash/Linux/Mac

```bash
chmod +x scripts/test-ai-services.sh
./scripts/test-ai-services.sh
```

#### PowerShell (Windows)

在 Windows PowerShell 中，不需要 `chmod` 命令（Windows 不使用 Unix 權限系統）。直接執行 PowerShell 腳本：

```powershell
# 執行 PowerShell 測試腳本（推薦）
.\scripts\test-ai-services.ps1

# 或執行 Forecast API 測試腳本
.\scripts\test-forecast-api.ps1
```

**注意：** 如果您想執行 `.sh` 文件，需要：
- 使用 **Git Bash**（如果已安裝 Git for Windows）
- 或使用 **WSL** (Windows Subsystem for Linux)
- 或使用 **Docker** 容器執行

---

## 故障排除

### Python AI 服務問題

#### 問題：scikit-learn 編譯失敗（Windows + Python 3.13）

**錯誤訊息：** `'int_t' is not a type identifier` 或 `CompileError`

**解決方案：**
```powershell
# 方案 1：使用預編譯的包（推薦）
pip install --only-binary :all: scikit-learn
pip install -r requirements.txt

# 方案 2：升級到最新版本
pip install scikit-learn --upgrade
pip install -r requirements.txt

# 方案 3：使用 Python 3.11 或 3.12
python3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

詳細說明請參考：`apps/ai-service/INSTALL_WINDOWS.md`

#### 問題：Docker 構建時 SSL 連接錯誤

**錯誤訊息：** `ssl.SSLError: [SSL] record layer failure` 或 `pip._vendor.urllib3.exceptions.SSLError`

這通常發生在下載大型包（如 scikit-learn）時，可能是網路不穩定或 PyPI 伺服器暫時不可用。

**解決方案：**

**方案 1：重試構建（最簡單）**
```powershell
# 直接重試，網路問題通常是暫時的
docker-compose --profile ai build --no-cache ai-service
docker-compose --profile ai up -d ai-service
```

**方案 2：使用國內鏡像源（如果在中國）**

修改 `apps/ai-service/Dockerfile`，在 pip install 前添加：
```dockerfile
# 使用清華大學 PyPI 鏡像（可選）
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

或使用環境變數：
```powershell
# 構建時指定鏡像源
docker build --build-arg PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple -t erp-ai-service apps/ai-service
```

**方案 3：分階段構建（已包含在更新的 Dockerfile 中）**

更新的 Dockerfile 已經將大型包（pandas, numpy, scikit-learn）分開安裝，並包含重試邏輯。如果仍然失敗，可以手動構建：

```powershell
# 進入服務目錄
cd apps/ai-service

# 手動構建並查看詳細日誌
docker build -t erp-ai-service . --progress=plain
```

**方案 4：使用預構建的基礎映像**

如果持續遇到問題，可以考慮使用包含 ML 庫的預構建映像。

#### 問題：服務無法啟動

**解決方案：**
```bash
# 檢查 Python 版本
python --version  # 應該是 3.10+

# 檢查端口是否被佔用
# Windows:
netstat -ano | findstr :8000
# Linux/Mac:
lsof -i :8000

# 重新安裝依賴
pip install --upgrade -r requirements.txt
```

#### 問題：數據庫連接失敗

**解決方案：**
```bash
# 檢查 DATABASE_URL 格式
# 應該是: postgresql://user:password@host:port/database

# 測試數據庫連接
psql $DATABASE_URL -c "SELECT 1;"
```

#### 問題：依賴安裝失敗

**解決方案：**
```bash
# 升級 pip
pip install --upgrade pip

# 使用 conda（如果可用）
conda install scikit-learn pandas numpy fastapi uvicorn
```

### Ollama 問題

#### 問題：模型下載失敗

**解決方案：**
```bash
# 檢查網絡連接
ping ollama.ai

# 手動下載模型
ollama pull llama2 --verbose

# 檢查磁盤空間
df -h  # Linux/Mac
```

#### 問題：響應速度慢

**解決方案：**
- 使用較小的模型（7B 而非 13B）
- 增加系統內存
- 使用 GPU 加速（如果可用）

#### 問題：容器無法啟動

**解決方案：**
```bash
# 檢查 Docker 日誌
docker-compose logs ollama

# 檢查端口衝突
docker ps | grep 11434

# 重新創建容器
docker-compose down ollama
docker-compose up -d ollama
```

### 後端連接問題

#### 問題：後端無法連接到 AI 服務

**解決方案：**
```bash
# 檢查環境變數
cat apps/api/.env | grep AI_SERVICE_URL
cat apps/api/.env | grep OLLAMA_API_URL

# 測試連接
curl $AI_SERVICE_URL/health
curl $OLLAMA_API_URL/api/tags

# 檢查網絡（Docker）
docker network inspect erp-network
```

---

## 生產環境設置

### Python AI 服務

1. **使用 Gunicorn**（多進程）：
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

2. **設置環境變數**：
```env
ENVIRONMENT=production
LOG_LEVEL=warning
WORKERS=4
```

3. **使用 Docker**：
```bash
docker build -t erp-ai-service:latest ./apps/ai-service
docker run -d -p 8000:8000 --env-file .env.production erp-ai-service:latest
```

### Ollama

1. **資源限制**：
```yaml
# docker-compose.yml
ollama:
  deploy:
    resources:
      limits:
        memory: 8G
        cpus: '4'
```

2. **持久化模型**：
```yaml
volumes:
  - ollama_data:/root/.ollama  # 已配置
```

---

## 性能優化

### Python AI 服務

- **緩存預測結果**：使用 Redis 緩存常見查詢
- **異步處理**：長時間運行的預測使用後台任務
- **模型預加載**：在服務啟動時加載常用模型

### Ollama

- **模型選擇**：根據用例選擇合適大小的模型
- **上下文管理**：限制上下文長度以提高速度
- **並發控制**：限制同時請求數量

---

## 安全考慮

1. **API 認證**：AI 服務應驗證來自後端的請求
2. **速率限制**：防止濫用
3. **數據隱私**：確保敏感數據不會洩露給 AI 模型
4. **網絡隔離**：生產環境中將 AI 服務放在私有網絡

---

## 下一步

設置完成後，您可以：

1. **測試 L2 功能**：訪問預測分析頁面
2. **測試 L3 功能**：使用 AI 聊天助手
3. **查看日誌**：監控 AI 服務的運行狀況
4. **調整配置**：根據需求優化模型和參數

---

## 相關文檔

- [API 文檔](../README.md#api-documentation)
- [環境變數配置](../README.md#environment-variables)
- [部署指南](../README.md#production-deployment)

---

**需要幫助？** 查看 [故障排除](#故障排除) 部分或聯繫支持團隊。


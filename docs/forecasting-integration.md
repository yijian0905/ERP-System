# 📊 預測功能整合指南 (Forecasting Integration Guide)

本文檔說明如何確保預測功能正確連接到 Python AI 服務。

## ✅ 已完成的整合

### 1. AI 服務客戶端 (`apps/api/src/services/ai/ai-service.client.ts`)

創建了完整的 AI 服務客戶端，包含以下功能：

- ✅ `checkAIServiceHealth()` - 檢查 AI 服務健康狀態
- ✅ `forecastDemand()` - 需求預測
- ✅ `optimizeStock()` - 庫存優化
- ✅ `analyzeSeasonalPatterns()` - 季節性模式分析

### 2. 後端 API 路由

#### 產品預測端點
- **GET** `/api/v1/products/:id/forecast`
  - 查詢參數：`days` (預設 30), `includeConfidence` (預設 false)
  - 返回產品的需求預測

#### 專用預測路由 (`/api/v1/forecasting`)
- **POST** `/api/v1/forecasting/demand` - 需求預測
- **POST** `/api/v1/forecasting/stock-optimization` - 庫存優化
- **POST** `/api/v1/forecasting/seasonal-patterns` - 季節性分析
- **GET** `/api/v1/forecasting/health` - AI 服務健康檢查

### 3. 錯誤處理

- ✅ AI 服務不可用時自動降級到備用預測
- ✅ 完整的錯誤日誌記錄
- ✅ 適當的 HTTP 狀態碼返回

## 🔧 配置

### 環境變數

確保 `apps/api/.env` 包含：

```env
# AI Services (L2/L3)
AI_SERVICE_URL=http://localhost:8000
OLLAMA_API_URL=http://localhost:11434
```

### 啟動服務

1. **啟動 Python AI 服務：**
   ```powershell
   cd apps/ai-service
   venv\Scripts\activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **啟動後端 API：**
   ```powershell
   cd apps/api
   pnpm dev
   ```

## 🧪 測試

### 測試腳本

運行測試腳本驗證連接：

```powershell
.\scripts\test-forecast-api.ps1
```

### 手動測試

#### 1. 測試 AI 服務健康狀態

```powershell
curl http://localhost:8000/health
```

#### 2. 測試後端 API 健康狀態

```powershell
curl http://localhost:3000/health
```

#### 3. 測試預測端點（需要認證）

```powershell
# 先獲取 JWT token（通過登錄）
$token = "your-jwt-token"

# 測試產品預測
curl -H "Authorization: Bearer $token" `
  "http://localhost:3000/api/v1/products/{product-id}/forecast?days=30"

# 測試專用預測端點
curl -X POST `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"product_id":"{uuid}","forecast_days":30}' `
  http://localhost:3000/api/v1/forecasting/demand
```

## 📋 API 使用範例

### 需求預測

```typescript
// 前端調用範例
const response = await fetch('/api/v1/forecasting/demand', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    product_id: '550e8400-e29b-41d4-a716-446655440000',
    forecast_days: 30,
    include_confidence: true,
  }),
});

const data = await response.json();
// data.data.predictions 包含預測結果
```

### 庫存優化

```typescript
const response = await fetch('/api/v1/forecasting/stock-optimization', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    product_id: '550e8400-e29b-41d4-a716-446655440000',
    current_stock: 100,
    lead_time_days: 7,
    service_level: 0.95,
  }),
});
```

## 🔍 故障排除

### 問題：AI 服務連接失敗

**症狀：** 返回 503 錯誤或備用預測

**解決方案：**
1. 檢查 AI 服務是否運行：`curl http://localhost:8000/health`
2. 檢查環境變數 `AI_SERVICE_URL` 是否正確
3. 查看後端日誌：`apps/api/logs/`

### 問題：認證錯誤

**症狀：** 返回 401 Unauthorized

**解決方案：**
1. 確保請求包含有效的 JWT token
2. 檢查 token 是否過期
3. 確認用戶有 L2 或 L3 層級許可

### 問題：預測結果不準確

**症狀：** 預測值看起來不合理

**解決方案：**
1. 檢查 Python AI 服務的實現（`apps/ai-service/app/routes/forecast.py`）
2. 確保有足夠的歷史數據
3. 調整預測參數（forecast_days, include_confidence）

## 📝 下一步

1. **實現實際的 ML 模型** - 在 Python AI 服務中實現真實的預測算法
2. **添加數據獲取** - 從數據庫獲取歷史銷售數據
3. **優化性能** - 添加緩存和異步處理
4. **前端整合** - 更新前端頁面使用新的 API 端點

## 🔗 相關文檔

- [AI 設置指南](ai-setup-guide.md)
- [API 文檔](../README.md#api-documentation)
- [Python AI 服務 README](../apps/ai-service/README.md)


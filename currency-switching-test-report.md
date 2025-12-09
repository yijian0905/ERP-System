# 貨幣切換功能測試報告

## 測試日期
2025-12-09

## 測試範圍
測試貨幣切換功能是否正常運作，並使用 console logs 驗證錯誤類型。

---

## 🔍 發現的問題

### 1. **API 端點 404 錯誤** ❌

**錯誤類型**: `HTTP 404 Not Found`

**錯誤詳情**:
```
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found)
[ERROR] [API-CLIENT] Response error: {status: 404, statusText: Not Found, url: /v1/currencies, errorMessage: Request failed with status code 404}
[ERROR] Failed to load currencies: AxiosError
```

**影響**:
- 前端無法從 API 載入貨幣列表
- 貨幣切換功能無法正常工作
- 頁面顯示 "Loading currencies..." 但無法完成載入

**根本原因分析**:
- 後端路由文件 `apps/api/src/routes/v1/currencies.ts` 存在且已註冊
- 路由註冊在 `apps/api/src/routes/v1/index.ts` 第 31 行：`await fastify.register(currenciesRoutes, { prefix: '/currencies' });`
- 可能原因：
  1. **Tenant ID 不匹配**: Mock 數據中的 `tenantId` 與實際請求的 tenant ID 不一致
  2. **路由註冊順序問題**: 路由可能未正確註冊
  3. **認證中間件問題**: 認證失敗導致路由未正確處理

**Mock 數據中的 Tenant ID**:
```typescript
tenantId: '550e8400-e29b-41d4-a716-446655440001'
```

**建議修復**:
1. 檢查 `getTenantId(request)` 返回的實際 tenant ID
2. 確保 mock 數據的 tenant ID 與實際登入用戶的 tenant ID 匹配
3. 添加調試日誌以追蹤路由匹配過程

---

### 2. **前端貨幣 Store 為空** ⚠️

**狀態**:
- `localStorage` 中的 `erp-currency` store 為 `null`
- 前端使用 mock 數據顯示貨幣（TWD, USD, MYR, SGD, CNY）

**影響**:
- 貨幣切換功能依賴於 API 數據，但 API 失敗導致無法切換
- 前端顯示的貨幣是硬編碼的 mock 數據，不是從 API 獲取的

---

### 3. **貨幣切換邏輯實現** ✅

**代碼位置**: `apps/web/src/routes/_dashboard/settings/currencies.tsx:419-459`

**實現邏輯**:
```typescript
const handleSetBaseCurrency = async (currency: Currency) => {
  // 1. 調用 API 設置基準貨幣
  const response = await patch<Currency>(
    `/v1/currencies/${currency.id}`,
    { isBaseCurrency: true }
  );
  
  // 2. 重新載入所有貨幣
  const currenciesResponse = await get<Currency[]>('/v1/currencies', {
    params: { limit: 100, activeOnly: false },
  });
  
  // 3. 更新全局設置
  setGlobalCurrency(currency.code);
}
```

**問題**:
- 由於 API 返回 404，此功能無法執行
- 沒有錯誤處理來處理 API 失敗的情況（除了基本的 try-catch）

---

## 📊 Console Logs 分析

### 錯誤日誌
```
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found)
[ERROR] [API-CLIENT] Response error: {
  status: 404,
  statusText: "Not Found",
  url: "/v1/currencies",
  errorMessage: "Request failed with status code 404",
  responseData: Object
}
[ERROR] Failed to load currencies: AxiosError
```

### 信息日誌
```
[LOG] [API-CLIENT] GET /v1/currencies
[LOG] [API-CLIENT] Request interceptor: {
  method: "GET",
  url: "/v1/currencies",
  baseURL: "http://localhost:3000",
  fullURL: "http://localhost:3000/v1/currencies",
  hasData: false
}
[LOG] [API-CLIENT] Added auth token to request
```

**觀察**:
- API 請求已正確發送
- 認證 token 已添加到請求
- 但服務器返回 404

---

## ✅ 正常運作的功能

1. **前端 UI 渲染**: 貨幣卡片正確顯示
2. **Mock 數據顯示**: 即使 API 失敗，前端仍顯示硬編碼的貨幣列表
3. **點擊事件**: 貨幣卡片可以點擊（但由於 API 失敗無法完成切換）

---

## 🔧 建議修復步驟

### 優先級 1: 修復 API 404 錯誤

1. **檢查 Tenant ID 匹配**:
   ```typescript
   // 在 currencies.ts 中添加調試日誌
   const tenantId = getTenantId(request);
   console.log('[CURRENCIES-API] Tenant ID:', tenantId);
   console.log('[CURRENCIES-API] Mock currencies tenant IDs:', mockCurrencies.map(c => c.tenantId));
   ```

2. **驗證路由註冊**:
   - 確認 `currenciesRoutes` 正確導出
   - 確認路由前綴正確：`/currencies` → `/api/v1/currencies`

3. **測試 API 端點**:
   ```bash
   curl -X GET http://localhost:3000/api/v1/currencies \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json"
   ```

### 優先級 2: 改進錯誤處理

1. **添加重試機制**: 當 API 失敗時自動重試
2. **降級處理**: 當 API 失敗時使用本地 mock 數據
3. **用戶友好的錯誤提示**: 顯示具體的錯誤信息而非通用 alert

### 優先級 3: 添加調試日誌

在貨幣切換函數中添加詳細日誌：
```typescript
console.log('[CURRENCY-SWITCH] Starting switch to:', currency.code);
console.log('[CURRENCY-SWITCH] API response:', response);
console.log('[CURRENCY-SWITCH] Updated currencies:', currenciesResponse.data);
```

---

## 📝 測試結論

**貨幣切換功能目前無法正常運作**，主要原因為：

1. ❌ **API 端點返回 404** - 阻止了貨幣數據的載入和切換
2. ⚠️ **Tenant ID 不匹配** - 可能是根本原因
3. ✅ **前端邏輯實現正確** - 一旦 API 修復，功能應該能正常工作

**建議**: 優先修復 API 404 錯誤，然後重新測試貨幣切換功能。

---

## 🔄 後續測試計劃

修復 API 問題後，需要測試：

1. ✅ 點擊貨幣卡片設置基準貨幣
2. ✅ 驗證 API 調用成功
3. ✅ 驗證貨幣列表更新
4. ✅ 驗證全局設置更新
5. ✅ 驗證 UI 反映新的基準貨幣
6. ✅ 驗證無 console 錯誤

---

**報告生成時間**: 2025-12-09
**測試環境**: Development (localhost:5173 / localhost:3000)
**測試人員**: AI Assistant


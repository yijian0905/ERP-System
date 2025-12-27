# Cloudflare Tunnel 設定指南

> 讓你的 NAS 後端可以安全地從公網訪問，無需開放端口，自動 HTTPS。

---

## 前置需求

- [ ] 一個域名（可在 Cloudflare 註冊，約 $10/年）
- [ ] Cloudflare 帳號（免費）
- [ ] NAS 可以運行 Docker 或安裝 cloudflared

---

## Step 1: 註冊 Cloudflare 並添加域名

### 1.1 創建帳號
1. 前往 [dash.cloudflare.com](https://dash.cloudflare.com)
2. 點擊 **Sign Up** 創建帳號

### 1.2 添加域名
1. 登入後點擊 **Add a Site**
2. 輸入你的域名（例如：`yourcompany.com`）
3. 選擇 **Free** 方案
4. Cloudflare 會掃描現有 DNS 記錄

### 1.3 更新域名 DNS 伺服器
1. Cloudflare 會提供兩個 nameserver（例如：`anna.ns.cloudflare.com`）
2. 前往你的域名註冊商（Namecheap, GoDaddy 等）
3. 將 DNS 伺服器更新為 Cloudflare 提供的地址
4. 等待生效（通常 5-30 分鐘，最長 24 小時）

---

## Step 2: 創建 Cloudflare Tunnel

### 2.1 進入 Zero Trust 面板
1. 在 Cloudflare Dashboard 左側選單，點擊 **Zero Trust**
2. 首次使用會要求選擇團隊名稱（任意名稱即可）

### 2.2 創建 Tunnel
1. 導航到 **Networks** → **Tunnels**
2. 點擊 **Create a tunnel**
3. 選擇 **Cloudflared** 作為連接方式
4. 輸入 Tunnel 名稱（例如：`erp-api-tunnel`）
5. 點擊 **Save tunnel**

### 2.3 獲取安裝 Token
創建後會顯示一個安裝命令，包含一個 token，格式類似：
```
eyJhIjoiNjk...（很長的字串）
```
**保存這個 token，後面需要用到！**

---

## Step 3: 在 NAS 上安裝 cloudflared

### 方式 A: 使用 Docker（推薦）

如果你的 NAS 支持 Docker（群暉 DSM 7+、威聯通等）：

```bash
docker run -d \
  --name cloudflared-tunnel \
  --restart unless-stopped \
  cloudflare/cloudflared:latest \
  tunnel --no-autoupdate run --token YOUR_TOKEN_HERE
```

將 `YOUR_TOKEN_HERE` 替換為 Step 2.3 獲取的 token。

### 方式 B: 直接安裝 cloudflared

對於 Linux/Debian 系統：

```bash
# 下載並安裝
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# 安裝為系統服務
sudo cloudflared service install YOUR_TOKEN_HERE
```

### 方式 C: 群暉 NAS（Container Manager）

1. 打開 **Container Manager**（或 Docker）
2. 前往 **Registry** → 搜索 `cloudflare/cloudflared`
3. 下載 `latest` 標籤
4. 創建容器：
   - **映像**：cloudflare/cloudflared:latest
   - **命令**：`tunnel --no-autoupdate run --token YOUR_TOKEN_HERE`
   - **網路**：使用 host 網路模式
   - **自動重啟**：開啟

---

## Step 4: 配置路由（Public Hostname）

### 4.1 添加公開主機名
1. 回到 Cloudflare Zero Trust
2. 點擊你創建的 Tunnel
3. 選擇 **Public Hostname** 標籤
4. 點擊 **Add a public hostname**

### 4.2 設定路由
填寫以下資訊：

| 欄位 | 值 | 說明 |
|------|-----|------|
| **Subdomain** | `api` | 子域名 |
| **Domain** | `yourcompany.com` | 你的域名 |
| **Type** | `HTTP` | 協議類型 |
| **URL** | `localhost:3000` | NAS 上後端的地址和端口 |

點擊 **Save hostname**

### 4.3 完成！
現在你可以通過 `https://api.yourcompany.com` 訪問你的後端 API！

---

## Step 5: 驗證連接

### 5.1 檢查 Tunnel 狀態
1. 在 Cloudflare Zero Trust → Tunnels
2. 你的 Tunnel 應該顯示 **HEALTHY** 狀態

### 5.2 測試 API
```bash
curl https://api.yourcompany.com/health
```

或直接在瀏覽器訪問。

---

## Step 6: 更新桌面應用配置

修改 `apps/desktop/src/main/api-handler.ts`：

```typescript
// 更新為你的 Cloudflare Tunnel 域名
const DEFAULT_API_URL = process.env.ERP_API_URL || 'https://api.yourcompany.com';
```

然後重新打包應用：
```bash
pnpm --filter @erp/desktop build:production
pnpm desktop:package
```

---

## 安全加強（可選）

### 添加訪問控制
1. Zero Trust → Access → Applications
2. **Add an application** → Self-hosted
3. 設定 Application domain 為 `api.yourcompany.com`
4. 添加訪問策略（如：僅允許特定 Email 域）

### 啟用 WAF（Web Application Firewall）
1. Cloudflare Dashboard → Security → WAF
2. 啟用 Managed Rules

---

## 常見問題

### Q: Tunnel 顯示離線？
- 檢查 cloudflared 容器/服務是否運行
- 檢查 token 是否正確
- 查看日誌：`docker logs cloudflared-tunnel`

### Q: API 返回 502 錯誤？
- 確認後端服務正在運行
- 確認 `localhost:3000` 是正確的地址
- 如果後端在 Docker 中，可能需要使用 `host.docker.internal:3000`

### Q: 如何更新 Token？
1. 在 Cloudflare 重新生成 token
2. 更新 Docker 容器或服務配置

---

## 總結

設定完成後的架構：

```
用戶桌面應用
      │
      │ HTTPS (自動 CA 證書)
      ▼
Cloudflare Edge Network
      │
      │ 加密隧道 (無需開放端口)
      ▼
你的 NAS 後端 (localhost:3000)
      │
      │ HTTPS
      ▼
LHDN MyInvois API
```

**優點**：
- ✅ 自動 HTTPS，無需管理證書
- ✅ 無需開放路由器端口
- ✅ 你的 NAS IP 對外隱藏
- ✅ 免費 DDoS 保護
- ✅ 可隨時添加訪問控制

# ERP 後端部署指南

> **注意：** 此指南僅涵蓋後端服務（API + AI Service）的部署。
> 前端使用 Electron 桌面應用，不需要 Web 部署。

## 📋 目錄
1. [架構概覽](#架構概覽)
2. [快速部署](#快速部署)
3. [Docker 部署](#docker-部署)
4. [手動部署](#手動部署)
5. [桌面應用配置](#桌面應用配置)
6. [常見問題](#常見問題)

---

## 🏗️ 架構概覽

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron 桌面應用                         │
│              （安裝在用戶電腦上，無需部署）                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    通過 HTTP/HTTPS 連接
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      後端服務器（需部署）                       │
├─────────────────────────────────────────────────────────────┤
│  • API Service (Node.js/Fastify) - 端口 3000               │
│  • AI Service (Python/FastAPI)   - 端口 8000               │
│  • PostgreSQL Database           - 端口 5432               │
│  • Redis Cache                   - 端口 6379               │
└─────────────────────────────────────────────────────────────┘
```

**需要對外開放的端口：**
- `3000` - API Service（必須）
- `8000` - AI Service（可選，僅 L2/L3 功能需要）

---

## 🚀 快速部署

### 1. 打包後端文件
```powershell
# 在 ERP-System 目錄下執行
.\scripts\deploy\package-backend.ps1
```

### 2. 上傳到服務器
```bash
scp deploy-package/erp-backend-*.zip user@your-server:/opt/erp/
```

### 3. 解壓並配置
```bash
cd /opt/erp
unzip erp-backend-*.zip
cp apps/api/env.example.txt apps/api/.env
cp apps/ai-service/env.example.txt apps/ai-service/.env
# 編輯 .env 文件填入生產環境值
```

### 4. 啟動服務
```bash
docker-compose up -d
```

### 5. 配置桌面應用連接
在啟動桌面應用前設置環境變數：
```bash
# Windows
set ERP_API_URL=http://your-server-ip:3000

# 或使用域名
set ERP_API_URL=https://api.your-domain.com
```

---

## 🐳 Docker 部署（推薦）

### 1. 服務器要求
- **OS:** Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM:** 最少 2GB，建議 4GB+
- **Docker:** 20.10+
- **Docker Compose:** 2.0+

### 2. 安裝 Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安裝 Docker Compose
sudo apt-get install docker-compose-plugin
```

### 3. 配置環境變數

**API 服務 (`apps/api/.env`):**
```env
# 服務器配置
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# 資料庫
DATABASE_URL=postgresql://erp_user:erp_password@postgres:5432/erp_database

# Redis
REDIS_URL=redis://redis:6379

# JWT（重要！請生成強隨機密鑰）
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters

# CORS - 允許桌面應用連接
CORS_ORIGIN=*

# AI 服務
AI_SERVICE_URL=http://ai-service:8000

# 加密密鑰
LICENSE_ENCRYPTION_KEY=your-license-encryption-key-32-chars-min
LHDN_ENCRYPTION_KEY=aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899

# 日誌
LOG_LEVEL=info
```

**AI 服務 (`apps/ai-service/.env`):**
```env
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=production
DATABASE_URL=postgresql://erp_user:erp_password@postgres:5432/erp_database
REDIS_URL=redis://redis:6379
CORS_ORIGINS=*
LOG_LEVEL=info
```

### 4. 啟動服務

```bash
# 啟動資料庫和緩存
docker-compose up -d postgres redis

# 等待資料庫就緒（約 10-15 秒）
sleep 15

# 啟動 API 服務
docker-compose up -d

# 啟動 AI 服務（可選）
docker-compose --profile ai up -d ai-service

# 查看狀態
docker-compose ps
```

### 5. 驗證部署

```bash
# 測試 API
curl http://localhost:3000/health
# 預期結果：{"status":"ok",...}

# 測試 AI 服務
curl http://localhost:8000/health
# 預期結果：{"status":"healthy",...}
```

### 6. 配置防火牆

```bash
# Ubuntu (ufw)
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp  # 僅 AI 服務需要時
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

---

## 🔧 手動部署

如果不使用 Docker，可以手動部署：

### 1. 安裝依賴

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm@9.14.2

# Python 3.11
sudo apt-get install python3.11 python3.11-venv python3-pip

# PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Redis
sudo apt-get install redis-server
```

### 2. 設置資料庫

```bash
# 登入 PostgreSQL
sudo -u postgres psql

# 創建用戶和資料庫
CREATE USER erp_user WITH PASSWORD 'erp_password';
CREATE DATABASE erp_database OWNER erp_user;
GRANT ALL PRIVILEGES ON DATABASE erp_database TO erp_user;
\q
```

### 3. 部署 API 服務

```bash
cd /opt/erp

# 安裝依賴
pnpm install --frozen-lockfile

# 構建
pnpm build

# 運行資料庫遷移
cd packages/database
npx prisma migrate deploy
cd ../..

# 使用 PM2 管理進程
npm install -g pm2
pm2 start apps/api/dist/index.js --name erp-api
pm2 save
pm2 startup
```

### 4. 部署 AI 服務

```bash
cd /opt/erp/apps/ai-service

# 創建虛擬環境
python3.11 -m venv venv
source venv/bin/activate

# 安裝依賴
pip install -r requirements.txt

# 使用 PM2 管理
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name erp-ai
pm2 save
```

---

## 💻 桌面應用配置

### 方式一：環境變數（推薦）

在啟動桌面應用前設置：

**Windows:**
```batch
set ERP_API_URL=http://your-server-ip:3000
"path\to\ERP System.exe"
```

**創建快捷方式啟動腳本 `start-erp.bat`:**
```batch
@echo off
set ERP_API_URL=http://your-server-ip:3000
start "" "C:\Program Files\ERP System\ERP System.exe"
```

### 方式二：應用內設置（需要開發）

可以在桌面應用的設置頁面添加 API URL 配置選項，使用 `api:setBaseUrl` IPC 接口。

### 方式三：配置文件

修改 `apps/desktop/src/main/api-handler.ts`：
```typescript
// 從配置或環境變數讀取
const DEFAULT_API_URL = process.env.ERP_API_URL || 'http://localhost:3000';
```

---

## 🌐 使用域名（生產環境推薦）

### 1. 配置 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/erp-api
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. 獲取 SSL 證書

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

### 3. 桌面應用連接

```batch
set ERP_API_URL=https://api.your-domain.com
```

---

## 🔍 常見問題

### Q1: 桌面應用無法連接後端

**檢查步驟：**
```bash
# 1. 確認服務正在運行
docker-compose ps

# 2. 確認端口開放
sudo netstat -tulpn | grep 3000

# 3. 從外部測試連接
curl http://your-server-ip:3000/health

# 4. 檢查防火牆
sudo ufw status
```

**常見原因：**
- 後端 `HOST` 未設為 `0.0.0.0`
- 防火牆未開放端口
- API URL 配置錯誤

### Q2: CORS 錯誤

確保 `apps/api/.env` 中設置：
```env
CORS_ORIGIN=*
```

### Q3: 資料庫連接失敗

```bash
# 檢查 PostgreSQL 狀態
docker-compose logs postgres

# 確認連接 URL 正確
# Docker 環境使用 postgres:5432
# 手動部署使用 localhost:5432
```

### Q4: 外網無法訪問

1. 確認公網 IP 或域名正確
2. 檢查雲服務商安全組規則
3. 確認防火牆開放端口
4. 使用 `telnet your-ip 3000` 測試端口

---

## 📝 部署檢查清單

- [ ] 打包後端文件
- [ ] 上傳到服務器
- [ ] 安裝 Docker（或手動安裝依賴）
- [ ] 配置環境變數（`.env` 文件）
- [ ] 生成強隨機密鑰（JWT_SECRET 等）
- [ ] 啟動服務
- [ ] 測試 API 健康檢查
- [ ] 配置防火牆
- [ ] 配置 Nginx + SSL（可選但推薦）
- [ ] 配置桌面應用 API URL
- [ ] 測試桌面應用連接

---

## 🔐 安全建議

1. **更改默認密碼** - 資料庫、Redis 等
2. **生成強密鑰** - 使用 `openssl rand -base64 32` 生成
3. **限制端口** - 只開放必要端口（3000、8000）
4. **使用 HTTPS** - 生產環境必須
5. **定期備份** - 資料庫備份策略
6. **監控日誌** - 設置日誌收集和告警

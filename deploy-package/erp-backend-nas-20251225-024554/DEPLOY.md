# ERP 後端 Synology NAS 部署指南

## 快速部署

### 1. 上傳並解壓
`ash
# 上傳 ZIP 到 NAS 後
unzip erp-backend-nas-*.zip -d /volume1/docker/erp
cd /volume1/docker/erp
`

### 2. 啟動服務
`ash
docker-compose up -d
`

### 3. 檢查服務狀態
`ash
docker-compose ps
`

### 4. 驗證 API
`ash
curl http://localhost:3000/health
curl http://localhost:8000/health
`

## 服務端口

| 服務 | 端口 | 說明 |
|------|------|------|
| API | 3000 | 主要後端 API |
| AI Service | 8000 | AI 預測服務 |
| PostgreSQL | 5433 | 資料庫 (外部) |
| Redis | 6379 | 緩存 |

## 桌面應用配置

在啟動 Electron 桌面應用前設置：
`atch
set ERP_API_URL=http://NAS-IP:3000
`

## 常用命令

`ash
# 查看日誌
docker-compose logs -f api
docker-compose logs -f ai-service

# 重啟服務
docker-compose restart

# 停止服務
docker-compose down

# 重建並啟動
docker-compose up -d --build
`
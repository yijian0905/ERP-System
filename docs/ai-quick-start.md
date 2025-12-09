# 🚀 AI 服務快速開始指南

## 一鍵設置（Docker）

```bash
# 啟動所有 AI 服務（L2 + L3）
docker-compose --profile ai up -d

# 下載 Ollama 模型
docker exec -it erp-ollama ollama pull llama2

# 驗證服務
# Windows:
.\scripts\test-ai-services.ps1
# Linux/Mac:
./scripts/test-ai-services.sh
```

## 本地開發設置

### L2 服務（Python AI）

```bash
cd apps/ai-service
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp env.example.txt .env
uvicorn app.main:app --reload --port 8000
```

### L3 服務（Ollama）

```bash
# 下載並安裝: https://ollama.ai/download
ollama pull llama2
# Ollama 會自動在 http://localhost:11434 運行
```

## 驗證

| 服務 | URL | 檢查命令 |
|------|-----|----------|
| Python AI | http://localhost:8000 | `curl http://localhost:8000/health` |
| Ollama | http://localhost:11434 | `curl http://localhost:11434/api/tags` |

## 環境變數

在 `apps/api/.env` 中設置：

```env
AI_SERVICE_URL=http://localhost:8000
OLLAMA_API_URL=http://localhost:11434
```

## 詳細文檔

- [完整設置指南](ai-setup-guide.md)
- [API 文檔](../README.md#api-documentation)



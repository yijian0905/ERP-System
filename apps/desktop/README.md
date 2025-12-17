# ERP Desktop App

Electron 桌面應用程式，載入 ERP System web 應用作為 renderer。

## 開發

```bash
# 安裝依賴
pnpm install

# 開發模式（需要先啟動 web app）
pnpm dev

# 在另一個終端啟動 web app
pnpm --filter @erp/web dev
```

## 打包

```bash
# Windows
pnpm package:win

# macOS
pnpm package:mac

# Linux
pnpm package:linux
```

## 目錄結構

```
src/
├── main/           # Electron 主進程
│   ├── index.ts    # 入口點
│   ├── license-store.ts    # 加密 License 存儲
│   ├── license-handler.ts  # License IPC 處理器
│   └── print-handler.ts    # 印刷 IPC 處理器
├── preload/        # Preload 腳本
│   └── index.ts    # 安全 contextBridge
└── renderer/       # Renderer 進程
    ├── index.html  # HTML 入口
    └── main.tsx    # React 入口
```

## 安全配置

按照 `spec.md` 要求：

- ✅ `contextIsolation: true`
- ✅ `nodeIntegration: false`
- ✅ `sandbox: true`
- ✅ 加密 License 存儲 (safeStorage)
- ✅ IPC 白名單 (contextBridge)

/**
 * @file Electron Main Process Entry Point
 * @description ERP System Desktop Application - Main Process
 *
 * Per license-system-guide.md:
 * - No license key input on client
 * - All authorization validation happens on backend during login
 *
 * Security Configuration:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - sandbox: true
 */

import { app, BrowserWindow, ipcMain, shell, session, globalShortcut } from 'electron';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import { join } from 'path';
import { setupPrintHandlers } from './print-handler';
import { setupApiHandlers } from './api-handler';

// 禁用 HTTP 緩存
app.commandLine.appendSwitch('disable-http-cache');

let mainWindow: BrowserWindow | null = null;

// 開發模式 URL
const DEV_URL = 'http://localhost:5173';

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        // 完全無邊框窗口 - 使用 web app UI 中的自定義控制按鈕
        frame: false,
        transparent: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            contextIsolation: true, // 必須為 true (安全要求)
            nodeIntegration: false, // 必須為 false (安全要求)
            sandbox: true,
            webSecurity: true,
        },
        icon: join(__dirname, '../../resources/icon.png'),
        backgroundColor: '#0a0a0a',
        show: false, // 等待 ready-to-show 事件
    });

    // 移除選單欄
    mainWindow.setMenu(null);

    // 啟動時最大化
    mainWindow.once('ready-to-show', () => {
        mainWindow?.maximize();
        mainWindow?.show();
    });

    // 外部連結在系統瀏覽器中打開
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // 載入應用
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL(DEV_URL);
    } else {
        const rendererPath = join(__dirname, '../renderer/index.html');
        mainWindow.loadFile(rendererPath);
    }

    // 註冊 F12 快捷鍵打開 DevTools（用於調試）
    globalShortcut.register('F12', () => {
        mainWindow?.webContents.toggleDevTools();
    });
    globalShortcut.register('CommandOrControl+Shift+I', () => {
        mainWindow?.webContents.toggleDevTools();
    });

    // 設置 IPC 處理器
    setupPrintHandlers(mainWindow);

    mainWindow.on('closed', () => {
        mainWindow = null;
        // 取消註冊快捷鍵
        globalShortcut.unregisterAll();
    });
}

// 應用程式生命週期
app.whenReady().then(() => {
    // 設置 Content-Security-Policy
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        // For IPC-based API calls, we don't need to allow external connections in CSP
        // The main process handles all HTTP requests via IPC
        const csp = process.env.NODE_ENV === 'development'
            ? "default-src 'self' http://localhost:*; script-src 'self' 'unsafe-inline' http://localhost:*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: http://localhost:*; connect-src 'self' http://localhost:* ws://localhost:*;"
            : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self';";

        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [csp],
            },
        });
    });

    createWindow();

    // 設置 API IPC 處理器
    setupApiHandlers();

    // 檢查更新（僅生產環境）
    if (process.env.NODE_ENV !== 'development') {
        autoUpdater.checkForUpdatesAndNotify();
    }

    app.on('activate', () => {
        // macOS: 點擊 Dock 圖標重新創建窗口
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 自動更新事件
autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update:available');
});

autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update:downloaded');
});

// IPC: 安裝更新
ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall();
});

// IPC: 獲取應用版本
ipcMain.handle('app:version', () => {
    return app.getVersion();
});

// IPC: 獲取平台信息
ipcMain.handle('app:platform', () => {
    return {
        platform: process.platform,
        arch: process.arch,
        electron: process.versions.electron,
        node: process.versions.node,
    };
});

// IPC: 檢查是否在 Electron 環境中
ipcMain.handle('app:isElectron', () => {
    return true;
});

// ============ 窗口控制 IPC (自定義標題欄) ============

// 最小化窗口
ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
});

// 最大化/還原窗口
ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});

// 檢查窗口是否最大化
ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false;
});

// 關閉窗口
ipcMain.handle('window:close', () => {
    mainWindow?.close();
});

// 退出應用
ipcMain.handle('app:quit', () => {
    app.quit();
});

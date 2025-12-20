/**
 * @file Electron API Type Definitions
 * @description Extends Window interface with electronAPI for Electron desktop app
 */

import type { ApiResponse } from '@erp/shared-types';

interface ElectronAPI {
    // ============ API Bridge (per spec.md IPC Architecture) ============
    api: {
        get: <T>(url: string, params?: Record<string, string | number | boolean>) => Promise<ApiResponse<T>>;
        post: <T>(url: string, data?: unknown) => Promise<ApiResponse<T>>;
        put: <T>(url: string, data?: unknown) => Promise<ApiResponse<T>>;
        patch: <T>(url: string, data?: unknown) => Promise<ApiResponse<T>>;
        delete: <T>(url: string) => Promise<ApiResponse<T>>;
        setTokens: (tokens: { accessToken: string; refreshToken?: string }) => Promise<{ success: boolean }>;
        clearTokens: () => Promise<{ success: boolean }>;
        isAuthenticated: () => Promise<boolean>;
        setBaseUrl: (url: string) => Promise<{ success: boolean }>;
        getBaseUrl: () => Promise<string>;
    };

    // License APIs
    getLicense: () => Promise<{ success: boolean; context?: unknown; error?: string }>;
    hasLicense: () => Promise<boolean>;
    activateLicense: (licenseKey: string, serverUrl?: string) => Promise<{ success: boolean; context?: unknown; error?: string }>;
    validateLicense: () => Promise<{ success: boolean; context?: unknown; cached?: boolean; error?: string }>;
    clearLicense: () => Promise<{ success: boolean }>;

    // Branding APIs
    getBranding: () => Promise<unknown | null>;

    // Print APIs
    getPrinters: () => Promise<unknown[]>;
    getDefaultPrinter: () => Promise<string | null>;
    silentPrint: (options: unknown) => Promise<{ success: boolean; error?: string }>;
    printWithDialog: (options: unknown) => Promise<{ success: boolean; error?: string }>;
    printToPDF: (options: unknown) => Promise<{ success: boolean; data?: Uint8Array; path?: string; error?: string }>;
    getDefaultPDFPath: (filename: string) => Promise<string>;
    logPrintAudit: (entry: unknown) => Promise<{ success: boolean }>;

    // App APIs
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<{ platform: string; arch: string; electron: string; node: string }>;

    // Update APIs
    installUpdate: () => Promise<void>;
    onUpdateAvailable: (callback: () => void) => void;
    onUpdateDownloaded: (callback: () => void) => void;
    removeUpdateListeners: () => void;

    // Window Control APIs (自定義標題欄)
    isElectron: () => Promise<boolean>;
    minimizeWindow: () => Promise<void>;
    maximizeWindow: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    closeWindow: () => Promise<void>;
    quitApp: () => Promise<void>;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export { };

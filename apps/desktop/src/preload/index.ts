/**
 * @file Preload Script - Secure Context Bridge
 * @description Exposes limited, whitelisted APIs to renderer process
 *
 * Per license-system-guide.md:
 * - No license key input on client
 * - Authorization happens via backend during login
 *
 * Security:
 * - IPC: preload + contextBridge (whitelist only)
 * - contextIsolation: true
 * - nodeIntegration: false
 */

import { contextBridge, ipcRenderer, PrinterInfo } from 'electron';

/**
 * Print Options exposed to renderer
 */
interface PrintOptions {
    deviceName?: string;
    pageSize?: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';
    landscape?: boolean;
    color?: boolean;
    scaleFactor?: number;
    copies?: number;
    silent?: boolean;
}

/**
 * PDF Options exposed to renderer
 */
interface PDFOptions {
    pageSize?: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';
    landscape?: boolean;
    printBackground?: boolean;
    savePath?: string;
}

/**
 * Print Audit Entry
 */
interface PrintAuditEntry {
    tenantId: string;
    userId: string;
    documentType: string;
    documentId: string;
    printTimestamp: string;
    printerName?: string;
    success: boolean;
    errorMessage?: string;
}

/**
 * Print Settings (workstation-level)
 */
interface PrintSettings {
    targetPrinter: string | null;
    paperSize: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';
    landscape: boolean;
    color: boolean;
    scale: number;
    copies: number;
    saveToPdfDefault: boolean;
}

/**
 * Electron API exposed to renderer (whitelist only)
 */
const electronAPI = {
    // ============ API Bridge (IPC Architecture) ============
    /**
     * API bridge for making HTTP requests through main process
     * This allows renderer to call backend API without direct HTTP access
     */
    api: {
        /**
         * GET request
         */
        get: <T>(url: string, params?: Record<string, string | number | boolean>): Promise<{
            success: boolean;
            data?: T;
            error?: { code: string; message: string };
        }> => ipcRenderer.invoke('api:get', url, params),

        /**
         * POST request
         */
        post: <T>(url: string, data?: unknown): Promise<{
            success: boolean;
            data?: T;
            error?: { code: string; message: string };
        }> => ipcRenderer.invoke('api:post', url, data),

        /**
         * PUT request
         */
        put: <T>(url: string, data?: unknown): Promise<{
            success: boolean;
            data?: T;
            error?: { code: string; message: string };
        }> => ipcRenderer.invoke('api:put', url, data),

        /**
         * PATCH request
         */
        patch: <T>(url: string, data?: unknown): Promise<{
            success: boolean;
            data?: T;
            error?: { code: string; message: string };
        }> => ipcRenderer.invoke('api:patch', url, data),

        /**
         * DELETE request
         */
        delete: <T>(url: string): Promise<{
            success: boolean;
            data?: T;
            error?: { code: string; message: string };
        }> => ipcRenderer.invoke('api:delete', url),

        /**
         * Set auth tokens (call after login)
         */
        setTokens: (tokens: { accessToken: string; refreshToken?: string }): Promise<{ success: boolean }> =>
            ipcRenderer.invoke('api:setTokens', tokens),

        /**
         * Clear auth tokens (call on logout)
         */
        clearTokens: (): Promise<{ success: boolean }> => ipcRenderer.invoke('api:clearTokens'),

        /**
         * Check if authenticated
         */
        isAuthenticated: (): Promise<boolean> => ipcRenderer.invoke('api:isAuthenticated'),

        /**
         * Set API base URL
         */
        setBaseUrl: (url: string): Promise<{ success: boolean }> => ipcRenderer.invoke('api:setBaseUrl', url),

        /**
         * Get current API base URL
         */
        getBaseUrl: (): Promise<string> => ipcRenderer.invoke('api:getBaseUrl'),
    },

    // ============ Print APIs ============
    /**
     * Get available printers
     */
    getPrinters: (): Promise<PrinterInfo[]> => ipcRenderer.invoke('print:getPrinters'),

    /**
     * Get default printer name
     */
    getDefaultPrinter: (): Promise<string | null> =>
        ipcRenderer.invoke('print:getDefaultPrinter'),

    /**
     * Silent print (no dialog)
     */
    silentPrint: (
        options: PrintOptions
    ): Promise<{ success: boolean; error?: string }> =>
        ipcRenderer.invoke('print:silent', options),

    /**
     * Print with dialog (fallback)
     */
    printWithDialog: (
        options: PrintOptions
    ): Promise<{ success: boolean; error?: string }> =>
        ipcRenderer.invoke('print:dialog', options),

    /**
     * Generate PDF
     */
    printToPDF: (
        options: PDFOptions
    ): Promise<{ success: boolean; data?: Uint8Array; path?: string; error?: string }> =>
        ipcRenderer.invoke('print:pdf', options),

    /**
     * Print PDF buffer silently (for printing specific invoice content)
     */
    printPdfBuffer: (
        pdfData: number[],
        options: PrintOptions
    ): Promise<{ success: boolean; error?: string }> =>
        ipcRenderer.invoke('print:pdfBuffer', pdfData, options),

    /**
     * Print HTML content silently (direct HTML string)
     */
    printHtmlContent: (
        htmlContent: string,
        options: PrintOptions
    ): Promise<{ success: boolean; error?: string }> =>
        ipcRenderer.invoke('print:htmlContent', htmlContent, options),

    /**
     * Get default PDF save path
     */
    getDefaultPDFPath: (filename: string): Promise<string> =>
        ipcRenderer.invoke('print:getDefaultPDFPath', filename),

    /**
     * Log print audit (Enterprise)
     */
    logPrintAudit: (
        entry: PrintAuditEntry
    ): Promise<{ success: boolean }> => ipcRenderer.invoke('print:audit', entry),

    // ============ Print Settings APIs ============
    /**
     * Get current print settings
     */
    getPrintSettings: (): Promise<PrintSettings> =>
        ipcRenderer.invoke('print:getSettings'),

    /**
     * Save print settings
     */
    savePrintSettings: (settings: Partial<PrintSettings>): Promise<PrintSettings> =>
        ipcRenderer.invoke('print:saveSettings', settings),

    /**
     * Reset print settings to defaults
     */
    resetPrintSettings: (): Promise<PrintSettings> =>
        ipcRenderer.invoke('print:resetSettings'),

    /**
     * Get default print settings
     */
    getDefaultPrintSettings: (): Promise<PrintSettings> =>
        ipcRenderer.invoke('print:getDefaultSettings'),

    // ============ App APIs ============
    /**
     * Get app version
     */
    getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),

    /**
     * Get platform info
     */
    getPlatform: (): Promise<{
        platform: string;
        arch: string;
        electron: string;
        node: string;
    }> => ipcRenderer.invoke('app:platform'),

    // ============ Update APIs ============
    /**
     * Install downloaded update
     */
    installUpdate: (): Promise<void> => ipcRenderer.invoke('update:install'),

    /**
     * Listen for update available event
     */
    onUpdateAvailable: (callback: () => void): void => {
        ipcRenderer.on('update:available', callback);
    },

    /**
     * Listen for update downloaded event
     */
    onUpdateDownloaded: (callback: () => void): void => {
        ipcRenderer.on('update:downloaded', callback);
    },

    /**
     * Remove update listeners
     */
    removeUpdateListeners: (): void => {
        ipcRenderer.removeAllListeners('update:available');
        ipcRenderer.removeAllListeners('update:downloaded');
    },

    // ============ Window Control APIs (自定義標題欄) ============
    /**
     * Check if running in Electron
     */
    isElectron: (): Promise<boolean> => ipcRenderer.invoke('app:isElectron'),

    /**
     * Minimize window
     */
    minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),

    /**
     * Maximize/restore window
     */
    maximizeWindow: (): Promise<void> => ipcRenderer.invoke('window:maximize'),

    /**
     * Check if window is maximized
     */
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),

    /**
     * Close window
     */
    closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),

    /**
     * Quit application
     */
    quitApp: (): Promise<void> => ipcRenderer.invoke('app:quit'),
};

// Expose to renderer via context bridge
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for renderer
export type ElectronAPI = typeof electronAPI;

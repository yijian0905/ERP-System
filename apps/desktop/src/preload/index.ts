/**
 * @file Preload Script - Secure Context Bridge
 * @description Exposes limited, whitelisted APIs to renderer process
 *
 * Per spec.md:
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
 * License Context
 */
interface LicenseContext {
    tenantId: string;
    authPolicy: {
        primary: 'password' | 'sso';
        allowPasswordFallback: boolean;
        mfa: 'off' | 'optional' | 'required';
        identifier: 'email' | 'username';
    };
    capabilities: string[];
    branding: {
        logo?: string;
        primaryColor?: string;
        companyName?: string;
    };
    activatedAt: string;
    serverUrl: string;
    expiresAt?: string;
}

/**
 * Electron API exposed to renderer (whitelist only)
 */
const electronAPI = {
    // ============ License APIs ============
    /**
     * Get stored license context
     */
    getLicense: (): Promise<{ success: boolean; context?: LicenseContext; error?: string }> =>
        ipcRenderer.invoke('license:get'),

    /**
     * Check if license exists
     */
    hasLicense: (): Promise<boolean> => ipcRenderer.invoke('license:exists'),

    /**
     * Activate license with server
     */
    activateLicense: (
        licenseKey: string,
        serverUrl?: string
    ): Promise<{ success: boolean; context?: LicenseContext; error?: string }> =>
        ipcRenderer.invoke('license:activate', licenseKey, serverUrl),

    /**
     * Validate license with server (refresh capabilities & branding)
     */
    validateLicense: (): Promise<{
        success: boolean;
        context?: LicenseContext;
        cached?: boolean;
        error?: string;
    }> => ipcRenderer.invoke('license:validate'),

    /**
     * Clear stored license
     */
    clearLicense: (): Promise<{ success: boolean }> =>
        ipcRenderer.invoke('license:clear'),

    // ============ Branding APIs ============
    /**
     * Get cached branding for immediate startup
     */
    getBranding: (): Promise<LicenseContext['branding'] | null> =>
        ipcRenderer.invoke('branding:get'),

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

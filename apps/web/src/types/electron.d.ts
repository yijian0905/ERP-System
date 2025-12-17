/**
 * @file Electron API Type Definitions
 * @description Extends Window interface with electronAPI for Electron desktop app
 */

interface ElectronAPI {
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

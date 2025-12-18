/**
 * @file Print Settings Store - Workstation-level Print Settings Persistence
 * @description Stores print settings per workstation using electron-store
 *
 * Per spec.md §277-279:
 * - Print settings stored locally (Workstation-level)
 * - Different devices may have different defaults
 *
 * Required Settings:
 * - Target printer (default: connected printer, with "Save to PDF" option)
 * - Paper size
 * - Orientation (Portrait / Landscape)
 * - Color mode (Color / B&W)
 * - Scale
 * - Copy count
 */

import Store from 'electron-store';

/**
 * Print Settings Schema (per spec.md §269-275)
 */
export interface PrintSettings {
    // Target printer name (null = use default system printer)
    targetPrinter: string | null;
    // Paper size
    paperSize: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';
    // Orientation (true = Landscape, false = Portrait)
    landscape: boolean;
    // Color mode (true = Color, false = B&W)
    color: boolean;
    // Scale (percentage, 1-500)
    scale: number;
    // Copy count
    copies: number;
    // Save to PDF as default action
    saveToPdfDefault: boolean;
}

/**
 * Default print settings
 */
const DEFAULT_SETTINGS: PrintSettings = {
    targetPrinter: null,
    paperSize: 'A4',
    landscape: false,
    color: true,
    scale: 100,
    copies: 1,
    saveToPdfDefault: false,
};

/**
 * Print Settings Store
 * Persists print settings at workstation level for quick access
 */
export class PrintSettingsStore {
    private store: Store<{ settings: PrintSettings }>;

    constructor() {
        this.store = new Store<{ settings: PrintSettings }>({
            name: 'print-settings',
            defaults: {
                settings: DEFAULT_SETTINGS,
            },
        });
    }

    /**
     * Get current print settings
     */
    getSettings(): PrintSettings {
        return this.store.get('settings', DEFAULT_SETTINGS) as PrintSettings;
    }

    /**
     * Save print settings
     */
    saveSettings(settings: Partial<PrintSettings>): PrintSettings {
        const current = this.getSettings();
        const updated = { ...current, ...settings };

        // Validate values
        if (updated.scale < 1) updated.scale = 1;
        if (updated.scale > 500) updated.scale = 500;
        if (updated.copies < 1) updated.copies = 1;
        if (updated.copies > 999) updated.copies = 999;

        this.store.set('settings', updated);
        return updated;
    }

    /**
     * Reset to default settings
     */
    resetToDefaults(): PrintSettings {
        this.store.set('settings', DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
    }

    /**
     * Get default settings (without modifying stored settings)
     */
    getDefaults(): PrintSettings {
        return { ...DEFAULT_SETTINGS };
    }

    /**
     * Set last used printer (convenience method)
     */
    setLastUsedPrinter(printerName: string | null): void {
        const settings = this.getSettings();
        settings.targetPrinter = printerName;
        this.store.set('settings', settings);
    }

    /**
     * Get last used printer
     */
    getLastUsedPrinter(): string | null {
        return this.getSettings().targetPrinter;
    }
}

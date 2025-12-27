/**
 * Print Service Types
 * Unified types for document printing across the application
 */

export interface PrintSettings {
    printer: string;
    colorMode: 'color' | 'bw';
    paperSize: 'A4' | 'Letter' | 'Legal';
    copies: number;
}

export interface PrinterInfo {
    id: string;
    name: string;
}

export interface PrintResult {
    success: boolean;
    error?: string;
}

export interface DocumentInfo {
    title: string;
    number: string;
    type: 'invoice' | 'purchase-order' | 'recurring-invoice' | 'quotation';
}

// Electron API type for print integration
export interface ElectronPrintAPI {
    printHtmlContent: (
        htmlContent: string,
        options: {
            deviceName?: string;
            pageSize?: 'A4' | 'Letter' | 'Legal';
            color?: boolean;
            copies?: number;
            silent?: boolean;
        }
    ) => Promise<PrintResult>;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
    printer: 'default',
    colorMode: 'color',
    paperSize: 'A4',
    copies: 1,
};

export const DEFAULT_PRINTERS: PrinterInfo[] = [
    { id: 'default', name: 'System Default Printer' },
    { id: 'hp-office', name: 'HP OfficeJet Pro 9015' },
    { id: 'canon-lbp', name: 'Canon LBP6230' },
    { id: 'epson-wf', name: 'Epson WorkForce WF-2860' },
    { id: 'pdf', name: 'Save as PDF' },
];

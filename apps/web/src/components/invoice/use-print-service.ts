/**
 * Print Service Hook
 * @see spec.md §7 Invoice Printing & Preview System
 * 
 * Provides PDF generation and download functionality using @react-pdf/renderer.
 * Decouples print output from live preview as required by spec.
 */

import { useCallback, useState, createElement, type ReactElement } from 'react';
import { pdf } from '@react-pdf/renderer';

import type { PrintSnapshot, PrintSettings } from './print-types';
import { createPrintSnapshot, DEFAULT_PRINT_SETTINGS } from './print-types';
import type { InvoiceFormData, CompanyInfo } from './types';

export interface UsePrintServiceOptions {
    onPrintStart?: () => void;
    onPrintComplete?: (snapshot: PrintSnapshot) => void;
    onPrintError?: (error: Error) => void;
}

export interface UsePrintServiceReturn {
    isPrinting: boolean;
    printError: Error | null;
    print: (
        formData: InvoiceFormData,
        invoiceNumber: string,
        companyInfo: CompanyInfo,
        PrintLayoutComponent: React.ComponentType<{ snapshot: PrintSnapshot }>,
        settings?: PrintSettings
    ) => Promise<void>;
}

/**
 * Hook for handling PDF-based printing
 */
export function usePrintService(options: UsePrintServiceOptions = {}): UsePrintServiceReturn {
    const { onPrintStart, onPrintComplete, onPrintError } = options;

    const [isPrinting, setIsPrinting] = useState(false);
    const [printError, setPrintError] = useState<Error | null>(null);

    const print = useCallback(async (
        formData: InvoiceFormData,
        invoiceNumber: string,
        companyInfo: CompanyInfo,
        PrintLayoutComponent: React.ComponentType<{ snapshot: PrintSnapshot }>,
        settings: PrintSettings = DEFAULT_PRINT_SETTINGS
    ) => {
        setIsPrinting(true);
        setPrintError(null);
        onPrintStart?.();

        try {
            // 1. Capture immutable snapshot (spec §7.3)
            const snapshot = createPrintSnapshot(formData, invoiceNumber, companyInfo, settings);

            // 2. Generate PDF from dedicated print layout (spec §7.4)
            // Use createElement since this is a .ts file (no JSX support)
            const element = createElement(PrintLayoutComponent, { snapshot }) as ReactElement;
            const pdfBlob = await pdf(element).toBlob();

            // 3. Trigger download (user requested direct download)
            downloadPdf(pdfBlob, `Invoice-${invoiceNumber}.pdf`);

            // 4. Notify completion
            onPrintComplete?.(snapshot);
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Print failed');
            setPrintError(err);
            onPrintError?.(err);
            console.error('Print service error:', error);
        } finally {
            setIsPrinting(false);
        }
    }, [onPrintStart, onPrintComplete, onPrintError]);

    return {
        isPrinting,
        printError,
        print,
    };
}

/**
 * Trigger PDF download
 */
function downloadPdf(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

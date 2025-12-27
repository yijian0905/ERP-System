/**
 * useDocumentPrint Hook
 * Unified document printing service for the ERP system
 * 
 * Consolidates printing logic from sales.tsx and purchase.tsx
 * Supports:
 * - Electron silent print (via printHtmlContent API)
 * - Browser iframe print (fallback)
 * - PDF save via html2canvas + jsPDF
 */

import { useCallback, useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import type {
    PrintSettings,
    PrinterInfo,
    PrintResult,
    DocumentInfo,
    ElectronPrintAPI
} from '@/lib/print/types';
import { DEFAULT_PRINT_SETTINGS, DEFAULT_PRINTERS } from '@/lib/print/types';
import { buildPrintDocument } from '@/lib/print/base-styles';

interface UseDocumentPrintOptions {
    onPrintStart?: () => void;
    onPrintComplete?: () => void;
    onPrintError?: (error: Error) => void;
}

interface UseDocumentPrintReturn {
    // Ref to attach to print content container
    printRef: React.RefObject<HTMLDivElement>;

    // State
    isPrinting: boolean;
    printSettings: PrintSettings;
    availablePrinters: PrinterInfo[];

    // Settings controls
    setPrintSettings: React.Dispatch<React.SetStateAction<PrintSettings>>;

    // Print actions
    printDocument: (documentInfo: DocumentInfo) => Promise<void>;
    savePdf: (documentInfo: DocumentInfo) => Promise<void>;

    // Helper to determine which action to use based on settings
    executeCurrentAction: (documentInfo: DocumentInfo) => Promise<void>;
}

/**
 * Get Electron API if available
 */
function getElectronAPI(): ElectronPrintAPI | undefined {
    return (window as unknown as { electronAPI?: ElectronPrintAPI }).electronAPI;
}

/**
 * Print HTML content in an iframe (browser fallback)
 */
async function printViaIframe(htmlContent: string): Promise<void> {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.top = '-10000px';
        iframe.style.left = '-10000px';
        iframe.style.width = '210mm';
        iframe.style.height = '297mm';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) {
            document.body.removeChild(iframe);
            throw new Error('Could not access iframe document');
        }

        doc.open();
        doc.write(htmlContent);
        doc.close();

        // Wait for content to load, then print
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
                resolve();
            }, 1000);
        }, 250);
    });
}

export function useDocumentPrint(options: UseDocumentPrintOptions = {}): UseDocumentPrintReturn {
    const { onPrintStart, onPrintComplete, onPrintError } = options;

    const printRef = useRef<HTMLDivElement>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);

    const availablePrinters = useMemo(() => DEFAULT_PRINTERS, []);

    /**
     * Print document using Electron silent print or browser iframe
     */
    const printDocument = useCallback(async (documentInfo: DocumentInfo) => {
        if (!printRef.current) {
            console.error('Print ref not attached');
            return;
        }

        setIsPrinting(true);
        onPrintStart?.();

        try {
            const printContent = printRef.current;
            const htmlContent = buildPrintDocument(
                `${documentInfo.type === 'invoice' ? 'Invoice' : 'Purchase Order'} - ${documentInfo.number}`,
                printContent.innerHTML
            );

            const electronAPI = getElectronAPI();

            if (electronAPI?.printHtmlContent) {
                // Electron: Use silent print
                const printerName = printSettings.printer === 'default'
                    ? undefined
                    : availablePrinters.find(p => p.id === printSettings.printer)?.name;

                const result = await electronAPI.printHtmlContent(htmlContent, {
                    deviceName: printerName,
                    pageSize: printSettings.paperSize,
                    color: printSettings.colorMode === 'color',
                    copies: printSettings.copies,
                    silent: true,
                });

                if (result.success) {
                    console.log('✅ Silent print successful');
                    onPrintComplete?.();
                } else {
                    throw new Error(result.error || 'Print failed');
                }
            } else {
                // Browser: Use iframe printing (will show print dialog)
                await printViaIframe(htmlContent);
                onPrintComplete?.();
            }
        } catch (error) {
            console.error('Print error:', error);
            onPrintError?.(error instanceof Error ? error : new Error('Print failed'));
        } finally {
            setIsPrinting(false);
        }
    }, [printSettings, availablePrinters, onPrintStart, onPrintComplete, onPrintError]);

    /**
     * Save document as PDF using html2canvas
     */
    const savePdf = useCallback(async (documentInfo: DocumentInfo) => {
        if (!printRef.current) {
            console.error('Print ref not attached');
            return;
        }

        setIsPrinting(true);
        onPrintStart?.();

        try {
            const element = printRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 0;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

            const filename = documentInfo.type === 'invoice'
                ? `Invoice-${documentInfo.number}.pdf`
                : `PurchaseOrder-${documentInfo.number}.pdf`;

            pdf.save(filename);

            onPrintComplete?.();
        } catch (error) {
            console.error('Failed to save PDF:', error);
            onPrintError?.(error instanceof Error ? error : new Error('PDF save failed'));
        } finally {
            setIsPrinting(false);
        }
    }, [onPrintStart, onPrintComplete, onPrintError]);

    /**
     * Execute current action based on printer settings
     */
    const executeCurrentAction = useCallback(async (documentInfo: DocumentInfo) => {
        if (printSettings.printer === 'pdf') {
            await savePdf(documentInfo);
        } else {
            await printDocument(documentInfo);
        }
    }, [printSettings.printer, printDocument, savePdf]);

    return {
        printRef,
        isPrinting,
        printSettings,
        availablePrinters,
        setPrintSettings,
        printDocument,
        savePdf,
        executeCurrentAction,
    };
}

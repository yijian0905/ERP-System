/**
 * @file Print Handler - Electron Print Functionality
 * @description Implements printing per spec.md requirements:
 *
 * - Silent Print (requires target printer specification)
 * - Save to PDF (default option available)
 * - Print failures MUST NOT cause data loss
 * - System MUST NOT rely on browser/OS print headers/footers
 * - Print audit logging (Enterprise)
 */

import { BrowserWindow, ipcMain, PrinterInfo } from 'electron';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { app } from 'electron';

/**
 * Print Options (per spec.md Print Settings)
 */
export interface PrintOptions {
    // Target printer (default: connected printer)
    deviceName?: string;
    // Paper size
    pageSize?: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';
    // Orientation
    landscape?: boolean;
    // Color mode (true = Color, false = B&W)
    color?: boolean;
    // Scale (percentage)
    scaleFactor?: number;
    // Copy count
    copies?: number;
    // Silent print (no dialog)
    silent?: boolean;
}

/**
 * PDF Options
 */
export interface PDFOptions {
    pageSize?: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';
    landscape?: boolean;
    printBackground?: boolean;
    savePath?: string;
}

/**
 * Print Audit Log Entry (Enterprise feature per spec.md)
 */
export interface PrintAuditEntry {
    tenantId: string;
    userId: string;
    documentType: string;
    documentId: string;
    documentNumber?: string;
    printerName?: string;
    paperSize?: string;
    copies?: number;
    printMode?: 'silent' | 'pdf' | 'preview';
    success: boolean;
    errorMessage?: string;
    printTimestamp: string;
}

/**
 * Setup print-related IPC handlers
 */
export function setupPrintHandlers(mainWindow: BrowserWindow): void {
    // Get available printers
    ipcMain.handle('print:getPrinters', async (): Promise<PrinterInfo[]> => {
        try {
            const printers = await mainWindow.webContents.getPrintersAsync();
            return printers;
        } catch (error) {
            console.error('Failed to get printers:', error);
            return [];
        }
    });

    // Get default printer
    ipcMain.handle('print:getDefaultPrinter', async (): Promise<string | null> => {
        try {
            const printers = await mainWindow.webContents.getPrintersAsync();
            const defaultPrinter = printers.find((p) => p.isDefault);
            return defaultPrinter?.name ?? null;
        } catch {
            return null;
        }
    });

    // Silent print (spec.md: Silent Print with fallback)
    ipcMain.handle(
        'print:silent',
        async (_event, options: PrintOptions): Promise<{ success: boolean; error?: string }> => {
            return new Promise((resolve) => {
                try {
                    mainWindow.webContents.print(
                        {
                            silent: options.silent ?? true,
                            printBackground: true,
                            deviceName: options.deviceName,
                            copies: options.copies ?? 1,
                            color: options.color ?? true,
                            landscape: options.landscape ?? false,
                            // No browser headers/footers (per spec.md)
                            margins: {
                                marginType: 'none',
                            },
                            pageSize: options.pageSize ?? 'A4',
                            scaleFactor: options.scaleFactor ?? 100,
                        },
                        (success, failureReason) => {
                            if (success) {
                                resolve({ success: true });
                            } else {
                                // Per spec.md: Silent print failures MUST fallback to non-silent print flow
                                console.warn(
                                    'Silent print failed, reason:',
                                    failureReason
                                );
                                resolve({
                                    success: false,
                                    error: failureReason || 'Print failed',
                                });
                            }
                        }
                    );
                } catch (error) {
                    console.error('Print error:', error);
                    resolve({
                        success: false,
                        error: error instanceof Error ? error.message : 'Print failed',
                    });
                }
            });
        }
    );

    // Print with dialog (fallback for silent print failure)
    ipcMain.handle(
        'print:dialog',
        async (_event, options: PrintOptions): Promise<{ success: boolean; error?: string }> => {
            return new Promise((resolve) => {
                try {
                    mainWindow.webContents.print(
                        {
                            silent: false, // Show print dialog
                            printBackground: true,
                            color: options.color ?? true,
                            landscape: options.landscape ?? false,
                            margins: {
                                marginType: 'none',
                            },
                            pageSize: options.pageSize ?? 'A4',
                        },
                        (success, failureReason) => {
                            resolve({
                                success,
                                error: success ? undefined : failureReason || 'Print cancelled',
                            });
                        }
                    );
                } catch (error) {
                    resolve({
                        success: false,
                        error: error instanceof Error ? error.message : 'Print failed',
                    });
                }
            });
        }
    );

    // Print to PDF (spec.md: Save to PDF option)
    ipcMain.handle(
        'print:pdf',
        async (
            _event,
            options: PDFOptions
        ): Promise<{ success: boolean; data?: Uint8Array; path?: string; error?: string }> => {
            try {
                const pdfData = await mainWindow.webContents.printToPDF({
                    printBackground: options.printBackground ?? true,
                    pageSize: options.pageSize ?? 'A4',
                    landscape: options.landscape ?? false,
                    margins: {
                        marginType: 'none', // No browser margins (per spec.md)
                    },
                });

                // If save path specified, write to file
                if (options.savePath) {
                    await writeFile(options.savePath, pdfData);
                    return { success: true, path: options.savePath };
                }

                // Return PDF data for renderer to handle
                return { success: true, data: pdfData };
            } catch (error) {
                console.error('PDF generation error:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'PDF generation failed',
                };
            }
        }
    );

    // Get default save path for PDFs
    ipcMain.handle('print:getDefaultPDFPath', (_event, filename: string) => {
        const documentsPath = app.getPath('documents');
        return join(documentsPath, filename);
    });

    // Log print audit (Enterprise feature per spec.md §283-291)
    ipcMain.handle(
        'print:audit',
        async (
            _event,
            entry: PrintAuditEntry & { apiBaseUrl: string; accessToken: string }
        ): Promise<{ success: boolean; error?: string }> => {
            try {
                const { apiBaseUrl, accessToken, ...auditData } = entry;

                // Send to API server for audit logging
                const response = await fetch(`${apiBaseUrl}/api/v1/print-audit/print`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        documentType: auditData.documentType,
                        documentId: auditData.documentId,
                        documentNumber: auditData.documentNumber,
                        printerName: auditData.printerName,
                        paperSize: auditData.paperSize,
                        copies: auditData.copies,
                        printMode: auditData.printMode,
                        success: auditData.success,
                        errorMessage: auditData.errorMessage,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.warn('Print audit API error:', errorData);
                    // Don't fail - audit logging should not block print operation
                    return { success: true };
                }

                console.log('Print audit logged successfully');
                return { success: true };
            } catch (error) {
                // Per spec.md: Print failures MUST NOT cause data loss or system interruption
                // Log error but don't block the print operation
                console.error('Print audit error (non-blocking):', error);
                return { success: true };
            }
        }
    );
}

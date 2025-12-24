/**
 * Print Types
 * @see spec.md §7 Invoice Printing & Preview System
 *
 * Defines types and utilities for the PDF-based printing workflow.
 */

import type { InvoiceFormData, InvoiceLineItem, CompanyInfo } from './types';

/**
 * Paper size options for printing
 */
export type PaperSize = 'A4' | 'LETTER' | 'LEGAL';

/**
 * Page orientation
 */
export type Orientation = 'portrait' | 'landscape';

/**
 * Color mode for printing
 */
export type ColorMode = 'color' | 'bw';

/**
 * Print settings configuration
 * @see spec.md §7.6 Print Settings
 */
export interface PrintSettings {
    paperSize: PaperSize;
    orientation: Orientation;
    colorMode: ColorMode;
    scale: number; // 0.5 - 1.5
    copies: number;
}

/**
 * Default print settings
 */
export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
    paperSize: 'A4',
    orientation: 'portrait',
    colorMode: 'color',
    scale: 1,
    copies: 1,
};

/**
 * Print snapshot - immutable data captured at print time
 * @see spec.md §7.3 Print Snapshot
 *
 * This snapshot is frozen at the moment the user clicks "Print"
 * and is NOT synced with form state after capture.
 */
export interface PrintSnapshot {
    // Document identification
    invoiceNumber: string;
    printTimestamp: string;

    // Invoice data
    invoiceDate: string;
    dueDate: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerAddress: string;
    customerTin?: string;
    customerBrn?: string;
    customerSstNo?: string;

    // Line items (frozen copy)
    items: Readonly<InvoiceLineItem[]>;

    // Totals
    subtotal: number;
    taxAmount: number;
    discount: number;
    total: number;

    // Additional fields
    notes: string;
    terms: string;

    // E-Invoice specifics
    currency: string;
    paymentMode?: string;
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
    billReferenceNumber?: string;

    // Company info (frozen copy)
    companyInfo: Readonly<CompanyInfo>;

    // Print settings
    settings: Readonly<PrintSettings>;
}

/**
 * Create an immutable print snapshot from form data
 *
 * @param formData - Current invoice form data
 * @param invoiceNumber - Generated invoice number
 * @param companyInfo - Company information
 * @param settings - Print settings
 * @returns Immutable PrintSnapshot
 */
export function createPrintSnapshot(
    formData: InvoiceFormData,
    invoiceNumber: string,
    companyInfo: CompanyInfo,
    settings: PrintSettings = DEFAULT_PRINT_SETTINGS
): PrintSnapshot {
    // Create deep frozen copy of items
    const frozenItems = formData.items.map((item) => ({ ...item }));

    // Create the snapshot
    const snapshot: PrintSnapshot = {
        invoiceNumber,
        printTimestamp: new Date().toISOString(),

        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        customerId: formData.customerId,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerAddress: formData.customerAddress,
        customerTin: formData.customerTin,
        customerBrn: formData.customerBrn,
        customerSstNo: formData.customerSstNo,

        items: Object.freeze(frozenItems),

        subtotal: formData.subtotal,
        taxAmount: formData.taxAmount,
        discount: formData.discount,
        total: formData.total,

        notes: formData.notes,
        terms: formData.terms,

        currency: formData.currency,
        paymentMode: formData.paymentMode,
        billingPeriodStart: formData.billingPeriodStart,
        billingPeriodEnd: formData.billingPeriodEnd,
        billReferenceNumber: formData.billReferenceNumber,

        companyInfo: Object.freeze({ ...companyInfo }),
        settings: Object.freeze({ ...settings }),
    };

    // Freeze the entire snapshot to ensure immutability
    return Object.freeze(snapshot) as PrintSnapshot;
}

/**
 * Paper size dimensions in points (1 inch = 72 points)
 */
export const PAPER_DIMENSIONS: Record<PaperSize, { width: number; height: number }> = {
    A4: { width: 595.28, height: 841.89 },      // 210mm × 297mm
    LETTER: { width: 612, height: 792 },          // 8.5" × 11"
    LEGAL: { width: 612, height: 1008 },          // 8.5" × 14"
};

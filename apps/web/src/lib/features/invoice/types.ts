/**
 * Invoice Types for E-Invoice compliance
 */

import type { TaxTypeCode, TaxExemptionCode } from './tax-engine';

// Document Type Codes (E-Invoice spec)
export type DocumentTypeCode = '01' | '02' | '03' | '04' | '11' | '12' | '13' | '14';

export interface DocumentType {
    code: DocumentTypeCode;
    name: string;
    nameZh: string;
    description: string;
}

export const DOCUMENT_TYPES: DocumentType[] = [
    { code: '01', name: 'Invoice', nameZh: '發票', description: 'Standard invoice' },
    { code: '02', name: 'Credit Note', nameZh: '貸項通知單', description: 'Credit adjustment' },
    { code: '03', name: 'Debit Note', nameZh: '借項通知單', description: 'Debit adjustment' },
    { code: '04', name: 'Refund Note', nameZh: '退款通知單', description: 'Return of monies' },
    { code: '11', name: 'Self-Billed Invoice', nameZh: '自開發票', description: 'For foreign suppliers, agents' },
    { code: '12', name: 'Self-Billed Credit Note', nameZh: '自開貸項通知單', description: 'Adjust self-billed invoice' },
    { code: '13', name: 'Self-Billed Debit Note', nameZh: '自開借項通知單', description: 'Additional charges on self-billed' },
    { code: '14', name: 'Self-Billed Refund Note', nameZh: '自開退款通知單', description: 'Refund on self-billed' },
];

// Payment Mode Codes
export type PaymentModeCode = '01' | '02' | '03' | '04' | '05' | '06' | '07';

export interface PaymentMode {
    code: PaymentModeCode;
    name: string;
    nameZh: string;
}

export const PAYMENT_MODES: PaymentMode[] = [
    { code: '01', name: 'Cash', nameZh: '現金' },
    { code: '02', name: 'Cheque', nameZh: '支票' },
    { code: '03', name: 'Bank Transfer', nameZh: '銀行轉帳' },
    { code: '04', name: 'Credit Card', nameZh: '信用卡' },
    { code: '05', name: 'Debit Card', nameZh: '扣帳卡' },
    { code: '06', name: 'e-Wallet', nameZh: '電子錢包' },
    { code: '07', name: 'Others', nameZh: '其他' },
];

// Malaysia State Codes
export type StateCode = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17';

export interface MalaysiaState {
    code: StateCode;
    name: string;
}

export const MALAYSIA_STATES: MalaysiaState[] = [
    { code: '01', name: 'Johor' },
    { code: '02', name: 'Kedah' },
    { code: '03', name: 'Kelantan' },
    { code: '04', name: 'Melaka' },
    { code: '05', name: 'Negeri Sembilan' },
    { code: '06', name: 'Pahang' },
    { code: '07', name: 'Pulau Pinang' },
    { code: '08', name: 'Perak' },
    { code: '09', name: 'Perlis' },
    { code: '10', name: 'Selangor' },
    { code: '11', name: 'Terengganu' },
    { code: '12', name: 'Sabah' },
    { code: '13', name: 'Sarawak' },
    { code: '14', name: 'Wilayah Persekutuan Kuala Lumpur' },
    { code: '15', name: 'Wilayah Persekutuan Labuan' },
    { code: '16', name: 'Wilayah Persekutuan Putrajaya' },
    { code: '17', name: 'Not Applicable' },
];

// E-Invoice Line Item
export interface EInvoiceLineItem {
    lineNo: number;
    classificationCode: string;
    description: string;
    quantity: number;
    unitOfMeasure?: string;
    unitPrice: number;
    discountRate?: number;
    discountAmount?: number;
    taxType: TaxTypeCode;
    taxRate: number;
    taxAmount: number;
    exemptionCode?: TaxExemptionCode;
    exemptionAmount?: number;
    subtotal: number;
    total: number;
}

// E-Invoice Address
export interface EInvoiceAddress {
    addressLine1: string;
    addressLine2?: string;
    addressLine3?: string;
    postalZone: string;
    cityName: string;
    state: StateCode;
    country: string; // ISO 3166-1 alpha-3 (e.g., 'MYS')
}

// E-Invoice Party (Supplier or Buyer)
export interface EInvoiceParty {
    name: string;
    tin: string; // Tax Identification Number
    registrationNumber: string; // BRN/MyKad/Passport
    sstRegistrationNumber?: string;
    tourismTaxRegistrationNumber?: string;
    email?: string;
    phone: string;
    msicCode?: string; // Supplier only
    businessActivityDescription?: string; // Supplier only
    address: EInvoiceAddress;
}

// Full E-Invoice Document
export interface EInvoiceDocument {
    // Document Info
    version: '1.0' | '1.1';
    typeCode: DocumentTypeCode;
    internalId: string; // Invoice number
    issueDateTime: string; // ISO 8601
    currencyCode: string; // ISO 4217
    exchangeRate?: number;

    // Reference (for Credit/Debit notes)
    originalInvoiceUuid?: string;

    // Parties
    supplier: EInvoiceParty;
    buyer: EInvoiceParty;

    // Line Items
    lineItems: EInvoiceLineItem[];

    // Totals
    totalExcludingTax: number;
    totalIncludingTax: number;
    totalPayableAmount: number;
    totalDiscount?: number;
    roundingAmount?: number;

    // Payment
    paymentMode?: PaymentModeCode;
    paymentTerms?: string;
    supplierBankAccount?: string;

    // Notes
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
}

// Special TIN values for specific scenarios
export const SPECIAL_TINS = {
    MALAYSIAN_INDIVIDUAL_NO_TIN: 'EI00000000010',
    FOREIGN_BUYER_NO_TIN: 'EI00000000020',
    FOREIGN_SUPPLIER_SELF_BILLED: 'EI00000000030',
    GOVERNMENT_BODIES: 'EI00000000040',
} as const;

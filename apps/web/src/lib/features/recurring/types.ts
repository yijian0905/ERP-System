/**
 * Recurring Module Types
 * Extracted from recurring.tsx for better maintainability
 */

export type BillingCycle = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';

export interface RecurringItem {
    id: string;
    name: string;
    customer: string;
    customerId: string;
    description: string;
    amount: number;
    billingCycle: BillingCycle;
    startDate: string;
    nextBillingDate: string;
    status: SubscriptionStatus;
    lastInvoice: string | null;
    totalRevenue: number;
    invoiceCount: number;
}

export interface RecurringFormData {
    name: string;
    customerId: string;
    description: string;
    amount: number;
    billingCycle: BillingCycle;
    startDate: string;
}

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

// Status styles
export const statusStyles: Record<SubscriptionStatus, { color: string; label: string }> = {
    ACTIVE: { color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400', label: 'Active' },
    PAUSED: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400', label: 'Paused' },
    CANCELLED: { color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400', label: 'Cancelled' },
    EXPIRED: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400', label: 'Expired' },
};

// Billing cycle labels
export const billingCycleLabels: Record<BillingCycle, string> = {
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    YEARLY: 'Yearly',
};

// Company info for invoice
export const companyInfo = {
    name: 'Demo Company Ltd.',
    address: '123 Business Street, San Francisco, CA 94105',
    phone: '+1 (555) 123-4567',
    email: 'billing@demo-company.com',
    taxId: 'US123456789',
};

export const initialRecurringFormData: RecurringFormData = {
    name: '',
    customerId: '',
    description: '',
    amount: 0,
    billingCycle: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
};

export const initialPrintSettings: PrintSettings = {
    printer: 'default',
    colorMode: 'color',
    paperSize: 'A4',
    copies: 1,
};

export const defaultPrinters: PrinterInfo[] = [
    { id: 'default', name: 'System Default Printer' },
    { id: 'hp-office', name: 'HP OfficeJet Pro 9015' },
    { id: 'canon-lbp', name: 'Canon LBP6230' },
    { id: 'epson-wf', name: 'Epson WorkForce WF-2860' },
    { id: 'pdf', name: 'Save as PDF' },
];

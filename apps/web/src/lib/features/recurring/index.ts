/**
 * Recurring Feature Module
 * 
 * This module contains all recurring revenue code extracted from the
 * original monolithic recurring.tsx (1252 lines) for better maintainability.
 */

// Types
export type {
    RecurringItem,
    RecurringFormData,
    BillingCycle,
    SubscriptionStatus,
    PrintSettings,
    PrinterInfo,
} from './types';

export {
    statusStyles,
    billingCycleLabels,
    companyInfo,
    initialRecurringFormData,
    initialPrintSettings,
    defaultPrinters,
} from './types';

// Utilities
export {
    calculateMonthlyEquivalent,
    calculateRecurringStats,
    formatAmountWithCycle,
    generateInvoiceNumber,
    formatDate,
} from './utils';

// Hooks
export { useRecurring } from './useRecurring';

// Components
export { RecurringTable } from './RecurringTable';
export { RecurringForm } from './RecurringForm';

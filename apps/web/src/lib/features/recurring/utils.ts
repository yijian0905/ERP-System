/**
 * Recurring Module Utilities
 * Helper functions for recurring revenue management
 */

import type { RecurringItem, BillingCycle } from './types';
import { billingCycleLabels } from './types';

/**
 * Calculate monthly equivalent amount for a recurring item
 */
export function calculateMonthlyEquivalent(amount: number, cycle: BillingCycle): number {
    switch (cycle) {
        case 'WEEKLY': return amount * 4.33;
        case 'MONTHLY': return amount;
        case 'QUARTERLY': return amount / 3;
        case 'YEARLY': return amount / 12;
        default: return amount;
    }
}

/**
 * Calculate stats from recurring items
 */
export function calculateRecurringStats(items: RecurringItem[]) {
    const activeItems = items.filter((i) => i.status === 'ACTIVE');

    const monthlyRecurring = activeItems.reduce((sum, item) =>
        sum + calculateMonthlyEquivalent(item.amount, item.billingCycle), 0
    );

    const annualRecurring = monthlyRecurring * 12;
    const totalLifetimeRevenue = items.reduce((sum, i) => sum + i.totalRevenue, 0);

    return {
        monthlyRecurring,
        annualRecurring,
        activeCount: activeItems.length,
        totalCount: items.length,
        totalLifetimeRevenue,
    };
}

/**
 * Format amount with billing cycle suffix
 */
export function formatAmountWithCycle(amount: number, cycle: BillingCycle): string {
    const cycleSuffix = billingCycleLabels[cycle].toLowerCase().slice(0, -2);
    return `$${amount.toLocaleString()}/${cycleSuffix}`;
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(): string {
    return `INV-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
}

/**
 * Requisitions Module Utilities
 * Helper functions for requisitions management
 */

import type { Requisition, RequisitionItem } from './types';

/**
 * Generate requisition number
 */
export function generateRequisitionNumber(existingCount: number): string {
    const year = new Date().getFullYear();
    return `REQ-${year}-${String(existingCount + 1).padStart(4, '0')}`;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
}

/**
 * Calculate total cost from items
 */
export function calculateTotalCost(items: RequisitionItem[]): number {
    return items.reduce((sum, item) => sum + item.totalCost, 0);
}

/**
 * Calculate requisition stats
 */
export function calculateRequisitionStats(requisitions: Requisition[]) {
    const totalRequests = requisitions.length;
    const pendingApproval = requisitions.filter((r) => r.status === 'PENDING').length;
    const totalCostApproved = requisitions
        .filter((r) => r.status === 'FULFILLED' || r.status === 'APPROVED')
        .reduce((sum, r) => sum + r.totalCost, 0);
    const urgentRequests = requisitions.filter((r) => r.priority === 'URGENT' && r.status === 'PENDING').length;
    const fulfilledCount = requisitions.filter((r) => r.status === 'FULFILLED').length;
    const fulfillmentRate = requisitions.length > 0
        ? Math.round((fulfilledCount / requisitions.length) * 100)
        : 0;

    return {
        totalRequests,
        pendingApproval,
        totalCostApproved,
        urgentRequests,
        fulfillmentRate,
    };
}

/**
 * Recurring Revenue Mock Data
 */
export const mockRecurringItems = [
    {
        id: '1',
        name: 'Monthly Software Subscription',
        customerId: '1',
        customerName: 'Acme Corporation',
        type: 'SUBSCRIPTION' as const,
        frequency: 'MONTHLY' as const,
        amount: 99.99,
        nextBillingDate: '2025-01-01',
        status: 'ACTIVE' as const,
        startDate: '2024-01-01',
        endDate: null,
        notes: 'Enterprise software license',
    },
    {
        id: '2',
        name: 'Annual Maintenance Contract',
        customerId: '2',
        customerName: 'Tech Solutions Inc',
        type: 'CONTRACT' as const,
        frequency: 'YEARLY' as const,
        amount: 1200.00,
        nextBillingDate: '2025-06-15',
        status: 'ACTIVE' as const,
        startDate: '2024-06-15',
        endDate: '2025-06-14',
        notes: 'Hardware maintenance agreement',
    },
];

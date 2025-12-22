/**
 * Payments Mock Data
 */
export const mockPayments = [
    {
        id: '1',
        paymentNumber: 'PAY-2024-001',
        invoiceId: '1',
        customerId: '1',
        customerName: 'Acme Corporation',
        amount: 329.89,
        method: 'BANK_TRANSFER' as const,
        status: 'COMPLETED' as const,
        reference: 'TRF-123456',
        paymentDate: '2024-12-10',
        createdAt: '2024-12-10',
    },
    {
        id: '2',
        paymentNumber: 'PAY-2024-002',
        invoiceId: '2',
        customerId: '2',
        customerName: 'Tech Solutions Inc',
        amount: 100.00,
        method: 'CREDIT_CARD' as const,
        status: 'PENDING' as const,
        reference: null,
        paymentDate: '2024-12-15',
        createdAt: '2024-12-15',
    },
];

/**
 * Invoices Mock Data
 */
export const mockInvoices = [
    {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        orderId: '1',
        customerId: '1',
        customerName: 'Acme Corporation',
        status: 'PAID' as const,
        issueDate: '2024-12-01',
        dueDate: '2024-12-31',
        subtotal: 299.90,
        tax: 29.99,
        total: 329.89,
        paidAmount: 329.89,
        createdAt: '2024-12-01',
    },
    {
        id: '2',
        invoiceNumber: 'INV-2024-002',
        orderId: '2',
        customerId: '2',
        customerName: 'Tech Solutions Inc',
        status: 'PENDING' as const,
        issueDate: '2024-12-05',
        dueDate: '2025-01-05',
        subtotal: 249.95,
        tax: 25.00,
        total: 274.95,
        paidAmount: 0,
        createdAt: '2024-12-05',
    },
];

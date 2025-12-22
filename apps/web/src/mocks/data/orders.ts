/**
 * Orders Mock Data
 */
export const mockSalesOrders = [
    {
        id: '1',
        orderNumber: 'SO-2024-001',
        type: 'SALES' as const,
        customerId: '1',
        customerName: 'Acme Corporation',
        status: 'CONFIRMED' as const,
        items: [
            { productId: '1', productName: 'Wireless Mouse', quantity: 10, unitPrice: 29.99, total: 299.90 },
        ],
        subtotal: 299.90,
        tax: 29.99,
        total: 329.89,
        createdAt: '2024-12-01',
    },
    {
        id: '2',
        orderNumber: 'SO-2024-002',
        type: 'SALES' as const,
        customerId: '2',
        customerName: 'Tech Solutions Inc',
        status: 'PENDING' as const,
        items: [
            { productId: '2', productName: 'USB-C Hub', quantity: 5, unitPrice: 49.99, total: 249.95 },
        ],
        subtotal: 249.95,
        tax: 25.00,
        total: 274.95,
        createdAt: '2024-12-05',
    },
];

export const mockPurchaseOrders = [
    {
        id: '1',
        orderNumber: 'PO-2024-001',
        type: 'PURCHASE' as const,
        supplierId: '1',
        supplierName: 'Global Tech Suppliers',
        status: 'RECEIVED' as const,
        items: [
            { productId: '1', productName: 'Wireless Mouse', quantity: 100, unitPrice: 15.00, total: 1500.00 },
        ],
        subtotal: 1500.00,
        tax: 150.00,
        total: 1650.00,
        createdAt: '2024-11-15',
    },
];

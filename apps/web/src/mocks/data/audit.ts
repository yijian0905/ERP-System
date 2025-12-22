/**
 * Audit Logs Mock Data
 */
export const mockAuditLogs = [
    {
        id: '1',
        action: 'CREATE',
        entityType: 'Product',
        entityId: '1',
        entityName: 'Wireless Mouse',
        userId: '1',
        userName: 'Admin User',
        changes: { name: 'Wireless Mouse', price: 29.99 },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: '2024-12-15T10:30:00Z',
    },
    {
        id: '2',
        action: 'UPDATE',
        entityType: 'Customer',
        entityId: '1',
        entityName: 'Acme Corporation',
        userId: '2',
        userName: 'Manager User',
        changes: { creditLimit: { old: 25000, new: 50000 } },
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0',
        createdAt: '2024-12-15T11:45:00Z',
    },
    {
        id: '3',
        action: 'DELETE',
        entityType: 'Invoice',
        entityId: '5',
        entityName: 'INV-2024-005',
        userId: '1',
        userName: 'Admin User',
        changes: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: '2024-12-14T09:00:00Z',
    },
];

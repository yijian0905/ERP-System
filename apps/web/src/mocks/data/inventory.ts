/**
 * Inventory Mock Data
 */
export const mockInventory = [
    {
        id: '1',
        productId: '1',
        productName: 'Wireless Mouse',
        sku: 'ELEC-001',
        warehouseId: '1',
        warehouseName: 'Main Warehouse',
        quantity: 150,
        reservedQuantity: 10,
        availableQuantity: 140,
        minStock: 20,
        maxStock: 200,
        reorderPoint: 30,
        lastUpdated: '2024-12-15',
    },
    {
        id: '2',
        productId: '2',
        productName: 'USB-C Hub',
        sku: 'ELEC-002',
        warehouseId: '1',
        warehouseName: 'Main Warehouse',
        quantity: 75,
        reservedQuantity: 5,
        availableQuantity: 70,
        minStock: 15,
        maxStock: 100,
        reorderPoint: 20,
        lastUpdated: '2024-12-15',
    },
];

export const mockMovements = [
    {
        id: '1',
        type: 'IN' as const,
        productId: '1',
        productName: 'Wireless Mouse',
        quantity: 100,
        fromLocation: null,
        toLocation: 'Main Warehouse',
        reference: 'PO-2024-001',
        notes: 'Initial stock received',
        createdAt: '2024-12-01',
        createdBy: 'Admin User',
    },
    {
        id: '2',
        type: 'OUT' as const,
        productId: '1',
        productName: 'Wireless Mouse',
        quantity: 10,
        fromLocation: 'Main Warehouse',
        toLocation: null,
        reference: 'SO-2024-001',
        notes: 'Sales order fulfilled',
        createdAt: '2024-12-10',
        createdBy: 'Sales Rep',
    },
];

export const mockAdjustments = [
    {
        id: '1',
        type: 'INCREASE' as const,
        productId: '1',
        productName: 'Wireless Mouse',
        quantity: 5,
        reason: 'Found in inventory count',
        notes: 'Physical count adjustment',
        createdAt: '2024-12-12',
        createdBy: 'Warehouse Staff',
    },
];

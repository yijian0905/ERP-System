/**
 * Products Mock Data
 */
export const mockProducts = [
    {
        id: '1',
        sku: 'ELEC-001',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with long battery life',
        category: 'elec',
        price: 29.99,
        cost: 15.00,
        stock: 150,
        minStock: 20,
        maxStock: 200,
        reorderPoint: 30,
        status: 'ACTIVE' as const,
        createdAt: '2024-01-15',
    },
    {
        id: '2',
        sku: 'ELEC-002',
        name: 'USB-C Hub',
        description: '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader',
        category: 'elec',
        price: 49.99,
        cost: 25.00,
        stock: 75,
        minStock: 15,
        maxStock: 100,
        reorderPoint: 20,
        status: 'ACTIVE' as const,
        createdAt: '2024-02-01',
    },
];

export const mockCategories = [
    { id: 'elec', name: 'Electronics', prefix: 'ELEC' },
    { id: 'office', name: 'Office Supplies', prefix: 'OFF' },
    { id: 'furn', name: 'Furniture', prefix: 'FURN' },
    { id: 'pack', name: 'Packaging', prefix: 'PACK' },
    { id: 'clean', name: 'Cleaning Supplies', prefix: 'CLN', isNonSellable: true },
    { id: 'maint', name: 'Maintenance', prefix: 'MNT', isNonSellable: true },
];

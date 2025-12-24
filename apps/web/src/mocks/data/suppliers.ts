/**
 * Suppliers Mock Data
 */
export interface MockSupplier {
    id: string;
    code: string;
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    fax: string | null;
    website: string | null;
    taxId: string | null;
    address: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    } | null;
    bankDetails: {
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
        swiftCode?: string;
    } | null;
    paymentTerms: number;
    currency: string;
    leadTime: number;
    minimumOrder: number;
    rating: number | null;
    notes: string | null;
    isActive: boolean;
    orderCount: number;
    productCount: number;
    createdAt: string;
    updatedAt: string;
}

export const mockSuppliers: MockSupplier[] = [
    {
        id: 'sup-001',
        code: 'SUP-001',
        name: 'Global Tech Suppliers',
        contactPerson: 'John Chen',
        email: 'orders@globaltech.com',
        phone: '+86 755 8888 9999',
        mobile: '+86 138 0000 1111',
        fax: '+86 755 8888 9998',
        website: 'https://www.globaltech.com',
        taxId: 'CN91440300MA5EP2XL2X',
        address: {
            street: '100 Tech Park, Building A',
            city: 'Shenzhen',
            state: 'Guangdong',
            postalCode: '518000',
            country: 'China',
        },
        bankDetails: {
            bankName: 'Bank of China',
            accountNumber: '123456789012345',
            accountName: 'Global Tech Suppliers Ltd',
            swiftCode: 'BKCHCNBJ',
        },
        paymentTerms: 30,
        currency: 'USD',
        leadTime: 14,
        minimumOrder: 100,
        rating: 4.5,
        notes: 'Primary electronics supplier. Excellent quality and reliability.',
        isActive: true,
        orderCount: 45,
        productCount: 12,
        createdAt: '2023-01-15',
        updatedAt: '2024-12-01',
    },
    {
        id: 'sup-002',
        code: 'SUP-002',
        name: 'Office Essentials Co.',
        contactPerson: 'Maria Garcia',
        email: 'sales@officeessentials.com',
        phone: '+1 213 555 0100',
        mobile: '+1 213 555 0101',
        fax: null,
        website: 'https://www.officeessentials.com',
        taxId: 'US12-3456789',
        address: {
            street: '250 Industrial Way',
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90001',
            country: 'USA',
        },
        bankDetails: {
            bankName: 'Chase Bank',
            accountNumber: '987654321',
            accountName: 'Office Essentials Co.',
            swiftCode: 'CHASUS33',
        },
        paymentTerms: 15,
        currency: 'USD',
        leadTime: 5,
        minimumOrder: 50,
        rating: 4.2,
        notes: 'Fast delivery for office supplies.',
        isActive: true,
        orderCount: 28,
        productCount: 8,
        createdAt: '2023-03-20',
        updatedAt: '2024-11-15',
    },
    {
        id: 'sup-003',
        code: 'SUP-003',
        name: 'Premium Furniture Inc.',
        contactPerson: 'David Wilson',
        email: 'wholesale@premiumfurniture.com',
        phone: '+1 616 555 0200',
        mobile: '+1 616 555 0201',
        fax: '+1 616 555 0202',
        website: 'https://www.premiumfurniture.com',
        taxId: 'US45-6789012',
        address: {
            street: '500 Furniture Boulevard',
            city: 'Grand Rapids',
            state: 'MI',
            postalCode: '49503',
            country: 'USA',
        },
        bankDetails: {
            bankName: 'Fifth Third Bank',
            accountNumber: '54321678',
            accountName: 'Premium Furniture Inc.',
            swiftCode: 'FTBCUS44',
        },
        paymentTerms: 45,
        currency: 'USD',
        leadTime: 21,
        minimumOrder: 5,
        rating: 4.8,
        notes: 'High-quality ergonomic furniture. Premium pricing but excellent craftsmanship.',
        isActive: true,
        orderCount: 12,
        productCount: 5,
        createdAt: '2023-06-01',
        updatedAt: '2024-10-20',
    },
];

/**
 * Supplier Products - Products available from each supplier for purchase orders
 */
export interface SupplierProduct {
    id: string;
    supplierId: string;
    productId: string;
    name: string;
    sku: string;
    category: string;
    cost: number;
    currentStock: number;
    reorderPoint: number;
    leadTime: number;
}

export const mockSupplierProducts: SupplierProduct[] = [
    // Global Tech Suppliers products
    {
        id: 'sp-001',
        supplierId: 'sup-001',
        productId: 'prod-001',
        name: 'Wireless Mouse',
        sku: 'ELEC-001',
        category: 'Electronics',
        cost: 15.00,
        currentStock: 150,
        reorderPoint: 30,
        leadTime: 14,
    },
    {
        id: 'sp-002',
        supplierId: 'sup-001',
        productId: 'prod-002',
        name: 'Mechanical Keyboard',
        sku: 'ELEC-002',
        category: 'Electronics',
        cost: 75.00,
        currentStock: 8,
        reorderPoint: 10,
        leadTime: 14,
    },
    {
        id: 'sp-003',
        supplierId: 'sup-001',
        productId: 'prod-003',
        name: 'USB-C Hub',
        sku: 'ELEC-003',
        category: 'Electronics',
        cost: 28.00,
        currentStock: 200,
        reorderPoint: 25,
        leadTime: 14,
    },
    {
        id: 'sp-004',
        supplierId: 'sup-001',
        productId: 'prod-004',
        name: '27" 4K Monitor',
        sku: 'ELEC-004',
        category: 'Electronics',
        cost: 280.00,
        currentStock: 18,
        reorderPoint: 5,
        leadTime: 21,
    },
    // Office Essentials products
    {
        id: 'sp-005',
        supplierId: 'sup-002',
        productId: 'prod-005',
        name: 'A4 Copy Paper',
        sku: 'OFFC-001',
        category: 'Office Supplies',
        cost: 4.50,
        currentStock: 500,
        reorderPoint: 200,
        leadTime: 5,
    },
    {
        id: 'sp-006',
        supplierId: 'sup-002',
        productId: 'prod-006',
        name: 'Printer Ink Cartridge',
        sku: 'OFFC-002',
        category: 'Office Supplies',
        cost: 12.00,
        currentStock: 12,
        reorderPoint: 30,
        leadTime: 5,
    },
    {
        id: 'sp-007',
        supplierId: 'sup-002',
        productId: 'prod-007',
        name: 'Sticky Notes Pack',
        sku: 'OFFC-003',
        category: 'Office Supplies',
        cost: 5.50,
        currentStock: 320,
        reorderPoint: 80,
        leadTime: 3,
    },
    // Premium Furniture products
    {
        id: 'sp-008',
        supplierId: 'sup-003',
        productId: 'prod-008',
        name: 'Ergonomic Office Chair',
        sku: 'FURN-001',
        category: 'Furniture',
        cost: 150.00,
        currentStock: 25,
        reorderPoint: 8,
        leadTime: 21,
    },
    {
        id: 'sp-009',
        supplierId: 'sup-003',
        productId: 'prod-009',
        name: 'Standing Desk',
        sku: 'FURN-002',
        category: 'Furniture',
        cost: 350.00,
        currentStock: 5,
        reorderPoint: 3,
        leadTime: 28,
    },
];

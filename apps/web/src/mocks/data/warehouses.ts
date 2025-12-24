/**
 * Warehouses Mock Data
 */
export interface MockWarehouse {
    id: string;
    code: string;
    name: string;
    type: 'WAREHOUSE' | 'STORE' | 'VIRTUAL';
    address: string | null;
    phone: string | null;
    email: string | null;
    manager: string | null;
    isDefault: boolean;
    isActive: boolean;
    itemCount: number;
    totalValue: number;
    capacityUsed: number;
    createdAt: string;
    updatedAt: string;
}

export const mockWarehouses: MockWarehouse[] = [
    {
        id: 'wh-001',
        code: 'WH-MAIN',
        name: 'Main Warehouse',
        type: 'WAREHOUSE',
        address: '123 Industrial Ave, New York, NY 10001',
        phone: '+1 212 555 0100',
        email: 'main@warehouse.com',
        manager: 'Robert Johnson',
        isDefault: true,
        isActive: true,
        itemCount: 1250,
        totalValue: 458750.00,
        capacityUsed: 72,
        createdAt: '2022-01-01',
        updatedAt: '2024-12-15',
    },
    {
        id: 'wh-002',
        code: 'WH-SEC',
        name: 'Secondary Warehouse',
        type: 'WAREHOUSE',
        address: '456 Storage Blvd, Brooklyn, NY 11201',
        phone: '+1 718 555 0200',
        email: 'secondary@warehouse.com',
        manager: 'Sarah Mitchell',
        isDefault: false,
        isActive: true,
        itemCount: 820,
        totalValue: 215600.00,
        capacityUsed: 45,
        createdAt: '2022-06-15',
        updatedAt: '2024-12-10',
    },
    {
        id: 'wh-003',
        code: 'ST-DT',
        name: 'Downtown Retail Store',
        type: 'STORE',
        address: '789 Main Street, Manhattan, NY 10013',
        phone: '+1 212 555 0300',
        email: 'downtown@store.com',
        manager: 'Emily Davis',
        isDefault: false,
        isActive: true,
        itemCount: 350,
        totalValue: 87500.00,
        capacityUsed: 60,
        createdAt: '2023-02-01',
        updatedAt: '2024-12-12',
    },
];

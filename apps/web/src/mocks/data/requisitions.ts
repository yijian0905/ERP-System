/**
 * Requisitions Mock Data
 */
export const mockRequisitions = [
    {
        id: '1',
        requisitionNumber: 'REQ-2024-001',
        costCenterId: '1',
        costCenterName: 'Marketing Department',
        requesterId: '3',
        requesterName: 'Sales Rep',
        status: 'APPROVED' as const,
        items: [
            { productId: '1', productName: 'Wireless Mouse', quantity: 5, estimatedCost: 149.95 },
        ],
        totalEstimatedCost: 149.95,
        justification: 'New team members need equipment',
        createdAt: '2024-12-05',
        approvedAt: '2024-12-06',
        approvedBy: 'Manager User',
    },
    {
        id: '2',
        requisitionNumber: 'REQ-2024-002',
        costCenterId: '2',
        costCenterName: 'IT Department',
        requesterId: '4',
        requesterName: 'Warehouse Staff',
        status: 'PENDING' as const,
        items: [
            { productId: '2', productName: 'USB-C Hub', quantity: 10, estimatedCost: 499.90 },
        ],
        totalEstimatedCost: 499.90,
        justification: 'Upgrade workstation connectivity',
        createdAt: '2024-12-10',
        approvedAt: null,
        approvedBy: null,
    },
];

export const mockCostCenters = [
    {
        id: '1',
        code: 'MKT',
        name: 'Marketing Department',
        description: 'Marketing and advertising expenses',
        budget: 50000,
        spent: 12500,
        remaining: 37500,
        isActive: true,
    },
    {
        id: '2',
        code: 'IT',
        name: 'IT Department',
        description: 'Technology and infrastructure',
        budget: 100000,
        spent: 45000,
        remaining: 55000,
        isActive: true,
    },
    {
        id: '3',
        code: 'OPS',
        name: 'Operations',
        description: 'General operations and logistics',
        budget: 75000,
        spent: 30000,
        remaining: 45000,
        isActive: true,
    },
];

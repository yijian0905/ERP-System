/**
 * Requisitions MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockRequisitions, mockCostCenters } from '../data/requisitions';

export const requisitionsHandlers = [
    // GET /api/v1/requisitions
    http.get('/api/v1/requisitions', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status') || '';

        let filtered = [...mockRequisitions];

        if (status) {
            filtered = filtered.filter((r) => r.status === status);
        }

        return HttpResponse.json({
            success: true,
            data: filtered,
            meta: { total: filtered.length, page: 1, limit: 50 },
        });
    }),

    // POST /api/v1/requisitions
    http.post('/api/v1/requisitions', async ({ request }) => {
        const body = await request.json();
        const newRequisition = {
            id: String(mockRequisitions.length + 1),
            requisitionNumber: `REQ-2024-${String(mockRequisitions.length + 1).padStart(3, '0')}`,
            status: 'PENDING' as const,
            approvedAt: null,
            approvedBy: null,
            ...body,
            createdAt: new Date().toISOString().split('T')[0],
        };
        mockRequisitions.push(newRequisition);
        return HttpResponse.json({ success: true, data: newRequisition }, { status: 201 });
    }),

    // PATCH /api/v1/requisitions/:id/approve
    http.patch('/api/v1/requisitions/:id/approve', ({ params }) => {
        const index = mockRequisitions.findIndex((r) => r.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Requisition not found' },
                { status: 404 }
            );
        }
        mockRequisitions[index] = {
            ...mockRequisitions[index],
            status: 'APPROVED',
            approvedAt: new Date().toISOString().split('T')[0],
            approvedBy: 'Admin User',
        };
        return HttpResponse.json({ success: true, data: mockRequisitions[index] });
    }),
];

export const costCentersHandlers = [
    // GET /api/v1/cost-centers
    http.get('/api/v1/cost-centers', () => {
        return HttpResponse.json({
            success: true,
            data: mockCostCenters,
            meta: { total: mockCostCenters.length, page: 1, limit: 50 },
        });
    }),

    // POST /api/v1/cost-centers
    http.post('/api/v1/cost-centers', async ({ request }) => {
        const body = await request.json();
        const newCostCenter = {
            id: String(mockCostCenters.length + 1),
            spent: 0,
            remaining: body.budget || 0,
            isActive: true,
            ...body,
        };
        mockCostCenters.push(newCostCenter);
        return HttpResponse.json({ success: true, data: newCostCenter }, { status: 201 });
    }),

    // PATCH /api/v1/cost-centers/:id
    http.patch('/api/v1/cost-centers/:id', async ({ params, request }) => {
        const index = mockCostCenters.findIndex((c) => c.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Cost center not found' },
                { status: 404 }
            );
        }
        const body = await request.json();
        mockCostCenters[index] = { ...mockCostCenters[index], ...body };
        return HttpResponse.json({ success: true, data: mockCostCenters[index] });
    }),
];

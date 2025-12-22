/**
 * Inventory MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockInventory, mockMovements, mockAdjustments } from '../data/inventory';

export const inventoryHandlers = [
    // GET /api/v1/inventory
    http.get('/api/v1/inventory', () => {
        return HttpResponse.json({
            success: true,
            data: mockInventory,
            meta: { total: mockInventory.length, page: 1, limit: 50 },
        });
    }),

    // GET /api/v1/inventory/movements
    http.get('/api/v1/inventory/movements', () => {
        return HttpResponse.json({
            success: true,
            data: mockMovements,
            meta: { total: mockMovements.length, page: 1, limit: 50 },
        });
    }),

    // GET /api/v1/inventory/adjustments
    http.get('/api/v1/inventory/adjustments', () => {
        return HttpResponse.json({
            success: true,
            data: mockAdjustments,
            meta: { total: mockAdjustments.length, page: 1, limit: 50 },
        });
    }),

    // POST /api/v1/inventory/adjustments
    http.post('/api/v1/inventory/adjustments', async ({ request }) => {
        const body = await request.json();
        const newAdjustment = {
            id: String(mockAdjustments.length + 1),
            ...body,
            createdAt: new Date().toISOString().split('T')[0],
        };
        mockAdjustments.push(newAdjustment);
        return HttpResponse.json({ success: true, data: newAdjustment }, { status: 201 });
    }),

    // POST /api/v1/inventory/transfer
    http.post('/api/v1/inventory/transfer', async ({ request }) => {
        const body = await request.json();
        const movement = {
            id: String(mockMovements.length + 1),
            type: 'TRANSFER' as const,
            ...body,
            createdAt: new Date().toISOString().split('T')[0],
        };
        mockMovements.push(movement);
        return HttpResponse.json({ success: true, data: movement }, { status: 201 });
    }),
];

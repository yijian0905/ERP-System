/**
 * Warehouses MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockWarehouses, type MockWarehouse } from '../data/warehouses';

export const warehousesHandlers = [
    // GET /api/v1/warehouses - Get list of warehouses
    http.get('/api/v1/warehouses', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search')?.toLowerCase() || '';
        const type = url.searchParams.get('type') || '';
        const isActiveParam = url.searchParams.get('isActive');

        let filtered = [...mockWarehouses];

        if (search) {
            filtered = filtered.filter(
                (w) =>
                    w.name.toLowerCase().includes(search) ||
                    w.code.toLowerCase().includes(search) ||
                    w.address?.toLowerCase().includes(search)
            );
        }

        if (type) {
            filtered = filtered.filter((w) => w.type === type);
        }

        if (isActiveParam !== null) {
            const isActive = isActiveParam === 'true';
            filtered = filtered.filter((w) => w.isActive === isActive);
        }

        return HttpResponse.json({
            success: true,
            data: filtered,
            meta: { total: filtered.length, page: 1, limit: 50 },
        });
    }),

    // GET /api/v1/warehouses/:id - Get single warehouse
    http.get('/api/v1/warehouses/:id', ({ params }) => {
        const warehouse = mockWarehouses.find((w) => w.id === params.id);
        if (!warehouse) {
            return HttpResponse.json(
                { success: false, error: 'Warehouse not found' },
                { status: 404 }
            );
        }
        return HttpResponse.json({ success: true, data: warehouse });
    }),

    // POST /api/v1/warehouses - Create warehouse
    http.post('/api/v1/warehouses', async ({ request }) => {
        const body = await request.json() as Partial<MockWarehouse>;
        const newWarehouse: MockWarehouse = {
            id: `wh-${String(mockWarehouses.length + 1).padStart(3, '0')}`,
            code: body.code || `WH-${String(mockWarehouses.length + 1).padStart(3, '0')}`,
            name: body.name || '',
            type: body.type || 'WAREHOUSE',
            address: body.address || null,
            phone: body.phone || null,
            email: body.email || null,
            manager: body.manager || null,
            isDefault: body.isDefault ?? false,
            isActive: body.isActive ?? true,
            itemCount: 0,
            totalValue: 0,
            capacityUsed: 0,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
        };
        mockWarehouses.push(newWarehouse);
        return HttpResponse.json({ success: true, data: newWarehouse }, { status: 201 });
    }),

    // PATCH /api/v1/warehouses/:id - Update warehouse
    http.patch('/api/v1/warehouses/:id', async ({ params, request }) => {
        const index = mockWarehouses.findIndex((w) => w.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Warehouse not found' },
                { status: 404 }
            );
        }
        const body = await request.json() as Partial<MockWarehouse>;
        mockWarehouses[index] = {
            ...mockWarehouses[index],
            ...body,
            updatedAt: new Date().toISOString().split('T')[0],
        };
        return HttpResponse.json({ success: true, data: mockWarehouses[index] });
    }),

    // DELETE /api/v1/warehouses/:id - Delete warehouse
    http.delete('/api/v1/warehouses/:id', ({ params }) => {
        const index = mockWarehouses.findIndex((w) => w.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Warehouse not found' },
                { status: 404 }
            );
        }
        mockWarehouses.splice(index, 1);
        return HttpResponse.json({ success: true, data: { message: 'Warehouse deleted' } });
    }),

    // POST /api/v1/warehouses/:id/set-default - Set warehouse as default
    http.post('/api/v1/warehouses/:id/set-default', ({ params }) => {
        const index = mockWarehouses.findIndex((w) => w.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Warehouse not found' },
                { status: 404 }
            );
        }
        // Remove default from all warehouses
        mockWarehouses.forEach((w) => (w.isDefault = false));
        // Set new default
        mockWarehouses[index].isDefault = true;
        return HttpResponse.json({ success: true, data: { message: 'Default warehouse updated' } });
    }),
];

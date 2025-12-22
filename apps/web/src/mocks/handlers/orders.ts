/**
 * Orders MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockSalesOrders, mockPurchaseOrders } from '../data/orders';

export const ordersHandlers = [
    // GET /api/v1/orders - unified orders list
    http.get('/api/v1/orders', ({ request }) => {
        const url = new URL(request.url);
        const type = url.searchParams.get('type') || '';
        const status = url.searchParams.get('status') || '';

        let orders = [...mockSalesOrders, ...mockPurchaseOrders];

        if (type === 'SALES') {
            orders = orders.filter((o) => o.type === 'SALES');
        } else if (type === 'PURCHASE') {
            orders = orders.filter((o) => o.type === 'PURCHASE');
        }

        if (status) {
            orders = orders.filter((o) => o.status === status);
        }

        return HttpResponse.json({
            success: true,
            data: orders,
            meta: { total: orders.length, page: 1, limit: 50 },
        });
    }),

    // GET /api/v1/orders/sales
    http.get('/api/v1/orders/sales', () => {
        return HttpResponse.json({
            success: true,
            data: mockSalesOrders,
            meta: { total: mockSalesOrders.length, page: 1, limit: 50 },
        });
    }),

    // GET /api/v1/orders/purchase
    http.get('/api/v1/orders/purchase', () => {
        return HttpResponse.json({
            success: true,
            data: mockPurchaseOrders,
            meta: { total: mockPurchaseOrders.length, page: 1, limit: 50 },
        });
    }),

    // POST /api/v1/orders/sales
    http.post('/api/v1/orders/sales', async ({ request }) => {
        const body = await request.json();
        const newOrder = {
            id: String(mockSalesOrders.length + 1),
            orderNumber: `SO-2024-${String(mockSalesOrders.length + 1).padStart(3, '0')}`,
            type: 'SALES' as const,
            status: 'PENDING' as const,
            ...body,
            createdAt: new Date().toISOString().split('T')[0],
        };
        mockSalesOrders.push(newOrder);
        return HttpResponse.json({ success: true, data: newOrder }, { status: 201 });
    }),

    // POST /api/v1/orders/purchase
    http.post('/api/v1/orders/purchase', async ({ request }) => {
        const body = await request.json();
        const newOrder = {
            id: String(mockPurchaseOrders.length + 1),
            orderNumber: `PO-2024-${String(mockPurchaseOrders.length + 1).padStart(3, '0')}`,
            type: 'PURCHASE' as const,
            status: 'PENDING' as const,
            ...body,
            createdAt: new Date().toISOString().split('T')[0],
        };
        mockPurchaseOrders.push(newOrder);
        return HttpResponse.json({ success: true, data: newOrder }, { status: 201 });
    }),
];

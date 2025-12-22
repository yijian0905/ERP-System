/**
 * Recurring Revenue MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockRecurringItems } from '../data/recurring';

export const recurringHandlers = [
    // GET /api/v1/recurring
    http.get('/api/v1/recurring', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status') || '';

        let filtered = [...mockRecurringItems];

        if (status) {
            filtered = filtered.filter((r) => r.status === status);
        }

        return HttpResponse.json({
            success: true,
            data: filtered,
            meta: { total: filtered.length, page: 1, limit: 50 },
        });
    }),

    // POST /api/v1/recurring
    http.post('/api/v1/recurring', async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        const newItem = {
            id: String(mockRecurringItems.length + 1),
            status: 'ACTIVE' as const,
            endDate: null,
            ...body,
        };
        mockRecurringItems.push(newItem);
        return HttpResponse.json({ success: true, data: newItem }, { status: 201 });
    }),

    // PATCH /api/v1/recurring/:id
    http.patch('/api/v1/recurring/:id', async ({ params, request }) => {
        const index = mockRecurringItems.findIndex((r) => r.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Recurring item not found' },
                { status: 404 }
            );
        }
        const body = await request.json() as Record<string, unknown>;
        mockRecurringItems[index] = { ...mockRecurringItems[index], ...body };
        return HttpResponse.json({ success: true, data: mockRecurringItems[index] });
    }),

    // DELETE /api/v1/recurring/:id
    http.delete('/api/v1/recurring/:id', ({ params }) => {
        const index = mockRecurringItems.findIndex((r) => r.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Recurring item not found' },
                { status: 404 }
            );
        }
        mockRecurringItems.splice(index, 1);
        return HttpResponse.json({ success: true, data: { message: 'Recurring item deleted' } });
    }),
];

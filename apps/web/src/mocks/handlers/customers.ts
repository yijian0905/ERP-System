/**
 * Customers MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockCustomers } from '../data/customers';

export const customersHandlers = [
    // GET /api/v1/customers
    http.get('/api/v1/customers', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search')?.toLowerCase() || '';
        const type = url.searchParams.get('type') || '';

        let filtered = [...mockCustomers];

        if (search) {
            filtered = filtered.filter(
                (c) =>
                    c.name.toLowerCase().includes(search) ||
                    c.code.toLowerCase().includes(search) ||
                    c.email?.toLowerCase().includes(search)
            );
        }

        if (type) {
            filtered = filtered.filter((c) => c.type === type);
        }

        return HttpResponse.json({
            success: true,
            data: filtered,
            meta: { total: filtered.length, page: 1, limit: 50 },
        });
    }),

    // GET /api/v1/customers/:id
    http.get('/api/v1/customers/:id', ({ params }) => {
        const customer = mockCustomers.find((c) => c.id === params.id);
        if (!customer) {
            return HttpResponse.json(
                { success: false, error: 'Customer not found' },
                { status: 404 }
            );
        }
        return HttpResponse.json({ success: true, data: customer });
    }),

    // POST /api/v1/customers
    http.post('/api/v1/customers', async ({ request }) => {
        const body = await request.json();
        const newCustomer = {
            id: String(mockCustomers.length + 1),
            code: `CUST-${String(mockCustomers.length + 1).padStart(3, '0')}`,
            ...body,
            createdAt: new Date().toISOString().split('T')[0],
        };
        mockCustomers.push(newCustomer);
        return HttpResponse.json({ success: true, data: newCustomer }, { status: 201 });
    }),

    // PATCH /api/v1/customers/:id
    http.patch('/api/v1/customers/:id', async ({ params, request }) => {
        const index = mockCustomers.findIndex((c) => c.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Customer not found' },
                { status: 404 }
            );
        }
        const body = await request.json();
        mockCustomers[index] = { ...mockCustomers[index], ...body };
        return HttpResponse.json({ success: true, data: mockCustomers[index] });
    }),

    // DELETE /api/v1/customers/:id
    http.delete('/api/v1/customers/:id', ({ params }) => {
        const index = mockCustomers.findIndex((c) => c.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Customer not found' },
                { status: 404 }
            );
        }
        mockCustomers.splice(index, 1);
        return HttpResponse.json({ success: true, data: { message: 'Customer deleted' } });
    }),
];

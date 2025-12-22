/**
 * Invoices MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockInvoices } from '../data/invoices';

export const invoicesHandlers = [
    // GET /api/v1/invoices
    http.get('/api/v1/invoices', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status') || '';

        let filtered = [...mockInvoices];

        if (status) {
            filtered = filtered.filter((i) => i.status === status);
        }

        return HttpResponse.json({
            success: true,
            data: filtered,
            meta: { total: filtered.length, page: 1, limit: 50 },
        });
    }),

    // GET /api/v1/invoices/:id
    http.get('/api/v1/invoices/:id', ({ params }) => {
        const invoice = mockInvoices.find((i) => i.id === params.id);
        if (!invoice) {
            return HttpResponse.json(
                { success: false, error: 'Invoice not found' },
                { status: 404 }
            );
        }
        return HttpResponse.json({ success: true, data: invoice });
    }),

    // POST /api/v1/invoices
    http.post('/api/v1/invoices', async ({ request }) => {
        const body = await request.json();
        const newInvoice = {
            id: String(mockInvoices.length + 1),
            invoiceNumber: `INV-2024-${String(mockInvoices.length + 1).padStart(3, '0')}`,
            status: 'PENDING' as const,
            paidAmount: 0,
            ...body,
            createdAt: new Date().toISOString().split('T')[0],
        };
        mockInvoices.push(newInvoice);
        return HttpResponse.json({ success: true, data: newInvoice }, { status: 201 });
    }),
];

/**
 * Payments MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockPayments } from '../data/payments';

export const paymentsHandlers = [
    // GET /api/v1/payments
    http.get('/api/v1/payments', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status') || '';

        let filtered = [...mockPayments];

        if (status) {
            filtered = filtered.filter((p) => p.status === status);
        }

        return HttpResponse.json({
            success: true,
            data: filtered,
            meta: { total: filtered.length, page: 1, limit: 50 },
        });
    }),

    // POST /api/v1/payments
    http.post('/api/v1/payments', async ({ request }) => {
        const body = await request.json();
        const newPayment = {
            id: String(mockPayments.length + 1),
            paymentNumber: `PAY-2024-${String(mockPayments.length + 1).padStart(3, '0')}`,
            status: 'PENDING' as const,
            ...body,
            createdAt: new Date().toISOString().split('T')[0],
        };
        mockPayments.push(newPayment);
        return HttpResponse.json({ success: true, data: newPayment }, { status: 201 });
    }),
];

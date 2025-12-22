/**
 * Audit MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockAuditLogs } from '../data/audit';

export const auditHandlers = [
    // GET /api/v1/audit
    http.get('/api/v1/audit', ({ request }) => {
        const url = new URL(request.url);
        const action = url.searchParams.get('action') || '';
        const entityType = url.searchParams.get('entityType') || '';

        let filtered = [...mockAuditLogs];

        if (action) {
            filtered = filtered.filter((l) => l.action === action);
        }

        if (entityType) {
            filtered = filtered.filter((l) => l.entityType === entityType);
        }

        return HttpResponse.json({
            success: true,
            data: filtered,
            meta: { total: filtered.length, page: 1, limit: 50 },
        });
    }),
];

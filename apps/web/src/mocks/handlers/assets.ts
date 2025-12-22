/**
 * Assets MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockAssets } from '../data/assets';

export const assetsHandlers = [
    // GET /api/v1/assets
    http.get('/api/v1/assets', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status') || '';
        const category = url.searchParams.get('category') || '';

        let filtered = [...mockAssets];

        if (status) {
            filtered = filtered.filter((a) => a.status === status);
        }

        if (category) {
            filtered = filtered.filter((a) => a.category === category);
        }

        return HttpResponse.json({
            success: true,
            data: filtered,
            meta: { total: filtered.length, page: 1, limit: 50 },
        });
    }),

    // GET /api/v1/assets/:id
    http.get('/api/v1/assets/:id', ({ params }) => {
        const asset = mockAssets.find((a) => a.id === params.id);
        if (!asset) {
            return HttpResponse.json(
                { success: false, error: 'Asset not found' },
                { status: 404 }
            );
        }
        return HttpResponse.json({ success: true, data: asset });
    }),

    // POST /api/v1/assets
    http.post('/api/v1/assets', async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        const newAsset = {
            id: String(mockAssets.length + 1),
            assetNumber: `AST-${String(mockAssets.length + 1).padStart(3, '0')}`,
            status: 'AVAILABLE' as const,
            ...body,
        };
        mockAssets.push(newAsset);
        return HttpResponse.json({ success: true, data: newAsset }, { status: 201 });
    }),

    // PATCH /api/v1/assets/:id
    http.patch('/api/v1/assets/:id', async ({ params, request }) => {
        const index = mockAssets.findIndex((a) => a.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Asset not found' },
                { status: 404 }
            );
        }
        const body = await request.json() as Record<string, unknown>;
        mockAssets[index] = { ...mockAssets[index], ...body };
        return HttpResponse.json({ success: true, data: mockAssets[index] });
    }),

    // DELETE /api/v1/assets/:id
    http.delete('/api/v1/assets/:id', ({ params }) => {
        const index = mockAssets.findIndex((a) => a.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Asset not found' },
                { status: 404 }
            );
        }
        mockAssets.splice(index, 1);
        return HttpResponse.json({ success: true, data: { message: 'Asset deleted' } });
    }),
];

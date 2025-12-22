/**
 * Products MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockProducts, mockCategories } from '../data/products';

export const productsHandlers = [
    // GET /api/v1/products
    http.get('/api/v1/products', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search')?.toLowerCase() || '';
        const category = url.searchParams.get('category') || '';
        const status = url.searchParams.get('status') || '';

        let filtered = [...mockProducts];

        if (search) {
            filtered = filtered.filter(
                (p) =>
                    p.name.toLowerCase().includes(search) ||
                    p.sku.toLowerCase().includes(search)
            );
        }

        if (category) {
            filtered = filtered.filter((p) => p.category === category);
        }

        if (status) {
            filtered = filtered.filter((p) => p.status === status);
        }

        return HttpResponse.json({
            success: true,
            data: filtered,
            meta: { total: filtered.length, page: 1, limit: 50 },
        });
    }),

    // GET /api/v1/products/:id
    http.get('/api/v1/products/:id', ({ params }) => {
        const product = mockProducts.find((p) => p.id === params.id);
        if (!product) {
            return HttpResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }
        return HttpResponse.json({ success: true, data: product });
    }),

    // POST /api/v1/products
    http.post('/api/v1/products', async ({ request }) => {
        const body = await request.json();
        const newProduct = {
            id: String(mockProducts.length + 1),
            ...body,
            createdAt: new Date().toISOString().split('T')[0],
        };
        mockProducts.push(newProduct);
        return HttpResponse.json({ success: true, data: newProduct }, { status: 201 });
    }),

    // PATCH /api/v1/products/:id
    http.patch('/api/v1/products/:id', async ({ params, request }) => {
        const index = mockProducts.findIndex((p) => p.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }
        const body = await request.json();
        mockProducts[index] = { ...mockProducts[index], ...body };
        return HttpResponse.json({ success: true, data: mockProducts[index] });
    }),

    // DELETE /api/v1/products/:id
    http.delete('/api/v1/products/:id', ({ params }) => {
        const index = mockProducts.findIndex((p) => p.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }
        mockProducts.splice(index, 1);
        return HttpResponse.json({ success: true, data: { message: 'Product deleted' } });
    }),

    // GET /api/v1/products/categories
    http.get('/api/v1/products/categories', () => {
        return HttpResponse.json({ success: true, data: mockCategories });
    }),
];

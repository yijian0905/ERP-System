/**
 * Suppliers MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockSuppliers, mockSupplierProducts, type MockSupplier } from '../data/suppliers';

export const suppliersHandlers = [
    // GET /api/v1/suppliers - Get list of suppliers
    http.get('/api/v1/suppliers', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search')?.toLowerCase() || '';
        const isActiveParam = url.searchParams.get('isActive');

        let filtered = [...mockSuppliers];

        if (search) {
            filtered = filtered.filter(
                (s) =>
                    s.name.toLowerCase().includes(search) ||
                    s.code.toLowerCase().includes(search) ||
                    s.email?.toLowerCase().includes(search)
            );
        }

        if (isActiveParam !== null) {
            const isActive = isActiveParam === 'true';
            filtered = filtered.filter((s) => s.isActive === isActive);
        }

        return HttpResponse.json({
            success: true,
            data: filtered,
            meta: { total: filtered.length, page: 1, limit: 50 },
        });
    }),

    // GET /api/v1/suppliers/:id - Get single supplier
    http.get('/api/v1/suppliers/:id', ({ params }) => {
        const supplier = mockSuppliers.find((s) => s.id === params.id);
        if (!supplier) {
            return HttpResponse.json(
                { success: false, error: 'Supplier not found' },
                { status: 404 }
            );
        }
        return HttpResponse.json({ success: true, data: supplier });
    }),

    // GET /api/v1/suppliers/:id/products - Get products from a supplier
    http.get('/api/v1/suppliers/:id/products', ({ params, request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search')?.toLowerCase() || '';
        const category = url.searchParams.get('category') || '';

        let products = mockSupplierProducts.filter((p) => p.supplierId === params.id);

        if (search) {
            products = products.filter(
                (p) =>
                    p.name.toLowerCase().includes(search) ||
                    p.sku.toLowerCase().includes(search)
            );
        }

        if (category) {
            products = products.filter((p) => p.category === category);
        }

        return HttpResponse.json({
            success: true,
            data: products,
            meta: { total: products.length, page: 1, limit: 50 },
        });
    }),

    // POST /api/v1/suppliers - Create supplier
    http.post('/api/v1/suppliers', async ({ request }) => {
        const body = await request.json() as Partial<MockSupplier>;
        const newSupplier: MockSupplier = {
            id: `sup-${String(mockSuppliers.length + 1).padStart(3, '0')}`,
            code: body.code || `SUP-${String(mockSuppliers.length + 1).padStart(3, '0')}`,
            name: body.name || '',
            contactPerson: body.contactPerson || null,
            email: body.email || null,
            phone: body.phone || null,
            mobile: body.mobile || null,
            fax: body.fax || null,
            website: body.website || null,
            taxId: body.taxId || null,
            address: body.address || null,
            bankDetails: body.bankDetails || null,
            paymentTerms: body.paymentTerms || 30,
            currency: body.currency || 'USD',
            leadTime: body.leadTime || 14,
            minimumOrder: body.minimumOrder || 1,
            rating: body.rating || null,
            notes: body.notes || null,
            isActive: body.isActive ?? true,
            orderCount: 0,
            productCount: 0,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
        };
        mockSuppliers.push(newSupplier);
        return HttpResponse.json({ success: true, data: newSupplier }, { status: 201 });
    }),

    // PATCH /api/v1/suppliers/:id - Update supplier
    http.patch('/api/v1/suppliers/:id', async ({ params, request }) => {
        const index = mockSuppliers.findIndex((s) => s.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Supplier not found' },
                { status: 404 }
            );
        }
        const body = await request.json() as Partial<MockSupplier>;
        mockSuppliers[index] = {
            ...mockSuppliers[index],
            ...body,
            updatedAt: new Date().toISOString().split('T')[0],
        };
        return HttpResponse.json({ success: true, data: mockSuppliers[index] });
    }),

    // DELETE /api/v1/suppliers/:id - Delete supplier
    http.delete('/api/v1/suppliers/:id', ({ params }) => {
        const index = mockSuppliers.findIndex((s) => s.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'Supplier not found' },
                { status: 404 }
            );
        }
        mockSuppliers.splice(index, 1);
        return HttpResponse.json({ success: true, data: { message: 'Supplier deleted' } });
    }),
];

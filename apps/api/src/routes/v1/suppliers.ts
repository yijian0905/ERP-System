/**
 * Suppliers API Routes
 * CRUD operations for supplier management
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { getTenantId, hasPermission } from '../../middleware/auth.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { authRouteOptions } from '../../types/fastify-schema.js';

// Validation schemas
const createSupplierSchema = z.object({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    contactPerson: z.string().max(255).optional().nullable(),
    email: z.string().email().max(255).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    mobile: z.string().max(50).optional().nullable(),
    fax: z.string().max(50).optional().nullable(),
    website: z.string().url().max(255).optional().nullable(),
    taxId: z.string().max(50).optional().nullable(),
    address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
    }).optional().nullable(),
    bankDetails: z.object({
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        accountName: z.string().optional(),
        swiftCode: z.string().optional(),
    }).optional().nullable(),
    paymentTerms: z.number().int().min(0).max(365).optional().default(30),
    currency: z.string().length(3).optional().default('MYR'),
    leadTime: z.number().int().min(0).optional().default(7),
    minimumOrder: z.number().min(0).optional().default(0),
    rating: z.number().int().min(1).max(5).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    isActive: z.boolean().optional().default(true),
});

const updateSupplierSchema = z.object({
    code: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(255).optional(),
    contactPerson: z.string().max(255).optional().nullable(),
    email: z.string().email().max(255).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    mobile: z.string().max(50).optional().nullable(),
    fax: z.string().max(50).optional().nullable(),
    website: z.string().url().max(255).optional().nullable(),
    taxId: z.string().max(50).optional().nullable(),
    address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
    }).optional().nullable(),
    bankDetails: z.object({
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        accountName: z.string().optional(),
        swiftCode: z.string().optional(),
    }).optional().nullable(),
    paymentTerms: z.number().int().min(0).max(365).optional(),
    currency: z.string().length(3).optional(),
    leadTime: z.number().int().min(0).optional(),
    minimumOrder: z.number().min(0).optional(),
    rating: z.number().int().min(1).max(5).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    isActive: z.boolean().optional(),
});

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
});

export async function suppliersRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/v1/suppliers
     * List suppliers with pagination
     */
    fastify.get<{
        Querystring: z.infer<typeof paginationSchema>;
    }>(
        '/',
        authRouteOptions('List all suppliers', ['Suppliers']),
        async (request, reply) => {
            if (!hasPermission(request, 'suppliers:view')) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to view suppliers',
                    },
                });
            }

            const params = paginationSchema.parse(request.query);
            const tenantId = getTenantId(request);

            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const where: any = {
                    tenantId,
                    deletedAt: null,
                };

                if (params.search) {
                    where.OR = [
                        { name: { contains: params.search, mode: 'insensitive' } },
                        { code: { contains: params.search, mode: 'insensitive' } },
                        { contactPerson: { contains: params.search, mode: 'insensitive' } },
                    ];
                }

                if (params.isActive !== undefined) {
                    where.isActive = params.isActive;
                }

                const [suppliers, total] = await Promise.all([
                    prisma.supplier.findMany({
                        where,
                        include: {
                            _count: {
                                select: { orders: true, supplierProducts: true },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                        skip: (params.page - 1) * params.limit,
                        take: params.limit,
                    }),
                    prisma.supplier.count({ where }),
                ]);

                const suppliersData = suppliers.map((s) => ({
                    id: s.id,
                    code: s.code,
                    name: s.name,
                    contactPerson: s.contactPerson,
                    email: s.email,
                    phone: s.phone,
                    mobile: s.mobile,
                    fax: s.fax,
                    website: s.website,
                    taxId: s.taxId,
                    address: s.address,
                    bankDetails: s.bankDetails,
                    paymentTerms: s.paymentTerms,
                    currency: s.currency,
                    leadTime: s.leadTime,
                    minimumOrder: Number(s.minimumOrder),
                    rating: s.rating,
                    notes: s.notes,
                    isActive: s.isActive,
                    orderCount: s._count.orders,
                    productCount: s._count.supplierProducts,
                    createdAt: s.createdAt.toISOString(),
                    updatedAt: s.updatedAt.toISOString(),
                }));

                return reply.send({
                    success: true,
                    data: suppliersData,
                    meta: {
                        page: params.page,
                        limit: params.limit,
                        total,
                        totalPages: Math.ceil(total / params.limit),
                    },
                });
            } catch (error) {
                logger.error('Failed to fetch suppliers', { error, tenantId });
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Failed to fetch suppliers',
                    },
                });
            }
        }
    );

    /**
     * GET /api/v1/suppliers/:id
     * Get single supplier
     */
    fastify.get<{
        Params: { id: string };
    }>(
        '/:id',
        authRouteOptions('Get a supplier by ID', ['Suppliers']),
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            if (!hasPermission(request, 'suppliers:view')) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to view suppliers',
                    },
                });
            }

            const { id } = request.params;
            const tenantId = getTenantId(request);

            try {
                const supplier = await prisma.supplier.findFirst({
                    where: {
                        id,
                        tenantId,
                        deletedAt: null,
                    },
                    include: {
                        supplierProducts: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        sku: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                        _count: {
                            select: { orders: true },
                        },
                    },
                });

                if (!supplier) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Supplier not found',
                        },
                    });
                }

                return reply.send({
                    success: true,
                    data: {
                        id: supplier.id,
                        code: supplier.code,
                        name: supplier.name,
                        contactPerson: supplier.contactPerson,
                        email: supplier.email,
                        phone: supplier.phone,
                        mobile: supplier.mobile,
                        fax: supplier.fax,
                        website: supplier.website,
                        taxId: supplier.taxId,
                        address: supplier.address,
                        bankDetails: supplier.bankDetails,
                        paymentTerms: supplier.paymentTerms,
                        currency: supplier.currency,
                        leadTime: supplier.leadTime,
                        minimumOrder: Number(supplier.minimumOrder),
                        rating: supplier.rating,
                        notes: supplier.notes,
                        isActive: supplier.isActive,
                        orderCount: supplier._count.orders,
                        products: supplier.supplierProducts.map((sp) => ({
                            id: sp.id,
                            productId: sp.productId,
                            productSku: sp.product.sku,
                            productName: sp.product.name,
                            supplierSku: sp.supplierSku,
                            unitPrice: Number(sp.unitPrice),
                            minOrderQty: sp.minOrderQty,
                            leadTime: sp.leadTime,
                            isPreferred: sp.isPreferred,
                        })),
                        createdAt: supplier.createdAt.toISOString(),
                        updatedAt: supplier.updatedAt.toISOString(),
                    },
                });
            } catch (error) {
                logger.error('Failed to fetch supplier', { error, id, tenantId });
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Failed to fetch supplier',
                    },
                });
            }
        }
    );

    /**
     * POST /api/v1/suppliers
     * Create new supplier
     */
    fastify.post<{
        Body: z.infer<typeof createSupplierSchema>;
    }>(
        '/',
        authRouteOptions('Create a new supplier', ['Suppliers']),
        async (request, reply) => {
            if (!hasPermission(request, 'suppliers:create')) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to create suppliers',
                    },
                });
            }

            const validation = createSupplierSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validation.error.errors[0].message,
                    },
                });
            }

            const tenantId = getTenantId(request);
            const data = validation.data;

            try {
                // Check if code already exists
                const existing = await prisma.supplier.findFirst({
                    where: {
                        tenantId,
                        code: data.code,
                        deletedAt: null,
                    },
                });

                if (existing) {
                    return reply.status(409).send({
                        success: false,
                        error: {
                            code: 'CONFLICT',
                            message: 'A supplier with this code already exists',
                        },
                    });
                }

                const supplier = await prisma.supplier.create({
                    data: {
                        tenantId,
                        code: data.code,
                        name: data.name,
                        contactPerson: data.contactPerson,
                        email: data.email,
                        phone: data.phone,
                        mobile: data.mobile,
                        fax: data.fax,
                        website: data.website,
                        taxId: data.taxId,
                        address: data.address as object | undefined,
                        bankDetails: data.bankDetails as object | undefined,
                        paymentTerms: data.paymentTerms,
                        currency: data.currency,
                        leadTime: data.leadTime,
                        minimumOrder: data.minimumOrder,
                        rating: data.rating,
                        notes: data.notes,
                        isActive: data.isActive,
                    },
                });

                logger.info('Supplier created', { supplierId: supplier.id, tenantId });

                return reply.status(201).send({
                    success: true,
                    data: {
                        ...supplier,
                        minimumOrder: Number(supplier.minimumOrder),
                        createdAt: supplier.createdAt.toISOString(),
                        updatedAt: supplier.updatedAt.toISOString(),
                    },
                });
            } catch (error) {
                logger.error('Failed to create supplier', { error, tenantId });
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Failed to create supplier',
                    },
                });
            }
        }
    );

    /**
     * PATCH /api/v1/suppliers/:id
     * Update supplier
     */
    fastify.patch<{
        Params: { id: string };
        Body: z.infer<typeof updateSupplierSchema>;
    }>(
        '/:id',
        authRouteOptions('Update a supplier', ['Suppliers']),
        async (
            request: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof updateSupplierSchema> }>,
            reply: FastifyReply
        ) => {
            if (!hasPermission(request, 'suppliers:update')) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to update suppliers',
                    },
                });
            }

            const { id } = request.params;
            const tenantId = getTenantId(request);

            const validation = updateSupplierSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validation.error.errors[0].message,
                    },
                });
            }

            try {
                const existing = await prisma.supplier.findFirst({
                    where: { id, tenantId, deletedAt: null },
                });

                if (!existing) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Supplier not found',
                        },
                    });
                }

                const data = validation.data;

                // Check code uniqueness if updating
                if (data.code && data.code !== existing.code) {
                    const codeConflict = await prisma.supplier.findFirst({
                        where: {
                            tenantId,
                            code: data.code,
                            id: { not: id },
                            deletedAt: null,
                        },
                    });

                    if (codeConflict) {
                        return reply.status(409).send({
                            success: false,
                            error: {
                                code: 'CONFLICT',
                                message: 'A supplier with this code already exists',
                            },
                        });
                    }
                }

                const supplier = await prisma.supplier.update({
                    where: { id },
                    data: {
                        ...data,
                        address: data.address as object | undefined,
                        bankDetails: data.bankDetails as object | undefined,
                    },
                });

                logger.info('Supplier updated', { supplierId: id, tenantId });

                return reply.send({
                    success: true,
                    data: {
                        ...supplier,
                        minimumOrder: Number(supplier.minimumOrder),
                        createdAt: supplier.createdAt.toISOString(),
                        updatedAt: supplier.updatedAt.toISOString(),
                    },
                });
            } catch (error) {
                logger.error('Failed to update supplier', { error, id, tenantId });
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Failed to update supplier',
                    },
                });
            }
        }
    );

    /**
     * DELETE /api/v1/suppliers/:id
     * Delete supplier (soft delete)
     */
    fastify.delete<{
        Params: { id: string };
    }>(
        '/:id',
        authRouteOptions('Delete a supplier', ['Suppliers']),
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            if (!hasPermission(request, 'suppliers:delete')) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to delete suppliers',
                    },
                });
            }

            const { id } = request.params;
            const tenantId = getTenantId(request);

            try {
                const supplier = await prisma.supplier.findFirst({
                    where: { id, tenantId, deletedAt: null },
                    include: {
                        _count: { select: { orders: true } },
                    },
                });

                if (!supplier) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Supplier not found',
                        },
                    });
                }

                if (supplier._count.orders > 0) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: `Cannot delete supplier with ${supplier._count.orders} orders. Deactivate instead.`,
                        },
                    });
                }

                // Soft delete
                await prisma.supplier.update({
                    where: { id },
                    data: { deletedAt: new Date(), isActive: false },
                });

                logger.info('Supplier deleted', { supplierId: id, tenantId });

                return reply.send({
                    success: true,
                    data: { message: 'Supplier deleted successfully' },
                });
            } catch (error) {
                logger.error('Failed to delete supplier', { error, id, tenantId });
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Failed to delete supplier',
                    },
                });
            }
        }
    );
}

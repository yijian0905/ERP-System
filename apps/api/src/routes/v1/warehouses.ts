/**
 * Warehouses API Routes
 * CRUD operations for warehouse management
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { getTenantId, hasPermission } from '../../middleware/auth.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { authRouteOptions } from '../../types/fastify-schema.js';

// Validation schemas
const createWarehouseSchema = z.object({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    type: z.enum(['WAREHOUSE', 'STORE', 'VIRTUAL']).default('WAREHOUSE'),
    address: z.string().max(1000).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    email: z.string().email().max(255).optional().nullable(),
    manager: z.string().max(255).optional().nullable(),
    isDefault: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),
});

const updateWarehouseSchema = z.object({
    code: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(255).optional(),
    type: z.enum(['WAREHOUSE', 'STORE', 'VIRTUAL']).optional(),
    address: z.string().max(1000).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    email: z.string().email().max(255).optional().nullable(),
    manager: z.string().max(255).optional().nullable(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
});

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    search: z.string().optional(),
    type: z.enum(['WAREHOUSE', 'STORE', 'VIRTUAL']).optional(),
    isActive: z.coerce.boolean().optional(),
});

export async function warehousesRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/v1/warehouses
     * List warehouses with pagination
     */
    fastify.get<{
        Querystring: z.infer<typeof paginationSchema>;
    }>(
        '/',
        authRouteOptions('List all warehouses', ['Warehouses']),
        async (request, reply) => {
            if (!hasPermission(request, 'inventory:view')) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to view warehouses',
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
                    ];
                }

                if (params.type) {
                    where.type = params.type;
                }

                if (params.isActive !== undefined) {
                    where.isActive = params.isActive;
                }

                const [warehouses, total] = await Promise.all([
                    prisma.warehouse.findMany({
                        where,
                        include: {
                            _count: {
                                select: { inventoryItems: true },
                            },
                        },
                        orderBy: [
                            { isDefault: 'desc' },
                            { createdAt: 'asc' },
                        ],
                        skip: (params.page - 1) * params.limit,
                        take: params.limit,
                    }),
                    prisma.warehouse.count({ where }),
                ]);

                // Get inventory totals for each warehouse
                const warehouseStats = await Promise.all(
                    warehouses.map(async (wh) => {
                        const stats = await prisma.inventoryItem.aggregate({
                            where: {
                                warehouseId: wh.id,
                                tenantId,
                            },
                            _sum: {
                                quantity: true,
                            },
                        });

                        // Get total value
                        const items = await prisma.inventoryItem.findMany({
                            where: {
                                warehouseId: wh.id,
                                tenantId,
                            },
                            include: {
                                product: {
                                    select: { cost: true },
                                },
                            },
                        });

                        const totalValue = items.reduce((sum, item) => {
                            return sum + (item.quantity * Number(item.product.cost));
                        }, 0);

                        return {
                            warehouseId: wh.id,
                            itemCount: stats._sum.quantity || 0,
                            totalValue,
                        };
                    })
                );

                const warehousesWithStats = warehouses.map((wh) => {
                    const stats = warehouseStats.find((s) => s.warehouseId === wh.id);
                    return {
                        id: wh.id,
                        code: wh.code,
                        name: wh.name,
                        type: wh.type,
                        address: wh.address,
                        phone: wh.phone,
                        email: wh.email,
                        manager: wh.manager,
                        isDefault: wh.isDefault,
                        isActive: wh.isActive,
                        itemCount: stats?.itemCount || 0,
                        totalValue: stats?.totalValue || 0,
                        capacityUsed: 0, // Could be calculated if capacity is tracked
                        createdAt: wh.createdAt.toISOString(),
                        updatedAt: wh.updatedAt.toISOString(),
                    };
                });

                return reply.send({
                    success: true,
                    data: warehousesWithStats,
                    meta: {
                        page: params.page,
                        limit: params.limit,
                        total,
                        totalPages: Math.ceil(total / params.limit),
                    },
                });
            } catch (error) {
                logger.error('Failed to fetch warehouses', { error, tenantId });
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Failed to fetch warehouses',
                    },
                });
            }
        }
    );

    /**
     * GET /api/v1/warehouses/:id
     * Get single warehouse
     */
    fastify.get<{
        Params: { id: string };
    }>(
        '/:id',
        authRouteOptions('Get a warehouse by ID', ['Warehouses']),
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            if (!hasPermission(request, 'inventory:view')) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to view warehouses',
                    },
                });
            }

            const { id } = request.params;
            const tenantId = getTenantId(request);

            try {
                const warehouse = await prisma.warehouse.findFirst({
                    where: {
                        id,
                        tenantId,
                        deletedAt: null,
                    },
                });

                if (!warehouse) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Warehouse not found',
                        },
                    });
                }

                return reply.send({
                    success: true,
                    data: {
                        ...warehouse,
                        createdAt: warehouse.createdAt.toISOString(),
                        updatedAt: warehouse.updatedAt.toISOString(),
                    },
                });
            } catch (error) {
                logger.error('Failed to fetch warehouse', { error, id, tenantId });
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Failed to fetch warehouse',
                    },
                });
            }
        }
    );

    /**
     * POST /api/v1/warehouses
     * Create new warehouse
     */
    fastify.post<{
        Body: z.infer<typeof createWarehouseSchema>;
    }>(
        '/',
        authRouteOptions('Create a new warehouse', ['Warehouses']),
        async (request, reply) => {
            if (!hasPermission(request, 'inventory:adjust')) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to create warehouses',
                    },
                });
            }

            const validation = createWarehouseSchema.safeParse(request.body);
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
                const existing = await prisma.warehouse.findFirst({
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
                            message: 'A warehouse with this code already exists',
                        },
                    });
                }

                // If setting as default, unset other defaults
                if (data.isDefault) {
                    await prisma.warehouse.updateMany({
                        where: { tenantId, isDefault: true },
                        data: { isDefault: false },
                    });
                }

                const warehouse = await prisma.warehouse.create({
                    data: {
                        tenantId,
                        ...data,
                    },
                });

                logger.info('Warehouse created', { warehouseId: warehouse.id, tenantId });

                return reply.status(201).send({
                    success: true,
                    data: {
                        ...warehouse,
                        createdAt: warehouse.createdAt.toISOString(),
                        updatedAt: warehouse.updatedAt.toISOString(),
                    },
                });
            } catch (error) {
                logger.error('Failed to create warehouse', { error, tenantId });
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Failed to create warehouse',
                    },
                });
            }
        }
    );

    /**
     * PATCH /api/v1/warehouses/:id
     * Update warehouse
     */
    fastify.patch<{
        Params: { id: string };
        Body: z.infer<typeof updateWarehouseSchema>;
    }>(
        '/:id',
        authRouteOptions('Update a warehouse', ['Warehouses']),
        async (
            request: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof updateWarehouseSchema> }>,
            reply: FastifyReply
        ) => {
            if (!hasPermission(request, 'inventory:adjust')) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to update warehouses',
                    },
                });
            }

            const { id } = request.params;
            const tenantId = getTenantId(request);

            const validation = updateWarehouseSchema.safeParse(request.body);
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
                const existing = await prisma.warehouse.findFirst({
                    where: { id, tenantId, deletedAt: null },
                });

                if (!existing) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Warehouse not found',
                        },
                    });
                }

                const data = validation.data;

                // Check code uniqueness if updating
                if (data.code && data.code !== existing.code) {
                    const codeConflict = await prisma.warehouse.findFirst({
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
                                message: 'A warehouse with this code already exists',
                            },
                        });
                    }
                }

                // If setting as default, unset other defaults
                if (data.isDefault === true) {
                    await prisma.warehouse.updateMany({
                        where: { tenantId, isDefault: true, id: { not: id } },
                        data: { isDefault: false },
                    });
                }

                const warehouse = await prisma.warehouse.update({
                    where: { id },
                    data,
                });

                logger.info('Warehouse updated', { warehouseId: id, tenantId });

                return reply.send({
                    success: true,
                    data: {
                        ...warehouse,
                        createdAt: warehouse.createdAt.toISOString(),
                        updatedAt: warehouse.updatedAt.toISOString(),
                    },
                });
            } catch (error) {
                logger.error('Failed to update warehouse', { error, id, tenantId });
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Failed to update warehouse',
                    },
                });
            }
        }
    );

    /**
     * DELETE /api/v1/warehouses/:id
     * Delete warehouse (soft delete)
     */
    fastify.delete<{
        Params: { id: string };
    }>(
        '/:id',
        authRouteOptions('Delete a warehouse', ['Warehouses']),
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            if (!hasPermission(request, 'inventory:adjust')) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to delete warehouses',
                    },
                });
            }

            const { id } = request.params;
            const tenantId = getTenantId(request);

            try {
                const warehouse = await prisma.warehouse.findFirst({
                    where: { id, tenantId, deletedAt: null },
                    include: {
                        _count: { select: { inventoryItems: true } },
                    },
                });

                if (!warehouse) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Warehouse not found',
                        },
                    });
                }

                if (warehouse.isDefault) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Cannot delete the default warehouse',
                        },
                    });
                }

                if (warehouse._count.inventoryItems > 0) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: `Cannot delete warehouse with ${warehouse._count.inventoryItems} inventory items. Transfer inventory first.`,
                        },
                    });
                }

                // Soft delete
                await prisma.warehouse.update({
                    where: { id },
                    data: { deletedAt: new Date(), isActive: false },
                });

                logger.info('Warehouse deleted', { warehouseId: id, tenantId });

                return reply.send({
                    success: true,
                    data: { message: 'Warehouse deleted successfully' },
                });
            } catch (error) {
                logger.error('Failed to delete warehouse', { error, id, tenantId });
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Failed to delete warehouse',
                    },
                });
            }
        }
    );

    /**
     * POST /api/v1/warehouses/:id/set-default
     * Set warehouse as default
     */
    fastify.post<{
        Params: { id: string };
    }>(
        '/:id/set-default',
        authRouteOptions('Set a warehouse as the default', ['Warehouses']),
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            if (!hasPermission(request, 'inventory:adjust')) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to modify warehouses',
                    },
                });
            }

            const { id } = request.params;
            const tenantId = getTenantId(request);

            try {
                const warehouse = await prisma.warehouse.findFirst({
                    where: { id, tenantId, deletedAt: null },
                });

                if (!warehouse) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Warehouse not found',
                        },
                    });
                }

                // Unset all other defaults and set this one
                await prisma.$transaction([
                    prisma.warehouse.updateMany({
                        where: { tenantId, isDefault: true },
                        data: { isDefault: false },
                    }),
                    prisma.warehouse.update({
                        where: { id },
                        data: { isDefault: true },
                    }),
                ]);

                logger.info('Warehouse set as default', { warehouseId: id, tenantId });

                return reply.send({
                    success: true,
                    data: { message: 'Warehouse set as default' },
                });
            } catch (error) {
                logger.error('Failed to set default warehouse', { error, id, tenantId });
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Failed to set default warehouse',
                    },
                });
            }
        }
    );

    /**
     * GET /api/v1/warehouses/:id/inventory
     * Get inventory items for a specific warehouse
     */
    fastify.get<{
        Params: { id: string };
        Querystring: { search?: string; page?: number; limit?: number };
    }>(
        '/:id/inventory',
        authRouteOptions('Get inventory for a warehouse', ['Warehouses']),
        async (request: FastifyRequest<{ Params: { id: string }; Querystring: { search?: string; page?: number; limit?: number } }>, reply: FastifyReply) => {
            if (!hasPermission(request, 'inventory:view')) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to view inventory',
                    },
                });
            }

            const { id } = request.params;
            const { search, page = 1, limit = 50 } = request.query;
            const tenantId = getTenantId(request);

            try {
                const warehouse = await prisma.warehouse.findFirst({
                    where: { id, tenantId, deletedAt: null },
                });

                if (!warehouse) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Warehouse not found',
                        },
                    });
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const where: any = {
                    warehouseId: id,
                    tenantId,
                };

                if (search) {
                    where.product = {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { sku: { contains: search, mode: 'insensitive' } },
                        ],
                    };
                }

                const [items, total] = await Promise.all([
                    prisma.inventoryItem.findMany({
                        where,
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    sku: true,
                                    name: true,
                                    unit: true,
                                    cost: true,
                                    category: {
                                        select: { name: true },
                                    },
                                },
                            },
                        },
                        skip: (page - 1) * limit,
                        take: limit,
                    }),
                    prisma.inventoryItem.count({ where }),
                ]);

                const inventory = items.map((item) => ({
                    id: item.id,
                    productId: item.productId,
                    productName: item.product.name,
                    sku: item.product.sku,
                    category: item.product.category?.name || 'Uncategorized',
                    quantity: item.quantity,
                    reservedQty: item.reservedQty,
                    availableQty: item.availableQty,
                    unitCost: Number(item.product.cost),
                    totalValue: item.quantity * Number(item.product.cost),
                    reorderPoint: 0, // From product if needed
                    location: item.location,
                }));

                return reply.send({
                    success: true,
                    data: inventory,
                    meta: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                });
            } catch (error) {
                logger.error('Failed to fetch warehouse inventory', { error, id, tenantId });
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Failed to fetch warehouse inventory',
                    },
                });
            }
        }
    );
}

/**
 * Admin Subscriber Management Routes
 * Platform admin endpoints for managing subscription tenants
 * These routes are for the ERP product company's internal admin portal
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { getJwtConfig } from '../lib/jwt.js';

// ============================================================================
// Validation Schemas
// ============================================================================

const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
});

const subscriberListSchema = paginationSchema.extend({
    search: z.string().optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED', 'all']).optional(),
    tier: z.enum(['L1', 'L2', 'L3', 'all']).optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED']),
});

// ============================================================================
// Admin Authentication Middleware
// ============================================================================

async function adminAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Admin authentication required',
            },
        });
    }

    try {
        const token = authHeader.slice(7);
        const config = getJwtConfig();

        // Use jwt.verify directly to handle platform_admin token type
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, config.accessSecret, {
            algorithms: ['HS256'],
            issuer: config.issuer,
            audience: config.audience,
        }) as { sub: string; type: string; role?: string; email?: string };

        // Verify it's a platform admin token
        if (!decoded.sub || decoded.type !== 'platform_admin') {
            return reply.status(401).send({
                success: false,
                error: {
                    code: 'INVALID_ADMIN',
                    message: 'Invalid admin credentials - requires platform admin token',
                },
            });
        }

        // Store decoded payload for route handlers
        (request as FastifyRequest & { platformAdmin: typeof decoded }).platformAdmin = decoded;
    } catch {
        return reply.status(401).send({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired token',
            },
        });
    }
}

// ============================================================================
// Routes
// ============================================================================

export async function adminSubscribersRoutes(fastify: FastifyInstance) {
    // Apply admin auth middleware to all routes
    fastify.addHook('onRequest', adminAuthMiddleware);

    /**
     * GET /api/v1/admin/subscribers
     * List all subscription tenants with pagination and filtering
     */
    fastify.get<{
        Querystring: z.infer<typeof subscriberListSchema>;
    }>(
        '/',
        {
            schema: {
                description: 'List all subscription tenants (subscribers)',
                tags: ['Admin - Subscribers'],
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: 'object',
                    properties: {
                        page: { type: 'number', default: 1 },
                        pageSize: { type: 'number', default: 20 },
                        search: { type: 'string' },
                        status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED', 'all'] },
                        tier: { type: 'string', enum: ['L1', 'L2', 'L3', 'all'] },
                    },
                },
            },
        },
        async (request, reply) => {
            const validation = subscriberListSchema.safeParse(request.query);
            if (!validation.success) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validation.error.errors[0].message,
                    },
                });
            }

            const { page, pageSize, search, status, tier } = validation.data;

            try {
                // Build where clause
                const where: Record<string, unknown> = {
                    deletedAt: null,
                };

                if (search) {
                    where.OR = [
                        { name: { contains: search, mode: 'insensitive' } },
                        { slug: { contains: search, mode: 'insensitive' } },
                    ];
                }

                if (status && status !== 'all') {
                    where.status = status;
                }

                if (tier && tier !== 'all') {
                    where.tier = tier;
                }

                // Get total count
                const total = await prisma.tenant.count({ where });

                // Get subscribers with license and user count
                const subscribers = await prisma.tenant.findMany({
                    where,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        licenses: {
                            where: { isActive: true },
                            orderBy: { expiresAt: 'desc' },
                            take: 1,
                        },
                        _count: {
                            select: { users: true },
                        },
                    },
                });

                // Transform response
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const items = subscribers.map((tenant: any) => ({
                    id: tenant.id,
                    name: tenant.name,
                    slug: tenant.slug,
                    tier: tenant.tier,
                    status: tenant.status,
                    createdAt: tenant.createdAt.toISOString(),
                    updatedAt: tenant.updatedAt.toISOString(),
                    userCount: tenant._count.users,
                    license: tenant.licenses[0] ? {
                        id: tenant.licenses[0].id,
                        licenseKey: tenant.licenses[0].licenseKey,
                        tier: tenant.licenses[0].tier,
                        maxUsers: tenant.licenses[0].maxUsers,
                        isActive: tenant.licenses[0].isActive,
                        startsAt: tenant.licenses[0].startsAt.toISOString(),
                        expiresAt: tenant.licenses[0].expiresAt.toISOString(),
                    } : null,
                }));

                return reply.send({
                    success: true,
                    data: {
                        items,
                        total,
                        page,
                        pageSize,
                        totalPages: Math.ceil(total / pageSize),
                    },
                });
            } catch (error) {
                logger.error('Failed to list subscribers:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'LIST_ERROR',
                        message: 'Failed to retrieve subscribers',
                    },
                });
            }
        }
    );

    /**
     * GET /api/v1/admin/subscribers/:id
     * Get subscriber details
     */
    fastify.get<{
        Params: { id: string };
    }>(
        '/:id',
        {
            schema: {
                description: 'Get subscriber details',
                tags: ['Admin - Subscribers'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
            },
        },
        async (request, reply) => {
            const { id } = request.params;

            try {
                const tenant = await prisma.tenant.findFirst({
                    where: {
                        id,
                        deletedAt: null,
                    },
                    include: {
                        licenses: {
                            orderBy: { expiresAt: 'desc' },
                        },
                        _count: {
                            select: { users: true },
                        },
                    },
                });

                if (!tenant) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Subscriber not found',
                        },
                    });
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const activeLicense = tenant.licenses.find((l: any) => l.isActive);

                return reply.send({
                    success: true,
                    data: {
                        id: tenant.id,
                        name: tenant.name,
                        slug: tenant.slug,
                        domain: tenant.domain,
                        tier: tenant.tier,
                        status: tenant.status,
                        settings: tenant.settings,
                        createdAt: tenant.createdAt.toISOString(),
                        updatedAt: tenant.updatedAt.toISOString(),
                        userCount: tenant._count.users,
                        license: activeLicense ? {
                            id: activeLicense.id,
                            licenseKey: activeLicense.licenseKey,
                            tier: activeLicense.tier,
                            maxUsers: activeLicense.maxUsers,
                            isActive: activeLicense.isActive,
                            startsAt: activeLicense.startsAt.toISOString(),
                            expiresAt: activeLicense.expiresAt.toISOString(),
                            features: activeLicense.features,
                        } : null,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        allLicenses: tenant.licenses.map((l: any) => ({
                            id: l.id,
                            licenseKey: l.licenseKey,
                            tier: l.tier,
                            maxUsers: l.maxUsers,
                            isActive: l.isActive,
                            startsAt: l.startsAt.toISOString(),
                            expiresAt: l.expiresAt.toISOString(),
                        })),
                    },
                });
            } catch (error) {
                logger.error('Failed to get subscriber:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'GET_ERROR',
                        message: 'Failed to retrieve subscriber',
                    },
                });
            }
        }
    );

    /**
     * GET /api/v1/admin/subscribers/:id/users
     * Get all users for a subscriber
     */
    fastify.get<{
        Params: { id: string };
        Querystring: z.infer<typeof paginationSchema>;
    }>(
        '/:id/users',
        {
            schema: {
                description: 'Get users for a subscriber',
                tags: ['Admin - Subscribers'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
                querystring: {
                    type: 'object',
                    properties: {
                        page: { type: 'number', default: 1 },
                        pageSize: { type: 'number', default: 20 },
                    },
                },
            },
        },
        async (request, reply) => {
            const { id } = request.params;
            const validation = paginationSchema.safeParse(request.query);

            if (!validation.success) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validation.error.errors[0].message,
                    },
                });
            }

            const { page, pageSize } = validation.data;

            try {
                // Check tenant exists
                const tenant = await prisma.tenant.findFirst({
                    where: { id, deletedAt: null },
                });

                if (!tenant) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Subscriber not found',
                        },
                    });
                }

                // Get total count
                const total = await prisma.user.count({
                    where: { tenantId: id, deletedAt: null },
                });

                // Get users
                const users = await prisma.user.findMany({
                    where: { tenantId: id, deletedAt: null },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        isActive: true,
                        lastLoginAt: true,
                        createdAt: true,
                    },
                });

                return reply.send({
                    success: true,
                    data: {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        items: users.map((u: any) => ({
                            id: u.id,
                            email: u.email,
                            name: u.name,
                            role: u.role,
                            isActive: u.isActive,
                            lastLoginAt: u.lastLoginAt?.toISOString() || null,
                            createdAt: u.createdAt.toISOString(),
                        })),
                        total,
                        page,
                        pageSize,
                        totalPages: Math.ceil(total / pageSize),
                    },
                });
            } catch (error) {
                logger.error('Failed to get subscriber users:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'LIST_ERROR',
                        message: 'Failed to retrieve users',
                    },
                });
            }
        }
    );

    /**
     * PATCH /api/v1/admin/subscribers/:id/status
     * Update subscriber status
     */
    fastify.patch<{
        Params: { id: string };
        Body: z.infer<typeof updateStatusSchema>;
    }>(
        '/:id/status',
        {
            schema: {
                description: 'Update subscriber status',
                tags: ['Admin - Subscribers'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
                body: {
                    type: 'object',
                    required: ['status'],
                    properties: {
                        status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED'] },
                    },
                },
            },
        },
        async (request, reply) => {
            const { id } = request.params;
            const validation = updateStatusSchema.safeParse(request.body);

            if (!validation.success) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validation.error.errors[0].message,
                    },
                });
            }

            const { status } = validation.data;

            try {
                const tenant = await prisma.tenant.findFirst({
                    where: { id, deletedAt: null },
                });

                if (!tenant) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Subscriber not found',
                        },
                    });
                }

                const updated = await prisma.tenant.update({
                    where: { id },
                    data: { status },
                });

                // Log the action
                logger.info(`Subscriber ${id} status updated to ${status} by admin ${request.user?.sub}`);

                return reply.send({
                    success: true,
                    data: {
                        id: updated.id,
                        name: updated.name,
                        status: updated.status,
                        updatedAt: updated.updatedAt.toISOString(),
                    },
                });
            } catch (error) {
                logger.error('Failed to update subscriber status:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'UPDATE_ERROR',
                        message: 'Failed to update subscriber status',
                    },
                });
            }
        }
    );

    /**
     * DELETE /api/v1/admin/subscribers/:id
     * Soft delete a subscriber (mark as deleted)
     */
    fastify.delete<{
        Params: { id: string };
    }>(
        '/:id',
        {
            schema: {
                description: 'Remove (soft delete) a subscriber',
                tags: ['Admin - Subscribers'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
            },
        },
        async (request, reply) => {
            const { id } = request.params;

            try {
                const tenant = await prisma.tenant.findFirst({
                    where: { id, deletedAt: null },
                });

                if (!tenant) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Subscriber not found',
                        },
                    });
                }

                // Soft delete - set deletedAt timestamp
                await prisma.$transaction([
                    // Mark tenant as deleted
                    prisma.tenant.update({
                        where: { id },
                        data: {
                            deletedAt: new Date(),
                            status: 'EXPIRED',
                        },
                    }),
                    // Deactivate all licenses
                    prisma.license.updateMany({
                        where: { tenantId: id },
                        data: { isActive: false },
                    }),
                    // Deactivate all users
                    prisma.user.updateMany({
                        where: { tenantId: id },
                        data: {
                            isActive: false,
                            deletedAt: new Date(),
                        },
                    }),
                ]);

                // Log the action
                logger.warn(`Subscriber ${id} (${tenant.name}) removed by admin ${request.user?.sub}`);

                return reply.send({
                    success: true,
                    data: {
                        message: 'Subscriber removed successfully',
                        id,
                        name: tenant.name,
                    },
                });
            } catch (error) {
                logger.error('Failed to remove subscriber:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'DELETE_ERROR',
                        message: 'Failed to remove subscriber',
                    },
                });
            }
        }
    );

    /**
     * GET /api/v1/admin/dashboard/stats
     * Get platform dashboard statistics
     */
    fastify.get(
        '/dashboard/stats',
        {
            schema: {
                description: 'Get platform dashboard statistics',
                tags: ['Admin - Dashboard'],
                security: [{ bearerAuth: [] }],
            },
        },
        async (_request, reply) => {
            try {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                // Run all queries in parallel
                const [
                    totalTenants,
                    activeTenants,
                    totalUsers,
                    activeUsers,
                    totalLicenses,
                    activeLicenses,
                    newTenantsThisMonth,
                    tierCounts,
                    statusCounts,
                ] = await Promise.all([
                    prisma.tenant.count({ where: { deletedAt: null } }),
                    prisma.tenant.count({ where: { status: 'ACTIVE', deletedAt: null } }),
                    prisma.user.count({ where: { deletedAt: null } }),
                    prisma.user.count({ where: { isActive: true, deletedAt: null } }),
                    prisma.license.count(),
                    prisma.license.count({ where: { isActive: true, expiresAt: { gt: now } } }),
                    prisma.tenant.count({
                        where: {
                            createdAt: { gte: startOfMonth },
                            deletedAt: null,
                        },
                    }),
                    prisma.tenant.groupBy({
                        by: ['tier'],
                        where: { deletedAt: null },
                        _count: true,
                    }),
                    prisma.tenant.groupBy({
                        by: ['status'],
                        where: { deletedAt: null },
                        _count: true,
                    }),
                ]);

                // Transform tier counts
                const tierDistribution: Record<string, number> = {
                    L1: 0,
                    L2: 0,
                    L3: 0,
                };
                for (const item of tierCounts) {
                    tierDistribution[item.tier] = item._count;
                }

                // Transform status counts
                const statusDistribution: Record<string, number> = {
                    ACTIVE: 0,
                    SUSPENDED: 0,
                    TRIAL: 0,
                    EXPIRED: 0,
                };
                for (const item of statusCounts) {
                    statusDistribution[item.status] = item._count;
                }

                return reply.send({
                    success: true,
                    data: {
                        totalTenants,
                        activeTenants,
                        totalUsers,
                        activeUsers,
                        totalLicenses,
                        activeLicenses,
                        newTenantsThisMonth,
                        tierDistribution,
                        statusDistribution,
                        // Calculate revenue estimate (placeholder - would need billing data)
                        revenueThisMonth: 0,
                    },
                });
            } catch (error) {
                logger.error('Failed to get dashboard stats:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'STATS_ERROR',
                        message: 'Failed to retrieve dashboard statistics',
                    },
                });
            }
        }
    );
}

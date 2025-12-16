/**
 * Tenant Branding routes
 * @see spec.md §4 Branding (All Tiers)
 *
 * All subscription tiers MAY configure a tenant logo.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type {
    TenantBranding,
    BrandingLogoUpdateRequest,
    BrandingUpdateResponse,
    ApiResponse,
} from '@erp/shared-types';

import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

/**
 * Get branding for a tenant from database
 * Falls back to defaults if not configured
 */
async function getTenantBranding(tenantId: string): Promise<TenantBranding> {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
            name: true,
            // These fields may need to be added to the Tenant model
            // For now, return defaults
        },
    });

    // TODO: Add branding fields to Tenant model in database
    // For now, return defaults with company name
    return {
        companyName: tenant?.name || 'Unknown',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        logoUrl: undefined,
        faviconUrl: undefined,
    };
}

export async function brandingRoutes(fastify: FastifyInstance) {
    /**
     * GET /tenant/branding
     * Get current tenant branding configuration
     */
    fastify.get(
        '/',
        {
            schema: {
                description: 'Get tenant branding configuration',
                tags: ['Branding'],
                security: [{ bearerAuth: [] }],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: {
                                type: 'object',
                                properties: {
                                    logoUrl: { type: 'string' },
                                    primaryColor: { type: 'string' },
                                    secondaryColor: { type: 'string' },
                                    companyName: { type: 'string' },
                                    faviconUrl: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user;

            if (!user?.tid) {
                return reply.status(401).send({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
            }

            const branding = await getTenantBranding(user.tid);

            return reply.send({
                success: true,
                data: branding,
            });
        }
    );

    /**
     * POST /tenant/branding/logo
     * Upload or update tenant logo
     * Requires Tenant Admin permission by default
     */
    fastify.post<{
        Body: BrandingLogoUpdateRequest;
        Reply: ApiResponse<BrandingUpdateResponse>;
    }>(
        '/logo',
        {
            schema: {
                description: 'Upload or update tenant logo',
                tags: ['Branding'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    required: ['logo'],
                    properties: {
                        logo: { type: 'string', description: 'Base64 encoded image or URL' },
                        format: { type: 'string', enum: ['png', 'jpg', 'svg'] },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: BrandingLogoUpdateRequest }>, reply: FastifyReply) => {
            const user = request.user;

            if (!user?.tid) {
                return reply.status(401).send({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
            }

            // Check if user has admin role (Tenant Admin permission)
            if (user.role !== 'ADMIN') {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Only tenant administrators can update branding',
                    },
                });
            }

            const { logo: _logo, format } = request.body;

            // TODO: Implement actual logo storage
            // 1. Validate image format and size
            // 2. Store in object storage (S3, GCS, etc.)
            // 3. Update tenant branding in database
            // For now, log the attempt and return success

            logger.info(`Logo update requested for tenant: ${user.tid}, format: ${format}`);

            // Mock response - in production, return the actual stored URL
            const branding = await getTenantBranding(user.tid);

            return reply.send({
                success: true,
                data: {
                    success: true,
                    branding: {
                        ...branding,
                        // logoUrl would be set to the actual stored URL
                    },
                },
            });
        }
    );

    /**
     * DELETE /tenant/branding/logo
     * Remove tenant logo
     */
    fastify.delete(
        '/logo',
        {
            schema: {
                description: 'Remove tenant logo',
                tags: ['Branding'],
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user;

            if (!user?.tid) {
                return reply.status(401).send({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
            }

            // Check if user has admin role
            if (user.role !== 'ADMIN') {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Only tenant administrators can update branding',
                    },
                });
            }

            // TODO: Implement actual logo removal
            // 1. Delete from object storage
            // 2. Clear logo URL in database

            logger.info(`Logo removal requested for tenant: ${user.tid}`);

            const branding = await getTenantBranding(user.tid);

            return reply.send({
                success: true,
                data: {
                    success: true,
                    branding: {
                        ...branding,
                        logoUrl: undefined,
                    },
                },
            });
        }
    );
}

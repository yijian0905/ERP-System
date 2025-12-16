/**
 * License routes
 * @see spec.md §6 Desktop Application Lifecycle
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type {
    LicenseActivationRequest,
    LicenseActivationResponse,
    LicenseContext,
    ApiResponse,
} from '@erp/shared-types';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { getTenantCapabilities } from '../middleware/capability.js';

// Validation schemas
const activationSchema = z.object({
    licenseKey: z.string().min(1, 'License key is required'),
    serverUrl: z.string().url().optional(),
});

/**
 * Get auth policy for a tenant
 * TODO: Fetch from database once auth policy storage is implemented
 */
function getTenantAuthPolicy(tier: string) {
    // Default auth policies based on tier
    // In production, this should be stored per-tenant in the database
    const policies = {
        L1: {
            primary: 'password' as const,
            allowPasswordFallback: true,
            mfa: 'off' as const,
            identifier: 'email' as const,
        },
        L2: {
            primary: 'password' as const,
            allowPasswordFallback: true,
            mfa: 'optional' as const,
            identifier: 'email' as const,
        },
        L3: {
            primary: 'password' as const,
            allowPasswordFallback: true,
            mfa: 'optional' as const,
            identifier: 'email' as const,
        },
    };

    return policies[tier as keyof typeof policies] || policies.L1;
}

/**
 * Get branding for a tenant
 * TODO: Fetch from database once branding storage is implemented
 */
function getTenantBranding(tenant: { name: string; id: string }) {
    // Default branding
    // In production, this should be stored per-tenant in the database
    return {
        companyName: tenant.name,
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        logoUrl: undefined,
        faviconUrl: undefined,
    };
}

export async function licenseRoutes(fastify: FastifyInstance) {
    /**
     * POST /license/activate
     * Activate a license key and return License Context
     * @see spec.md §6.A First-run Initialization
     */
    fastify.post<{
        Body: LicenseActivationRequest;
        Reply: ApiResponse<LicenseActivationResponse>;
    }>(
        '/activate',
        {
            schema: {
                description: 'Activate a license key and receive License Context',
                tags: ['License'],
                body: {
                    type: 'object',
                    required: ['licenseKey'],
                    properties: {
                        licenseKey: { type: 'string' },
                        serverUrl: { type: 'string', format: 'uri' },
                    },
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean' },
                                    licenseContext: {
                                        type: 'object',
                                        properties: {
                                            tenantId: { type: 'string' },
                                            capabilities: { type: 'array' },
                                            authPolicy: { type: 'object' },
                                            branding: { type: 'object' },
                                            tier: { type: 'string' },
                                            expiresAt: { type: 'string' },
                                            activatedAt: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: LicenseActivationRequest }>, reply: FastifyReply) => {
            const validation = activationSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validation.error.errors[0].message,
                    },
                });
            }

            const { licenseKey } = validation.data;

            // Find license by key
            const license = await prisma.license.findUnique({
                where: { licenseKey },
                include: {
                    tenant: true,
                },
            });

            if (!license) {
                logger.warn(`License activation failed: invalid key`);
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'INVALID_LICENSE_KEY',
                        message: 'The license key is invalid or does not exist',
                    },
                });
            }

            // Check if license is active
            if (!license.isActive) {
                logger.warn(`License activation failed: license inactive for tenant ${license.tenantId}`);
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'LICENSE_INACTIVE',
                        message: 'This license has been deactivated',
                    },
                });
            }

            // Check if license has expired
            if (license.expiresAt < new Date()) {
                logger.warn(`License activation failed: license expired for tenant ${license.tenantId}`);
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'LICENSE_EXPIRED',
                        message: 'This license has expired',
                    },
                });
            }

            // Check if license start date has passed
            if (license.startsAt > new Date()) {
                logger.warn(`License activation failed: license not started for tenant ${license.tenantId}`);
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'LICENSE_NOT_STARTED',
                        message: 'This license is not yet active',
                    },
                });
            }

            // Get capabilities for the tenant
            const capabilities = await getTenantCapabilities(license.tenantId);

            // Build License Context
            const licenseContext: LicenseContext = {
                tenantId: license.tenantId,
                capabilities,
                authPolicy: getTenantAuthPolicy(license.tier),
                branding: getTenantBranding(license.tenant),
                tier: license.tier,
                expiresAt: license.expiresAt.toISOString(),
                activatedAt: new Date().toISOString(),
            };

            logger.info(`License activated for tenant: ${license.tenantId}`);

            return reply.send({
                success: true,
                data: {
                    success: true,
                    licenseContext,
                },
            });
        }
    );

    /**
     * GET /license/validate
     * Validate current license status
     */
    fastify.get(
        '/validate',
        {
            schema: {
                description: 'Validate current license status',
                tags: ['License'],
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

            const license = await prisma.license.findFirst({
                where: {
                    tenantId: user.tid,
                    isActive: true,
                },
                include: {
                    tenant: true,
                },
            });

            if (!license) {
                return reply.status(404).send({
                    success: false,
                    error: {
                        code: 'NO_LICENSE',
                        message: 'No active license found',
                    },
                });
            }

            const capabilities = await getTenantCapabilities(user.tid);
            const daysRemaining = Math.ceil(
                (license.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            return reply.send({
                success: true,
                data: {
                    valid: license.isActive && license.expiresAt > new Date(),
                    tier: license.tier,
                    capabilities,
                    expiresAt: license.expiresAt.toISOString(),
                    daysRemaining,
                    maxUsers: license.maxUsers,
                },
            });
        }
    );
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@erp/database';
import { logger } from '../../lib/logger.js';

interface CompanyInfo {
    name: string;
    legalName?: string;
    taxId?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    logo?: string | null;
}

export async function companyRoutes(fastify: FastifyInstance) {
    /**
     * GET /company
     * Get company information for current tenant
     */
    fastify.get(
        '/',
        {
            schema: {
                description: 'Get company information',
                tags: ['Company'],
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
                        message: 'Not authenticated',
                    },
                });
            }

            const tenant = await prisma.tenant.findUnique({
                where: { id: user.tid },
                select: {
                    id: true,
                    name: true,
                    settings: true,
                },
            });

            if (!tenant) {
                return reply.status(404).send({
                    success: false,
                    error: {
                        code: 'TENANT_NOT_FOUND',
                        message: 'Tenant not found',
                    },
                });
            }

            // Parse settings to get company info
            const settings = (tenant.settings as Record<string, unknown>) || {};
            const companyInfo: CompanyInfo = {
                name: tenant.name,
                legalName: settings.legalName as string | undefined,
                taxId: settings.taxId as string | undefined,
                email: settings.email as string | undefined,
                phone: settings.phone as string | undefined,
                website: settings.website as string | undefined,
                address: settings.address as CompanyInfo['address'],
                logo: settings.logo as string | null | undefined,
            };

            return reply.send({
                success: true,
                data: companyInfo,
            });
        }
    );

    /**
     * PATCH /company
     * Update company information for current tenant
     */
    fastify.patch<{
        Body: Partial<CompanyInfo>;
    }>(
        '/',
        {
            schema: {
                description: 'Update company information',
                tags: ['Company'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', minLength: 1, maxLength: 255 },
                        legalName: { type: 'string', maxLength: 255 },
                        taxId: { type: 'string', maxLength: 50 },
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string', maxLength: 50 },
                        website: { type: 'string', maxLength: 255 },
                        address: {
                            type: 'object',
                            properties: {
                                street: { type: 'string' },
                                city: { type: 'string' },
                                state: { type: 'string' },
                                zip: { type: 'string' },
                                country: { type: 'string' },
                            },
                        },
                        logo: { type: ['string', 'null'] },
                    },
                },
            },
        },
        async (request, reply) => {
            const user = request.user;

            if (!user?.tid) {
                return reply.status(401).send({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Not authenticated',
                    },
                });
            }

            const { name, legalName, taxId, email, phone, website, address, logo } = request.body;

            // Get current tenant
            const tenant = await prisma.tenant.findUnique({
                where: { id: user.tid },
                select: { settings: true, name: true },
            });

            if (!tenant) {
                return reply.status(404).send({
                    success: false,
                    error: {
                        code: 'TENANT_NOT_FOUND',
                        message: 'Tenant not found',
                    },
                });
            }

            // Merge new settings with existing
            const currentSettings = (tenant.settings as Record<string, unknown>) || {};
            const newSettings = {
                ...currentSettings,
                ...(legalName !== undefined && { legalName }),
                ...(taxId !== undefined && { taxId }),
                ...(email !== undefined && { email }),
                ...(phone !== undefined && { phone }),
                ...(website !== undefined && { website }),
                ...(address !== undefined && { address }),
                ...(logo !== undefined && { logo }),
            };

            // Update tenant
            const updatedTenant = await prisma.tenant.update({
                where: { id: user.tid },
                data: {
                    ...(name && { name }),
                    settings: newSettings,
                },
                select: {
                    id: true,
                    name: true,
                    settings: true,
                },
            });

            logger.info(`Company info updated for tenant: ${user.tid}`);

            // Return updated company info
            const settings = (updatedTenant.settings as Record<string, unknown>) || {};
            const companyInfo: CompanyInfo = {
                name: updatedTenant.name,
                legalName: settings.legalName as string | undefined,
                taxId: settings.taxId as string | undefined,
                email: settings.email as string | undefined,
                phone: settings.phone as string | undefined,
                website: settings.website as string | undefined,
                address: settings.address as CompanyInfo['address'],
                logo: settings.logo as string | null | undefined,
            };

            return reply.send({
                success: true,
                data: companyInfo,
            });
        }
    );
}


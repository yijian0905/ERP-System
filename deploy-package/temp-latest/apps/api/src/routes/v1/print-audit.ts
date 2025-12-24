/**
 * Print Audit routes
 * @see spec.md §283-291 Print Audit (Enterprise)
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ApiResponse } from '@erp/shared-types';
import { z } from 'zod';

import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { requireCapability } from '../../middleware/capability.js';

// Validation schema for print audit
const printAuditSchema = z.object({
    documentType: z.enum(['invoice', 'delivery_note', 'receipt', 'quotation', 'purchase_order']),
    documentId: z.string().uuid(),
    documentNumber: z.string().optional(),
    printerName: z.string().optional(),
    paperSize: z.string().optional(),
    copies: z.number().int().positive().default(1),
    printMode: z.enum(['silent', 'pdf', 'preview']).optional(),
    success: z.boolean().default(true),
    errorMessage: z.string().optional(),
});

type PrintAuditRequest = z.infer<typeof printAuditSchema>;

export async function printAuditRoutes(fastify: FastifyInstance) {
    /**
     * POST /audit/print
     * Log a print event
     * Requires ai_chat capability (Enterprise tier) or can be made available to all tiers
     */
    fastify.post<{
        Body: PrintAuditRequest;
        Reply: ApiResponse<{ id: string; logged: boolean }>;
    }>(
        '/print',
        {
            schema: {
                description: 'Log a print event for audit',
                tags: ['Audit'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    required: ['documentType', 'documentId'],
                    properties: {
                        documentType: {
                            type: 'string',
                            enum: ['invoice', 'delivery_note', 'receipt', 'quotation', 'purchase_order']
                        },
                        documentId: { type: 'string', format: 'uuid' },
                        documentNumber: { type: 'string' },
                        printerName: { type: 'string' },
                        paperSize: { type: 'string' },
                        copies: { type: 'integer', minimum: 1 },
                        printMode: { type: 'string', enum: ['silent', 'pdf', 'preview'] },
                        success: { type: 'boolean' },
                        errorMessage: { type: 'string' },
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
                                    id: { type: 'string' },
                                    logged: { type: 'boolean' },
                                },
                            },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: PrintAuditRequest }>, reply: FastifyReply) => {
            const user = request.user;

            if (!user?.tid || !user?.sub) {
                return reply.status(401).send({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
            }

            const validation = printAuditSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validation.error.errors[0].message,
                    },
                });
            }

            const {
                documentType,
                documentId,
                documentNumber,
                printerName,
                paperSize,
                copies,
                printMode,
                success,
                errorMessage,
            } = validation.data;

            try {
                // Create print audit record
                const printAudit = await prisma.printAudit.create({
                    data: {
                        tenantId: user.tid,
                        userId: user.sub,
                        documentType,
                        documentId,
                        documentNumber,
                        printerName,
                        paperSize,
                        copies,
                        printMode,
                        success,
                        errorMessage,
                        ipAddress: request.ip,
                        userAgent: request.headers['user-agent'],
                    },
                });

                logger.info(`Print audit logged: ${documentType} ${documentId} by user ${user.sub}`);

                return reply.send({
                    success: true,
                    data: {
                        id: printAudit.id,
                        logged: true,
                    },
                });
            } catch (error) {
                logger.error('Failed to log print audit:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Failed to log print audit',
                    },
                });
            }
        }
    );

    /**
     * GET /audit/print
     * Get print audit logs for a tenant
     * Requires Enterprise tier (ai_chat capability as proxy)
     */
    fastify.get<{
        Querystring: {
            limit?: number;
            offset?: number;
            documentType?: string;
            documentId?: string;
            userId?: string;
            startDate?: string;
            endDate?: string;
        };
    }>(
        '/print',
        {
            preHandler: requireCapability('ai_chat'), // Enterprise feature
            schema: {
                description: 'Get print audit logs',
                tags: ['Audit'],
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: 'object',
                    properties: {
                        limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
                        offset: { type: 'integer', minimum: 0, default: 0 },
                        documentType: { type: 'string' },
                        documentId: { type: 'string' },
                        userId: { type: 'string' },
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time' },
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
                        message: 'Authentication required',
                    },
                });
            }

            const {
                limit = 50,
                offset = 0,
                documentType,
                documentId,
                userId,
                startDate,
                endDate,
            } = request.query;

            // Build where clause
            const where: Record<string, unknown> = {
                tenantId: user.tid,
            };

            if (documentType) where.documentType = documentType;
            if (documentId) where.documentId = documentId;
            if (userId) where.userId = userId;
            if (startDate || endDate) {
                where.printTimestamp = {};
                if (startDate) (where.printTimestamp as Record<string, Date>).gte = new Date(startDate);
                if (endDate) (where.printTimestamp as Record<string, Date>).lte = new Date(endDate);
            }

            const [audits, total] = await Promise.all([
                prisma.printAudit.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { printTimestamp: 'desc' },
                    take: limit,
                    skip: offset,
                }),
                prisma.printAudit.count({ where }),
            ]);

            return reply.send({
                success: true,
                data: {
                    audits,
                    pagination: {
                        total,
                        limit,
                        offset,
                        hasMore: offset + audits.length < total,
                    },
                },
            });
        }
    );
}

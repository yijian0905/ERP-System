/**
 * E-Invoice Test API Routes (Sandbox Only)
 * These endpoints are for testing against LHDN sandbox environment
 * 
 * WARNING: These endpoints create test data and make API calls to sandbox
 * Route: /api/v1/einvoice-test/*
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { getTenantId } from '../../middleware/auth.js';
import { SandboxTestService, checkSandboxConnectivity } from '../../services/einvoice/sandbox-test.service.js';
import { logger } from '../../lib/logger.js';
import type { OpenAPIRouteOptions } from '../../types/fastify-schema.js';

// Schema for test invoice submission
const testInvoiceSchema = z.object({
    invoiceNumber: z.string().min(1).max(50),
    currency: z.string().length(3).default('MYR'),
    total: z.number().positive(),
    customerName: z.string().min(1),
    customerTin: z.string().optional(),
    items: z.array(z.object({
        name: z.string().min(1),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        taxRate: z.number().min(0).max(100).default(0),
    })).min(1),
});

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    details?: unknown;
}

export async function einvoiceTestRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/v1/einvoice-test/connectivity
     * Check sandbox connectivity (no authentication required for this check)
     */
    fastify.get<{
        Reply: ApiResponse<{ sandbox: { url: string; connected: boolean }; timestamp: string }>;
    }>(
        '/connectivity',
        {
            schema: {
                description: 'Check LHDN sandbox connectivity',
                tags: ['E-Invoice Test'],
                security: [{ bearerAuth: [] }],
            } as OpenAPIRouteOptions['schema'],
        },
        async (_request, reply) => {
            try {
                const connected = await checkSandboxConnectivity();

                return reply.send({
                    success: true,
                    data: {
                        sandbox: {
                            url: 'https://preprod-api.myinvois.hasil.gov.my',
                            connected,
                        },
                        timestamp: new Date().toISOString(),
                    },
                });
            } catch (error) {
                logger.error('Connectivity check failed', { error });
                return reply.status(500).send({
                    success: false,
                    error: error instanceof Error ? error.message : 'Connectivity check failed',
                });
            }
        }
    );

    /**
     * POST /api/v1/einvoice-test/run-all
     * Run all sandbox tests
     */
    fastify.post<{
        Reply: ApiResponse<unknown>;
    }>(
        '/run-all',
        {
            schema: {
                description: 'Run all sandbox tests (authentication, TIN validation, document validation)',
                tags: ['E-Invoice Test'],
                security: [{ bearerAuth: [] }],
            } as OpenAPIRouteOptions['schema'],
        },
        async (request, reply) => {
            try {
                const tenantId = getTenantId(request);

                const testService = new SandboxTestService(tenantId);
                const results = await testService.runAllTests();

                logger.info('Sandbox tests completed', {
                    tenantId,
                    passed: results.summary.passed,
                    failed: results.summary.failed,
                });

                return reply.send({
                    success: true,
                    data: results,
                });
            } catch (error) {
                logger.error('Sandbox tests failed', { error });
                return reply.status(500).send({
                    success: false,
                    error: error instanceof Error ? error.message : 'Test execution failed',
                });
            }
        }
    );

    /**
     * POST /api/v1/einvoice-test/validate
     * Test document validation without submission
     */
    fastify.post<{
        Reply: ApiResponse<unknown>;
    }>(
        '/validate',
        {
            schema: {
                description: 'Test document structure validation without actual submission',
                tags: ['E-Invoice Test'],
                security: [{ bearerAuth: [] }],
            } as OpenAPIRouteOptions['schema'],
        },
        async (request, reply) => {
            try {
                const tenantId = getTenantId(request);

                const testService = new SandboxTestService(tenantId);
                const result = await testService.testDocumentValidation();

                return reply.send({
                    success: result.success,
                    data: result,
                });
            } catch (error) {
                logger.error('Validation test failed', { error });
                return reply.status(500).send({
                    success: false,
                    error: error instanceof Error ? error.message : 'Validation failed',
                });
            }
        }
    );

    /**
     * POST /api/v1/einvoice-test/submit
     * Submit a test invoice to sandbox
     * WARNING: This creates a real submission in sandbox environment
     */
    fastify.post<{
        Body: z.infer<typeof testInvoiceSchema> | Record<string, never>;
        Reply: ApiResponse<unknown>;
    }>(
        '/submit',
        {
            schema: {
                description: 'Submit a test invoice to LHDN sandbox. WARNING: Creates real sandbox submission.',
                tags: ['E-Invoice Test'],
                security: [{ bearerAuth: [] }],
            } as OpenAPIRouteOptions['schema'],
        },
        async (request: FastifyRequest<{ Body: z.infer<typeof testInvoiceSchema> | Record<string, never> }>, reply: FastifyReply) => {
            try {
                const tenantId = getTenantId(request);

                // Parse and validate request body if provided
                let testData;
                if (request.body && Object.keys(request.body).length > 0) {
                    const parsed = testInvoiceSchema.safeParse(request.body);
                    if (!parsed.success) {
                        return reply.status(400).send({
                            success: false,
                            error: 'Invalid test data',
                            details: parsed.error.errors,
                        });
                    }
                    testData = parsed.data;
                }

                const testService = new SandboxTestService(tenantId);
                const result = await testService.submitTestInvoice(testData);

                logger.info('Sandbox submission test completed', {
                    tenantId,
                    success: result.success,
                });

                return reply.send({
                    success: result.success,
                    data: result,
                });
            } catch (error) {
                logger.error('Sandbox submission failed', { error });
                return reply.status(500).send({
                    success: false,
                    error: error instanceof Error ? error.message : 'Submission failed',
                });
            }
        }
    );

    /**
     * GET /api/v1/einvoice-test/status/:uuid
     * Check document status in sandbox
     */
    fastify.get<{
        Params: { uuid: string };
        Reply: ApiResponse<unknown>;
    }>(
        '/status/:uuid',
        {
            schema: {
                description: 'Check document status in sandbox by UUID',
                tags: ['E-Invoice Test'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    required: ['uuid'],
                    properties: {
                        uuid: { type: 'string', description: 'Document UUID from LHDN' },
                    },
                },
            } as OpenAPIRouteOptions['schema'],
        },
        async (request: FastifyRequest<{ Params: { uuid: string } }>, reply: FastifyReply) => {
            try {
                const tenantId = getTenantId(request);
                const { uuid } = request.params;

                if (!uuid) {
                    return reply.status(400).send({
                        success: false,
                        error: 'Document UUID required',
                    });
                }

                // Import here to avoid circular dependency issues
                const { LhdnApiAdapter } = await import('../../services/einvoice/lhdn-api.adapter.js');
                const adapter = await LhdnApiAdapter.fromTenant(tenantId);
                const status = await adapter.getDocumentDetails(uuid);

                return reply.send({
                    success: true,
                    data: status,
                });
            } catch (error) {
                logger.error('Status check failed', { error });
                return reply.status(500).send({
                    success: false,
                    error: error instanceof Error ? error.message : 'Status check failed',
                });
            }
        }
    );

    /**
     * POST /api/v1/einvoice-test/auth
     * Test authentication only
     */
    fastify.post<{
        Reply: ApiResponse<unknown>;
    }>(
        '/auth',
        {
            schema: {
                description: 'Test LHDN OAuth2 authentication',
                tags: ['E-Invoice Test'],
                security: [{ bearerAuth: [] }],
            } as OpenAPIRouteOptions['schema'],
        },
        async (request, reply) => {
            try {
                const tenantId = getTenantId(request);

                const testService = new SandboxTestService(tenantId);
                const result = await testService.testAuthentication();

                return reply.send({
                    success: result.success,
                    data: result,
                });
            } catch (error) {
                logger.error('Auth test failed', { error });
                return reply.status(500).send({
                    success: false,
                    error: error instanceof Error ? error.message : 'Auth test failed',
                });
            }
        }
    );

    /**
     * DELETE /api/v1/einvoice-test/cleanup
     * Clean up sandbox test data
     */
    fastify.delete<{
        Reply: ApiResponse<{ deleted: number }>;
    }>(
        '/cleanup',
        {
            schema: {
                description: 'Clean up sandbox test data (invoices starting with SANDBOX-)',
                tags: ['E-Invoice Test'],
                security: [{ bearerAuth: [] }],
            } as OpenAPIRouteOptions['schema'],
        },
        async (request, reply) => {
            try {
                const tenantId = getTenantId(request);

                const testService = new SandboxTestService(tenantId);
                const result = await testService.cleanupTestData();

                return reply.send({
                    success: true,
                    data: result,
                });
            } catch (error) {
                logger.error('Cleanup failed', { error });
                return reply.status(500).send({
                    success: false,
                    error: error instanceof Error ? error.message : 'Cleanup failed',
                });
            }
        }
    );
}

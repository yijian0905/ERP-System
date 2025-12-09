/**
 * E-Invoice API Routes
 * Endpoints for managing LHDN e-Invoice integration
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type {
  EInvoiceType,
  EInvoiceStatus,
} from '@erp/shared-types';
import { EInvoiceService, encryptSecret, LhdnApiAdapter } from '../../services/einvoice/index.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createEInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
  invoiceType: z.enum([
    'INVOICE',
    'CREDIT_NOTE',
    'DEBIT_NOTE',
    'REFUND_NOTE',
    'SELF_BILLED',
    'SELF_BILLED_CREDIT_NOTE',
    'SELF_BILLED_DEBIT_NOTE',
    'SELF_BILLED_REFUND_NOTE',
  ]).optional().default('INVOICE'),
  originalEInvoiceId: z.string().uuid().optional(),
});

const cancelEInvoiceSchema = z.object({
  reason: z.string().min(1).max(500),
});

const listEInvoicesSchema = z.object({
  status: z.enum([
    'DRAFT',
    'PENDING',
    'SUBMITTED',
    'VALID',
    'INVALID',
    'CANCELLED',
    'REJECTED',
    'ERROR',
  ]).optional(),
  invoiceType: z.enum([
    'INVOICE',
    'CREDIT_NOTE',
    'DEBIT_NOTE',
    'REFUND_NOTE',
    'SELF_BILLED',
    'SELF_BILLED_CREDIT_NOTE',
    'SELF_BILLED_DEBIT_NOTE',
    'SELF_BILLED_REFUND_NOTE',
  ]).optional(),
  invoiceId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const lhdnCredentialSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  tin: z.string().min(1),
  brn: z.string().optional(),
  idType: z.enum(['NRIC', 'PASSPORT', 'BRN', 'ARMY']),
  idValue: z.string().min(1),
  environment: z.enum(['SANDBOX', 'PRODUCTION']).optional().default('SANDBOX'),
});

const updateLhdnCredentialSchema = z.object({
  clientId: z.string().min(1).optional(),
  clientSecret: z.string().min(1).optional(),
  tin: z.string().min(1).optional(),
  brn: z.string().optional(),
  idType: z.enum(['NRIC', 'PASSPORT', 'BRN', 'ARMY']).optional(),
  idValue: z.string().min(1).optional(),
  environment: z.enum(['SANDBOX', 'PRODUCTION']).optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// ROUTES
// ============================================

export async function einvoicesRoutes(fastify: FastifyInstance) {
  // ============================================
  // E-INVOICE CRUD
  // ============================================

  /**
   * List e-Invoices
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId!;
    const query = listEInvoicesSchema.parse(request.query);

    const service = new EInvoiceService(tenantId);
    const result = await service.list(
      {
        status: query.status as EInvoiceStatus,
        invoiceType: query.invoiceType as EInvoiceType,
        invoiceId: query.invoiceId,
        startDate: query.startDate,
        endDate: query.endDate,
      },
      query.page,
      query.pageSize
    );

    return reply.send({
      success: true,
      data: result.eInvoices,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / query.pageSize),
      },
    });
  });

  /**
   * Get e-Invoice summary statistics
   */
  fastify.get('/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId!;
    const service = new EInvoiceService(tenantId);
    const summary = await service.getSummary();

    return reply.send({
      success: true,
      data: summary,
    });
  });

  /**
   * Get single e-Invoice by ID
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId!;
      const { id } = request.params;

      const service = new EInvoiceService(tenantId);
      const eInvoice = await service.getById(id);

      if (!eInvoice) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'E-Invoice not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: eInvoice,
      });
    }
  );

  /**
   * Get e-Invoice by internal invoice ID
   */
  fastify.get<{ Params: { invoiceId: string } }>(
    '/by-invoice/:invoiceId',
    async (request: FastifyRequest<{ Params: { invoiceId: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId!;
      const { invoiceId } = request.params;

      const service = new EInvoiceService(tenantId);
      const eInvoice = await service.getByInvoiceId(invoiceId);

      if (!eInvoice) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'E-Invoice not found for this invoice',
          },
        });
      }

      return reply.send({
        success: true,
        data: eInvoice,
      });
    }
  );

  /**
   * Create e-Invoice from internal invoice
   */
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId!;
    const body = createEInvoiceSchema.parse(request.body);

    const service = new EInvoiceService(tenantId);
    const eInvoice = await service.createFromInvoice(
      body.invoiceId,
      body.invoiceType as EInvoiceType,
      body.originalEInvoiceId
    );

    return reply.status(201).send({
      success: true,
      data: eInvoice,
    });
  });

  /**
   * Validate e-Invoice before submission
   */
  fastify.post<{ Params: { id: string } }>(
    '/:id/validate',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId!;
      const { id } = request.params;

      const service = new EInvoiceService(tenantId);
      const result = await service.validate(id);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * Submit e-Invoice to LHDN
   */
  fastify.post<{ Params: { id: string } }>(
    '/:id/submit',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId!;
      const { id } = request.params;

      const service = new EInvoiceService(tenantId);
      const result = await service.submit(id);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * Sync e-Invoice status from LHDN
   */
  fastify.post<{ Params: { id: string } }>(
    '/:id/sync',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId!;
      const { id } = request.params;

      const service = new EInvoiceService(tenantId);
      const eInvoice = await service.syncStatus(id);

      return reply.send({
        success: true,
        data: eInvoice,
      });
    }
  );

  /**
   * Retry failed e-Invoice submission
   */
  fastify.post<{ Params: { id: string } }>(
    '/:id/retry',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId!;
      const { id } = request.params;

      const service = new EInvoiceService(tenantId);
      const result = await service.retry(id);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * Cancel e-Invoice
   */
  fastify.post<{ Params: { id: string } }>(
    '/:id/cancel',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId!;
      const { id } = request.params;
      const body = cancelEInvoiceSchema.parse(request.body);

      const service = new EInvoiceService(tenantId);
      const eInvoice = await service.cancel(id, body.reason);

      return reply.send({
        success: true,
        data: eInvoice,
      });
    }
  );

  // ============================================
  // LHDN CREDENTIALS
  // ============================================

  /**
   * Get LHDN credentials (without secret)
   */
  fastify.get('/settings/credentials', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId!;

    const credential = await prisma.lhdnCredential.findUnique({
      where: { tenantId },
      select: {
        id: true,
        tenantId: true,
        clientId: true,
        tin: true,
        brn: true,
        idType: true,
        idValue: true,
        environment: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!credential) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'LHDN credentials not configured',
        },
      });
    }

    return reply.send({
      success: true,
      data: credential,
    });
  });

  /**
   * Create or update LHDN credentials
   */
  fastify.post('/settings/credentials', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId!;
    const body = lhdnCredentialSchema.parse(request.body);

    // Encrypt the client secret
    const clientSecretEncrypted = encryptSecret(body.clientSecret);

    const credential = await prisma.lhdnCredential.upsert({
      where: { tenantId },
      create: {
        tenantId,
        clientId: body.clientId,
        clientSecretEncrypted,
        tin: body.tin,
        brn: body.brn,
        idType: body.idType,
        idValue: body.idValue,
        environment: body.environment,
      },
      update: {
        clientId: body.clientId,
        clientSecretEncrypted,
        tin: body.tin,
        brn: body.brn,
        idType: body.idType,
        idValue: body.idValue,
        environment: body.environment,
      },
      select: {
        id: true,
        tenantId: true,
        clientId: true,
        tin: true,
        brn: true,
        idType: true,
        idValue: true,
        environment: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Clear any existing token to force re-authentication
    await prisma.lhdnToken.deleteMany({
      where: { tenantId },
    });

    logger.info({
      type: 'lhdn_credentials_saved',
      tenantId,
      environment: body.environment,
    });

    return reply.send({
      success: true,
      data: credential,
    });
  });

  /**
   * Update LHDN credentials
   */
  fastify.patch('/settings/credentials', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId!;
    const body = updateLhdnCredentialSchema.parse(request.body);

    const existing = await prisma.lhdnCredential.findUnique({
      where: { tenantId },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'LHDN credentials not found',
        },
      });
    }

    const updateData: Record<string, unknown> = {};

    if (body.clientId) updateData.clientId = body.clientId;
    if (body.clientSecret) updateData.clientSecretEncrypted = encryptSecret(body.clientSecret);
    if (body.tin) updateData.tin = body.tin;
    if (body.brn !== undefined) updateData.brn = body.brn;
    if (body.idType) updateData.idType = body.idType;
    if (body.idValue) updateData.idValue = body.idValue;
    if (body.environment) updateData.environment = body.environment;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const credential = await prisma.lhdnCredential.update({
      where: { tenantId },
      data: updateData,
      select: {
        id: true,
        tenantId: true,
        clientId: true,
        tin: true,
        brn: true,
        idType: true,
        idValue: true,
        environment: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Clear token if credentials changed
    if (body.clientId || body.clientSecret || body.environment) {
      await prisma.lhdnToken.deleteMany({
        where: { tenantId },
      });
    }

    return reply.send({
      success: true,
      data: credential,
    });
  });

  /**
   * Test LHDN connection
   */
  fastify.post('/settings/credentials/test', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId!;

    try {
      const adapter = await LhdnApiAdapter.fromTenant(tenantId);
      await adapter.getAccessToken();

      return reply.send({
        success: true,
        data: {
          connected: true,
          message: 'Successfully connected to LHDN',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';

      return reply.send({
        success: true,
        data: {
          connected: false,
          message,
        },
      });
    }
  });

  /**
   * Delete LHDN credentials
   */
  fastify.delete('/settings/credentials', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId!;

    // Check for active e-invoices
    const activeCount = await prisma.eInvoice.count({
      where: {
        tenantId,
        status: {
          in: ['PENDING', 'SUBMITTED'],
        },
      },
    });

    if (activeCount > 0) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'ACTIVE_EINVOICES',
          message: `Cannot delete credentials while ${activeCount} e-Invoices are pending`,
        },
      });
    }

    // Delete credentials and token
    await Promise.all([
      prisma.lhdnCredential.deleteMany({ where: { tenantId } }),
      prisma.lhdnToken.deleteMany({ where: { tenantId } }),
    ]);

    return reply.send({
      success: true,
      data: { deleted: true },
    });
  });

  // ============================================
  // LHDN UTILITIES
  // ============================================

  /**
   * Validate a TIN with LHDN
   */
  fastify.get<{ Params: { tin: string } }>(
    '/validate-tin/:tin',
    async (request: FastifyRequest<{ Params: { tin: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId!;
      const { tin } = request.params;

      try {
        const adapter = await LhdnApiAdapter.fromTenant(tenantId);
        const isValid = await adapter.validateTin(tin);

        return reply.send({
          success: true,
          data: {
            tin,
            isValid,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Validation failed';
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message,
          },
        });
      }
    }
  );

  /**
   * Get recent documents from LHDN
   */
  fastify.get('/lhdn/recent', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId!;
    const query = request.query as { direction?: 'Sent' | 'Received'; page?: number; pageSize?: number };

    try {
      const adapter = await LhdnApiAdapter.fromTenant(tenantId);
      const result = await adapter.getRecentDocuments(
        query.direction || 'Sent',
        query.page || 1,
        query.pageSize || 50
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch documents';
      return reply.status(400).send({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message,
        },
      });
    }
  });
}

/**
 * E-Invoice Service
 * Manages e-Invoice lifecycle: create, submit, cancel, status updates
 */

import type {
  EInvoice,
  EInvoiceType,
  EInvoiceStatus,
  EInvoiceFilter,
  EInvoiceSummary,
  ValidationResult,
  EInvoiceSubmissionResult,
} from '@erp/shared-types';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { LhdnApiAdapter, encodeDocumentBase64 } from './lhdn-api.adapter.js';
import { EInvoiceBuilder } from './einvoice.builder.js';

const MAX_RETRY_COUNT = 3;
// 72-hour cancellation window in milliseconds (per spec §7.3)
const CANCELLATION_WINDOW_MS = 72 * 60 * 60 * 1000;

/**
 * E-Invoice Service class
 * Coordinates e-Invoice operations and status management
 */
export class EInvoiceService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Create e-Invoice record from internal invoice
   */
  async createFromInvoice(
    invoiceId: string,
    invoiceType: EInvoiceType = 'INVOICE',
    originalEInvoiceId?: string
  ): Promise<EInvoice> {
    // Validate invoice exists
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId: this.tenantId,
      },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Check if e-invoice already exists for this invoice
    const existing = await prisma.eInvoice.findFirst({
      where: {
        invoiceId,
        tenantId: this.tenantId,
        status: {
          notIn: ['CANCELLED', 'REJECTED', 'ERROR'],
        },
      },
    });

    if (existing) {
      throw new Error('Active e-Invoice already exists for this invoice');
    }

    // Create e-invoice record
    const eInvoice = await prisma.eInvoice.create({
      data: {
        tenantId: this.tenantId,
        invoiceId,
        invoiceType,
        status: 'DRAFT',
        originalEInvoiceId,
        items: {
          create: invoice.items.map((item, index) => ({
            invoiceItemId: item.id,
            classificationCode: '001', // Default classification
            description: item.name,
            quantity: item.quantity,
            unitCode: 'C62', // Default to pieces
            unitPrice: item.unitPrice,
            taxType: Number(item.taxRate) > 0 ? '01' : 'E',
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            subtotal: item.unitPrice.mul(item.quantity),
            discountAmount: item.discount,
            discountRate: 0,
            totalAmount: item.total,
            sortOrder: index,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Log creation
    await this.logAction(eInvoice.id, 'create', 'DRAFT', 'E-Invoice created from invoice');

    logger.info({
      type: 'einvoice_created',
      tenantId: this.tenantId,
      eInvoiceId: eInvoice.id,
      invoiceId,
      invoiceType,
    });

    return this.mapToEInvoice(eInvoice);
  }

  /**
   * Build and store JSON for e-Invoice
   */
  async buildAndStoreJson(eInvoiceId: string): Promise<{
    jsonString: string;
    base64: string;
    hash: string;
  }> {
    const eInvoice = await prisma.eInvoice.findFirst({
      where: {
        id: eInvoiceId,
        tenantId: this.tenantId,
      },
    });

    if (!eInvoice) {
      throw new Error('E-Invoice not found');
    }

    // Build JSON using builder
    const builder = new EInvoiceBuilder(this.tenantId);
    const result = await builder.build(
      eInvoice.invoiceId,
      eInvoice.invoiceType as EInvoiceType,
      eInvoice.originalEInvoiceId ?
        (await this.getOriginalUuid(eInvoice.originalEInvoiceId)) :
        undefined
    );

    // Store in database
    await prisma.eInvoice.update({
      where: { id: eInvoiceId },
      data: {
        requestJson: result.document as object,
        documentHash: result.hash,
      },
    });

    return {
      jsonString: result.jsonString,
      base64: result.base64,
      hash: result.hash,
    };
  }

  /**
   * Validate e-Invoice before submission
   */
  async validate(eInvoiceId: string): Promise<ValidationResult> {
    const eInvoice = await prisma.eInvoice.findFirst({
      where: {
        id: eInvoiceId,
        tenantId: this.tenantId,
      },
    });

    if (!eInvoice) {
      return {
        isValid: false,
        errors: [{ code: 'NOT_FOUND', message: 'E-Invoice not found' }],
      };
    }

    const builder = new EInvoiceBuilder(this.tenantId);
    return builder.validate(eInvoice.invoiceId);
  }

  /**
   * Submit e-Invoice to LHDN
   */
  async submit(eInvoiceId: string): Promise<EInvoiceSubmissionResult> {
    const eInvoice = await prisma.eInvoice.findFirst({
      where: {
        id: eInvoiceId,
        tenantId: this.tenantId,
      },
      include: {
        invoice: true,
      },
    });

    if (!eInvoice) {
      throw new Error('E-Invoice not found');
    }

    // Validate status
    if (!['DRAFT', 'PENDING', 'ERROR'].includes(eInvoice.status)) {
      throw new Error(`Cannot submit e-Invoice with status: ${eInvoice.status}`);
    }

    // Build JSON if not already built
    let jsonData: { base64: string; hash: string };
    if (!eInvoice.requestJson || !eInvoice.documentHash) {
      jsonData = await this.buildAndStoreJson(eInvoiceId);
    } else {
      const jsonString = JSON.stringify(eInvoice.requestJson);
      jsonData = {
        base64: encodeDocumentBase64(jsonString),
        hash: eInvoice.documentHash,
      };
    }

    // Update status to pending
    await this.updateStatus(eInvoiceId, 'PENDING');

    try {
      // Get API adapter
      const adapter = await LhdnApiAdapter.fromTenant(this.tenantId);

      // Submit to LHDN
      const response = await adapter.submitDocuments({
        documents: [{
          format: 'JSON',
          document: jsonData.base64,
          documentHash: jsonData.hash,
          codeNumber: eInvoice.invoice.invoiceNumber,
        }],
      });

      // Process response
      if (response.acceptedDocuments.length > 0) {
        const accepted = response.acceptedDocuments[0];

        await prisma.eInvoice.update({
          where: { id: eInvoiceId },
          data: {
            status: 'SUBMITTED',
            lhdnUuid: accepted.uuid,
            lhdnSubmissionUid: response.submissionUid,
            submittedAt: new Date(),
            responseJson: response as object,
          },
        });

        await this.logAction(
          eInvoiceId,
          'submit',
          'SUBMITTED',
          'Document accepted by LHDN',
          { response }
        );

        logger.info({
          type: 'einvoice_submitted',
          tenantId: this.tenantId,
          eInvoiceId,
          lhdnUuid: accepted.uuid,
          submissionUid: response.submissionUid,
        });

        return {
          success: true,
          eInvoiceId,
          lhdnUuid: accepted.uuid,
          lhdnSubmissionUid: response.submissionUid,
          status: 'SUBMITTED',
        };
      } else if (response.rejectedDocuments.length > 0) {
        const rejected = response.rejectedDocuments[0];

        await prisma.eInvoice.update({
          where: { id: eInvoiceId },
          data: {
            status: 'INVALID',
            responseJson: response as object,
            validationErrors: [{
              code: rejected.error.code,
              message: rejected.error.message,
            }],
          },
        });

        await this.logAction(
          eInvoiceId,
          'submit',
          'INVALID',
          'Document rejected by LHDN',
          { response },
          rejected.error.code,
          rejected.error.message
        );

        return {
          success: false,
          eInvoiceId,
          status: 'INVALID',
          errors: [{
            code: rejected.error.code,
            message: rejected.error.message,
          }],
        };
      }

      throw new Error('Unexpected response from LHDN');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update retry count and status
      const updatedEInvoice = await prisma.eInvoice.update({
        where: { id: eInvoiceId },
        data: {
          status: 'ERROR',
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
          validationErrors: [{
            code: 'SUBMISSION_ERROR',
            message: errorMessage,
          }],
        },
      });

      await this.logAction(
        eInvoiceId,
        'submit',
        'ERROR',
        'Submission failed',
        undefined,
        'SUBMISSION_ERROR',
        errorMessage
      );

      logger.error({
        type: 'einvoice_submit_error',
        tenantId: this.tenantId,
        eInvoiceId,
        error: errorMessage,
        retryCount: updatedEInvoice.retryCount,
      });

      return {
        success: false,
        eInvoiceId,
        status: 'ERROR',
        errors: [{
          code: 'SUBMISSION_ERROR',
          message: errorMessage,
        }],
      };
    }
  }

  /**
   * Check and update e-Invoice status from LHDN
   */
  async syncStatus(eInvoiceId: string): Promise<EInvoice> {
    const eInvoice = await prisma.eInvoice.findFirst({
      where: {
        id: eInvoiceId,
        tenantId: this.tenantId,
      },
    });

    if (!eInvoice) {
      throw new Error('E-Invoice not found');
    }

    if (!eInvoice.lhdnUuid) {
      throw new Error('E-Invoice has not been submitted yet');
    }

    const adapter = await LhdnApiAdapter.fromTenant(this.tenantId);
    const details = await adapter.getDocumentDetails(eInvoice.lhdnUuid);

    // Map LHDN status to our status
    let newStatus: EInvoiceStatus = eInvoice.status as EInvoiceStatus;

    switch (details.status) {
      case 'Valid':
        newStatus = 'VALID';
        break;
      case 'Invalid':
        newStatus = 'INVALID';
        break;
      case 'Cancelled':
        newStatus = 'CANCELLED';
        break;
      case 'Submitted':
        newStatus = 'SUBMITTED';
        break;
    }

    const updatedEInvoice = await prisma.eInvoice.update({
      where: { id: eInvoiceId },
      data: {
        status: newStatus,
        lhdnLongId: details.longId,
        validatedAt: details.dateTimeValidated ? new Date(details.dateTimeValidated) : undefined,
        responseJson: details as object,
        validationErrors: details.validationResults?.errors as Array<{ code: string; message: string }> | undefined,
      },
      include: {
        items: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (newStatus !== eInvoice.status) {
      await this.logAction(
        eInvoiceId,
        'sync',
        newStatus,
        `Status updated from ${eInvoice.status} to ${newStatus}`
      );
    }

    return this.mapToEInvoice(updatedEInvoice);
  }

  /**
   * Cancel e-Invoice in LHDN
   */
  async cancel(eInvoiceId: string, reason: string): Promise<EInvoice> {
    const eInvoice = await prisma.eInvoice.findFirst({
      where: {
        id: eInvoiceId,
        tenantId: this.tenantId,
      },
    });

    if (!eInvoice) {
      throw new Error('E-Invoice not found');
    }

    if (!eInvoice.lhdnUuid) {
      // Not submitted yet, just update local status
      const updated = await prisma.eInvoice.update({
        where: { id: eInvoiceId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          rejectReason: reason,
        },
        include: { items: true, logs: true },
      });

      await this.logAction(eInvoiceId, 'cancel', 'CANCELLED', reason);
      return this.mapToEInvoice(updated);
    }

    // Cancel in LHDN
    if (!['VALID', 'SUBMITTED'].includes(eInvoice.status)) {
      throw new Error(`Cannot cancel e-Invoice with status: ${eInvoice.status}`);
    }

    // Check 72-hour cancellation window (per spec §7.3)
    if (eInvoice.validatedAt) {
      const deadline = new Date(eInvoice.validatedAt.getTime() + CANCELLATION_WINDOW_MS);
      if (new Date() > deadline) {
        throw new Error(
          `Cancellation window expired. E-Invoice was validated on ${eInvoice.validatedAt.toISOString()}. ` +
          `The 72-hour cancellation deadline was ${deadline.toISOString()}. ` +
          `Please issue a Credit Note or Debit Note instead.`
        );
      }
    }

    const adapter = await LhdnApiAdapter.fromTenant(this.tenantId);
    await adapter.cancelDocument(eInvoice.lhdnUuid, reason);

    const updated = await prisma.eInvoice.update({
      where: { id: eInvoiceId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        rejectReason: reason,
      },
      include: { items: true, logs: true },
    });

    await this.logAction(eInvoiceId, 'cancel', 'CANCELLED', reason);

    logger.info({
      type: 'einvoice_cancelled',
      tenantId: this.tenantId,
      eInvoiceId,
      lhdnUuid: eInvoice.lhdnUuid,
      reason,
    });

    return this.mapToEInvoice(updated);
  }

  /**
   * Check if e-Invoice can be cancelled (within 72-hour window)
   * Returns cancellation eligibility status and deadline info
   */
  async canCancel(eInvoiceId: string): Promise<{ canCancel: boolean; reason?: string; deadline?: string }> {
    const eInvoice = await prisma.eInvoice.findFirst({
      where: {
        id: eInvoiceId,
        tenantId: this.tenantId,
      },
    });

    if (!eInvoice) {
      return { canCancel: false, reason: 'E-Invoice not found' };
    }

    // Not submitted yet - can always cancel locally
    if (!eInvoice.lhdnUuid) {
      return { canCancel: true };
    }

    // Already cancelled or rejected
    if (['CANCELLED', 'REJECTED'].includes(eInvoice.status)) {
      return { canCancel: false, reason: `E-Invoice is already ${eInvoice.status.toLowerCase()}` };
    }

    // Not in a cancellable state
    if (!['VALID', 'SUBMITTED'].includes(eInvoice.status)) {
      return { canCancel: false, reason: `Cannot cancel e-Invoice with status: ${eInvoice.status}` };
    }

    // Check 72-hour window
    if (eInvoice.validatedAt) {
      const deadline = new Date(eInvoice.validatedAt.getTime() + CANCELLATION_WINDOW_MS);
      if (new Date() > deadline) {
        return {
          canCancel: false,
          reason: '72-hour cancellation window has expired. Issue a Credit Note instead.',
          deadline: deadline.toISOString(),
        };
      }
      return { canCancel: true, deadline: deadline.toISOString() };
    }

    return { canCancel: true };
  }

  /**
   * Get e-Invoice by ID
   */
  async getById(eInvoiceId: string): Promise<EInvoice | null> {
    const eInvoice = await prisma.eInvoice.findFirst({
      where: {
        id: eInvoiceId,
        tenantId: this.tenantId,
      },
      include: {
        items: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    return eInvoice ? this.mapToEInvoice(eInvoice) : null;
  }

  /**
   * Get e-Invoice by invoice ID
   */
  async getByInvoiceId(invoiceId: string): Promise<EInvoice | null> {
    const eInvoice = await prisma.eInvoice.findFirst({
      where: {
        invoiceId,
        tenantId: this.tenantId,
        status: {
          notIn: ['CANCELLED', 'REJECTED'],
        },
      },
      include: {
        items: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    return eInvoice ? this.mapToEInvoice(eInvoice) : null;
  }

  /**
   * List e-Invoices with filters
   */
  async list(
    filter: EInvoiceFilter = {},
    page = 1,
    pageSize = 20
  ): Promise<{ eInvoices: EInvoice[]; total: number }> {
    const where: Record<string, unknown> = {
      tenantId: this.tenantId,
    };

    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.invoiceType) {
      where.invoiceType = filter.invoiceType;
    }
    if (filter.invoiceId) {
      where.invoiceId = filter.invoiceId;
    }
    if (filter.lhdnUuid) {
      where.lhdnUuid = filter.lhdnUuid;
    }
    if (filter.startDate || filter.endDate) {
      where.createdAt = {
        ...(filter.startDate && { gte: new Date(filter.startDate) }),
        ...(filter.endDate && { lte: new Date(filter.endDate) }),
      };
    }

    const [eInvoices, total] = await Promise.all([
      prisma.eInvoice.findMany({
        where,
        include: {
          items: true,
          invoice: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.eInvoice.count({ where }),
    ]);

    return {
      eInvoices: eInvoices.map(e => this.mapToEInvoice(e)),
      total,
    };
  }

  /**
   * Get summary statistics
   */
  async getSummary(): Promise<EInvoiceSummary> {
    const statusCounts = await prisma.eInvoice.groupBy({
      by: ['status'],
      where: { tenantId: this.tenantId },
      _count: true,
    });

    const summary: EInvoiceSummary = {
      totalDraft: 0,
      totalPending: 0,
      totalSubmitted: 0,
      totalValid: 0,
      totalInvalid: 0,
      totalCancelled: 0,
      totalRejected: 0,
      totalError: 0,
    };

    for (const item of statusCounts) {
      switch (item.status) {
        case 'DRAFT':
          summary.totalDraft = item._count;
          break;
        case 'PENDING':
          summary.totalPending = item._count;
          break;
        case 'SUBMITTED':
          summary.totalSubmitted = item._count;
          break;
        case 'VALID':
          summary.totalValid = item._count;
          break;
        case 'INVALID':
          summary.totalInvalid = item._count;
          break;
        case 'CANCELLED':
          summary.totalCancelled = item._count;
          break;
        case 'REJECTED':
          summary.totalRejected = item._count;
          break;
        case 'ERROR':
          summary.totalError = item._count;
          break;
      }
    }

    return summary;
  }

  /**
   * Update e-Invoice status
   */
  async updateStatus(
    eInvoiceId: string,
    status: EInvoiceStatus,
    details?: string
  ): Promise<void> {
    await prisma.eInvoice.update({
      where: { id: eInvoiceId },
      data: { status },
    });

    if (details) {
      await this.logAction(eInvoiceId, 'status_update', status, details);
    }
  }

  /**
   * Retry failed submission
   */
  async retry(eInvoiceId: string): Promise<EInvoiceSubmissionResult> {
    const eInvoice = await prisma.eInvoice.findFirst({
      where: {
        id: eInvoiceId,
        tenantId: this.tenantId,
      },
    });

    if (!eInvoice) {
      throw new Error('E-Invoice not found');
    }

    if (!['ERROR', 'INVALID'].includes(eInvoice.status)) {
      throw new Error(`Cannot retry e-Invoice with status: ${eInvoice.status}`);
    }

    if (eInvoice.retryCount >= MAX_RETRY_COUNT) {
      throw new Error('Maximum retry count exceeded');
    }

    return this.submit(eInvoiceId);
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async getOriginalUuid(originalEInvoiceId: string): Promise<string | undefined> {
    const original = await prisma.eInvoice.findUnique({
      where: { id: originalEInvoiceId },
    });
    return original?.lhdnUuid || undefined;
  }

  private async logAction(
    eInvoiceId: string,
    action: string,
    status: EInvoiceStatus,
    message?: string,
    responseData?: object,
    errorCode?: string,
    errorMessage?: string
  ): Promise<void> {
    await prisma.eInvoiceLog.create({
      data: {
        eInvoiceId,
        action,
        status,
        message,
        responseData: responseData as object,
        errorCode,
        errorMessage,
      },
    });
  }

  private mapToEInvoice(data: {
    id: string;
    tenantId: string;
    invoiceId: string;
    invoiceType: string;
    status: string;
    lhdnUuid: string | null;
    lhdnLongId: string | null;
    lhdnSubmissionUid: string | null;
    submittedAt: Date | null;
    validatedAt: Date | null;
    cancelledAt: Date | null;
    rejectedAt: Date | null;
    requestJson: unknown;
    responseJson: unknown;
    documentHash: string | null;
    rejectReason: string | null;
    validationErrors: unknown;
    retryCount: number;
    lastRetryAt: Date | null;
    originalEInvoiceId: string | null;
    createdAt: Date;
    updatedAt: Date;
    items?: Array<Record<string, unknown>>;
    logs?: Array<Record<string, unknown>>;
  }): EInvoice {
    return {
      id: data.id,
      tenantId: data.tenantId,
      invoiceId: data.invoiceId,
      type: data.invoiceType as EInvoiceType,
      status: data.status as EInvoiceStatus,
      lhdnUuid: data.lhdnUuid,
      longId: data.lhdnLongId,
      lhdnSubmissionUid: data.lhdnSubmissionUid,
      submittedAt: data.submittedAt?.toISOString(),
      validatedAt: data.validatedAt?.toISOString(),
      cancelledAt: data.cancelledAt?.toISOString(),
      rejectedAt: data.rejectedAt?.toISOString(),
      requestJson: data.requestJson as Record<string, unknown> | null | undefined,
      responseJson: data.responseJson as Record<string, unknown> | null | undefined,
      documentHash: data.documentHash,
      rejectReason: data.rejectReason,
      validationErrors: data.validationErrors as Array<{ code: string; message: string }> | null | undefined,
      retryCount: data.retryCount,
      lastRetryAt: data.lastRetryAt?.toISOString(),
      originalEInvoiceId: data.originalEInvoiceId,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
      items: data.items?.map((item: Record<string, unknown>) => ({
        id: item.id as string,
        eInvoiceId: item.eInvoiceId as string,
        invoiceItemId: item.invoiceItemId as string,
        classificationCode: item.classificationCode as string,
        description: item.description as string,
        quantity: Number(item.quantity),
        unitCode: item.unitCode as string,
        unitPrice: Number(item.unitPrice),
        taxType: item.taxType as string,
        taxRate: Number(item.taxRate),
        taxAmount: Number(item.taxAmount),
        taxExemptReason: item.taxExemptReason as string | undefined,
        subtotal: Number(item.subtotal),
        discountAmount: Number(item.discountAmount),
        discountRate: Number(item.discountRate),
        totalAmount: Number(item.totalAmount),
        sortOrder: item.sortOrder as number,
        createdAt: (item.createdAt as Date).toISOString(),
        updatedAt: (item.updatedAt as Date).toISOString(),
      })),
      logs: data.logs?.map((log: Record<string, unknown>) => ({
        id: log.id as string,
        eInvoiceId: log.eInvoiceId as string,
        action: log.action as string,
        status: log.status as EInvoiceStatus,
        message: log.message as string | undefined,
        requestData: log.requestData as Record<string, unknown> | null | undefined,
        responseData: log.responseData as Record<string, unknown> | null | undefined,
        errorCode: log.errorCode as string | undefined,
        errorMessage: log.errorMessage as string | undefined,
        ipAddress: log.ipAddress as string | undefined,
        userAgent: log.userAgent as string | undefined,
        createdAt: (log.createdAt as Date).toISOString(),
      })),
    };
  }
}

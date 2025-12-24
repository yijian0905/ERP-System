/**
 * E-Invoice Sandbox Test Service
 * Provides testing utilities for LHDN MyInvois sandbox environment
 * Sandbox URL: https://preprod-api.myinvois.hasil.gov.my
 */

import { LhdnApiAdapter } from './lhdn-api.adapter.js';
import { EInvoiceBuilder } from './einvoice.builder.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

export interface SandboxTestResult {
    success: boolean;
    testName: string;
    duration: number;
    response?: unknown;
    error?: string;
    details?: Record<string, unknown>;
}

export interface SandboxTestSuite {
    tenantId: string;
    environment: string;
    executedAt: string;
    results: SandboxTestResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
    };
}

export interface TestInvoiceData {
    invoiceNumber: string;
    currency: string;
    total: number;
    customerName: string;
    customerTin?: string;
    items: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
    }>;
}

/**
 * Sandbox Test Service class
 * Run tests against the LHDN sandbox environment
 */
export class SandboxTestService {
    private tenantId: string;

    constructor(tenantId: string) {
        this.tenantId = tenantId;
    }

    /**
     * Run all sandbox tests
     */
    async runAllTests(): Promise<SandboxTestSuite> {
        const results: SandboxTestResult[] = [];

        // Run individual tests
        results.push(await this.testAuthentication());
        results.push(await this.testTinValidation());
        results.push(await this.testDocumentValidation());

        const passed = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
            tenantId: this.tenantId,
            environment: 'SANDBOX',
            executedAt: new Date().toISOString(),
            results,
            summary: {
                total: results.length,
                passed,
                failed,
            },
        };
    }

    /**
     * Test 1: Authentication
     * Verifies OAuth2 token retrieval works
     */
    async testAuthentication(): Promise<SandboxTestResult> {
        const startTime = Date.now();
        const testName = 'Authentication';

        try {
            const adapter = await LhdnApiAdapter.fromTenant(this.tenantId);
            const token = await adapter.getAccessToken();

            return {
                success: true,
                testName,
                duration: Date.now() - startTime,
                details: {
                    tokenReceived: !!token,
                    tokenLength: token.length,
                },
            };
        } catch (error) {
            return {
                success: false,
                testName,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Test 2: TIN Validation
     * Verifies TIN validation API works
     */
    async testTinValidation(): Promise<SandboxTestResult> {
        const startTime = Date.now();
        const testName = 'TIN Validation';

        try {
            const adapter = await LhdnApiAdapter.fromTenant(this.tenantId);

            // Get credential to use the configured TIN
            const credential = await prisma.lhdnCredential.findUnique({
                where: { tenantId: this.tenantId },
            });

            if (!credential) {
                throw new Error('LHDN credentials not configured');
            }

            // Validate the configured TIN
            const isValid = await adapter.validateTin(credential.tin, credential.idType, credential.idValue);

            return {
                success: true,
                testName,
                duration: Date.now() - startTime,
                details: {
                    tin: credential.tin,
                    isValid,
                },
            };
        } catch (error) {
            return {
                success: false,
                testName,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Test 3: Document Validation (dry-run)
     * Builds a test document and validates structure
     */
    async testDocumentValidation(): Promise<SandboxTestResult> {
        const startTime = Date.now();
        const testName = 'Document Structure Validation';

        try {
            const builder = new EInvoiceBuilder(this.tenantId);

            // Create a minimal test invoice
            const testInvoice = await this.createTestInvoice();

            // Validate the invoice structure
            const validationResult = await builder.validate(testInvoice.id);

            return {
                success: validationResult.isValid,
                testName,
                duration: Date.now() - startTime,
                details: {
                    isValid: validationResult.isValid,
                    errorCount: validationResult.errors.length,
                    errors: validationResult.errors,
                },
            };
        } catch (error) {
            return {
                success: false,
                testName,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Submit a test invoice to sandbox
     * WARNING: This creates a real submission in sandbox
     */
    async submitTestInvoice(testData?: TestInvoiceData): Promise<SandboxTestResult> {
        const startTime = Date.now();
        const testName = 'Document Submission (Sandbox)';

        try {
            // Create or get test invoice
            const invoice = testData
                ? await this.createTestInvoiceFromData(testData)
                : await this.createTestInvoice();

            // Build the e-invoice
            const builder = new EInvoiceBuilder(this.tenantId);
            const buildResult = await builder.build(invoice.id, 'INVOICE');

            // Get adapter
            const adapter = await LhdnApiAdapter.fromTenant(this.tenantId);

            // Submit to sandbox - wrap in documents array per LhdnSubmitDocumentRequest type
            const response = await adapter.submitDocuments({
                documents: [{
                    format: 'JSON',
                    document: buildResult.base64,
                    documentHash: buildResult.hash,
                    codeNumber: invoice.invoiceNumber,
                }],
            });

            const accepted = response.acceptedDocuments?.length ?? 0;
            const rejected = response.rejectedDocuments?.length ?? 0;

            return {
                success: accepted > 0,
                testName,
                duration: Date.now() - startTime,
                response,
                details: {
                    submissionUid: response.submissionUid,
                    acceptedCount: accepted,
                    rejectedCount: rejected,
                    acceptedDocuments: response.acceptedDocuments,
                    rejectedDocuments: response.rejectedDocuments,
                },
            };
        } catch (error) {
            return {
                success: false,
                testName,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Check sandbox connectivity
     */
    async checkConnectivity(): Promise<{
        connected: boolean;
        latency: number;
        endpoint: string;
        error?: string;
    }> {
        const startTime = Date.now();
        const endpoint = 'https://preprod-api.myinvois.hasil.gov.my';

        try {
            const response = await fetch(`${endpoint}/api/v1.0`);
            const latency = Date.now() - startTime;

            return {
                connected: response.ok || response.status === 401, // 401 is expected without auth
                latency,
                endpoint,
            };
        } catch (error) {
            return {
                connected: false,
                latency: Date.now() - startTime,
                endpoint,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Create a test invoice in the database
     */
    private async createTestInvoice() {
        // Get or create a test customer
        let testCustomer = await prisma.customer.findFirst({
            where: {
                tenantId: this.tenantId,
                code: 'TEST-SANDBOX',
            },
        });

        if (!testCustomer) {
            testCustomer = await prisma.customer.create({
                data: {
                    tenantId: this.tenantId,
                    code: 'TEST-SANDBOX',
                    name: 'Sandbox Test Customer',
                    type: 'COMPANY',
                    email: 'test@sandbox.com',
                    phone: '+60123456789',
                    billingAddress: {
                        street: '123 Test Street',
                        city: 'Kuala Lumpur',
                        state: '14', // WP Kuala Lumpur
                        postalCode: '50000',
                        country: 'MYS',
                    },
                    paymentTerms: 30,
                    creditLimit: 10000,
                    tags: ['sandbox'],
                },
            });
        }

        // Get first user for createdById
        const user = await prisma.user.findFirst({
            where: { tenantId: this.tenantId },
        });

        if (!user) {
            throw new Error('No user found for tenant');
        }

        // Create test invoice
        const invoice = await prisma.invoice.create({
            data: {
                tenantId: this.tenantId,
                customerId: testCustomer.id,
                createdById: user.id,
                invoiceNumber: `SANDBOX-${Date.now()}`,
                type: 'INVOICE',
                status: 'DRAFT',
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                subtotal: 100.00,
                taxAmount: 0,
                discount: 0,
                shippingCost: 0,
                total: 100.00,
                paidAmount: 0,
                balanceDue: 100.00,
                currency: 'MYR',
                exchangeRate: 1,
                metadata: { sandbox: true },
                items: {
                    create: [{
                        name: 'Sandbox Test Item',
                        description: 'Test item for sandbox validation',
                        quantity: 1,
                        unitPrice: 100.00,
                        discount: 0,
                        taxRate: 0,
                        taxAmount: 0,
                        total: 100.00,
                        sortOrder: 0,
                    }],
                },
            },
            include: {
                items: true,
                customer: true,
            },
        });

        return invoice;
    }

    /**
     * Create test invoice from provided data
     */
    private async createTestInvoiceFromData(data: TestInvoiceData) {
        // Get or create customer
        let customer = await prisma.customer.findFirst({
            where: {
                tenantId: this.tenantId,
                name: data.customerName,
            },
        });

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    tenantId: this.tenantId,
                    code: `CUST-${Date.now()}`,
                    name: data.customerName,
                    type: 'COMPANY',
                    paymentTerms: 30,
                    creditLimit: 10000,
                    tags: [],
                },
            });
        }

        const user = await prisma.user.findFirst({
            where: { tenantId: this.tenantId },
        });

        if (!user) throw new Error('No user found');

        const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const taxAmount = data.items.reduce((sum, item) =>
            sum + (item.quantity * item.unitPrice * item.taxRate / 100), 0
        );

        return prisma.invoice.create({
            data: {
                tenantId: this.tenantId,
                customerId: customer.id,
                createdById: user.id,
                invoiceNumber: data.invoiceNumber,
                type: 'INVOICE',
                status: 'DRAFT',
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                subtotal,
                taxAmount,
                discount: 0,
                shippingCost: 0,
                total: data.total,
                paidAmount: 0,
                balanceDue: data.total,
                currency: data.currency,
                exchangeRate: 1,
                metadata: { sandbox: true },
                items: {
                    create: data.items.map((item, index) => ({
                        name: item.name,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: 0,
                        taxRate: item.taxRate,
                        taxAmount: item.quantity * item.unitPrice * item.taxRate / 100,
                        total: item.quantity * item.unitPrice * (1 + item.taxRate / 100),
                        sortOrder: index,
                    })),
                },
            },
            include: {
                items: true,
                customer: true,
            },
        });
    }

    /**
     * Clean up sandbox test data
     */
    async cleanupTestData(): Promise<{ deleted: number }> {
        // Delete test invoices
        const result = await prisma.invoice.deleteMany({
            where: {
                tenantId: this.tenantId,
                invoiceNumber: { startsWith: 'SANDBOX-' },
            },
        });

        logger.info('Cleaned up sandbox test data', {
            tenantId: this.tenantId,
            deleted: result.count
        });

        return { deleted: result.count };
    }
}

/**
 * Quick sandbox connectivity check (no auth required)
 */
export async function checkSandboxConnectivity(): Promise<boolean> {
    try {
        const response = await fetch('https://preprod-api.myinvois.hasil.gov.my/api/v1.0');
        return response.status !== 0; // Any response means connectivity
    } catch {
        return false;
    }
}

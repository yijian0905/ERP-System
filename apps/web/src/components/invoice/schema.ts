import { z } from 'zod';
import {
    MALAYSIA_STATE_CODES,
    PAYMENT_MODE_CODES,
    TAX_TYPE_CODES
} from '@erp/shared-types';

// Validation helpers
const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
const tinRegex = /^([A-Z]{1,2})([0-9]{10,12})$/;

export const invoiceLineItemSchema = z.object({
    id: z.string(),
    productId: z.string().min(1, 'Product is required'),
    productName: z.string(),
    sku: z.string(),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: z.number().min(0, 'Unit price cannot be negative'),
    discount: z.number().min(0).max(100).default(0),
    taxRate: z.number().min(0).default(0),
    total: z.number(),

    // E-Invoice fields
    classificationCode: z.string().default('022'), // Default to 'Others' or specific code
    unitCode: z.string().default('C62'), // Default to 'Unit'
    taxTypeCode: z.string().default(TAX_TYPE_CODES.SST),
    taxExemptionReason: z.string().optional(),
});

export const invoiceFormSchema = z.object({
    customerId: z.string().min(1, 'Customer is required'),
    customerName: z.string(),
    customerEmail: z.string().email().optional().or(z.literal('')),
    customerAddress: z.string().min(5, 'Address is required for E-Invoice'),

    // E-Invoice Customer fields (Validation logic will be stricter in backend, but basic checks here)
    customerTin: z.string().regex(tinRegex, 'Invalid TIN format (e.g., IG1234567890)').optional().or(z.literal('')),
    customerBrn: z.string().min(5, 'BRN is too short').optional().or(z.literal('')),
    customerSstNo: z.string().optional(),

    invoiceDate: z.string().min(1, 'Invoice date is required'),
    dueDate: z.string().min(1, 'Due date is required'),

    // E-Invoice fields
    currency: z.string().length(3).default('MYR'),
    exchangeRate: z.number().min(0).default(1),

    billingPeriodStart: z.string().optional(),
    billingPeriodEnd: z.string().optional(),
    billingFrequency: z.string().optional(),

    paymentMode: z.string().default(PAYMENT_MODE_CODES.CASH),
    paymentBankAccount: z.string().optional(),

    prepaymentAmount: z.number().min(0).optional(),
    prepaymentDate: z.string().optional(),
    prepaymentReference: z.string().optional(),

    billReferenceNumber: z.string().optional(),

    items: z.array(invoiceLineItemSchema).min(1, 'At least one item is required'),

    notes: z.string().optional(),
    terms: z.string().optional(),

    subtotal: z.number(),
    taxAmount: z.number(),
    discount: z.number(),
    total: z.number(),
});

export type InvoiceFormSchema = z.infer<typeof invoiceFormSchema>;

/**
 * Invoices API functions
 */

import type { ApiResponse, PaginationMeta } from '@erp/shared-types';
import { get, post, patch } from '../api-client';

export interface Invoice {
    id: string;
    invoiceNumber: string;
    orderId: string;
    customerId: string;
    customerName: string;
    status: 'DRAFT' | 'PENDING' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    issueDate: string;
    dueDate: string;
    subtotal: number;
    tax: number;
    total: number;
    paidAmount: number;
    createdAt: string;
}

export interface InvoiceListParams {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
}

export interface CreateInvoiceData {
    orderId: string;
    customerId: string;
    issueDate: string;
    dueDate: string;
    subtotal: number;
    tax?: number;
}

export const invoicesApi = {
    /**
     * Get list of invoices
     */
    async list(params?: InvoiceListParams): Promise<ApiResponse<Invoice[]> & { meta?: PaginationMeta }> {
        return get<Invoice[]>('/v1/invoices', { params });
    },

    /**
     * Get a single invoice by ID
     */
    async getById(id: string): Promise<ApiResponse<Invoice>> {
        return get<Invoice>(`/v1/invoices/${id}`);
    },

    /**
     * Create a new invoice
     */
    async create(data: CreateInvoiceData): Promise<ApiResponse<Invoice>> {
        return post<Invoice>('/v1/invoices', data);
    },

    /**
     * Update invoice status
     */
    async updateStatus(id: string, status: string): Promise<ApiResponse<Invoice>> {
        return patch<Invoice>(`/v1/invoices/${id}/status`, { status });
    },

    /**
     * Record payment for invoice
     */
    async recordPayment(id: string, amount: number): Promise<ApiResponse<Invoice>> {
        return post<Invoice>(`/v1/invoices/${id}/payments`, { amount });
    },
};

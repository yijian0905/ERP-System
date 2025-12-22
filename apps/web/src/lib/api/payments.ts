/**
 * Payments API functions
 */

import type { ApiResponse, PaginationMeta } from '@erp/shared-types';
import { get, post } from '../api-client';

export interface Payment {
    id: string;
    paymentNumber: string;
    invoiceId: string;
    customerId: string;
    customerName: string;
    amount: number;
    method: 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CHECK';
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    reference: string | null;
    paymentDate: string;
    createdAt: string;
}

export interface PaymentListParams {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
    customerId?: string;
}

export interface CreatePaymentData {
    invoiceId: string;
    amount: number;
    method: 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CHECK';
    reference?: string;
    paymentDate: string;
}

export const paymentsApi = {
    /**
     * Get list of payments
     */
    async list(params?: PaymentListParams): Promise<ApiResponse<Payment[]> & { meta?: PaginationMeta }> {
        return get<Payment[]>('/v1/payments', { params });
    },

    /**
     * Get a single payment by ID
     */
    async getById(id: string): Promise<ApiResponse<Payment>> {
        return get<Payment>(`/v1/payments/${id}`);
    },

    /**
     * Create a new payment
     */
    async create(data: CreatePaymentData): Promise<ApiResponse<Payment>> {
        return post<Payment>('/v1/payments', data);
    },
};

/**
 * Recurring Revenue API functions
 */

import type { ApiResponse, PaginationMeta } from '@erp/shared-types';
import { get, post, patch, del } from '../api-client';

export interface RecurringItem {
    id: string;
    name: string;
    customerId: string;
    customerName: string;
    type: 'SUBSCRIPTION' | 'CONTRACT' | 'RETAINER';
    frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    amount: number;
    nextBillingDate: string;
    status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
    startDate: string;
    endDate: string | null;
    notes: string | null;
}

export interface RecurringListParams {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
}

export interface CreateRecurringData {
    name: string;
    customerId: string;
    type: 'SUBSCRIPTION' | 'CONTRACT' | 'RETAINER';
    frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    amount: number;
    startDate: string;
    endDate?: string;
    notes?: string;
}

export interface UpdateRecurringData {
    name?: string;
    amount?: number;
    frequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
    endDate?: string | null;
    notes?: string | null;
}

export const recurringApi = {
    /**
     * Get list of recurring items
     */
    async list(params?: RecurringListParams): Promise<ApiResponse<RecurringItem[]> & { meta?: PaginationMeta }> {
        return get<RecurringItem[]>('/v1/recurring', { params });
    },

    /**
     * Get a single recurring item by ID
     */
    async getById(id: string): Promise<ApiResponse<RecurringItem>> {
        return get<RecurringItem>(`/v1/recurring/${id}`);
    },

    /**
     * Create a new recurring item
     */
    async create(data: CreateRecurringData): Promise<ApiResponse<RecurringItem>> {
        return post<RecurringItem>('/v1/recurring', data);
    },

    /**
     * Update a recurring item
     */
    async update(id: string, data: UpdateRecurringData): Promise<ApiResponse<RecurringItem>> {
        return patch<RecurringItem>(`/v1/recurring/${id}`, data);
    },

    /**
     * Delete a recurring item
     */
    async delete(id: string): Promise<ApiResponse<{ message: string }>> {
        return del<{ message: string }>(`/v1/recurring/${id}`);
    },
};

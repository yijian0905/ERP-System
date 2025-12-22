/**
 * Customers API functions
 */

import type { ApiResponse, PaginationMeta } from '@erp/shared-types';
import { get, post, patch, del } from '../api-client';

export interface Customer {
    id: string;
    code: string;
    name: string;
    type: 'INDIVIDUAL' | 'COMPANY';
    address: string;
    email: string | null;
    phone: string | null;
    fax: string | null;
    creditLimit: number;
    currentBalance: number;
    isActive: boolean;
    createdAt: string;
}

export interface CustomerListParams {
    page?: number;
    limit?: number;
    search?: string;
    type?: 'INDIVIDUAL' | 'COMPANY';
    activeOnly?: boolean;
}

export interface CreateCustomerData {
    name: string;
    type: 'INDIVIDUAL' | 'COMPANY';
    address: string;
    email?: string;
    phone?: string;
    fax?: string;
    creditLimit?: number;
}

export interface UpdateCustomerData {
    name?: string;
    type?: 'INDIVIDUAL' | 'COMPANY';
    address?: string;
    email?: string | null;
    phone?: string | null;
    fax?: string | null;
    creditLimit?: number;
    isActive?: boolean;
}

export const customersApi = {
    /**
     * Get list of customers
     */
    async list(params?: CustomerListParams): Promise<ApiResponse<Customer[]> & { meta?: PaginationMeta }> {
        return get<Customer[]>('/v1/customers', { params });
    },

    /**
     * Get a single customer by ID
     */
    async getById(id: string): Promise<ApiResponse<Customer>> {
        return get<Customer>(`/v1/customers/${id}`);
    },

    /**
     * Create a new customer
     */
    async create(data: CreateCustomerData): Promise<ApiResponse<Customer>> {
        return post<Customer>('/v1/customers', data);
    },

    /**
     * Update a customer
     */
    async update(id: string, data: UpdateCustomerData): Promise<ApiResponse<Customer>> {
        return patch<Customer>(`/v1/customers/${id}`, data);
    },

    /**
     * Delete a customer
     */
    async delete(id: string): Promise<ApiResponse<{ message: string }>> {
        return del<{ message: string }>(`/v1/customers/${id}`);
    },
};

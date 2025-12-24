/**
 * Suppliers API functions
 */

import type { ApiResponse, PaginationMeta } from '@erp/shared-types';
import { get, post, patch, del } from '../api-client';

export interface Supplier {
    id: string;
    code: string;
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    fax: string | null;
    website: string | null;
    taxId: string | null;
    address: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    } | null;
    bankDetails: {
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
        swiftCode?: string;
    } | null;
    paymentTerms: number;
    currency: string;
    leadTime: number;
    minimumOrder: number;
    rating: number | null;
    notes: string | null;
    isActive: boolean;
    orderCount?: number;
    productCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface SupplierProduct {
    id: string;
    supplierId: string;
    productId: string;
    name: string;
    sku: string;
    category: string;
    cost: number;
    currentStock: number;
    reorderPoint: number;
    leadTime: number;
}

export interface CreateSupplierData {
    code: string;
    name: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    fax?: string | null;
    website?: string | null;
    taxId?: string | null;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    } | null;
    bankDetails?: {
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
        swiftCode?: string;
    } | null;
    paymentTerms?: number;
    currency?: string;
    leadTime?: number;
    minimumOrder?: number;
    rating?: number | null;
    notes?: string | null;
    isActive?: boolean;
}

export interface UpdateSupplierData {
    code?: string;
    name?: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    fax?: string | null;
    website?: string | null;
    taxId?: string | null;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    } | null;
    bankDetails?: {
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
        swiftCode?: string;
    } | null;
    paymentTerms?: number;
    currency?: string;
    leadTime?: number;
    minimumOrder?: number;
    rating?: number | null;
    notes?: string | null;
    isActive?: boolean;
}

export interface SupplierListParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
}

export const suppliersApi = {
    /**
     * Get list of suppliers
     */
    async list(params?: SupplierListParams): Promise<ApiResponse<Supplier[]> & { meta?: PaginationMeta }> {
        return get<Supplier[]>('/v1/suppliers', { params });
    },

    /**
     * Get a single supplier by ID
     */
    async getById(id: string): Promise<ApiResponse<Supplier>> {
        return get<Supplier>(`/v1/suppliers/${id}`);
    },

    /**
     * Create a new supplier
     */
    async create(data: CreateSupplierData): Promise<ApiResponse<Supplier>> {
        return post<Supplier>('/v1/suppliers', data);
    },

    /**
     * Update a supplier
     */
    async update(id: string, data: UpdateSupplierData): Promise<ApiResponse<Supplier>> {
        return patch<Supplier>(`/v1/suppliers/${id}`, data);
    },

    /**
     * Delete a supplier
     */
    async delete(id: string): Promise<ApiResponse<{ message: string }>> {
        return del<{ message: string }>(`/v1/suppliers/${id}`);
    },

    /**
     * Get products from a supplier
     */
    async getProducts(
        id: string,
        params?: { search?: string; category?: string; page?: number; limit?: number }
    ): Promise<ApiResponse<SupplierProduct[]> & { meta?: PaginationMeta }> {
        return get<SupplierProduct[]>(`/v1/suppliers/${id}/products`, { params });
    },
};

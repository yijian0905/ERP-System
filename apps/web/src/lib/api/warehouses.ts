/**
 * Warehouses API functions
 */

import type { ApiResponse, PaginationMeta } from '@erp/shared-types';
import { get, post, patch, del } from '../api-client';

export interface Warehouse {
    id: string;
    code: string;
    name: string;
    type: 'WAREHOUSE' | 'STORE' | 'VIRTUAL';
    address: string | null;
    phone: string | null;
    email: string | null;
    manager: string | null;
    isDefault: boolean;
    isActive: boolean;
    itemCount: number;
    totalValue: number;
    capacityUsed: number;
    createdAt: string;
    updatedAt: string;
}

export interface WarehouseInventoryItem {
    id: string;
    productId: string;
    productName: string;
    sku: string;
    category: string;
    quantity: number;
    reservedQty: number;
    availableQty: number;
    unitCost: number;
    totalValue: number;
    reorderPoint: number;
    location: string | null;
}

export interface CreateWarehouseData {
    code: string;
    name: string;
    type?: 'WAREHOUSE' | 'STORE' | 'VIRTUAL';
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    manager?: string | null;
    isDefault?: boolean;
    isActive?: boolean;
}

export interface UpdateWarehouseData {
    code?: string;
    name?: string;
    type?: 'WAREHOUSE' | 'STORE' | 'VIRTUAL';
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    manager?: string | null;
    isDefault?: boolean;
    isActive?: boolean;
}

export interface WarehouseListParams {
    page?: number;
    limit?: number;
    search?: string;
    type?: 'WAREHOUSE' | 'STORE' | 'VIRTUAL';
    isActive?: boolean;
}

export const warehousesApi = {
    /**
     * Get list of warehouses
     */
    async list(params?: WarehouseListParams): Promise<ApiResponse<Warehouse[]> & { meta?: PaginationMeta }> {
        return get<Warehouse[]>('/v1/warehouses', { params });
    },

    /**
     * Get a single warehouse by ID
     */
    async getById(id: string): Promise<ApiResponse<Warehouse>> {
        return get<Warehouse>(`/v1/warehouses/${id}`);
    },

    /**
     * Create a new warehouse
     */
    async create(data: CreateWarehouseData): Promise<ApiResponse<Warehouse>> {
        return post<Warehouse>('/v1/warehouses', data);
    },

    /**
     * Update a warehouse
     */
    async update(id: string, data: UpdateWarehouseData): Promise<ApiResponse<Warehouse>> {
        return patch<Warehouse>(`/v1/warehouses/${id}`, data);
    },

    /**
     * Delete a warehouse
     */
    async delete(id: string): Promise<ApiResponse<{ message: string }>> {
        return del<{ message: string }>(`/v1/warehouses/${id}`);
    },

    /**
     * Set warehouse as default
     */
    async setDefault(id: string): Promise<ApiResponse<{ message: string }>> {
        return post<{ message: string }>(`/v1/warehouses/${id}/set-default`);
    },

    /**
     * Get inventory for a warehouse
     */
    async getInventory(
        id: string,
        params?: { search?: string; page?: number; limit?: number }
    ): Promise<ApiResponse<WarehouseInventoryItem[]> & { meta?: PaginationMeta }> {
        return get<WarehouseInventoryItem[]>(`/v1/warehouses/${id}/inventory`, { params });
    },
};

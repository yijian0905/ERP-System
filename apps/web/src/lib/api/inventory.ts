/**
 * Inventory API functions
 */

import type { ApiResponse, PaginationMeta } from '@erp/shared-types';
import { get, post } from '../api-client';

export interface InventoryItem {
    id: string;
    productId: string;
    productName: string;
    sku: string;
    warehouseId: string;
    warehouseName: string;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    minStock: number;
    maxStock: number;
    reorderPoint: number;
    lastUpdated: string;
}

export interface StockMovement {
    id: string;
    type: 'IN' | 'OUT' | 'TRANSFER';
    productId: string;
    productName: string;
    quantity: number;
    fromLocation: string | null;
    toLocation: string | null;
    reference: string;
    notes: string;
    createdAt: string;
    createdBy: string;
}

export interface StockAdjustment {
    id: string;
    type: 'INCREASE' | 'DECREASE';
    productId: string;
    productName: string;
    quantity: number;
    reason: string;
    notes: string;
    createdAt: string;
    createdBy: string;
}

export interface InventoryListParams {
    page?: number;
    limit?: number;
    warehouseId?: string;
    lowStockOnly?: boolean;
}

export interface CreateAdjustmentData {
    productId: string;
    type: 'INCREASE' | 'DECREASE';
    quantity: number;
    reason: string;
    notes?: string;
}

export interface CreateTransferData {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    notes?: string;
}

export const inventoryApi = {
    /**
     * Get inventory list
     */
    async list(params?: InventoryListParams): Promise<ApiResponse<InventoryItem[]> & { meta?: PaginationMeta }> {
        return get<InventoryItem[]>('/v1/inventory', { params });
    },

    /**
     * Get stock movements
     */
    async getMovements(params?: { page?: number; limit?: number }): Promise<ApiResponse<StockMovement[]> & { meta?: PaginationMeta }> {
        return get<StockMovement[]>('/v1/inventory/movements', { params });
    },

    /**
     * Get stock adjustments
     */
    async getAdjustments(params?: { page?: number; limit?: number }): Promise<ApiResponse<StockAdjustment[]> & { meta?: PaginationMeta }> {
        return get<StockAdjustment[]>('/v1/inventory/adjustments', { params });
    },

    /**
     * Create stock adjustment
     */
    async createAdjustment(data: CreateAdjustmentData): Promise<ApiResponse<StockAdjustment>> {
        return post<StockAdjustment>('/v1/inventory/adjustments', data);
    },

    /**
     * Create stock transfer
     */
    async createTransfer(data: CreateTransferData): Promise<ApiResponse<StockMovement>> {
        return post<StockMovement>('/v1/inventory/transfer', data);
    },
};

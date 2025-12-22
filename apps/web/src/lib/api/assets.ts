/**
 * Assets API functions
 */

import type { ApiResponse, PaginationMeta } from '@erp/shared-types';
import { get, post, patch, del } from '../api-client';

export interface Asset {
    id: string;
    assetNumber: string;
    name: string;
    category: string;
    purchaseDate: string;
    purchasePrice: number;
    currentValue: number;
    depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
    usefulLifeYears: number;
    location: string;
    assignedTo: string | null;
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'DISPOSED';
    notes: string | null;
}

export interface AssetListParams {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
}

export interface CreateAssetData {
    name: string;
    category: string;
    purchaseDate: string;
    purchasePrice: number;
    depreciationMethod?: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
    usefulLifeYears: number;
    location: string;
    notes?: string;
}

export interface UpdateAssetData {
    name?: string;
    category?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    currentValue?: number;
    depreciationMethod?: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
    usefulLifeYears?: number;
    location?: string;
    assignedTo?: string | null;
    status?: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'DISPOSED';
    notes?: string | null;
}

export const assetsApi = {
    /**
     * Get list of assets
     */
    async list(params?: AssetListParams): Promise<ApiResponse<Asset[]> & { meta?: PaginationMeta }> {
        return get<Asset[]>('/v1/assets', { params });
    },

    /**
     * Get a single asset by ID
     */
    async getById(id: string): Promise<ApiResponse<Asset>> {
        return get<Asset>(`/v1/assets/${id}`);
    },

    /**
     * Create a new asset
     */
    async create(data: CreateAssetData): Promise<ApiResponse<Asset>> {
        return post<Asset>('/v1/assets', data);
    },

    /**
     * Update an asset
     */
    async update(id: string, data: UpdateAssetData): Promise<ApiResponse<Asset>> {
        return patch<Asset>(`/v1/assets/${id}`, data);
    },

    /**
     * Delete an asset
     */
    async delete(id: string): Promise<ApiResponse<{ message: string }>> {
        return del<{ message: string }>(`/v1/assets/${id}`);
    },
};

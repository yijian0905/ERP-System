/**
 * Cost Centers API functions
 */

import type { ApiResponse, PaginationMeta } from '@erp/shared-types';
import { get, post, patch, del } from '../api-client';

export interface CostCenter {
    id: string;
    code: string;
    name: string;
    description: string;
    budget: number;
    spent: number;
    remaining: number;
    isActive: boolean;
}

export interface CostCenterListParams {
    page?: number;
    limit?: number;
    activeOnly?: boolean;
}

export interface CreateCostCenterData {
    code: string;
    name: string;
    description?: string;
    budget: number;
}

export interface UpdateCostCenterData {
    code?: string;
    name?: string;
    description?: string;
    budget?: number;
    isActive?: boolean;
}

export const costCentersApi = {
    /**
     * Get list of cost centers
     */
    async list(params?: CostCenterListParams): Promise<ApiResponse<CostCenter[]> & { meta?: PaginationMeta }> {
        return get<CostCenter[]>('/v1/cost-centers', { params });
    },

    /**
     * Get a single cost center by ID
     */
    async getById(id: string): Promise<ApiResponse<CostCenter>> {
        return get<CostCenter>(`/v1/cost-centers/${id}`);
    },

    /**
     * Create a new cost center
     */
    async create(data: CreateCostCenterData): Promise<ApiResponse<CostCenter>> {
        return post<CostCenter>('/v1/cost-centers', data);
    },

    /**
     * Update a cost center
     */
    async update(id: string, data: UpdateCostCenterData): Promise<ApiResponse<CostCenter>> {
        return patch<CostCenter>(`/v1/cost-centers/${id}`, data);
    },

    /**
     * Delete a cost center
     */
    async delete(id: string): Promise<ApiResponse<{ message: string }>> {
        return del<{ message: string }>(`/v1/cost-centers/${id}`);
    },
};

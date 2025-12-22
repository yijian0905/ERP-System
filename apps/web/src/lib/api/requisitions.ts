/**
 * Requisitions API functions
 */

import type { ApiResponse, PaginationMeta } from '@erp/shared-types';
import { get, post, patch } from '../api-client';

export interface RequisitionItem {
    productId: string;
    productName: string;
    quantity: number;
    estimatedCost: number;
}

export interface Requisition {
    id: string;
    requisitionNumber: string;
    costCenterId: string;
    costCenterName: string;
    requesterId: string;
    requesterName: string;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED';
    items: RequisitionItem[];
    totalEstimatedCost: number;
    justification: string;
    createdAt: string;
    approvedAt: string | null;
    approvedBy: string | null;
}

export interface RequisitionListParams {
    page?: number;
    limit?: number;
    status?: string;
    costCenterId?: string;
}

export interface CreateRequisitionData {
    costCenterId: string;
    items: Array<{ productId: string; quantity: number; estimatedCost: number }>;
    justification: string;
}

export const requisitionsApi = {
    /**
     * Get list of requisitions
     */
    async list(params?: RequisitionListParams): Promise<ApiResponse<Requisition[]> & { meta?: PaginationMeta }> {
        return get<Requisition[]>('/v1/requisitions', { params });
    },

    /**
     * Get a single requisition by ID
     */
    async getById(id: string): Promise<ApiResponse<Requisition>> {
        return get<Requisition>(`/v1/requisitions/${id}`);
    },

    /**
     * Create a new requisition
     */
    async create(data: CreateRequisitionData): Promise<ApiResponse<Requisition>> {
        return post<Requisition>('/v1/requisitions', data);
    },

    /**
     * Approve a requisition
     */
    async approve(id: string): Promise<ApiResponse<Requisition>> {
        return patch<Requisition>(`/v1/requisitions/${id}/approve`, {});
    },

    /**
     * Reject a requisition
     */
    async reject(id: string, reason?: string): Promise<ApiResponse<Requisition>> {
        return patch<Requisition>(`/v1/requisitions/${id}/reject`, { reason });
    },
};

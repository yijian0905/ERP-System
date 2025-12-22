/**
 * Roles API functions
 */

import type { ApiResponse, PaginationMeta, RoleWithPermissions, PermissionRecord } from '@erp/shared-types';
import { get, post, patch, del } from '../api-client';

export interface RoleListParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
}

export interface CreateRoleData {
    name: string;
    displayName: string;
    description?: string | null;
    color?: string | null;
    permissionIds?: string[];
}

export interface UpdateRoleData {
    name?: string;
    displayName?: string;
    description?: string | null;
    color?: string | null;
    permissionIds?: string[];
    isActive?: boolean;
}

export interface RoleTemplate {
    displayName: string;
    description: string;
    color: string;
    permissionCodes: string[];
}

export const rolesApi = {
    /**
     * Get list of roles
     */
    async list(params?: RoleListParams): Promise<ApiResponse<RoleWithPermissions[]> & { meta?: PaginationMeta }> {
        return get<RoleWithPermissions[]>('/v1/roles', { params });
    },

    /**
     * Get a single role by ID
     */
    async getById(id: string): Promise<ApiResponse<RoleWithPermissions>> {
        return get<RoleWithPermissions>(`/v1/roles/${id}`);
    },

    /**
     * Create a new role
     */
    async create(data: CreateRoleData): Promise<ApiResponse<RoleWithPermissions>> {
        return post<RoleWithPermissions>('/v1/roles', data);
    },

    /**
     * Update a role
     */
    async update(id: string, data: UpdateRoleData): Promise<ApiResponse<RoleWithPermissions>> {
        return patch<RoleWithPermissions>(`/v1/roles/${id}`, data);
    },

    /**
     * Delete a role
     */
    async delete(id: string): Promise<ApiResponse<{ message: string }>> {
        return del<{ message: string }>(`/v1/roles/${id}`);
    },

    /**
     * Get available permissions
     */
    async getPermissions(): Promise<ApiResponse<PermissionRecord[]>> {
        return get<PermissionRecord[]>('/v1/roles/permissions');
    },

    /**
     * Get role templates
     */
    async getTemplates(): Promise<ApiResponse<Record<string, RoleTemplate>>> {
        return get<Record<string, RoleTemplate>>('/v1/roles/templates');
    },

    /**
     * Create role from template
     */
    async createFromTemplate(templateName: string): Promise<ApiResponse<RoleWithPermissions>> {
        return post<RoleWithPermissions>('/v1/roles/from-template', { templateName });
    },
};

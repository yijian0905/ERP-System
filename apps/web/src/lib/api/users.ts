/**
 * Users API functions
 */

import type { ApiResponse, PaginationMeta } from '@erp/shared-types';
import { get, post, patch, del } from '../api-client';

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER' | 'CUSTOM';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    permissions: string[];
    isActive: boolean;
    department?: string;
    position?: string;
    lastLogin: string | null;
    createdAt: string;
}

export interface UserListParams {
    page?: number;
    limit?: number;
    role?: UserRole;
    activeOnly?: boolean;
}

export interface CreateUserData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    permissions?: string[];
    department?: string;
    position?: string;
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    role?: UserRole;
    permissions?: string[];
    isActive?: boolean;
    department?: string;
    position?: string;
}

export const usersApi = {
    /**
     * Get list of users
     */
    async list(params?: UserListParams): Promise<ApiResponse<User[]> & { meta?: PaginationMeta }> {
        return get<User[]>('/v1/users', { params });
    },

    /**
     * Get a single user by ID
     */
    async getById(id: string): Promise<ApiResponse<User>> {
        return get<User>(`/v1/users/${id}`);
    },

    /**
     * Create a new user
     */
    async create(data: CreateUserData): Promise<ApiResponse<User>> {
        return post<User>('/v1/users', data);
    },

    /**
     * Update a user
     */
    async update(id: string, data: UpdateUserData): Promise<ApiResponse<User>> {
        return patch<User>(`/v1/users/${id}`, data);
    },

    /**
     * Delete a user
     */
    async delete(id: string): Promise<ApiResponse<{ message: string }>> {
        return del<{ message: string }>(`/v1/users/${id}`);
    },

    /**
     * Reset user password
     */
    async resetPassword(id: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
        return post<{ message: string }>(`/v1/users/${id}/reset-password`, { newPassword });
    },
};

/**
 * Products API functions
 */

import type { ApiResponse, PaginationMeta } from '@erp/shared-types';
import { get, post, patch, del } from '../api-client';

export interface Product {
    id: string;
    sku: string;
    name: string;
    description: string;
    category: string;
    price: number;
    cost: number;
    stock: number;
    minStock: number;
    maxStock: number;
    reorderPoint: number;
    status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
    createdAt: string;
}

export interface Category {
    id: string;
    name: string;
    prefix: string;
    isNonSellable?: boolean;
}

export interface ProductListParams {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
}

export interface CreateProductData {
    sku: string;
    name: string;
    description?: string;
    category: string;
    price: number;
    cost?: number;
    stock?: number;
    minStock?: number;
    maxStock?: number;
    reorderPoint?: number;
}

export interface UpdateProductData {
    sku?: string;
    name?: string;
    description?: string;
    category?: string;
    price?: number;
    cost?: number;
    stock?: number;
    minStock?: number;
    maxStock?: number;
    reorderPoint?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
}

export const productsApi = {
    /**
     * Get list of products
     */
    async list(params?: ProductListParams): Promise<ApiResponse<Product[]> & { meta?: PaginationMeta }> {
        return get<Product[]>('/v1/products', { params });
    },

    /**
     * Get a single product by ID
     */
    async getById(id: string): Promise<ApiResponse<Product>> {
        return get<Product>(`/v1/products/${id}`);
    },

    /**
     * Create a new product
     */
    async create(data: CreateProductData): Promise<ApiResponse<Product>> {
        return post<Product>('/v1/products', data);
    },

    /**
     * Update a product
     */
    async update(id: string, data: UpdateProductData): Promise<ApiResponse<Product>> {
        return patch<Product>(`/v1/products/${id}`, data);
    },

    /**
     * Delete a product
     */
    async delete(id: string): Promise<ApiResponse<{ message: string }>> {
        return del<{ message: string }>(`/v1/products/${id}`);
    },

    /**
     * Get product categories
     */
    async getCategories(): Promise<ApiResponse<Category[]>> {
        return get<Category[]>('/v1/products/categories');
    },
};

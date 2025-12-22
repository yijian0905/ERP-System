/**
 * Orders API functions
 */

import type { ApiResponse, PaginationMeta } from '@erp/shared-types';
import { get, post, patch } from '../api-client';

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface SalesOrder {
    id: string;
    orderNumber: string;
    type: 'SALES';
    customerId: string;
    customerName: string;
    status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    createdAt: string;
}

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    type: 'PURCHASE';
    supplierId: string;
    supplierName: string;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    createdAt: string;
}

export type Order = SalesOrder | PurchaseOrder;

export interface OrderListParams {
    page?: number;
    limit?: number;
    type?: 'SALES' | 'PURCHASE';
    status?: string;
    search?: string;
}

export interface CreateSalesOrderData {
    customerId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    tax?: number;
}

export interface CreatePurchaseOrderData {
    supplierId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    tax?: number;
}

export const ordersApi = {
    /**
     * Get unified orders list
     */
    async list(params?: OrderListParams): Promise<ApiResponse<Order[]> & { meta?: PaginationMeta }> {
        return get<Order[]>('/v1/orders', { params });
    },

    /**
     * Get sales orders
     */
    async listSales(params?: OrderListParams): Promise<ApiResponse<SalesOrder[]> & { meta?: PaginationMeta }> {
        return get<SalesOrder[]>('/v1/orders/sales', { params });
    },

    /**
     * Get purchase orders
     */
    async listPurchase(params?: OrderListParams): Promise<ApiResponse<PurchaseOrder[]> & { meta?: PaginationMeta }> {
        return get<PurchaseOrder[]>('/v1/orders/purchase', { params });
    },

    /**
     * Create a sales order
     */
    async createSalesOrder(data: CreateSalesOrderData): Promise<ApiResponse<SalesOrder>> {
        return post<SalesOrder>('/v1/orders/sales', data);
    },

    /**
     * Create a purchase order
     */
    async createPurchaseOrder(data: CreatePurchaseOrderData): Promise<ApiResponse<PurchaseOrder>> {
        return post<PurchaseOrder>('/v1/orders/purchase', data);
    },

    /**
     * Update order status
     */
    async updateStatus(id: string, status: string): Promise<ApiResponse<Order>> {
        return patch<Order>(`/v1/orders/${id}/status`, { status });
    },
};

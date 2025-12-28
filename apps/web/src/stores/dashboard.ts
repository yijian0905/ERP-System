/**
 * Dashboard Store
 * @description Global state management for dashboard data with preloading support
 * 
 * This store preloads dashboard data after login to eliminate loading delays.
 */

import { create } from 'zustand';
import { get as apiGet } from '@/lib/api-client';

// Types for dashboard data
interface DashboardStats {
    totalRevenue: number;
    orderCount: number;
    productCount: number;
    customerCount: number;
    revenueChange: number;
    ordersChange: number;
    productsChange: number;
    customersChange: number;
    paymentsReceived: number;
    outstanding: number;
    avgOrderValue: number;
    inventoryValue: number;
    paymentsReceivedChange: number;
    outstandingChange: number;
    avgOrderValueChange: number;
    inventoryValueChange: number;
}

interface SalesData {
    name: string;
    sales: number;
    orders: number;
}

interface RevenueData {
    name: string;
    revenue: number;
}

interface RecentOrder {
    id: string;
    customer: string;
    amount: string;
    status: string;
}

interface LowStockProduct {
    sku: string;
    name: string;
    stock: number;
    reorder: number;
}

interface DashboardState {
    // Data
    stats: DashboardStats;
    salesData: SalesData[];
    revenueData: RevenueData[];
    recentOrders: RecentOrder[];
    lowStockProducts: LowStockProduct[];

    // Loading state
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;

    // Last fetch time for cache invalidation
    lastFetchedAt: number | null;
}

interface DashboardActions {
    fetchDashboardData: () => Promise<void>;
    clearDashboard: () => void;
    refreshDashboard: () => Promise<void>;
    waitForPreload: () => Promise<void>;
}

type DashboardStore = DashboardState & DashboardActions;

const CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes cache for dashboard

const defaultStats: DashboardStats = {
    totalRevenue: 0,
    orderCount: 0,
    productCount: 0,
    customerCount: 0,
    revenueChange: 0,
    ordersChange: 0,
    productsChange: 0,
    customersChange: 0,
    paymentsReceived: 0,
    outstanding: 0,
    avgOrderValue: 0,
    inventoryValue: 0,
    paymentsReceivedChange: 0,
    outstandingChange: 0,
    avgOrderValueChange: 0,
    inventoryValueChange: 0,
};

const initialState: DashboardState = {
    stats: defaultStats,
    salesData: [],
    revenueData: [],
    recentOrders: [],
    lowStockProducts: [],
    isLoading: false,
    isLoaded: false,
    error: null,
    lastFetchedAt: null,
};

export const useDashboardStore = create<DashboardStore>()((set, get) => ({
    ...initialState,

    fetchDashboardData: async () => {
        const state = get();

        // Prevent duplicate fetches
        if (state.isLoading) return;

        // Check if cache is still valid
        if (state.isLoaded && state.lastFetchedAt) {
            const cacheAge = Date.now() - state.lastFetchedAt;
            if (cacheAge < CACHE_DURATION_MS) {
                return; // Use cached data
            }
        }

        set({ isLoading: true, error: null });

        try {
            // Fetch all dashboard data in parallel
            const [statsRes, salesRes, revenueRes, ordersRes, lowStockRes] = await Promise.all([
                apiGet<DashboardStats>('/v1/dashboard/stats'),
                apiGet<SalesData[]>('/v1/dashboard/sales-chart'),
                apiGet<RevenueData[]>('/v1/dashboard/revenue-trend'),
                apiGet<RecentOrder[]>('/v1/dashboard/recent-orders'),
                apiGet<LowStockProduct[]>('/v1/dashboard/low-stock'),
            ]);

            set({
                stats: statsRes.success && statsRes.data ? statsRes.data : defaultStats,
                salesData: salesRes.success && salesRes.data ? salesRes.data : [],
                revenueData: revenueRes.success && revenueRes.data ? revenueRes.data : [],
                recentOrders: ordersRes.success && ordersRes.data ? ordersRes.data : [],
                lowStockProducts: lowStockRes.success && lowStockRes.data ? lowStockRes.data : [],
                isLoading: false,
                isLoaded: true,
                error: null,
                lastFetchedAt: Date.now(),
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            set({
                isLoading: false,
                error: 'Failed to fetch dashboard data',
            });
        }
    },

    clearDashboard: () => {
        set(initialState);
    },

    refreshDashboard: async () => {
        // Force refresh by clearing cache
        set({ lastFetchedAt: null, isLoaded: false });
        await get().fetchDashboardData();
    },

    waitForPreload: () => {
        return new Promise<void>((resolve) => {
            const state = get();
            if (state.isLoaded || state.error) {
                resolve();
                return;
            }

            // Poll for completion
            const checkLoaded = () => {
                const currentState = get();
                if (currentState.isLoaded || currentState.error) {
                    resolve();
                } else {
                    setTimeout(checkLoaded, 100);
                }
            };
            checkLoaded();
        });
    },
}));

// Export types for use in components
export type { DashboardStats, SalesData, RevenueData, RecentOrder, LowStockProduct };


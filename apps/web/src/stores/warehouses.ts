/**
 * Warehouses Store
 * @description Global state management for warehouses data with preloading support
 */

import { create } from 'zustand';
import { warehousesApi, type Warehouse } from '@/lib/api/warehouses';

interface WarehousesState {
    // Data
    warehouses: Warehouse[];

    // Loading state
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;

    // Last fetch time for cache invalidation
    lastFetchedAt: number | null;
}

interface WarehousesActions {
    fetchWarehouses: () => Promise<void>;
    addWarehouse: (warehouse: Warehouse) => void;
    updateWarehouse: (id: string, warehouse: Warehouse) => void;
    removeWarehouse: (id: string) => void;
    clearWarehouses: () => void;
    refreshWarehouses: () => Promise<void>;
}

type WarehousesStore = WarehousesState & WarehousesActions;

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

const initialState: WarehousesState = {
    warehouses: [],
    isLoading: false,
    isLoaded: false,
    error: null,
    lastFetchedAt: null,
};

export const useWarehousesStore = create<WarehousesStore>()((set, get) => ({
    ...initialState,

    fetchWarehouses: async () => {
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
            const response = await warehousesApi.list({ limit: 1000 });

            if (response.success && response.data) {
                set({
                    warehouses: response.data,
                    isLoading: false,
                    isLoaded: true,
                    error: null,
                    lastFetchedAt: Date.now(),
                });
            } else {
                set({
                    isLoading: false,
                    error: response.error?.message || 'Failed to fetch warehouses',
                });
            }
        } catch (error) {
            console.error('Failed to fetch warehouses:', error);
            set({
                isLoading: false,
                error: 'Failed to fetch warehouses',
            });
        }
    },

    addWarehouse: (warehouse: Warehouse) => {
        set((state) => ({
            warehouses: [warehouse, ...state.warehouses],
        }));
    },

    updateWarehouse: (id: string, warehouse: Warehouse) => {
        set((state) => ({
            warehouses: state.warehouses.map((w) =>
                w.id === id ? warehouse : w
            ),
        }));
    },

    removeWarehouse: (id: string) => {
        set((state) => ({
            warehouses: state.warehouses.filter((w) => w.id !== id),
        }));
    },

    clearWarehouses: () => {
        set(initialState);
    },

    refreshWarehouses: async () => {
        // Force refresh by clearing cache
        set({ lastFetchedAt: null, isLoaded: false });
        await get().fetchWarehouses();
    },
}));

/**
 * Hook to get warehouses list
 */
export function useWarehouses(): Warehouse[] {
    return useWarehousesStore((state) => state.warehouses);
}

/**
 * Hook to check if warehouses are loading
 */
export function useWarehousesLoading(): boolean {
    return useWarehousesStore((state) => state.isLoading);
}

/**
 * Hook to check if warehouses are loaded
 */
export function useWarehousesLoaded(): boolean {
    return useWarehousesStore((state) => state.isLoaded);
}

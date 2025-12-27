/**
 * Suppliers Store
 * @description Global state management for suppliers data with preloading support
 */

import { create } from 'zustand';
import { suppliersApi, type Supplier } from '@/lib/api/suppliers';

interface SuppliersState {
    // Data
    suppliers: Supplier[];

    // Loading state
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;

    // Last fetch time for cache invalidation
    lastFetchedAt: number | null;
}

interface SuppliersActions {
    fetchSuppliers: () => Promise<void>;
    addSupplier: (supplier: Supplier) => void;
    updateSupplier: (id: string, supplier: Supplier) => void;
    removeSupplier: (id: string) => void;
    clearSuppliers: () => void;
    refreshSuppliers: () => Promise<void>;
}

type SuppliersStore = SuppliersState & SuppliersActions;

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

const initialState: SuppliersState = {
    suppliers: [],
    isLoading: false,
    isLoaded: false,
    error: null,
    lastFetchedAt: null,
};

export const useSuppliersStore = create<SuppliersStore>()((set, get) => ({
    ...initialState,

    fetchSuppliers: async () => {
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
            const response = await suppliersApi.list({ limit: 1000 });

            if (response.success && response.data) {
                set({
                    suppliers: response.data,
                    isLoading: false,
                    isLoaded: true,
                    error: null,
                    lastFetchedAt: Date.now(),
                });
            } else {
                set({
                    isLoading: false,
                    error: response.error?.message || 'Failed to fetch suppliers',
                });
            }
        } catch (error) {
            console.error('Failed to fetch suppliers:', error);
            set({
                isLoading: false,
                error: 'Failed to fetch suppliers',
            });
        }
    },

    addSupplier: (supplier: Supplier) => {
        set((state) => ({
            suppliers: [supplier, ...state.suppliers],
        }));
    },

    updateSupplier: (id: string, supplier: Supplier) => {
        set((state) => ({
            suppliers: state.suppliers.map((s) =>
                s.id === id ? supplier : s
            ),
        }));
    },

    removeSupplier: (id: string) => {
        set((state) => ({
            suppliers: state.suppliers.filter((s) => s.id !== id),
        }));
    },

    clearSuppliers: () => {
        set(initialState);
    },

    refreshSuppliers: async () => {
        // Force refresh by clearing cache
        set({ lastFetchedAt: null, isLoaded: false });
        await get().fetchSuppliers();
    },
}));

/**
 * Hook to get suppliers list
 */
export function useSuppliers(): Supplier[] {
    return useSuppliersStore((state) => state.suppliers);
}

/**
 * Hook to check if suppliers are loading
 */
export function useSuppliersLoading(): boolean {
    return useSuppliersStore((state) => state.isLoading);
}

/**
 * Hook to check if suppliers are loaded
 */
export function useSuppliersLoaded(): boolean {
    return useSuppliersStore((state) => state.isLoaded);
}

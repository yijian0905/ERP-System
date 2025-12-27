/**
 * Inventory Store
 * @description Global state management for inventory data with preloading support
 */

import { create } from 'zustand';
import { inventoryApi, type InventoryItem, type StockMovement, type StockAdjustment } from '@/lib/api/inventory';

interface InventoryState {
    // Data
    items: InventoryItem[];
    movements: StockMovement[];
    adjustments: StockAdjustment[];

    // Loading state
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;

    // Last fetch time for cache invalidation
    lastFetchedAt: number | null;
}

interface InventoryActions {
    fetchInventory: () => Promise<void>;
    fetchMovements: () => Promise<void>;
    fetchAdjustments: () => Promise<void>;
    addMovement: (movement: StockMovement) => void;
    addAdjustment: (adjustment: StockAdjustment) => void;
    updateItem: (id: string, item: InventoryItem) => void;
    clearInventory: () => void;
    refreshInventory: () => Promise<void>;
}

type InventoryStore = InventoryState & InventoryActions;

const CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes cache (more dynamic data)

const initialState: InventoryState = {
    items: [],
    movements: [],
    adjustments: [],
    isLoading: false,
    isLoaded: false,
    error: null,
    lastFetchedAt: null,
};

export const useInventoryStore = create<InventoryStore>()((set, get) => ({
    ...initialState,

    fetchInventory: async () => {
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
            const [itemsRes, movementsRes, adjustmentsRes] = await Promise.all([
                inventoryApi.list({ limit: 1000 }),
                inventoryApi.getMovements({ limit: 100 }),
                inventoryApi.getAdjustments({ limit: 100 }),
            ]);

            set({
                items: itemsRes.success && itemsRes.data ? itemsRes.data : [],
                movements: movementsRes.success && movementsRes.data ? movementsRes.data : [],
                adjustments: adjustmentsRes.success && adjustmentsRes.data ? adjustmentsRes.data : [],
                isLoading: false,
                isLoaded: true,
                error: null,
                lastFetchedAt: Date.now(),
            });
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            set({
                isLoading: false,
                error: 'Failed to fetch inventory',
            });
        }
    },

    fetchMovements: async () => {
        try {
            const response = await inventoryApi.getMovements({ limit: 100 });
            if (response.success && response.data) {
                set({ movements: response.data });
            }
        } catch (error) {
            console.error('Failed to fetch movements:', error);
        }
    },

    fetchAdjustments: async () => {
        try {
            const response = await inventoryApi.getAdjustments({ limit: 100 });
            if (response.success && response.data) {
                set({ adjustments: response.data });
            }
        } catch (error) {
            console.error('Failed to fetch adjustments:', error);
        }
    },

    addMovement: (movement: StockMovement) => {
        set((state) => ({
            movements: [movement, ...state.movements],
        }));
    },

    addAdjustment: (adjustment: StockAdjustment) => {
        set((state) => ({
            adjustments: [adjustment, ...state.adjustments],
        }));
    },

    updateItem: (id: string, item: InventoryItem) => {
        set((state) => ({
            items: state.items.map((i) =>
                i.id === id ? item : i
            ),
        }));
    },

    clearInventory: () => {
        set(initialState);
    },

    refreshInventory: async () => {
        // Force refresh by clearing cache
        set({ lastFetchedAt: null, isLoaded: false });
        await get().fetchInventory();
    },
}));

/**
 * Hook to get inventory items
 */
export function useInventoryItems(): InventoryItem[] {
    return useInventoryStore((state) => state.items);
}

/**
 * Hook to get stock movements
 */
export function useStockMovements(): StockMovement[] {
    return useInventoryStore((state) => state.movements);
}

/**
 * Hook to get stock adjustments
 */
export function useStockAdjustments(): StockAdjustment[] {
    return useInventoryStore((state) => state.adjustments);
}

/**
 * Hook to check if inventory is loading
 */
export function useInventoryLoading(): boolean {
    return useInventoryStore((state) => state.isLoading);
}

/**
 * Hook to check if inventory is loaded
 */
export function useInventoryLoaded(): boolean {
    return useInventoryStore((state) => state.isLoaded);
}

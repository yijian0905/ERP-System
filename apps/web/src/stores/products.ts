/**
 * Products Store
 * @description Global state management for products data with preloading support
 */

import { create } from 'zustand';
import { productsApi, type Product, type Category } from '@/lib/api/products';

interface ProductsState {
    // Data
    products: Product[];
    categories: Category[];

    // Loading state
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;

    // Last fetch time for cache invalidation
    lastFetchedAt: number | null;
}

interface ProductsActions {
    fetchProducts: () => Promise<void>;
    fetchCategories: () => Promise<void>;
    addProduct: (product: Product) => void;
    updateProduct: (id: string, product: Product) => void;
    removeProduct: (id: string) => void;
    clearProducts: () => void;
    refreshProducts: () => Promise<void>;
}

type ProductsStore = ProductsState & ProductsActions;

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

const initialState: ProductsState = {
    products: [],
    categories: [],
    isLoading: false,
    isLoaded: false,
    error: null,
    lastFetchedAt: null,
};

export const useProductsStore = create<ProductsStore>()((set, get) => ({
    ...initialState,

    fetchProducts: async () => {
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
            const [productsRes, categoriesRes] = await Promise.all([
                productsApi.list({ limit: 1000 }),
                productsApi.getCategories(),
            ]);

            set({
                products: productsRes.success && productsRes.data ? productsRes.data : [],
                categories: categoriesRes.success && categoriesRes.data ? categoriesRes.data : [],
                isLoading: false,
                isLoaded: true,
                error: null,
                lastFetchedAt: Date.now(),
            });
        } catch (error) {
            console.error('Failed to fetch products:', error);
            set({
                isLoading: false,
                error: 'Failed to fetch products',
            });
        }
    },

    fetchCategories: async () => {
        try {
            const response = await productsApi.getCategories();
            if (response.success && response.data) {
                set({ categories: response.data });
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    },

    addProduct: (product: Product) => {
        set((state) => ({
            products: [product, ...state.products],
        }));
    },

    updateProduct: (id: string, product: Product) => {
        set((state) => ({
            products: state.products.map((p) =>
                p.id === id ? product : p
            ),
        }));
    },

    removeProduct: (id: string) => {
        set((state) => ({
            products: state.products.filter((p) => p.id !== id),
        }));
    },

    clearProducts: () => {
        set(initialState);
    },

    refreshProducts: async () => {
        // Force refresh by clearing cache
        set({ lastFetchedAt: null, isLoaded: false });
        await get().fetchProducts();
    },
}));

/**
 * Hook to get products list
 */
export function useProducts(): Product[] {
    return useProductsStore((state) => state.products);
}

/**
 * Hook to get categories list
 */
export function useCategories(): Category[] {
    return useProductsStore((state) => state.categories);
}

/**
 * Hook to check if products are loading
 */
export function useProductsLoading(): boolean {
    return useProductsStore((state) => state.isLoading);
}

/**
 * Hook to check if products are loaded
 */
export function useProductsLoaded(): boolean {
    return useProductsStore((state) => state.isLoaded);
}

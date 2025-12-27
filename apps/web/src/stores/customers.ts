/**
 * Customers Store
 * @description Global state management for customers data with preloading support
 * 
 * This store preloads customers data after login to eliminate loading delays
 * when navigating to the customers page.
 */

import { create } from 'zustand';
import { customersApi, type Customer } from '@/lib/api/customers';

interface CustomersState {
    // Data
    customers: Customer[];

    // Loading state
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;

    // Last fetch time for cache invalidation
    lastFetchedAt: number | null;
}

interface CustomersActions {
    // Fetch customers from API
    fetchCustomers: () => Promise<void>;

    // Add a new customer to the store
    addCustomer: (customer: Customer) => void;

    // Update a customer in the store
    updateCustomer: (id: string, customer: Customer) => void;

    // Remove a customer from the store
    removeCustomer: (id: string) => void;

    // Clear all customers (on logout)
    clearCustomers: () => void;

    // Force refresh
    refreshCustomers: () => Promise<void>;
}

type CustomersStore = CustomersState & CustomersActions;

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

const initialState: CustomersState = {
    customers: [],
    isLoading: false,
    isLoaded: false,
    error: null,
    lastFetchedAt: null,
};

export const useCustomersStore = create<CustomersStore>()((set, get) => ({
    ...initialState,

    fetchCustomers: async () => {
        const { isLoading, isLoaded, lastFetchedAt } = get();

        // Prevent duplicate fetches
        if (isLoading) return;

        // Check if cache is still valid
        if (isLoaded && lastFetchedAt) {
            const cacheAge = Date.now() - lastFetchedAt;
            if (cacheAge < CACHE_DURATION_MS) {
                return; // Use cached data
            }
        }

        set({ isLoading: true, error: null });

        try {
            const response = await customersApi.list({ limit: 1000 }); // Fetch all

            if (response.success && response.data) {
                set({
                    customers: response.data,
                    isLoading: false,
                    isLoaded: true,
                    error: null,
                    lastFetchedAt: Date.now(),
                });
            } else {
                set({
                    isLoading: false,
                    error: response.error?.message || 'Failed to fetch customers',
                });
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
            set({
                isLoading: false,
                error: 'Failed to fetch customers',
            });
        }
    },

    addCustomer: (customer: Customer) => {
        set((state) => ({
            customers: [customer, ...state.customers],
        }));
    },

    updateCustomer: (id: string, customer: Customer) => {
        set((state) => ({
            customers: state.customers.map((c) =>
                c.id === id ? customer : c
            ),
        }));
    },

    removeCustomer: (id: string) => {
        set((state) => ({
            customers: state.customers.filter((c) => c.id !== id),
        }));
    },

    clearCustomers: () => {
        set(initialState);
    },

    refreshCustomers: async () => {
        // Force refresh by clearing cache
        set({ lastFetchedAt: null, isLoaded: false });
        await get().fetchCustomers();
    },
}));

/**
 * Hook to get customers list
 */
export function useCustomers(): Customer[] {
    return useCustomersStore((state) => state.customers);
}

/**
 * Hook to check if customers are loading
 */
export function useCustomersLoading(): boolean {
    return useCustomersStore((state) => state.isLoading);
}

/**
 * Hook to check if customers are loaded
 */
export function useCustomersLoaded(): boolean {
    return useCustomersStore((state) => state.isLoaded);
}

/**
 * Data Preloader Service
 * @description Preloads essential data after successful login to eliminate
 *              loading delays when navigating to different pages.
 * 
 * This service is called once after login and preloads:
 * - Dashboard data (stats, charts, recent orders, low stock)
 * - Customers
 * - Products (with categories)
 * - Suppliers
 * - Warehouses
 * - Inventory
 * 
 * Benefits:
 * - Eliminates "flash of empty content" when navigating
 * - Improves perceived performance
 * - Enables offline-like experience
 */

import { useCustomersStore } from '@/stores/customers';
import { useDashboardStore } from '@/stores/dashboard';
import { useProductsStore } from '@/stores/products';
import { useSuppliersStore } from '@/stores/suppliers';
import { useWarehousesStore } from '@/stores/warehouses';
import { useInventoryStore } from '@/stores/inventory';

/**
 * Preload all essential data for the tenant
 * Call this after successful authentication
 */
export async function preloadTenantData(): Promise<void> {
    console.log('[Preloader] Starting data preload...');

    // Run all preloads in parallel for speed
    const preloadPromises: Promise<void>[] = [];

    // Preload dashboard data (highest priority - first page user sees)
    preloadPromises.push(
        useDashboardStore.getState().fetchDashboardData()
            .then(() => console.log('[Preloader] Dashboard data loaded'))
            .catch((err) => console.error('[Preloader] Dashboard failed:', err))
    );

    // Preload customers
    preloadPromises.push(
        useCustomersStore.getState().fetchCustomers()
            .then(() => console.log('[Preloader] Customers loaded'))
            .catch((err) => console.error('[Preloader] Customers failed:', err))
    );

    // Preload products (includes categories)
    preloadPromises.push(
        useProductsStore.getState().fetchProducts()
            .then(() => console.log('[Preloader] Products loaded'))
            .catch((err) => console.error('[Preloader] Products failed:', err))
    );

    // Preload suppliers
    preloadPromises.push(
        useSuppliersStore.getState().fetchSuppliers()
            .then(() => console.log('[Preloader] Suppliers loaded'))
            .catch((err) => console.error('[Preloader] Suppliers failed:', err))
    );

    // Preload warehouses
    preloadPromises.push(
        useWarehousesStore.getState().fetchWarehouses()
            .then(() => console.log('[Preloader] Warehouses loaded'))
            .catch((err) => console.error('[Preloader] Warehouses failed:', err))
    );

    // Preload inventory
    preloadPromises.push(
        useInventoryStore.getState().fetchInventory()
            .then(() => console.log('[Preloader] Inventory loaded'))
            .catch((err) => console.error('[Preloader] Inventory failed:', err))
    );

    // Wait for all preloads to complete (don't fail if one fails)
    await Promise.allSettled(preloadPromises);

    console.log('[Preloader] Data preload complete');
}

/**
 * Clear all preloaded data (call on logout)
 */
export function clearPreloadedData(): void {
    console.log('[Preloader] Clearing preloaded data...');
    useDashboardStore.getState().clearDashboard();
    useCustomersStore.getState().clearCustomers();
    useProductsStore.getState().clearProducts();
    useSuppliersStore.getState().clearSuppliers();
    useWarehousesStore.getState().clearWarehouses();
    useInventoryStore.getState().clearInventory();
}

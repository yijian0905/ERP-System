/**
 * Product Module Utilities
 * Helper functions for product management
 */

import type { Product, Category } from './types';

/**
 * Generate SKU for a new product
 */
export function generateSKU(categoryId: string, categories: Category[], products: Product[]): string {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';
    const existingCount = products.filter(p => p.category === category.name).length;
    return `${category.prefix}-${String(existingCount + 1).padStart(3, '0')}`;
}

/**
 * Generate category ID from name
 */
export function generateCategoryId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4);
}

/**
 * Generate category prefix from name
 */
export function generateCategoryPrefix(name: string): string {
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length === 1) {
        return words[0].substring(0, 4).toUpperCase();
    }
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

/**
 * Calculate product margin percentage
 */
export function calculateMargin(price: number, cost: number): string {
    if (price <= 0) return '0';
    return ((price - cost) / price * 100).toFixed(0);
}

/**
 * Check if product is low stock
 */
export function isLowStock(product: Product): boolean {
    return product.stock <= product.reorderPoint && product.stock > 0;
}

/**
 * Check if product is out of stock
 */
export function isOutOfStock(product: Product): boolean {
    return product.stock === 0;
}

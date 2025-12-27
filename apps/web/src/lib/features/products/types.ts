/**
 * Product Module Types
 * Extracted from products.tsx for better maintainability
 */

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

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
    status: ProductStatus;
    createdAt: string;
}

/**
 * Category type - simplified for product form
 */
export interface Category {
    id: string;
    name: string;
    prefix: string;
    isNonSellable?: boolean;
}

/**
 * Category type - full for category management
 */
export interface CategoryFull {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    productCount: number;
    isActive: boolean;
    sortOrder: number;
    children?: CategoryFull[];
}

export type TabType = 'products' | 'consumables';

export interface ProductFormData {
    name: string;
    description: string;
    category: string;
    price: number;
    cost: number;
    minStock: number;
    maxStock: number;
    reorderPoint: number;
    status: ProductStatus;
}

export interface CategoryFormData {
    name: string;
    description: string;
}

export const statusConfig: Record<ProductStatus, { label: string; color: string }> = {
    ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    DISCONTINUED: { label: 'Discontinued', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export const initialProductFormData: ProductFormData = {
    name: '',
    description: '',
    category: '',
    price: 0,
    cost: 0,
    minStock: 10,
    maxStock: 500,
    reorderPoint: 25,
    status: 'ACTIVE',
};

export const initialCategoryFormData: CategoryFormData = {
    name: '',
    description: '',
};

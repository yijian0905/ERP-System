/**
 * Products Feature Module
 * 
 * This module contains all product-related code extracted from the
 * original monolithic products.tsx (1219 lines) for better maintainability.
 * 
 * Structure:
 * - types.ts: Type definitions and constants
 * - utils.ts: Helper functions
 * - useProducts.ts: Data fetching hook
 * - ProductTable.tsx: Table component
 * - ProductForm.tsx: Form dialog component
 */

// Types
export type {
    Product,
    ProductStatus,
    Category,
    CategoryFull,
    TabType,
    ProductFormData,
    CategoryFormData,
} from './types';

export {
    statusConfig,
    initialProductFormData,
    initialCategoryFormData,
} from './types';

// Utilities
export {
    generateSKU,
    generateCategoryId,
    generateCategoryPrefix,
    formatCurrency,
    calculateMargin,
    isLowStock,
    isOutOfStock,
} from './utils';

// Hooks
export { useProducts } from './useProducts';

// Components
export { ProductTable } from './ProductTable';
export { ProductForm } from './ProductForm';

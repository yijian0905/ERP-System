/**
 * Assets Feature Module
 */

// Types
export type {
    AssetType,
    AssetStatus,
    AssetCategory,
    DepreciationMethod,
    Asset,
    AssetFormData,
    Employee,
} from './types';

export {
    assetTypeConfig,
    categoryConfig,
    statusConfig,
    initialLocations,
    defaultEmployees,
    initialAssetFormData,
} from './types';

// Utilities
export {
    generateAssetTag,
    formatCurrency,
    isWarrantyExpired,
    calculateCurrentValue,
    calculateAssetStats,
    calculateDepreciationPercent,
} from './utils';

// Hooks
export { useAssets } from './useAssets';

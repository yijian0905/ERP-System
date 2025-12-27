/**
 * Assets Module Utilities
 * Helper functions for asset management
 */

import type { Asset, DepreciationMethod, AssetType } from './types';

/**
 * Generate asset tag
 */
export function generateAssetTag(existingCount: number): string {
    const year = new Date().getFullYear();
    return `AST-${year}-${String(existingCount + 1).padStart(4, '0')}`;
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
 * Check if warranty is expired
 */
export function isWarrantyExpired(warrantyExpiry: string | null): boolean | null {
    if (!warrantyExpiry) return null;
    return new Date(warrantyExpiry) < new Date();
}

/**
 * Calculate current value based on depreciation
 */
export function calculateCurrentValue(
    purchaseCost: number,
    purchaseDate: string,
    usefulLifeYears: number,
    salvageValue: number,
    method: DepreciationMethod,
    assetType: AssetType
): number {
    // Current assets don't depreciate
    if (assetType === 'CURRENT' || method === 'NONE') return purchaseCost;

    const now = new Date();
    const purchase = new Date(purchaseDate);
    const yearsElapsed = (now.getTime() - purchase.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    if (yearsElapsed >= usefulLifeYears) return salvageValue;

    if (method === 'STRAIGHT_LINE') {
        const annualDepreciation = (purchaseCost - salvageValue) / usefulLifeYears;
        return Math.max(salvageValue, purchaseCost - (annualDepreciation * yearsElapsed));
    } else if (method === 'DECLINING_BALANCE') {
        const rate = 2 / usefulLifeYears;
        let value = purchaseCost;
        for (let i = 0; i < Math.floor(yearsElapsed); i++) {
            value = Math.max(salvageValue, value * (1 - rate));
        }
        return value;
    }
    return purchaseCost;
}

/**
 * Calculate asset stats
 */
export function calculateAssetStats(assets: Asset[]) {
    const totalAssets = assets.length;
    const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
    const totalPurchaseCost = assets.reduce((sum, a) => sum + a.purchaseCost, 0);
    const totalDepreciation = totalPurchaseCost - totalValue;
    const activeAssets = assets.filter((a) => a.status === 'ACTIVE').length;
    const maintenanceAssets = assets.filter((a) => a.status === 'MAINTENANCE').length;

    const currentAssets = assets.filter((a) => a.assetType === 'CURRENT');
    const fixedAssets = assets.filter((a) => a.assetType === 'FIXED');
    const currentAssetsValue = currentAssets.reduce((sum, a) => sum + a.currentValue, 0);
    const fixedAssetsValue = fixedAssets.reduce((sum, a) => sum + a.currentValue, 0);

    return {
        totalAssets,
        totalValue,
        totalPurchaseCost,
        totalDepreciation,
        activeAssets,
        maintenanceAssets,
        currentAssetsCount: currentAssets.length,
        currentAssetsValue,
        fixedAssetsCount: fixedAssets.length,
        fixedAssetsValue,
    };
}

/**
 * Calculate depreciation percentage
 */
export function calculateDepreciationPercent(purchaseCost: number, currentValue: number): number {
    if (purchaseCost === 0) return 0;
    return ((purchaseCost - currentValue) / purchaseCost) * 100;
}

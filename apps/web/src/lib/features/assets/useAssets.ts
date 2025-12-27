/**
 * useAssets Hook
 * Manages assets data fetching and CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { assetsApi } from '@/lib/api';
import type { Asset, AssetFormData, AssetType, AssetStatus, AssetCategory, DepreciationMethod } from './types';
import { initialLocations } from './types';
import { generateAssetTag, calculateCurrentValue, calculateAssetStats } from './utils';

interface UseAssetsReturn {
    // Data
    assets: Asset[];
    locations: string[];
    isLoading: boolean;

    // Operations
    createAsset: (formData: AssetFormData) => Promise<void>;
    updateAsset: (id: string, formData: AssetFormData) => Promise<void>;
    deleteAsset: (id: string) => void;
    disposeAsset: (id: string) => void;
    addLocation: (location: string) => void;

    // Stats
    stats: ReturnType<typeof calculateAssetStats>;
}

export function useAssets(): UseAssetsReturn {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [locations, setLocations] = useState<string[]>(initialLocations);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch assets from API
    useEffect(() => {
        async function fetchAssets() {
            setIsLoading(true);
            try {
                const response = await assetsApi.list();
                if (response.success && response.data) {
                    setAssets(response.data.map((a) => ({
                        id: a.id,
                        assetTag: a.assetNumber,
                        name: a.name,
                        description: a.notes || '',
                        assetType: 'FIXED' as AssetType,
                        category: a.category as AssetCategory,
                        status: (a.status === 'AVAILABLE' ? 'ACTIVE' : a.status === 'IN_USE' ? 'ACTIVE' : a.status) as AssetStatus,
                        location: a.location,
                        assignedTo: a.assignedTo,
                        purchaseDate: a.purchaseDate,
                        purchaseCost: a.purchasePrice,
                        currentValue: a.currentValue,
                        depreciationMethod: a.depreciationMethod as DepreciationMethod,
                        usefulLifeYears: a.usefulLifeYears,
                        salvageValue: 0,
                        warrantyExpiry: null,
                        serialNumber: null,
                        manufacturer: null,
                        model: null,
                        notes: a.notes || '',
                        createdAt: '',
                        updatedAt: '',
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch assets:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAssets();
    }, []);

    // Create asset
    const createAsset = useCallback(async (formData: AssetFormData) => {
        const currentValue = calculateCurrentValue(
            formData.purchaseCost,
            formData.purchaseDate,
            formData.usefulLifeYears,
            formData.salvageValue,
            formData.depreciationMethod,
            formData.assetType
        );

        const newAsset: Asset = {
            id: String(assets.length + 1),
            assetTag: generateAssetTag(assets.length),
            name: formData.name,
            description: formData.description,
            assetType: formData.assetType,
            category: formData.category,
            status: formData.status,
            location: formData.location,
            assignedTo: formData.assignedTo || null,
            purchaseDate: formData.purchaseDate,
            purchaseCost: formData.purchaseCost,
            currentValue,
            depreciationMethod: formData.depreciationMethod,
            usefulLifeYears: formData.usefulLifeYears,
            salvageValue: formData.salvageValue,
            warrantyExpiry: formData.warrantyExpiry || null,
            serialNumber: formData.serialNumber || null,
            manufacturer: formData.manufacturer || null,
            model: formData.model || null,
            notes: formData.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setAssets((prev) => [newAsset, ...prev]);
    }, [assets.length]);

    // Update asset
    const updateAsset = useCallback(async (id: string, formData: AssetFormData) => {
        const currentValue = calculateCurrentValue(
            formData.purchaseCost,
            formData.purchaseDate,
            formData.usefulLifeYears,
            formData.salvageValue,
            formData.depreciationMethod,
            formData.assetType
        );

        setAssets((prev) => prev.map((a) =>
            a.id === id
                ? {
                    ...a,
                    name: formData.name,
                    description: formData.description,
                    assetType: formData.assetType,
                    category: formData.category,
                    status: formData.status,
                    location: formData.location,
                    assignedTo: formData.assignedTo || null,
                    purchaseDate: formData.purchaseDate,
                    purchaseCost: formData.purchaseCost,
                    currentValue,
                    depreciationMethod: formData.depreciationMethod,
                    usefulLifeYears: formData.usefulLifeYears,
                    salvageValue: formData.salvageValue,
                    warrantyExpiry: formData.warrantyExpiry || null,
                    serialNumber: formData.serialNumber || null,
                    manufacturer: formData.manufacturer || null,
                    model: formData.model || null,
                    notes: formData.notes,
                    updatedAt: new Date().toISOString(),
                }
                : a
        ));
    }, []);

    // Delete asset
    const deleteAsset = useCallback((id: string) => {
        setAssets((prev) => prev.filter((a) => a.id !== id));
    }, []);

    // Dispose asset
    const disposeAsset = useCallback((id: string) => {
        setAssets((prev) => prev.map((a) =>
            a.id === id
                ? { ...a, status: 'DISPOSED' as AssetStatus, currentValue: 0 }
                : a
        ));
    }, []);

    // Add location
    const addLocation = useCallback((location: string) => {
        if (!locations.includes(location)) {
            setLocations((prev) => [...prev, location]);
        }
    }, [locations]);

    // Calculate stats
    const stats = calculateAssetStats(assets);

    return {
        assets,
        locations,
        isLoading,
        createAsset,
        updateAsset,
        deleteAsset,
        disposeAsset,
        addLocation,
        stats,
    };
}

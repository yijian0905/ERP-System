/**
 * useProducts Hook
 * Manages product data fetching and CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { productsApi, type Product as ApiProduct } from '@/lib/api';
import type { Product, Category, ProductFormData, ProductStatus } from './types';
import { generateSKU, generateCategoryId, generateCategoryPrefix } from './utils';

interface UseProductsReturn {
    // Data
    products: Product[];
    categories: Category[];
    isLoading: boolean;

    // Product operations
    createProduct: (formData: ProductFormData) => Promise<void>;
    updateProduct: (id: string, formData: ProductFormData) => Promise<void>;
    deleteProduct: (id: string) => void;
    setProductStatus: (id: string, status: ProductStatus) => void;

    // Category operations
    createCategory: (name: string) => void;

    // Stats (for sellable products only)
    stats: {
        totalProducts: number;
        activeProducts: number;
        lowStockProducts: number;
        outOfStockProducts: number;
    };

    // Consumable stats
    consumableStats: {
        totalConsumables: number;
        activeConsumables: number;
        lowStockConsumables: number;
        outOfStockConsumables: number;
    };
}

export function useProducts(): UseProductsReturn {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch products and categories from API
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    productsApi.list(),
                    productsApi.getCategories(),
                ]);

                if (productsRes.success && productsRes.data) {
                    setProducts(productsRes.data.map((p: ApiProduct) => ({
                        ...p,
                        category: p.category,
                    })));
                }

                if (categoriesRes.success && categoriesRes.data) {
                    setCategories(categoriesRes.data);
                }
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Create product
    const createProduct = useCallback(async (formData: ProductFormData) => {
        const category = categories.find(c => c.id === formData.category);
        const finalPrice = category?.isNonSellable ? 0 : formData.price;

        const newProduct: Product = {
            id: String(products.length + 1),
            sku: generateSKU(formData.category, categories, products),
            name: formData.name,
            description: formData.description,
            category: category?.name || '',
            price: finalPrice,
            cost: formData.cost,
            stock: 0,
            minStock: formData.minStock,
            maxStock: formData.maxStock,
            reorderPoint: formData.reorderPoint,
            status: formData.status,
            createdAt: new Date().toISOString().split('T')[0],
        };
        setProducts(prev => [newProduct, ...prev]);
    }, [products, categories]);

    // Update product
    const updateProduct = useCallback(async (id: string, formData: ProductFormData) => {
        const category = categories.find(c => c.id === formData.category);
        const finalPrice = category?.isNonSellable ? 0 : formData.price;

        setProducts(prev => prev.map(p =>
            p.id === id
                ? {
                    ...p,
                    name: formData.name,
                    description: formData.description,
                    category: category?.name || p.category,
                    price: finalPrice,
                    cost: formData.cost,
                    minStock: formData.minStock,
                    maxStock: formData.maxStock,
                    reorderPoint: formData.reorderPoint,
                    status: formData.status,
                }
                : p
        ));
    }, [categories]);

    // Delete product
    const deleteProduct = useCallback((id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    }, []);

    // Set product status
    const setProductStatus = useCallback((id: string, status: ProductStatus) => {
        setProducts(prev => prev.map(p =>
            p.id === id ? { ...p, status } : p
        ));
    }, []);

    // Create category
    const createCategory = useCallback((name: string) => {
        const newCategory: Category = {
            id: generateCategoryId(name),
            name: name,
            prefix: generateCategoryPrefix(name),
        };
        setCategories(prev => [...prev, newCategory]);
    }, []);

    // Calculate stats (excluding non-sellable categories)
    const sellableProducts = products.filter(p => {
        const cat = categories.find(c => c.name === p.category);
        return !cat?.isNonSellable;
    });

    const stats = {
        totalProducts: sellableProducts.length,
        activeProducts: sellableProducts.filter(p => p.status === 'ACTIVE').length,
        lowStockProducts: sellableProducts.filter(p => p.stock <= p.reorderPoint && p.stock > 0).length,
        outOfStockProducts: sellableProducts.filter(p => p.stock === 0).length,
    };

    // Calculate consumable stats
    const consumableProducts = products.filter(p => {
        const cat = categories.find(c => c.name === p.category);
        return cat?.isNonSellable;
    });

    const consumableStats = {
        totalConsumables: consumableProducts.length,
        activeConsumables: consumableProducts.filter(p => p.status === 'ACTIVE').length,
        lowStockConsumables: consumableProducts.filter(p => p.stock <= p.reorderPoint && p.stock > 0).length,
        outOfStockConsumables: consumableProducts.filter(p => p.stock === 0).length,
    };

    return {
        products,
        categories,
        isLoading,
        createProduct,
        updateProduct,
        deleteProduct,
        setProductStatus,
        createCategory,
        stats,
        consumableStats,
    };
}

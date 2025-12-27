/**
 * useRecurring Hook
 * Manages recurring items data fetching and CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { recurringApi, customersApi } from '@/lib/api';
import type { Customer } from '@/lib/api/customers';
import type { RecurringItem, RecurringFormData, BillingCycle, SubscriptionStatus } from './types';
import { calculateRecurringStats, generateInvoiceNumber } from './utils';

interface UseRecurringReturn {
    // Data
    items: RecurringItem[];
    customers: Customer[];
    isLoading: boolean;
    isLoadingCustomers: boolean;

    // Operations
    createItem: (formData: RecurringFormData) => Promise<void>;
    updateItem: (id: string, formData: RecurringFormData) => Promise<void>;
    deleteItem: (id: string) => void;
    toggleStatus: (id: string) => void;
    updateInvoiceStats: (id: string) => void;

    // Stats
    stats: {
        monthlyRecurring: number;
        annualRecurring: number;
        activeCount: number;
        totalCount: number;
        totalLifetimeRevenue: number;
    };
}

export function useRecurring(): UseRecurringReturn {
    const [items, setItems] = useState<RecurringItem[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

    // Fetch recurring items from API
    useEffect(() => {
        async function fetchRecurringItems() {
            setIsLoading(true);
            try {
                const response = await recurringApi.list();
                if (response.success && response.data) {
                    setItems(response.data.map((item) => ({
                        id: item.id,
                        name: item.name,
                        customer: item.customerName,
                        customerId: item.customerId,
                        description: item.notes || '',
                        amount: item.amount,
                        billingCycle: item.frequency as BillingCycle,
                        startDate: item.startDate,
                        nextBillingDate: item.nextBillingDate,
                        status: item.status as SubscriptionStatus,
                        lastInvoice: null,
                        totalRevenue: item.amount * 10,
                        invoiceCount: 10,
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch recurring items:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRecurringItems();
    }, []);

    // Fetch customers for dropdown
    useEffect(() => {
        async function fetchCustomers() {
            setIsLoadingCustomers(true);
            try {
                const response = await customersApi.list({ activeOnly: true });
                if (response.success && response.data) {
                    setCustomers(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch customers:', error);
            } finally {
                setIsLoadingCustomers(false);
            }
        }
        fetchCustomers();
    }, []);

    // Create item
    const createItem = useCallback(async (formData: RecurringFormData) => {
        const customer = customers.find((c) => c.id === formData.customerId);
        const newItem: RecurringItem = {
            id: String(items.length + 1),
            name: formData.name,
            customer: customer?.name || '',
            customerId: formData.customerId,
            description: formData.description,
            amount: formData.amount,
            billingCycle: formData.billingCycle,
            startDate: formData.startDate,
            nextBillingDate: formData.startDate,
            status: 'ACTIVE',
            lastInvoice: null,
            totalRevenue: 0,
            invoiceCount: 0,
        };
        setItems((prev) => [...prev, newItem]);
    }, [items.length, customers]);

    // Update item
    const updateItem = useCallback(async (id: string, formData: RecurringFormData) => {
        const customer = customers.find((c) => c.id === formData.customerId);
        setItems((prev) => prev.map((item) =>
            item.id === id
                ? { ...item, ...formData, customer: customer?.name || item.customer }
                : item
        ));
    }, [customers]);

    // Delete item
    const deleteItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    }, []);

    // Toggle status
    const toggleStatus = useCallback((id: string) => {
        setItems((prev) => prev.map((item) =>
            item.id === id
                ? { ...item, status: item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
                : item
        ));
    }, []);

    // Update invoice stats after printing
    const updateInvoiceStats = useCallback((id: string) => {
        setItems((prev) => prev.map((i) =>
            i.id === id
                ? {
                    ...i,
                    invoiceCount: i.invoiceCount + 1,
                    totalRevenue: i.totalRevenue + i.amount,
                    lastInvoice: generateInvoiceNumber(),
                }
                : i
        ));
    }, []);

    // Calculate stats
    const stats = calculateRecurringStats(items);

    return {
        items,
        customers,
        isLoading,
        isLoadingCustomers,
        createItem,
        updateItem,
        deleteItem,
        toggleStatus,
        updateInvoiceStats,
        stats,
    };
}

/**
 * useRequisitions Hook
 * Manages requisitions data fetching and CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { requisitionsApi, costCentersApi, productsApi, type Product } from '@/lib/api';
import { useUser, useCanSkipApproval } from '@/stores/auth';
import type { Requisition, RequisitionItem, CostCenter, Priority, RequisitionStatus } from './types';
import { generateRequisitionNumber, calculateRequisitionStats, calculateTotalCost } from './utils';

export interface RequisitionFormData {
    costCenterId: string;
    projectCode: string;
    purpose: string;
    priority: Priority;
    requiredDate: string;
    notes: string;
    items: RequisitionItem[];
}

interface UseRequisitionsReturn {
    // Data
    requisitions: Requisition[];
    costCenters: CostCenter[];
    products: Product[];
    isLoading: boolean;

    // Operations
    createRequisition: (formData: RequisitionFormData, asDraft: boolean) => Promise<void>;
    approveRequisition: (id: string) => void;
    rejectRequisition: (id: string, reason: string) => void;
    fulfillRequisition: (id: string) => void;
    cancelRequisition: (id: string) => void;

    // User permissions
    canSkipApproval: boolean;
    currentUser: { name: string } | null;

    // Stats
    stats: {
        totalRequests: number;
        pendingApproval: number;
        totalCostApproved: number;
        urgentRequests: number;
        fulfillmentRate: number;
    };
}

export function useRequisitions(): UseRequisitionsReturn {
    const user = useUser();
    const canSkipApproval = useCanSkipApproval();

    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch data from API
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const [reqRes, ccRes, prodRes] = await Promise.all([
                    requisitionsApi.list(),
                    costCentersApi.list(),
                    productsApi.list({ status: 'ACTIVE' }),
                ]);

                if (reqRes.success && reqRes.data) {
                    setRequisitions(reqRes.data.map((r) => ({
                        id: r.id,
                        requisitionNumber: r.requisitionNumber,
                        status: r.status as RequisitionStatus,
                        priority: 'MEDIUM' as Priority,
                        requestedBy: r.requesterName,
                        requestedByDept: '',
                        costCenterId: r.costCenterId,
                        costCenterName: r.costCenterName,
                        projectCode: null,
                        purpose: r.justification,
                        items: r.items.map((item) => ({
                            id: item.productId,
                            productId: item.productId,
                            productName: item.productName,
                            productSku: '',
                            quantity: item.quantity,
                            unitCost: item.estimatedCost / item.quantity,
                            totalCost: item.estimatedCost,
                            availableStock: 100,
                            notes: '',
                        })),
                        totalCost: r.totalEstimatedCost,
                        requestDate: r.createdAt,
                        requiredDate: r.createdAt,
                        approvedBy: r.approvedBy,
                        approvedDate: r.approvedAt,
                        fulfilledDate: null,
                        rejectionReason: null,
                        notes: '',
                        createdAt: r.createdAt,
                        updatedAt: r.createdAt,
                    })));
                }

                if (ccRes.success && ccRes.data) {
                    setCostCenters(ccRes.data.map((cc) => ({
                        id: cc.id,
                        code: cc.code,
                        name: cc.name,
                        department: '',
                        budget: cc.budget,
                        usedBudget: cc.spent,
                    })));
                }

                if (prodRes.success && prodRes.data) {
                    setProducts(prodRes.data);
                }
            } catch (error) {
                console.error('Failed to fetch requisitions:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Create requisition
    const createRequisition = useCallback(async (formData: RequisitionFormData, asDraft: boolean) => {
        const costCenter = costCenters.find((cc) => cc.id === formData.costCenterId);

        let status: RequisitionStatus = asDraft ? 'DRAFT' : 'PENDING';
        let approvedBy: string | null = null;
        let approvedDate: string | null = null;

        if (!asDraft && canSkipApproval) {
            status = 'APPROVED';
            approvedBy = user?.name || 'System (Auto-approved)';
            approvedDate = new Date().toISOString().split('T')[0];
        }

        const newRequisition: Requisition = {
            id: String(requisitions.length + 1),
            requisitionNumber: generateRequisitionNumber(requisitions.length),
            status,
            priority: formData.priority,
            requestedBy: user?.name || 'Unknown User',
            requestedByDept: costCenter?.department || '',
            costCenterId: formData.costCenterId,
            costCenterName: costCenter?.name || '',
            projectCode: formData.projectCode || null,
            purpose: formData.purpose,
            items: formData.items,
            totalCost: calculateTotalCost(formData.items),
            requestDate: new Date().toISOString().split('T')[0],
            requiredDate: formData.requiredDate,
            approvedBy,
            approvedDate,
            fulfilledDate: null,
            rejectionReason: null,
            notes: formData.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setRequisitions((prev) => [newRequisition, ...prev]);
    }, [requisitions.length, costCenters, canSkipApproval, user]);

    // Approve requisition
    const approveRequisition = useCallback((id: string) => {
        setRequisitions((prev) => prev.map((req) =>
            req.id === id
                ? {
                    ...req,
                    status: 'APPROVED' as RequisitionStatus,
                    approvedBy: 'Current Manager',
                    approvedDate: new Date().toISOString().split('T')[0],
                    updatedAt: new Date().toISOString(),
                }
                : req
        ));
    }, []);

    // Reject requisition
    const rejectRequisition = useCallback((id: string, reason: string) => {
        setRequisitions((prev) => prev.map((req) =>
            req.id === id
                ? {
                    ...req,
                    status: 'REJECTED' as RequisitionStatus,
                    rejectionReason: reason,
                    updatedAt: new Date().toISOString(),
                }
                : req
        ));
    }, []);

    // Fulfill requisition
    const fulfillRequisition = useCallback((id: string) => {
        setRequisitions((prev) => prev.map((req) =>
            req.id === id
                ? {
                    ...req,
                    status: 'FULFILLED' as RequisitionStatus,
                    fulfilledDate: new Date().toISOString().split('T')[0],
                    updatedAt: new Date().toISOString(),
                }
                : req
        ));
    }, []);

    // Cancel requisition
    const cancelRequisition = useCallback((id: string) => {
        setRequisitions((prev) => prev.map((req) =>
            req.id === id
                ? {
                    ...req,
                    status: 'CANCELLED' as RequisitionStatus,
                    updatedAt: new Date().toISOString(),
                }
                : req
        ));
    }, []);

    // Calculate stats
    const stats = calculateRequisitionStats(requisitions);

    return {
        requisitions,
        costCenters,
        products,
        isLoading,
        createRequisition,
        approveRequisition,
        rejectRequisition,
        fulfillRequisition,
        cancelRequisition,
        canSkipApproval,
        currentUser: user,
        stats,
    };
}

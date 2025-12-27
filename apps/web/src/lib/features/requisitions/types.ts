/**
 * Requisitions Module Types
 * Extracted from requisitions.tsx for better maintainability
 */

import { Clock, FileText, CheckCircle, XCircle, Check, X, Package, AlertCircle } from 'lucide-react';

export type RequisitionStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface RequisitionItem {
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    availableStock: number;
    notes: string;
}

export interface Requisition {
    id: string;
    requisitionNumber: string;
    status: RequisitionStatus;
    priority: Priority;
    requestedBy: string;
    requestedByDept: string;
    costCenterId: string;
    costCenterName: string;
    projectCode: string | null;
    purpose: string;
    items: RequisitionItem[];
    totalCost: number;
    requestDate: string;
    requiredDate: string;
    approvedBy: string | null;
    approvedDate: string | null;
    fulfilledDate: string | null;
    rejectionReason: string | null;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface CostCenter {
    id: string;
    code: string;
    name: string;
    department: string;
    budget: number;
    usedBudget: number;
}

export interface InventoryItem {
    id: string;
    sku: string;
    name: string;
    category: string;
    stock: number;
    unitCost: number;
}

export interface RequisitionFormData {
    costCenterId: string;
    projectCode: string;
    priority: Priority;
    requiredDate: string;
    notes: string;
}

export interface ItemFormData {
    productId: string;
    quantity: number;
    notes: string;
}

// Status configuration
export const statusConfig: Record<RequisitionStatus, { label: string; color: string; icon: typeof Clock }> = {
    DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: FileText },
    PENDING: { label: 'Pending Approval', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
    APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
    FULFILLED: { label: 'Fulfilled', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Package },
    CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: AlertCircle },
};

// Priority configuration
export const priorityConfig: Record<Priority, { label: string; color: string }> = {
    LOW: { label: 'Low', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    HIGH: { label: 'High', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export const initialRequisitionFormData: RequisitionFormData = {
    costCenterId: '',
    projectCode: '',
    priority: 'MEDIUM',
    requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
};

export const initialItemFormData: ItemFormData = {
    productId: '',
    quantity: 1,
    notes: '',
};

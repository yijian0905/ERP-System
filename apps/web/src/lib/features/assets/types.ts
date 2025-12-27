/**
 * Assets Module Types
 * Extracted from assets.tsx for better maintainability
 */

import { Computer, Laptop, Building2, Truck, Server, DollarSign, Package } from 'lucide-react';

export type AssetType = 'CURRENT' | 'FIXED';
export type AssetStatus = 'ACTIVE' | 'MAINTENANCE' | 'DISPOSED' | 'RESERVED' | 'RETIRED';
export type AssetCategory = 'IT_EQUIPMENT' | 'FURNITURE' | 'VEHICLE' | 'MACHINERY' | 'OFFICE_EQUIPMENT' | 'CASH' | 'ACCOUNTS_RECEIVABLE' | 'INVENTORY' | 'INVESTMENTS' | 'OTHER';
export type DepreciationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'NONE';

export interface Asset {
    id: string;
    assetTag: string;
    name: string;
    description: string;
    assetType: AssetType;
    category: AssetCategory;
    status: AssetStatus;
    location: string;
    assignedTo: string | null;
    purchaseDate: string;
    purchaseCost: number;
    currentValue: number;
    depreciationMethod: DepreciationMethod;
    usefulLifeYears: number;
    salvageValue: number;
    warrantyExpiry: string | null;
    serialNumber: string | null;
    manufacturer: string | null;
    model: string | null;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface AssetFormData {
    name: string;
    description: string;
    assetType: AssetType;
    category: AssetCategory;
    status: AssetStatus;
    location: string;
    assignedTo: string;
    purchaseDate: string;
    purchaseCost: number;
    depreciationMethod: DepreciationMethod;
    usefulLifeYears: number;
    salvageValue: number;
    warrantyExpiry: string;
    serialNumber: string;
    manufacturer: string;
    model: string;
    notes: string;
}

export interface Employee {
    id: string;
    name: string;
    department: string;
    title: string;
}

// Asset Type configuration
export const assetTypeConfig: Record<AssetType, { label: string; color: string }> = {
    CURRENT: { label: 'Current Assets', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    FIXED: { label: 'Fixed Assets', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
};

// Category configuration
export const categoryConfig: Record<AssetCategory, { label: string; icon: typeof Computer; color: string }> = {
    IT_EQUIPMENT: { label: 'IT Equipment', icon: Laptop, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    FURNITURE: { label: 'Furniture', icon: Building2, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    VEHICLE: { label: 'Vehicle', icon: Truck, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    MACHINERY: { label: 'Machinery', icon: Server, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    OFFICE_EQUIPMENT: { label: 'Office Equipment', icon: Computer, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
    CASH: { label: 'Cash', icon: DollarSign, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    ACCOUNTS_RECEIVABLE: { label: 'Accounts Receivable', icon: DollarSign, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
    INVENTORY: { label: 'Inventory', icon: Package, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    INVESTMENTS: { label: 'Investments', icon: DollarSign, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    OTHER: { label: 'Other', icon: Package, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

export const statusConfig: Record<AssetStatus, { label: string; color: string }> = {
    ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    MAINTENANCE: { label: 'Maintenance', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    DISPOSED: { label: 'Disposed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    RESERVED: { label: 'Reserved', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    RETIRED: { label: 'Retired', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

export const initialLocations = [
    'Main Office - Floor 1',
    'Main Office - Floor 2',
    'Main Office - Floor 3',
    'Warehouse A',
    'Warehouse B',
    'Remote Office - NYC',
    'Remote Office - LA',
];

export const defaultEmployees: Employee[] = [
    { id: 'e1', name: 'John Smith', department: 'Engineering', title: 'Senior Engineer' },
    { id: 'e2', name: 'Sarah Johnson', department: 'Marketing', title: 'Marketing Manager' },
    { id: 'e3', name: 'Mike Chen', department: 'Sales', title: 'Sales Representative' },
    { id: 'e4', name: 'Emily Davis', department: 'HR', title: 'HR Specialist' },
    { id: 'e5', name: 'Alex Wilson', department: 'Finance', title: 'Financial Analyst' },
];

export const initialAssetFormData: AssetFormData = {
    name: '',
    description: '',
    assetType: 'FIXED',
    category: 'IT_EQUIPMENT',
    status: 'ACTIVE',
    location: '',
    assignedTo: '',
    purchaseDate: '',
    purchaseCost: 0,
    depreciationMethod: 'STRAIGHT_LINE',
    usefulLifeYears: 5,
    salvageValue: 0,
    warrantyExpiry: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    notes: '',
};

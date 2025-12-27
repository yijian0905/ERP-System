/**
 * Requisitions Feature Module
 */

// Types
export type {
    RequisitionStatus,
    Priority,
    RequisitionItem,
    Requisition,
    CostCenter,
    InventoryItem,
    RequisitionFormData,
    ItemFormData,
} from './types';

export {
    statusConfig,
    priorityConfig,
    initialRequisitionFormData,
    initialItemFormData,
} from './types';

// Utilities
export {
    generateRequisitionNumber,
    formatCurrency,
    formatDate,
    calculateTotalCost,
    calculateRequisitionStats,
} from './utils';

// Hooks
export { useRequisitions, type RequisitionFormData as UseRequisitionsFormData } from './useRequisitions';

// Components
export { RequisitionsTable } from './RequisitionsTable';

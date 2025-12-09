import { createFileRoute } from '@tanstack/react-router';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Send,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

import {
  DashboardCard,
  PageContainer,
  PageHeader,
  StatsCard,
} from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/requisitions')({
  component: RequisitionsPage,
});

// Types
type RequisitionStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface RequisitionItem {
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

interface Requisition {
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

interface CostCenter {
  id: string;
  code: string;
  name: string;
  department: string;
  budget: number;
  usedBudget: number;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  unitCost: number;
}

// Status configuration
const statusConfig: Record<RequisitionStatus, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: FileText },
  PENDING: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  FULFILLED: { label: 'Fulfilled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Check },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: X },
};

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  HIGH: { label: 'High', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

// Mock data
const mockCostCenters: CostCenter[] = [
  { id: 'cc1', code: 'CC-ENG', name: 'Engineering', department: 'Engineering', budget: 50000, usedBudget: 32500 },
  { id: 'cc2', code: 'CC-MKT', name: 'Marketing', department: 'Marketing', budget: 30000, usedBudget: 18200 },
  { id: 'cc3', code: 'CC-OPS', name: 'Operations', department: 'Operations', budget: 75000, usedBudget: 45600 },
  { id: 'cc4', code: 'CC-HR', name: 'Human Resources', department: 'HR', budget: 20000, usedBudget: 8500 },
  { id: 'cc5', code: 'CC-FIN', name: 'Finance', department: 'Finance', budget: 25000, usedBudget: 12300 },
  { id: 'cc6', code: 'CC-PRD', name: 'Production', department: 'Production', budget: 100000, usedBudget: 67800 },
];

const mockInventoryItems: InventoryItem[] = [
  { id: 'inv1', sku: 'OFF-001', name: 'A4 Paper (500 sheets)', category: 'Office Supplies', stock: 150, unitCost: 8.50 },
  { id: 'inv2', sku: 'OFF-002', name: 'Ballpoint Pens (Box of 12)', category: 'Office Supplies', stock: 80, unitCost: 5.99 },
  { id: 'inv3', sku: 'OFF-003', name: 'Stapler', category: 'Office Supplies', stock: 25, unitCost: 12.50 },
  { id: 'inv4', sku: 'IT-001', name: 'USB Flash Drive 32GB', category: 'IT Equipment', stock: 45, unitCost: 15.00 },
  { id: 'inv5', sku: 'IT-002', name: 'Wireless Mouse', category: 'IT Equipment', stock: 30, unitCost: 25.00 },
  { id: 'inv6', sku: 'IT-003', name: 'Keyboard', category: 'IT Equipment', stock: 20, unitCost: 45.00 },
  { id: 'inv7', sku: 'CLN-001', name: 'Hand Sanitizer (500ml)', category: 'Cleaning', stock: 60, unitCost: 4.50 },
  { id: 'inv8', sku: 'CLN-002', name: 'Disinfectant Wipes (Pack)', category: 'Cleaning', stock: 40, unitCost: 6.99 },
  { id: 'inv9', sku: 'SAF-001', name: 'Safety Glasses', category: 'Safety Equipment', stock: 100, unitCost: 8.00 },
  { id: 'inv10', sku: 'SAF-002', name: 'Work Gloves (Pair)', category: 'Safety Equipment', stock: 75, unitCost: 12.00 },
  { id: 'inv11', sku: 'RAW-001', name: 'Steel Rod (per meter)', category: 'Raw Materials', stock: 500, unitCost: 15.00 },
  { id: 'inv12', sku: 'RAW-002', name: 'Aluminum Sheet', category: 'Raw Materials', stock: 200, unitCost: 35.00 },
];

const mockRequisitions: Requisition[] = [
  {
    id: '1',
    requisitionNumber: 'REQ-2024-0001',
    status: 'FULFILLED',
    priority: 'MEDIUM',
    requestedBy: 'John Smith',
    requestedByDept: 'Engineering',
    costCenterId: 'cc1',
    costCenterName: 'Engineering',
    projectCode: 'PRJ-2024-001',
    purpose: 'Monthly office supplies replenishment',
    items: [
      { id: 'i1', productId: 'inv1', productName: 'A4 Paper (500 sheets)', productSku: 'OFF-001', quantity: 10, unitCost: 8.50, totalCost: 85, availableStock: 150, notes: '' },
      { id: 'i2', productId: 'inv2', productName: 'Ballpoint Pens (Box of 12)', productSku: 'OFF-002', quantity: 5, unitCost: 5.99, totalCost: 29.95, availableStock: 80, notes: '' },
    ],
    totalCost: 114.95,
    requestDate: '2024-12-01',
    requiredDate: '2024-12-05',
    approvedBy: 'Sarah Johnson',
    approvedDate: '2024-12-02',
    fulfilledDate: '2024-12-04',
    rejectionReason: null,
    notes: '',
    createdAt: '2024-12-01T09:00:00Z',
    updatedAt: '2024-12-04T14:00:00Z',
  },
  {
    id: '2',
    requisitionNumber: 'REQ-2024-0002',
    status: 'APPROVED',
    priority: 'HIGH',
    requestedBy: 'Mike Chen',
    requestedByDept: 'Production',
    costCenterId: 'cc6',
    costCenterName: 'Production',
    projectCode: 'PRJ-2024-003',
    purpose: 'Safety equipment for new hires',
    items: [
      { id: 'i3', productId: 'inv9', productName: 'Safety Glasses', productSku: 'SAF-001', quantity: 20, unitCost: 8.00, totalCost: 160, availableStock: 100, notes: '' },
      { id: 'i4', productId: 'inv10', productName: 'Work Gloves (Pair)', productSku: 'SAF-002', quantity: 20, unitCost: 12.00, totalCost: 240, availableStock: 75, notes: '' },
    ],
    totalCost: 400,
    requestDate: '2024-12-05',
    requiredDate: '2024-12-10',
    approvedBy: 'Emily Davis',
    approvedDate: '2024-12-06',
    fulfilledDate: null,
    rejectionReason: null,
    notes: '5 new production staff joining',
    createdAt: '2024-12-05T10:00:00Z',
    updatedAt: '2024-12-06T11:00:00Z',
  },
  {
    id: '3',
    requisitionNumber: 'REQ-2024-0003',
    status: 'PENDING',
    priority: 'URGENT',
    requestedBy: 'Alex Wilson',
    requestedByDept: 'Operations',
    costCenterId: 'cc3',
    costCenterName: 'Operations',
    projectCode: null,
    purpose: 'Emergency raw material request for urgent order',
    items: [
      { id: 'i5', productId: 'inv11', productName: 'Steel Rod (per meter)', productSku: 'RAW-001', quantity: 100, unitCost: 15.00, totalCost: 1500, availableStock: 500, notes: 'For Order #ORD-2024-0150' },
      { id: 'i6', productId: 'inv12', productName: 'Aluminum Sheet', productSku: 'RAW-002', quantity: 50, unitCost: 35.00, totalCost: 1750, availableStock: 200, notes: '' },
    ],
    totalCost: 3250,
    requestDate: '2024-12-07',
    requiredDate: '2024-12-08',
    approvedBy: null,
    approvedDate: null,
    fulfilledDate: null,
    rejectionReason: null,
    notes: 'Urgent - customer deadline',
    createdAt: '2024-12-07T08:00:00Z',
    updatedAt: '2024-12-07T08:00:00Z',
  },
  {
    id: '4',
    requisitionNumber: 'REQ-2024-0004',
    status: 'REJECTED',
    priority: 'LOW',
    requestedBy: 'Lisa Brown',
    requestedByDept: 'Marketing',
    costCenterId: 'cc2',
    costCenterName: 'Marketing',
    projectCode: 'PRJ-2024-005',
    purpose: 'New IT equipment request',
    items: [
      { id: 'i7', productId: 'inv5', productName: 'Wireless Mouse', productSku: 'IT-002', quantity: 10, unitCost: 25.00, totalCost: 250, availableStock: 30, notes: '' },
      { id: 'i8', productId: 'inv6', productName: 'Keyboard', productSku: 'IT-003', quantity: 10, unitCost: 45.00, totalCost: 450, availableStock: 20, notes: '' },
    ],
    totalCost: 700,
    requestDate: '2024-12-03',
    requiredDate: '2024-12-15',
    approvedBy: 'Sarah Johnson',
    approvedDate: null,
    fulfilledDate: null,
    rejectionReason: 'Budget exceeded for this quarter. Please resubmit in Q1 2025.',
    notes: '',
    createdAt: '2024-12-03T14:00:00Z',
    updatedAt: '2024-12-04T09:00:00Z',
  },
  {
    id: '5',
    requisitionNumber: 'REQ-2024-0005',
    status: 'DRAFT',
    priority: 'MEDIUM',
    requestedBy: 'David Lee',
    requestedByDept: 'Finance',
    costCenterId: 'cc5',
    costCenterName: 'Finance',
    projectCode: null,
    purpose: 'Office supplies for audit preparation',
    items: [
      { id: 'i9', productId: 'inv1', productName: 'A4 Paper (500 sheets)', productSku: 'OFF-001', quantity: 20, unitCost: 8.50, totalCost: 170, availableStock: 150, notes: 'For printing reports' },
    ],
    totalCost: 170,
    requestDate: '2024-12-07',
    requiredDate: '2024-12-20',
    approvedBy: null,
    approvedDate: null,
    fulfilledDate: null,
    rejectionReason: null,
    notes: 'Annual audit preparation',
    createdAt: '2024-12-07T16:00:00Z',
    updatedAt: '2024-12-07T16:00:00Z',
  },
];

function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>(mockRequisitions);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [costCenterFilter, setCostCenterFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    costCenterId: '',
    projectCode: '',
    purpose: '',
    priority: 'MEDIUM' as Priority,
    requiredDate: '',
    notes: '',
    items: [] as RequisitionItem[],
  });

  // Approval form state
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  // Item selection state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  // Filter requisitions
  const filteredRequisitions = requisitions.filter((req) => {
    const matchesSearch =
      req.requisitionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || req.status === statusFilter;
    const matchesCostCenter = !costCenterFilter || req.costCenterId === costCenterFilter;
    const matchesPriority = !priorityFilter || req.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesCostCenter && matchesPriority;
  });

  // Calculate stats
  const totalRequests = requisitions.length;
  const pendingApproval = requisitions.filter((r) => r.status === 'PENDING').length;
  const totalCostThisMonth = requisitions
    .filter((r) => r.status === 'FULFILLED' || r.status === 'APPROVED')
    .reduce((sum, r) => sum + r.totalCost, 0);
  const urgentRequests = requisitions.filter((r) => r.priority === 'URGENT' && r.status === 'PENDING').length;

  // Generate requisition number
  const generateRequisitionNumber = () => {
    const year = new Date().getFullYear();
    const count = requisitions.length + 1;
    return `REQ-${year}-${String(count).padStart(4, '0')}`;
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      costCenterId: '',
      projectCode: '',
      purpose: '',
      priority: 'MEDIUM',
      requiredDate: '',
      notes: '',
      items: [],
    });
    setSelectedProductId('');
    setItemQuantity(1);
    setItemNotes('');
  };

  // Add item to requisition
  const handleAddItem = () => {
    if (!selectedProductId) return;
    
    const product = mockInventoryItems.find((p) => p.id === selectedProductId);
    if (!product) return;

    // Check if already in list
    if (formData.items.some((item) => item.productId === selectedProductId)) {
      // Update quantity instead
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.productId === selectedProductId
            ? { ...item, quantity: item.quantity + itemQuantity, totalCost: (item.quantity + itemQuantity) * item.unitCost }
            : item
        ),
      }));
    } else {
      const newItem: RequisitionItem = {
        id: `new-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: itemQuantity,
        unitCost: product.unitCost,
        totalCost: product.unitCost * itemQuantity,
        availableStock: product.stock,
        notes: itemNotes,
      };
      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
    }

    setSelectedProductId('');
    setItemQuantity(1);
    setItemNotes('');
  };

  // Remove item from requisition
  const handleRemoveItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  // Update item quantity
  const handleUpdateItemQty = (itemId: string, qty: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, Math.min(qty, item.availableStock)), totalCost: Math.max(1, Math.min(qty, item.availableStock)) * item.unitCost }
          : item
      ),
    }));
  };

  // Calculate form total
  const formTotal = formData.items.reduce((sum, item) => sum + item.totalCost, 0);

  // Submit requisition
  const handleSubmitRequisition = async (asDraft: boolean) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const costCenter = mockCostCenters.find((cc) => cc.id === formData.costCenterId);
    const newRequisition: Requisition = {
      id: String(requisitions.length + 1),
      requisitionNumber: generateRequisitionNumber(),
      status: asDraft ? 'DRAFT' : 'PENDING',
      priority: formData.priority,
      requestedBy: 'Current User', // TODO: Get from auth
      requestedByDept: costCenter?.department || '',
      costCenterId: formData.costCenterId,
      costCenterName: costCenter?.name || '',
      projectCode: formData.projectCode || null,
      purpose: formData.purpose,
      items: formData.items,
      totalCost: formTotal,
      requestDate: new Date().toISOString().split('T')[0],
      requiredDate: formData.requiredDate,
      approvedBy: null,
      approvedDate: null,
      fulfilledDate: null,
      rejectionReason: null,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRequisitions((prev) => [newRequisition, ...prev]);
    setIsCreateModalOpen(false);
    resetForm();
    setIsSaving(false);
  };

  // Handle approval/rejection
  const handleApprovalAction = async () => {
    if (!selectedRequisition) return;
    
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setRequisitions((prev) =>
      prev.map((req) =>
        req.id === selectedRequisition.id
          ? {
              ...req,
              status: approvalAction === 'approve' ? 'APPROVED' : 'REJECTED',
              approvedBy: approvalAction === 'approve' ? 'Current Manager' : null,
              approvedDate: approvalAction === 'approve' ? new Date().toISOString().split('T')[0] : null,
              rejectionReason: approvalAction === 'reject' ? rejectionReason : null,
              updatedAt: new Date().toISOString(),
            }
          : req
      )
    );

    setIsApprovalModalOpen(false);
    setSelectedRequisition(null);
    setRejectionReason('');
    setIsSaving(false);
  };

  // Fulfill requisition
  const handleFulfill = (reqId: string) => {
    setRequisitions((prev) =>
      prev.map((req) =>
        req.id === reqId
          ? {
              ...req,
              status: 'FULFILLED',
              fulfilledDate: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString(),
            }
          : req
      )
    );
  };

  // Cancel requisition
  const handleCancel = (reqId: string) => {
    setRequisitions((prev) =>
      prev.map((req) =>
        req.id === reqId
          ? {
              ...req,
              status: 'CANCELLED',
              updatedAt: new Date().toISOString(),
            }
          : req
      )
    );
  };

  // View requisition details
  const handleView = (req: Requisition) => {
    setSelectedRequisition(req);
    setIsViewModalOpen(true);
  };

  // Open approval modal
  const handleOpenApproval = (req: Requisition, action: 'approve' | 'reject') => {
    setSelectedRequisition(req);
    setApprovalAction(action);
    setIsApprovalModalOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Internal Requisitions"
        description="Manage internal material and supply requests with cost allocation"
        actions={
          <Button onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Requisition
          </Button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Requests"
          value={totalRequests.toString()}
          change="This month"
          changeType="neutral"
          icon={FileText}
        />
        <StatsCard
          title="Pending Approval"
          value={pendingApproval.toString()}
          change={urgentRequests > 0 ? `${urgentRequests} urgent` : 'No urgent'}
          changeType={urgentRequests > 0 ? 'negative' : 'neutral'}
          icon={Clock}
        />
        <StatsCard
          title="Allocated Cost"
          value={formatCurrency(totalCostThisMonth)}
          change="Approved/Fulfilled"
          changeType="neutral"
          icon={DollarSign}
        />
        <StatsCard
          title="Fulfillment Rate"
          value={`${requisitions.length > 0 ? Math.round((requisitions.filter((r) => r.status === 'FULFILLED').length / requisitions.length) * 100) : 0}%`}
          change="All time"
          changeType="positive"
          icon={CheckCircle}
        />
      </div>

      {/* Filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by number, requester, or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Status</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={costCenterFilter}
              onChange={(e) => setCostCenterFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Cost Centers</option>
              {mockCostCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>{cc.name}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Priority</option>
              {Object.entries(priorityConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>
      </DashboardCard>

      {/* Requisitions Table */}
      <DashboardCard>
        <ScrollArea className="h-[calc(100vh-420px)]">
          <table className="w-full">
            <thead className="sticky top-0 bg-background border-b">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Requisition #</th>
                <th className="pb-3 font-medium">Requester</th>
                <th className="pb-3 font-medium">Cost Center</th>
                <th className="pb-3 font-medium">Purpose</th>
                <th className="pb-3 font-medium text-right">Total Cost</th>
                <th className="pb-3 font-medium">Priority</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Required By</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRequisitions.map((req) => {
                const statConfig = statusConfig[req.status];
                const prioConfig = priorityConfig[req.priority];
                const StatusIcon = statConfig.icon;

                return (
                  <tr key={req.id} className="text-sm hover:bg-muted/50">
                    <td className="py-3 font-medium">{req.requisitionNumber}</td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{req.requestedBy}</p>
                        <p className="text-xs text-muted-foreground">{req.requestedByDept}</p>
                      </div>
                    </td>
                    <td className="py-3">{req.costCenterName}</td>
                    <td className="py-3 max-w-[200px] truncate">{req.purpose}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(req.totalCost)}</td>
                    <td className="py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', prioConfig.color)}>
                        {prioConfig.label}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', statConfig.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {statConfig.label}
                      </span>
                    </td>
                    <td className="py-3">{new Date(req.requiredDate).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(req)}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {req.status === 'PENDING' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenApproval(req, 'approve')}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenApproval(req, 'reject')}>
                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {req.status === 'APPROVED' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleFulfill(req.id)}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Fulfilled
                              </DropdownMenuItem>
                            </>
                          )}
                          {(req.status === 'DRAFT' || req.status === 'PENDING') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleCancel(req.id)} className="text-destructive">
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredRequisitions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No requisitions found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </ScrollArea>
      </DashboardCard>

      {/* Create Requisition Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Requisition</DialogTitle>
            <DialogDescription>
              Request materials or supplies for internal use
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="grid gap-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="costCenter">Cost Center *</Label>
                  <select
                    id="costCenter"
                    value={formData.costCenterId}
                    onChange={(e) => setFormData((f) => ({ ...f, costCenterId: e.target.value }))}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select cost center</option>
                    {mockCostCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.code} - {cc.name} (Budget: {formatCurrency(cc.budget - cc.usedBudget)} remaining)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="projectCode">Project Code (Optional)</Label>
                  <Input
                    id="projectCode"
                    value={formData.projectCode}
                    onChange={(e) => setFormData((f) => ({ ...f, projectCode: e.target.value }))}
                    placeholder="e.g., PRJ-2024-001"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData((f) => ({ ...f, purpose: e.target.value }))}
                  placeholder="Describe the purpose of this requisition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData((f) => ({ ...f, priority: e.target.value as Priority }))}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="requiredDate">Required By *</Label>
                  <DateInput
                    value={formData.requiredDate}
                    onChange={(value) => setFormData((f) => ({ ...f, requiredDate: value }))}
                  />
                </div>
              </div>

              {/* Add Items */}
              <div className="border-t pt-4 mt-2">
                <h4 className="font-medium mb-3">Requested Items</h4>
                <div className="flex gap-2 mb-4">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select item to add...</option>
                    {mockInventoryItems.map((item) => (
                      <option key={item.id} value={item.id} disabled={item.stock === 0}>
                        {item.sku} - {item.name} ({item.stock} available) - {formatCurrency(item.unitCost)}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                    className="w-24"
                    placeholder="Qty"
                  />
                  <Button type="button" onClick={handleAddItem} disabled={!selectedProductId}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Items List */}
                {formData.items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Item</th>
                          <th className="px-3 py-2 text-right font-medium">Qty</th>
                          <th className="px-3 py-2 text-right font-medium">Unit Cost</th>
                          <th className="px-3 py-2 text-right font-medium">Total</th>
                          <th className="px-3 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {formData.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">{item.productSku}</p>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Input
                                type="number"
                                min="1"
                                max={item.availableStock}
                                value={item.quantity}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => handleUpdateItemQty(item.id, parseInt(e.target.value) || 1)}
                                className="w-20 h-7 text-right"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.unitCost)}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.totalCost)}</td>
                            <td className="px-3 py-2">
                              <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveItem(item.id)}>
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/30">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right font-medium">Total Cost:</td>
                          <td className="px-3 py-2 text-right font-bold">{formatCurrency(formTotal)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {formData.items.length === 0 && (
                  <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No items added yet</p>
                    <p className="text-xs">Select items from the dropdown above</p>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                  className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Additional notes or justification"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSubmitRequisition(true)}
              disabled={isSaving || !formData.costCenterId || !formData.purpose || formData.items.length === 0}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmitRequisition(false)}
              disabled={isSaving || !formData.costCenterId || !formData.purpose || !formData.requiredDate || formData.items.length === 0}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Requisition Details</DialogTitle>
            <DialogDescription>
              {selectedRequisition?.requisitionNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedRequisition && (
            <div className="space-y-4">
              {/* Status & Priority */}
              <div className="flex gap-2">
                <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium', statusConfig[selectedRequisition.status].color)}>
                  {statusConfig[selectedRequisition.status].label}
                </span>
                <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-medium', priorityConfig[selectedRequisition.priority].color)}>
                  {priorityConfig[selectedRequisition.priority].label} Priority
                </span>
              </div>

              {/* Rejection Reason */}
              {selectedRequisition.status === 'REJECTED' && selectedRequisition.rejectionReason && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Rejection Reason</p>
                    <p className="text-sm">{selectedRequisition.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Requested by:</span>
                  <span className="font-medium">{selectedRequisition.requestedBy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Cost Center:</span>
                  <span className="font-medium">{selectedRequisition.costCenterName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Request Date:</span>
                  <span className="font-medium">{new Date(selectedRequisition.requestDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Required By:</span>
                  <span className="font-medium">{new Date(selectedRequisition.requiredDate).toLocaleDateString()}</span>
                </div>
                {selectedRequisition.projectCode && (
                  <div className="flex items-center gap-2 col-span-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Project:</span>
                    <span className="font-medium">{selectedRequisition.projectCode}</span>
                  </div>
                )}
              </div>

              {/* Purpose */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Purpose</p>
                <p className="font-medium">{selectedRequisition.purpose}</p>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Requested Items</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Item</th>
                        <th className="px-3 py-2 text-right font-medium">Qty</th>
                        <th className="px-3 py-2 text-right font-medium">Unit Cost</th>
                        <th className="px-3 py-2 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedRequisition.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{item.productSku}</p>
                          </td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(item.unitCost)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.totalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right font-medium">Total Cost:</td>
                        <td className="px-3 py-2 text-right font-bold">{formatCurrency(selectedRequisition.totalCost)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Approval Info */}
              {selectedRequisition.approvedBy && (
                <div className="text-sm text-muted-foreground">
                  Approved by <span className="font-medium text-foreground">{selectedRequisition.approvedBy}</span> on {new Date(selectedRequisition.approvedDate!).toLocaleDateString()}
                </div>
              )}

              {/* Notes */}
              {selectedRequisition.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedRequisition.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Requisition' : 'Reject Requisition'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequisition?.requisitionNumber} - {formatCurrency(selectedRequisition?.totalCost || 0)}
            </DialogDescription>
          </DialogHeader>

          {approvalAction === 'approve' ? (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                <CheckCircle className="h-6 w-6" />
                <div>
                  <p className="font-medium">Confirm Approval</p>
                  <p className="text-sm">This will approve the requisition and allocate {formatCurrency(selectedRequisition?.totalCost || 0)} to the {selectedRequisition?.costCenterName} cost center.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                <XCircle className="h-6 w-6" />
                <div>
                  <p className="font-medium">Reject Requisition</p>
                  <p className="text-sm">Please provide a reason for rejection.</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Explain why this requisition is being rejected..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleApprovalAction}
              disabled={isSaving || (approvalAction === 'reject' && !rejectionReason)}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {approvalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

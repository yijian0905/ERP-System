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
import { useState, useEffect } from 'react';

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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useUser, useCanSkipApproval } from '@/stores/auth';
import { requisitionsApi, costCentersApi, productsApi, type Product } from '@/lib/api';

export const Route = createFileRoute('/_dashboard/requisitions')({
  component: RequisitionsPage,
});

import { FilterSelect } from '@/components/ui/filter-select';

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


function RequisitionsPage() {
  const user = useUser();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [costCenterFilter, setCostCenterFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

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
          // Map API response to local Requisition type
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

    const product = products.find((p) => p.id === selectedProductId);
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
        unitCost: product.cost,
        totalCost: product.cost * itemQuantity,
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

  // Check if user can skip approval workflow
  const canSkipApproval = useCanSkipApproval();

  // Calculate form total
  const formTotal = formData.items.reduce((sum, item) => sum + item.totalCost, 0);

  // Submit requisition
  const handleSubmitRequisition = async (asDraft: boolean) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const costCenter = costCenters.find((cc) => cc.id === formData.costCenterId);

    // Determine status: If not draft and user can skip approval, auto-approve
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
      requisitionNumber: generateRequisitionNumber(),
      status,
      priority: formData.priority,
      requestedBy: user?.name || 'Unknown User',
      requestedByDept: costCenter?.department || '',
      costCenterId: formData.costCenterId,
      costCenterName: costCenter?.name || '',
      projectCode: formData.projectCode || null,
      purpose: formData.purpose,
      items: formData.items,
      totalCost: formTotal,
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
            <FilterSelect
              value={statusFilter || 'all'}
              onChange={(val) => setStatusFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Status' },
                ...Object.entries(statusConfig).map(([key, config]) => ({ value: key, label: config.label })),
              ]}
              placeholder="All Status"
              className="w-auto"
            />
            <FilterSelect
              value={costCenterFilter || 'all'}
              onChange={(val) => setCostCenterFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Cost Centers' },
                ...costCenters.map((cc) => ({ value: cc.id, label: cc.name })),
              ]}
              placeholder="All Cost Centers"
              className="w-auto"
            />
            <FilterSelect
              value={priorityFilter || 'all'}
              onChange={(val) => setPriorityFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Priority' },
                ...Object.entries(priorityConfig).map(([key, config]) => ({ value: key, label: config.label })),
              ]}
              placeholder="All Priority"
              className="w-auto"
            />
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

          <ScrollArea className="flex-1 px-1">
            <div className="grid gap-4 py-4 px-1">
              {/* Basic Info */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="costCenter">Cost Center *</Label>
                  <FilterSelect
                    value={formData.costCenterId}
                    onChange={(val) => setFormData((f) => ({ ...f, costCenterId: val }))}
                    options={costCenters.map((cc) => ({
                      value: cc.id,
                      label: `${cc.code} - ${cc.name} (Budget: ${formatCurrency(cc.budget - cc.usedBudget)} remaining)`
                    }))}
                    placeholder="Select cost center"
                    className="w-full"
                  />
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
                  <FilterSelect
                    value={formData.priority}
                    onChange={(val) => setFormData((f) => ({ ...f, priority: val as Priority }))}
                    options={Object.entries(priorityConfig).map(([key, config]) => ({
                      value: key,
                      label: config.label
                    }))}
                    placeholder="Select priority"
                    className="w-full"
                  />
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
                  <div className="flex-1 min-w-[200px]">
                    <FilterSelect
                      value={selectedProductId}
                      onChange={(val) => setSelectedProductId(val)}
                      options={products.map((item) => ({
                        value: item.id,
                        label: `${item.sku} - ${item.name} (${item.stock} available) - ${formatCurrency(item.cost)}`,
                        disabled: item.stock === 0
                      }))}
                      placeholder="Select item to add..."
                      className="w-full"
                    />
                  </div>
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
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
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
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
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

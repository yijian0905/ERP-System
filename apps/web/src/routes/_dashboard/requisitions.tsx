/**
 * Requisitions Page - Refactored
 * 
 * This page has been refactored from a 1079-line monolithic component
 * into a modular structure located in @/lib/features/requisitions/:
 * 
 * - types.ts: Type definitions and constants
 * - utils.ts: Helper functions
 * - useRequisitions.ts: Data fetching hook with approval workflow
 * - RequisitionsTable.tsx: Table component
 * 
 * Note: Create form modal kept here as it has complex item management
 */

import { createFileRoute } from '@tanstack/react-router';
import {
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useState, useMemo } from 'react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { FilterSelect } from '@/components/ui/filter-select';

// Import from feature module
import {
  type Requisition,
  type RequisitionItem,
  type Priority,
  statusConfig,
  priorityConfig,
  useRequisitions,
  RequisitionsTable,
  formatCurrency,
} from '@/lib/features/requisitions';

export const Route = createFileRoute('/_dashboard/requisitions')({
  component: RequisitionsPage,
});

function RequisitionsPage() {
  const {
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
    currentUser,
    stats,
  } = useRequisitions();

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [costCenterFilter, setCostCenterFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    costCenterId: '',
    projectCode: '',
    purpose: '',
    priority: 'MEDIUM' as Priority,
    requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    items: [] as RequisitionItem[],
  });

  // Item selection state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  // Filter requisitions
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      const matchesSearch =
        req.requisitionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.purpose.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || req.status === statusFilter;
      const matchesCostCenter = !costCenterFilter || req.costCenterId === costCenterFilter;
      const matchesPriority = !priorityFilter || req.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesCostCenter && matchesPriority;
    });
  }, [requisitions, searchTerm, statusFilter, costCenterFilter, priorityFilter]);

  const hasFilters = !!(searchTerm || statusFilter || costCenterFilter || priorityFilter);
  const formTotal = formData.items.reduce((sum, item) => sum + item.totalCost, 0);

  // Reset form
  const resetForm = () => {
    setFormData({
      costCenterId: '',
      projectCode: '',
      purpose: '',
      priority: 'MEDIUM',
      requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      items: [],
    });
    setSelectedProductId('');
    setItemQuantity(1);
  };

  // Add item to form
  const handleAddItem = () => {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    if (formData.items.some((item) => item.productId === selectedProductId)) {
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
        notes: '',
      };
      setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    }
    setSelectedProductId('');
    setItemQuantity(1);
  };

  // Submit requisition
  const handleSubmitRequisition = async (asDraft: boolean) => {
    setIsSaving(true);
    try {
      await createRequisition(formData, asDraft);
      setIsCreateModalOpen(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  // Handle approval action
  const handleApprovalAction = async () => {
    if (!selectedRequisition) return;
    setIsSaving(true);
    try {
      if (approvalAction === 'approve') {
        approveRequisition(selectedRequisition.id);
      } else {
        rejectRequisition(selectedRequisition.id, rejectionReason);
      }
      setIsApprovalModalOpen(false);
      setSelectedRequisition(null);
      setRejectionReason('');
    } finally {
      setIsSaving(false);
    }
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
          value={stats.totalRequests.toString()}
          change="This month"
          changeType="neutral"
          icon={FileText}
        />
        <StatsCard
          title="Pending Approval"
          value={stats.pendingApproval.toString()}
          change={stats.urgentRequests > 0 ? `${stats.urgentRequests} urgent` : 'No urgent'}
          changeType={stats.urgentRequests > 0 ? 'negative' : 'neutral'}
          icon={Clock}
        />
        <StatsCard
          title="Allocated Cost"
          value={formatCurrency(stats.totalCostApproved)}
          change="Approved/Fulfilled"
          changeType="neutral"
          icon={DollarSign}
        />
        <StatsCard
          title="Fulfillment Rate"
          value={`${stats.fulfillmentRate}%`}
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
        <RequisitionsTable
          requisitions={filteredRequisitions}
          isLoading={isLoading}
          onView={(req) => { setSelectedRequisition(req); setIsViewModalOpen(true); }}
          onApprove={(req) => { setSelectedRequisition(req); setApprovalAction('approve'); setIsApprovalModalOpen(true); }}
          onReject={(req) => { setSelectedRequisition(req); setApprovalAction('reject'); setIsApprovalModalOpen(true); }}
          onFulfill={fulfillRequisition}
          onCancel={cancelRequisition}
          onAddNew={() => { resetForm(); setIsCreateModalOpen(true); }}
          hasFilters={hasFilters}
        />
      </DashboardCard>

      {/* Create Modal - Simplified */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Requisition</DialogTitle>
            <DialogDescription>Request materials or supplies for internal use</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 px-1">
            <div className="grid gap-4 py-4 px-1">
              <div className="grid gap-2">
                <Label>Cost Center *</Label>
                <FilterSelect
                  value={formData.costCenterId}
                  onChange={(val) => setFormData((f) => ({ ...f, costCenterId: val }))}
                  options={costCenters.map((cc) => ({
                    value: cc.id,
                    label: `${cc.code} - ${cc.name} (${formatCurrency(cc.budget - cc.usedBudget)} remaining)`
                  }))}
                  placeholder="Select cost center"
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label>Purpose *</Label>
                <Input
                  value={formData.purpose}
                  onChange={(e) => setFormData((f) => ({ ...f, purpose: e.target.value }))}
                  placeholder="Describe the purpose of this requisition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <FilterSelect
                    value={formData.priority}
                    onChange={(val) => setFormData((f) => ({ ...f, priority: val as Priority }))}
                    options={Object.entries(priorityConfig).map(([key, config]) => ({ value: key, label: config.label }))}
                    placeholder="Select priority"
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Required By *</Label>
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
                  <div className="flex-1">
                    <FilterSelect
                      value={selectedProductId}
                      onChange={(val) => setSelectedProductId(val)}
                      options={products.map((item) => ({
                        value: item.id,
                        label: `${item.sku} - ${item.name} (${item.stock} avail)`,
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
                    onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <Button type="button" onClick={handleAddItem} disabled={!selectedProductId}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left">Item</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-3 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {formData.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">{item.productName}</td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.totalCost)}</td>
                            <td className="px-3 py-2">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setFormData((f) => ({ ...f, items: f.items.filter((i) => i.id !== item.id) }))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/30">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 font-medium">Total</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(formTotal)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleSubmitRequisition(true)} disabled={isSaving || !formData.costCenterId || formData.items.length === 0}>
              Save as Draft
            </Button>
            <Button onClick={() => handleSubmitRequisition(false)} disabled={isSaving || !formData.costCenterId || !formData.purpose || formData.items.length === 0}>
              {canSkipApproval ? 'Submit & Auto-Approve' : 'Submit for Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approvalAction === 'approve' ? 'Approve' : 'Reject'} Requisition</DialogTitle>
          </DialogHeader>
          {selectedRequisition && (
            <div className="py-4">
              <p><strong>#{selectedRequisition.requisitionNumber}</strong></p>
              <p className="text-sm text-muted-foreground">{selectedRequisition.purpose}</p>
              <p className="mt-2"><strong>Total:</strong> {formatCurrency(selectedRequisition.totalCost)}</p>
              {approvalAction === 'reject' && (
                <div className="mt-4">
                  <Label>Rejection Reason</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleApprovalAction}
              disabled={isSaving || (approvalAction === 'reject' && !rejectionReason)}
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
            >
              {approvalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Requisition Details</DialogTitle>
          </DialogHeader>
          {selectedRequisition && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Number</p>
                    <p className="font-medium">{selectedRequisition.requisitionNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">{statusConfig[selectedRequisition.status].label}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Requested By</p>
                    <p className="font-medium">{selectedRequisition.requestedBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cost Center</p>
                    <p className="font-medium">{selectedRequisition.costCenterName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Purpose</p>
                  <p>{selectedRequisition.purpose}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Items ({selectedRequisition.items.length})</p>
                  <div className="border rounded">
                    {selectedRequisition.items.map((item) => (
                      <div key={item.id} className="flex justify-between p-2 border-b last:border-0 text-sm">
                        <span>{item.productName} x{item.quantity}</span>
                        <span>{formatCurrency(item.totalCost)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between p-2 bg-muted/30 font-medium text-sm">
                      <span>Total</span>
                      <span>{formatCurrency(selectedRequisition.totalCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

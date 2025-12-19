import { createFileRoute } from '@tanstack/react-router';
import {
  AlertCircle,
  Check,
  ClipboardList,
  Minus,
  Package,
  Plus,
  Search,
} from 'lucide-react';
import { useState } from 'react';

import { DashboardCard, PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
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
import { FilterSelect } from '@/components/ui/filter-select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/inventory/adjustments')({
  component: InventoryAdjustmentsPage,
});

// Types
type AdjustmentReason = 'DAMAGE' | 'EXPIRED' | 'THEFT' | 'FOUND' | 'COUNT_CORRECTION' | 'OTHER';

interface Adjustment {
  id: string;
  adjustmentNumber: string;
  productName: string;
  sku: string;
  warehouse: string;
  quantityBefore: number;
  quantityAdjusted: number;
  quantityAfter: number;
  reason: AdjustmentReason;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// Mock data
const mockAdjustments: Adjustment[] = [
  {
    id: '1',
    adjustmentNumber: 'ADJ-2312-00008',
    productName: 'USB-C Hub',
    sku: 'ELEC-003',
    warehouse: 'Main Warehouse',
    quantityBefore: 203,
    quantityAdjusted: -3,
    quantityAfter: 200,
    reason: 'COUNT_CORRECTION',
    notes: 'Physical count showed discrepancy',
    createdBy: 'Admin User',
    createdAt: '2024-12-06T14:00:00Z',
    status: 'APPROVED',
  },
  {
    id: '2',
    adjustmentNumber: 'ADJ-2312-00007',
    productName: 'Printer Ink Black',
    sku: 'OFFC-002',
    warehouse: 'Main Warehouse',
    quantityBefore: 15,
    quantityAdjusted: -3,
    quantityAfter: 12,
    reason: 'EXPIRED',
    notes: 'Expired ink cartridges removed from stock',
    createdBy: 'Manager User',
    createdAt: '2024-12-05T10:30:00Z',
    status: 'APPROVED',
  },
  {
    id: '3',
    adjustmentNumber: 'ADJ-2312-00006',
    productName: 'Mechanical Keyboard',
    sku: 'ELEC-002',
    warehouse: 'Main Warehouse',
    quantityBefore: 10,
    quantityAdjusted: -2,
    quantityAfter: 8,
    reason: 'DAMAGE',
    notes: 'Damaged during handling',
    createdBy: 'Admin User',
    createdAt: '2024-12-04T16:45:00Z',
    status: 'APPROVED',
  },
  {
    id: '4',
    adjustmentNumber: 'ADJ-2312-00005',
    productName: 'Wireless Mouse',
    sku: 'ELEC-001',
    warehouse: 'Main Warehouse',
    quantityBefore: 148,
    quantityAdjusted: 2,
    quantityAfter: 150,
    reason: 'FOUND',
    notes: 'Found misplaced items in storage',
    createdBy: 'Admin User',
    createdAt: '2024-12-03T09:15:00Z',
    status: 'PENDING',
  },
];

const reasonLabels: Record<AdjustmentReason, { label: string; color: string }> = {
  DAMAGE: { label: 'Damage', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  EXPIRED: { label: 'Expired', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  THEFT: { label: 'Theft', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  FOUND: { label: 'Found', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  COUNT_CORRECTION: { label: 'Count Correction', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
};

const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// Mock products for selection
const mockProducts = [
  { id: '1', name: 'Wireless Mouse', sku: 'ELEC-001', currentStock: 150 },
  { id: '2', name: 'Mechanical Keyboard', sku: 'ELEC-002', currentStock: 8 },
  { id: '3', name: 'USB-C Hub', sku: 'ELEC-003', currentStock: 200 },
  { id: '4', name: 'Printer Ink Black', sku: 'OFFC-002', currentStock: 12 },
];

function InventoryAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>(mockAdjustments);
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    adjustmentType: 'decrease' as 'increase' | 'decrease',
    quantity: '',
    reason: 'COUNT_CORRECTION' as AdjustmentReason,
    notes: '',
  });

  // Filter adjustments
  const filteredAdjustments = adjustments.filter((adj) => {
    const matchesSearch =
      adj.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.adjustmentNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReason = !reasonFilter || adj.reason === reasonFilter;
    const matchesStatus = !statusFilter || adj.status === statusFilter;
    return matchesSearch && matchesReason && matchesStatus;
  });

  const handleCreateAdjustment = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const selectedProduct = mockProducts.find((p) => p.id === formData.productId);
    if (!selectedProduct) return;

    const quantityChange = formData.adjustmentType === 'increase'
      ? parseInt(formData.quantity)
      : -parseInt(formData.quantity);

    const newAdjustment: Adjustment = {
      id: String(adjustments.length + 1),
      adjustmentNumber: `ADJ-${new Date().getFullYear()}-${String(adjustments.length + 1).padStart(5, '0')}`,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      warehouse: 'Main Warehouse',
      quantityBefore: selectedProduct.currentStock,
      quantityAdjusted: quantityChange,
      quantityAfter: selectedProduct.currentStock + quantityChange,
      reason: formData.reason,
      notes: formData.notes || null,
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };

    setAdjustments([newAdjustment, ...adjustments]);
    setIsSaving(false);
    setIsModalOpen(false);
    setFormData({
      productId: '',
      adjustmentType: 'decrease',
      quantity: '',
      reason: 'COUNT_CORRECTION',
      notes: '',
    });
  };

  const handleApprove = (id: string) => {
    setAdjustments((prev) =>
      prev.map((adj) => (adj.id === id ? { ...adj, status: 'APPROVED' as const } : adj))
    );
  };

  const handleReject = (id: string) => {
    setAdjustments((prev) =>
      prev.map((adj) => (adj.id === id ? { ...adj, status: 'REJECTED' as const } : adj))
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Inventory Adjustments"
        description="Record and track stock adjustments"
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Adjustment
          </Button>
        }
      />

      {/* Search and filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by product, SKU, or adjustment #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <FilterSelect
              value={reasonFilter || 'all'}
              onChange={(val) => setReasonFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Reasons' },
                { value: 'DAMAGE', label: 'Damage' },
                { value: 'EXPIRED', label: 'Expired' },
                { value: 'THEFT', label: 'Theft' },
                { value: 'FOUND', label: 'Found' },
                { value: 'COUNT_CORRECTION', label: 'Count Correction' },
                { value: 'OTHER', label: 'Other' },
              ]}
              placeholder="All Reasons"
              className="w-auto"
            />
            <FilterSelect
              value={statusFilter || 'all'}
              onChange={(val) => setStatusFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
              placeholder="All Status"
              className="w-auto"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Adjustments table */}
      <DashboardCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Adjustment #</th>
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">Reason</th>
                <th className="pb-3 font-medium text-right">Before</th>
                <th className="pb-3 font-medium text-right">Change</th>
                <th className="pb-3 font-medium text-right">After</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAdjustments.map((adj) => {
                const reasonConfig = reasonLabels[adj.reason];
                return (
                  <tr key={adj.id} className="border-b last:border-0 table-row-hover">
                    <td className="py-4">
                      <span className="font-medium">{adj.adjustmentNumber}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{adj.productName}</p>
                          <p className="text-sm text-muted-foreground">{adj.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        reasonConfig.color
                      )}>
                        {reasonConfig.label}
                      </span>
                    </td>
                    <td className="py-4 text-right text-muted-foreground">
                      {adj.quantityBefore}
                    </td>
                    <td className="py-4 text-right">
                      <span className={cn(
                        'font-semibold',
                        adj.quantityAdjusted > 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {adj.quantityAdjusted > 0 ? '+' : ''}{adj.quantityAdjusted}
                      </span>
                    </td>
                    <td className="py-4 text-right font-medium">
                      {adj.quantityAfter}
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        statusStyles[adj.status]
                      )}>
                        {adj.status.charAt(0) + adj.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {formatDate(adj.createdAt)}
                    </td>
                    <td className="py-4">
                      {adj.status === 'PENDING' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleApprove(adj.id)}
                            className="text-success hover:text-success"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleReject(adj.id)}
                            className="text-destructive hover:text-destructive"
                            title="Reject"
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAdjustments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No adjustments found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredAdjustments.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredAdjustments.length} adjustments
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* New Adjustment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Inventory Adjustment</DialogTitle>
            <DialogDescription>
              Record a stock adjustment for inventory correction
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">Product *</Label>
              <FilterSelect
                value={formData.productId}
                onChange={(val) => setFormData((f) => ({ ...f, productId: val }))}
                options={mockProducts.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.sku}) - Current: ${p.currentStock}`
                }))}
                placeholder="Select a product"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Adjustment Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.adjustmentType === 'increase' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setFormData((f) => ({ ...f, adjustmentType: 'increase' }))}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Increase
                  </Button>
                  <Button
                    type="button"
                    variant={formData.adjustmentType === 'decrease' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setFormData((f) => ({ ...f, adjustmentType: 'decrease' }))}
                  >
                    <Minus className="mr-1 h-4 w-4" />
                    Decrease
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData((f) => ({ ...f, quantity: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason *</Label>
              <FilterSelect
                value={formData.reason}
                onChange={(val) => setFormData((f) => ({ ...f, reason: val as AdjustmentReason }))}
                options={[
                  { value: 'COUNT_CORRECTION', label: 'Count Correction' },
                  { value: 'DAMAGE', label: 'Damage' },
                  { value: 'EXPIRED', label: 'Expired' },
                  { value: 'THEFT', label: 'Theft' },
                  { value: 'FOUND', label: 'Found' },
                  { value: 'OTHER', label: 'Other' },
                ]}
                placeholder="Select reason"
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Enter any additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateAdjustment}
              disabled={isSaving || !formData.productId || !formData.quantity}
            >
              {isSaving ? 'Creating...' : 'Create Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

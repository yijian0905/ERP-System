import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle,
  DollarSign,
  Edit,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Trash2,
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
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/recurring')({
  component: RecurringRevenuePage,
});

// Types
type BillingCycle = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';

interface RecurringItem {
  id: string;
  name: string;
  customer: string;
  customerId: string;
  description: string;
  amount: number;
  billingCycle: BillingCycle;
  startDate: string;
  nextBillingDate: string;
  status: SubscriptionStatus;
  lastInvoice: string | null;
  totalRevenue: number;
  invoiceCount: number;
}

// Mock data
const mockRecurringItems: RecurringItem[] = [
  {
    id: '1',
    name: 'Premium Support Plan',
    customer: 'Acme Corporation',
    customerId: 'c1',
    description: '24/7 priority support with dedicated account manager',
    amount: 999,
    billingCycle: 'MONTHLY',
    startDate: '2024-01-15',
    nextBillingDate: '2024-12-15',
    status: 'ACTIVE',
    lastInvoice: 'INV-2411-00123',
    totalRevenue: 10989,
    invoiceCount: 11,
  },
  {
    id: '2',
    name: 'Software License Subscription',
    customer: 'TechStart Inc.',
    customerId: 'c2',
    description: 'Enterprise software license - 50 seats',
    amount: 2500,
    billingCycle: 'MONTHLY',
    startDate: '2024-03-01',
    nextBillingDate: '2024-12-01',
    status: 'ACTIVE',
    lastInvoice: 'INV-2411-00145',
    totalRevenue: 22500,
    invoiceCount: 9,
  },
  {
    id: '3',
    name: 'Equipment Lease',
    customer: 'Global Systems',
    customerId: 'c3',
    description: 'Monthly lease for office equipment',
    amount: 750,
    billingCycle: 'MONTHLY',
    startDate: '2024-06-01',
    nextBillingDate: '2024-12-01',
    status: 'ACTIVE',
    lastInvoice: 'INV-2411-00156',
    totalRevenue: 4500,
    invoiceCount: 6,
  },
  {
    id: '4',
    name: 'Maintenance Contract',
    customer: 'City Government',
    customerId: 'c4',
    description: 'Annual maintenance for IT infrastructure',
    amount: 15000,
    billingCycle: 'YEARLY',
    startDate: '2024-01-01',
    nextBillingDate: '2025-01-01',
    status: 'ACTIVE',
    lastInvoice: 'INV-2401-00012',
    totalRevenue: 15000,
    invoiceCount: 1,
  },
  {
    id: '5',
    name: 'Consulting Retainer',
    customer: 'Smart Solutions',
    customerId: 'c5',
    description: '20 hours of consulting per month',
    amount: 3200,
    billingCycle: 'MONTHLY',
    startDate: '2024-04-01',
    nextBillingDate: '2024-12-01',
    status: 'PAUSED',
    lastInvoice: 'INV-2410-00089',
    totalRevenue: 22400,
    invoiceCount: 7,
  },
  {
    id: '6',
    name: 'Quarterly Service Package',
    customer: 'Local Store',
    customerId: 'c6',
    description: 'Quarterly on-site service and inspection',
    amount: 1200,
    billingCycle: 'QUARTERLY',
    startDate: '2024-02-01',
    nextBillingDate: '2025-02-01',
    status: 'ACTIVE',
    lastInvoice: 'INV-2411-00098',
    totalRevenue: 4800,
    invoiceCount: 4,
  },
];

const billingCycleLabels: Record<BillingCycle, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

const statusStyles: Record<SubscriptionStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  PAUSED: { label: 'Paused', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

// Mock customers for form
const mockCustomers = [
  { id: 'c1', name: 'Acme Corporation' },
  { id: 'c2', name: 'TechStart Inc.' },
  { id: 'c3', name: 'Global Systems' },
  { id: 'c4', name: 'City Government' },
  { id: 'c5', name: 'Smart Solutions' },
  { id: 'c6', name: 'Local Store' },
];

function RecurringRevenuePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RecurringItem[]>(mockRecurringItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    customerId: '',
    description: '',
    amount: 0,
    billingCycle: 'MONTHLY' as BillingCycle,
    startDate: new Date().toISOString().split('T')[0],
  });

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCycle = !cycleFilter || item.billingCycle === cycleFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesCycle && matchesStatus;
  });

  // Calculate stats
  const activeItems = items.filter((i) => i.status === 'ACTIVE');
  const monthlyRecurring = activeItems.reduce((sum, item) => {
    switch (item.billingCycle) {
      case 'WEEKLY': return sum + item.amount * 4.33;
      case 'MONTHLY': return sum + item.amount;
      case 'QUARTERLY': return sum + item.amount / 3;
      case 'YEARLY': return sum + item.amount / 12;
      default: return sum;
    }
  }, 0);
  const annualRecurring = monthlyRecurring * 12;
  const totalLifetimeRevenue = items.reduce((sum, i) => sum + i.totalRevenue, 0);

  const handleOpenModal = (item?: RecurringItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        customerId: item.customerId,
        description: item.description,
        amount: item.amount,
        billingCycle: item.billingCycle,
        startDate: item.startDate,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        customerId: '',
        description: '',
        amount: 0,
        billingCycle: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const customer = mockCustomers.find((c) => c.id === formData.customerId);

    if (editingItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
              ...item,
              ...formData,
              customer: customer?.name || item.customer,
            }
            : item
        )
      );
    } else {
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
    }

    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
          : item
      )
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this recurring item?')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleGenerateInvoice = (item: RecurringItem) => {
    // Navigate to invoices page with recurring item data as search params
    // The invoices page can read this and open the create modal with pre-filled data
    navigate({
      to: '/invoices',
      search: {
        action: 'create',
        recurringId: item.id,
        customerId: item.customerId,
        customerName: item.customer,
        description: item.name,
        amount: item.amount.toString(),
      },
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Recurring Revenue"
        description="Manage subscriptions and recurring billing items"
        actions={
          <div className="flex gap-2">
            <Link to="/orders">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>
            </Link>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Recurring Item
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Monthly Recurring Revenue"
          value={`$${monthlyRecurring.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change="MRR"
          changeType="positive"
          icon={DollarSign}
        />
        <StatsCard
          title="Annual Recurring Revenue"
          value={`$${annualRecurring.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change="ARR"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatsCard
          title="Active Subscriptions"
          value={activeItems.length.toString()}
          change={`${items.length} total`}
          changeType="neutral"
          icon={RefreshCw}
        />
        <StatsCard
          title="Lifetime Revenue"
          value={`$${totalLifetimeRevenue.toLocaleString()}`}
          change="All time"
          changeType="neutral"
          icon={CheckCircle}
        />
      </div>

      {/* Search and filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by name or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Cycles</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {/* Items table */}
      <DashboardCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Item / Customer</th>
                <th className="pb-3 font-medium text-right">Amount</th>
                <th className="pb-3 font-medium">Cycle</th>
                <th className="pb-3 font-medium">Next Billing</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Total Revenue</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const statusConfig = statusStyles[item.status];
                return (
                  <tr key={item.id} className="border-b last:border-0 table-row-hover">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <CalendarClock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.customer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-semibold">${item.amount.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">/{billingCycleLabels[item.billingCycle].toLowerCase().slice(0, -2)}</span>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <RefreshCw className="h-3 w-3" />
                        {billingCycleLabels[item.billingCycle]}
                      </span>
                    </td>
                    <td className="py-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(item.nextBillingDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        statusConfig.color
                      )}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <p className="font-medium">${item.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{item.invoiceCount} invoices</p>
                    </td>
                    <td className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenModal(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateInvoice(item)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Generate Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(item.id)}>
                            {item.status === 'ACTIVE' ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Resume
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarClock className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No recurring items found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm || cycleFilter || statusFilter
                ? 'Try adjusting your filters'
                : 'Add your first recurring revenue item'}
            </p>
            {!searchTerm && !cycleFilter && !statusFilter && (
              <Button className="mt-4" onClick={() => handleOpenModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Recurring Item
              </Button>
            )}
          </div>
        )}
      </DashboardCard>

      {/* Info card */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          💰 About Recurring Revenue
        </h3>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
          Track all your subscription and recurring billing items in one place. The system will
          automatically calculate your Monthly Recurring Revenue (MRR) and Annual Recurring
          Revenue (ARR) based on active subscriptions. Generate invoices when billing is due.
        </p>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Recurring Item' : 'Add Recurring Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update the recurring billing details'
                : 'Set up a new recurring revenue item'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Premium Support Plan"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer *</Label>
              <select
                id="customer"
                value={formData.customerId}
                onChange={(e) => setFormData((f) => ({ ...f, customerId: e.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select customer</option>
                {mockCustomers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Brief description of the service or item"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="billingCycle">Billing Cycle *</Label>
                <select
                  id="billingCycle"
                  value={formData.billingCycle}
                  onChange={(e) => setFormData((f) => ({ ...f, billingCycle: e.target.value as BillingCycle }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <DateInput
                value={formData.startDate}
                onChange={(value) => setFormData((f) => ({ ...f, startDate: value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.name || !formData.customerId || !formData.amount}
            >
              {isSaving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

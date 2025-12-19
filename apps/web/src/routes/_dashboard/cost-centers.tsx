import { createFileRoute } from '@tanstack/react-router';
import {
  AlertTriangle,
  Building2,
  Check,
  DollarSign,
  Edit,
  Loader2,
  MoreHorizontal,
  PieChart,
  Plus,
  Search,
  TrendingUp,
  Trash2,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import {
  DashboardCard,
  PageContainer,
  PageHeader,
  StatsCard,
} from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
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
import { FilterSelect } from '@/components/ui/filter-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/cost-centers')({
  component: CostCentersPage,
});

// Types
type CostCenterStatus = 'ACTIVE' | 'INACTIVE' | 'OVER_BUDGET';

interface CostAllocation {
  id: string;
  description: string;
  amount: number;
  date: string;
  reference: string;
  type: 'REQUISITION' | 'PURCHASE' | 'EXPENSE' | 'ADJUSTMENT';
}

interface CostCenter {
  id: string;
  code: string;
  name: string;
  description: string;
  department: string;
  manager: string;
  budget: number;
  usedBudget: number;
  status: CostCenterStatus;
  fiscalYear: number;
  allocations: CostAllocation[];
  createdAt: string;
  updatedAt: string;
}

// Status configuration
const statusConfig: Record<CostCenterStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  OVER_BUDGET: { label: 'Over Budget', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

// Mock data
const mockCostCenters: CostCenter[] = [
  {
    id: 'cc1',
    code: 'CC-ENG',
    name: 'Engineering',
    description: 'Engineering department cost center for R&D and development expenses',
    department: 'Engineering',
    manager: 'John Smith',
    budget: 50000,
    usedBudget: 32500,
    status: 'ACTIVE',
    fiscalYear: 2024,
    allocations: [
      { id: 'a1', description: 'Office supplies', amount: 500, date: '2024-12-01', reference: 'REQ-2024-0001', type: 'REQUISITION' },
      { id: 'a2', description: 'Software licenses', amount: 2500, date: '2024-11-15', reference: 'PO-2024-0045', type: 'PURCHASE' },
      { id: 'a3', description: 'Hardware upgrade', amount: 5000, date: '2024-11-01', reference: 'PO-2024-0038', type: 'PURCHASE' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'cc2',
    code: 'CC-MKT',
    name: 'Marketing',
    description: 'Marketing department cost center for campaigns and promotions',
    department: 'Marketing',
    manager: 'Sarah Johnson',
    budget: 30000,
    usedBudget: 28200,
    status: 'ACTIVE',
    fiscalYear: 2024,
    allocations: [
      { id: 'a4', description: 'Trade show materials', amount: 8000, date: '2024-11-20', reference: 'PO-2024-0050', type: 'PURCHASE' },
      { id: 'a5', description: 'Digital ads', amount: 5000, date: '2024-11-10', reference: 'EXP-2024-0088', type: 'EXPENSE' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-11-25T14:00:00Z',
  },
  {
    id: 'cc3',
    code: 'CC-OPS',
    name: 'Operations',
    description: 'Operations department cost center for operational expenses',
    department: 'Operations',
    manager: 'Mike Chen',
    budget: 75000,
    usedBudget: 45600,
    status: 'ACTIVE',
    fiscalYear: 2024,
    allocations: [
      { id: 'a6', description: 'Safety equipment', amount: 3000, date: '2024-12-05', reference: 'REQ-2024-0002', type: 'REQUISITION' },
      { id: 'a7', description: 'Maintenance supplies', amount: 2500, date: '2024-11-28', reference: 'REQ-2024-0003', type: 'REQUISITION' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-05T11:00:00Z',
  },
  {
    id: 'cc4',
    code: 'CC-HR',
    name: 'Human Resources',
    description: 'HR department cost center for recruitment and training',
    department: 'HR',
    manager: 'Emily Davis',
    budget: 20000,
    usedBudget: 8500,
    status: 'ACTIVE',
    fiscalYear: 2024,
    allocations: [
      { id: 'a8', description: 'Training materials', amount: 2000, date: '2024-11-15', reference: 'PO-2024-0042', type: 'PURCHASE' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-11-15T09:00:00Z',
  },
  {
    id: 'cc5',
    code: 'CC-FIN',
    name: 'Finance',
    description: 'Finance department cost center for accounting and audit expenses',
    department: 'Finance',
    manager: 'Alex Wilson',
    budget: 25000,
    usedBudget: 12300,
    status: 'ACTIVE',
    fiscalYear: 2024,
    allocations: [
      { id: 'a9', description: 'Audit fees', amount: 5000, date: '2024-10-01', reference: 'EXP-2024-0065', type: 'EXPENSE' },
      { id: 'a10', description: 'Software subscription', amount: 1200, date: '2024-09-15', reference: 'EXP-2024-0058', type: 'EXPENSE' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-10-01T16:00:00Z',
  },
  {
    id: 'cc6',
    code: 'CC-PRD',
    name: 'Production',
    description: 'Production department cost center for manufacturing expenses',
    department: 'Production',
    manager: 'David Lee',
    budget: 100000,
    usedBudget: 105800,
    status: 'OVER_BUDGET',
    fiscalYear: 2024,
    allocations: [
      { id: 'a11', description: 'Raw materials', amount: 45000, date: '2024-11-01', reference: 'PO-2024-0055', type: 'PURCHASE' },
      { id: 'a12', description: 'Equipment maintenance', amount: 8000, date: '2024-10-15', reference: 'EXP-2024-0072', type: 'EXPENSE' },
      { id: 'a13', description: 'Safety equipment', amount: 2000, date: '2024-12-01', reference: 'REQ-2024-0004', type: 'REQUISITION' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-01T08:00:00Z',
  },
  {
    id: 'cc7',
    code: 'CC-IT',
    name: 'Information Technology',
    description: 'IT department cost center for technology infrastructure',
    department: 'IT',
    manager: 'Tom Anderson',
    budget: 60000,
    usedBudget: 42000,
    status: 'ACTIVE',
    fiscalYear: 2024,
    allocations: [
      { id: 'a14', description: 'Server upgrades', amount: 15000, date: '2024-10-20', reference: 'PO-2024-0048', type: 'PURCHASE' },
      { id: 'a15', description: 'Cloud services', amount: 8000, date: '2024-11-01', reference: 'EXP-2024-0080', type: 'EXPENSE' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-11-01T12:00:00Z',
  },
];

function CostCentersPage() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>(mockCostCenters);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    department: '',
    manager: '',
    budget: 0,
  });

  // Get unique departments
  const departments = [...new Set(costCenters.map((cc) => cc.department))];

  // Filter cost centers
  const filteredCostCenters = costCenters.filter((cc) => {
    const matchesSearch =
      cc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cc.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || cc.status === statusFilter;
    const matchesDepartment = !departmentFilter || cc.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Calculate stats
  const totalBudget = costCenters.reduce((sum, cc) => sum + cc.budget, 0);
  const totalUsed = costCenters.reduce((sum, cc) => sum + cc.usedBudget, 0);
  const totalRemaining = totalBudget - totalUsed;
  const overBudgetCount = costCenters.filter((cc) => cc.usedBudget > cc.budget).length;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Calculate budget percentage
  const getBudgetPercentage = (used: number, budget: number) => {
    return budget > 0 ? Math.min((used / budget) * 100, 100) : 0;
  };

  // Get budget color
  const getBudgetColor = (used: number, budget: number) => {
    const percentage = (used / budget) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      department: '',
      manager: '',
      budget: 0,
    });
  };

  // Open edit modal
  const handleEdit = (cc: CostCenter) => {
    setSelectedCostCenter(cc);
    setFormData({
      code: cc.code,
      name: cc.name,
      description: cc.description,
      department: cc.department,
      manager: cc.manager,
      budget: cc.budget,
    });
    setIsEditModalOpen(true);
  };

  // View details
  const handleViewDetails = (cc: CostCenter) => {
    setSelectedCostCenter(cc);
    setIsDetailsModalOpen(true);
  };

  // Save cost center
  const handleSave = async (isNew: boolean) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (isNew) {
      const newCostCenter: CostCenter = {
        id: `cc${costCenters.length + 1}`,
        code: formData.code,
        name: formData.name,
        description: formData.description,
        department: formData.department,
        manager: formData.manager,
        budget: formData.budget,
        usedBudget: 0,
        status: 'ACTIVE',
        fiscalYear: new Date().getFullYear(),
        allocations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCostCenters((prev) => [newCostCenter, ...prev]);
      setIsAddModalOpen(false);
    } else if (selectedCostCenter) {
      setCostCenters((prev) =>
        prev.map((cc) =>
          cc.id === selectedCostCenter.id
            ? {
              ...cc,
              code: formData.code,
              name: formData.name,
              description: formData.description,
              department: formData.department,
              manager: formData.manager,
              budget: formData.budget,
              status: cc.usedBudget > formData.budget ? 'OVER_BUDGET' : 'ACTIVE',
              updatedAt: new Date().toISOString(),
            }
            : cc
        )
      );
      setIsEditModalOpen(false);
    }

    resetForm();
    setSelectedCostCenter(null);
    setIsSaving(false);
  };

  // Delete cost center
  const handleDelete = (ccId: string) => {
    setCostCenters((prev) => prev.filter((cc) => cc.id !== ccId));
  };

  // Toggle status
  const handleToggleStatus = (ccId: string) => {
    setCostCenters((prev) =>
      prev.map((cc) =>
        cc.id === ccId
          ? {
            ...cc,
            status: cc.status === 'ACTIVE' ? 'INACTIVE' : cc.usedBudget > cc.budget ? 'OVER_BUDGET' : 'ACTIVE',
            updatedAt: new Date().toISOString(),
          }
          : cc
      )
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Cost Centers"
        description="Manage departmental budgets and track cost allocations"
        actions={
          <Button onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Cost Center
          </Button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Budget"
          value={formatCurrency(totalBudget)}
          change={`FY ${new Date().getFullYear()}`}
          changeType="neutral"
          icon={DollarSign}
        />
        <StatsCard
          title="Total Used"
          value={formatCurrency(totalUsed)}
          change={`${((totalUsed / totalBudget) * 100).toFixed(1)}% of budget`}
          changeType="neutral"
          icon={TrendingUp}
        />
        <StatsCard
          title="Remaining Budget"
          value={formatCurrency(totalRemaining)}
          change={totalRemaining < 0 ? 'Over budget!' : 'Available'}
          changeType={totalRemaining < 0 ? 'negative' : 'positive'}
          icon={PieChart}
        />
        <StatsCard
          title="Over Budget"
          value={overBudgetCount.toString()}
          change={overBudgetCount > 0 ? 'Needs attention' : 'All on track'}
          changeType={overBudgetCount > 0 ? 'negative' : 'positive'}
          icon={AlertTriangle}
        />
      </div>

      {/* Filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by code, name, or manager..."
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
              value={departmentFilter || 'all'}
              onChange={(val) => setDepartmentFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Departments' },
                ...departments.map((dept) => ({ value: dept, label: dept })),
              ]}
              placeholder="All Departments"
              className="w-auto"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Cost Centers Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCostCenters.map((cc) => {
          const budgetPercentage = getBudgetPercentage(cc.usedBudget, cc.budget);
          const budgetColor = getBudgetColor(cc.usedBudget, cc.budget);
          const remaining = cc.budget - cc.usedBudget;

          return (
            <DashboardCard key={cc.id} className="relative">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{cc.code}</span>
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', statusConfig[cc.status].color)}>
                      {statusConfig[cc.status].label}
                    </span>
                  </div>
                  <h3 className="font-semibold mt-1">{cc.name}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(cc)}>
                      <PieChart className="mr-2 h-4 w-4" />
                      View Allocations
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(cc)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleToggleStatus(cc.id)}>
                      {cc.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(cc.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{cc.department}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>Manager: {cc.manager}</span>
                </div>
              </div>

              {/* Budget Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget Used</span>
                  <span className="font-medium">{budgetPercentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', budgetColor)}
                    style={{ width: `${budgetPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(cc.usedBudget)} used</span>
                  <span>{formatCurrency(cc.budget)} budget</span>
                </div>
              </div>

              {/* Remaining */}
              <div className={cn(
                'mt-4 pt-3 border-t flex justify-between items-center',
                remaining < 0 && 'text-red-600 dark:text-red-400'
              )}>
                <span className="text-sm">Remaining</span>
                <span className="font-semibold">{formatCurrency(remaining)}</span>
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {filteredCostCenters.length === 0 && (
        <DashboardCard>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No cost centers found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </DashboardCard>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedCostCenter(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditModalOpen ? 'Edit Cost Center' : 'Add Cost Center'}</DialogTitle>
            <DialogDescription>
              {isEditModalOpen ? 'Update cost center information' : 'Create a new cost center for budget tracking'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Cost Center Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., CC-ENG"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Engineering"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this cost center"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData((f) => ({ ...f, department: e.target.value }))}
                  placeholder="e.g., Engineering"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manager">Manager *</Label>
                <Input
                  id="manager"
                  value={formData.manager}
                  onChange={(e) => setFormData((f) => ({ ...f, manager: e.target.value }))}
                  placeholder="e.g., John Smith"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget">Annual Budget ($) *</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="100"
                value={formData.budget || ''}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormData((f) => ({ ...f, budget: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setSelectedCostCenter(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => handleSave(isAddModalOpen)}
              disabled={isSaving || !formData.code || !formData.name || !formData.department || !formData.manager || !formData.budget}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : isEditModalOpen ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cost Allocations</DialogTitle>
            <DialogDescription>
              {selectedCostCenter?.code} - {selectedCostCenter?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedCostCenter && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="text-lg font-semibold">{formatCurrency(selectedCostCenter.budget)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Used</p>
                  <p className="text-lg font-semibold">{formatCurrency(selectedCostCenter.usedBudget)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className={cn(
                    'text-lg font-semibold',
                    selectedCostCenter.budget - selectedCostCenter.usedBudget < 0 && 'text-red-600'
                  )}>
                    {formatCurrency(selectedCostCenter.budget - selectedCostCenter.usedBudget)}
                  </p>
                </div>
              </div>

              {/* Allocations Table */}
              <ScrollArea className="h-[300px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Reference</th>
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedCostCenter.allocations.map((alloc) => (
                      <tr key={alloc.id}>
                        <td className="py-2">{new Date(alloc.date).toLocaleDateString()}</td>
                        <td className="py-2 font-medium">{alloc.reference}</td>
                        <td className="py-2">{alloc.description}</td>
                        <td className="py-2">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted">
                            {alloc.type}
                          </span>
                        </td>
                        <td className="py-2 text-right font-medium">{formatCurrency(alloc.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedCostCenter.allocations.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No allocations recorded yet
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

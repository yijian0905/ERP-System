import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  DollarSign,
  FileText,
  Filter,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ExportDropdown } from '@/components/export/export-dropdown';
import {
  DashboardCard,
  PageContainer,
  PageHeader,
  StatsCard,
} from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import {
  DateRangeSelector,
  type DateRange,
  type PresetOption,
} from '@/components/ui/date-range-selector';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  exportData,
  formatCurrencyForExport,
  formatPercentageForExport,
  formatDateForExport,
  getExportTimestamp,
  type ExportColumn,
  type ExportFormat,
} from '@/lib/export';
import { cn } from '@/lib/utils';
import { FilterSelect } from '@/components/ui/filter-select';

export const Route = createFileRoute('/_dashboard/reports/cost-accounting')({
  component: CostAccountingReportPage,
});

// Types
interface CostCenterSummary {
  id: string;
  code: string;
  name: string;
  department: string;
  budget: number;
  usedBudget: number;
  requisitionCost: number;
  purchaseCost: number;
  expenseCost: number;
  variance: number;
  variancePercent: number;
}

interface MonthlyData {
  month: string;
  requisitions: number;
  purchases: number;
  expenses: number;
  total: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface RequisitionSummary {
  id: string;
  requisitionNumber: string;
  costCenter: string;
  purpose: string;
  amount: number;
  date: string;
  status: string;
}

// Mock data
const mockCostCenterSummaries: CostCenterSummary[] = [
  { id: '1', code: 'CC-ENG', name: 'Engineering', department: 'Engineering', budget: 50000, usedBudget: 32500, requisitionCost: 5500, purchaseCost: 20000, expenseCost: 7000, variance: 17500, variancePercent: 35 },
  { id: '2', code: 'CC-MKT', name: 'Marketing', department: 'Marketing', budget: 30000, usedBudget: 28200, requisitionCost: 2200, purchaseCost: 18000, expenseCost: 8000, variance: 1800, variancePercent: 6 },
  { id: '3', code: 'CC-OPS', name: 'Operations', department: 'Operations', budget: 75000, usedBudget: 45600, requisitionCost: 8600, purchaseCost: 25000, expenseCost: 12000, variance: 29400, variancePercent: 39.2 },
  { id: '4', code: 'CC-HR', name: 'Human Resources', department: 'HR', budget: 20000, usedBudget: 8500, requisitionCost: 1500, purchaseCost: 5000, expenseCost: 2000, variance: 11500, variancePercent: 57.5 },
  { id: '5', code: 'CC-FIN', name: 'Finance', department: 'Finance', budget: 25000, usedBudget: 12300, requisitionCost: 1300, purchaseCost: 6000, expenseCost: 5000, variance: 12700, variancePercent: 50.8 },
  { id: '6', code: 'CC-PRD', name: 'Production', department: 'Production', budget: 100000, usedBudget: 105800, requisitionCost: 15800, purchaseCost: 65000, expenseCost: 25000, variance: -5800, variancePercent: -5.8 },
  { id: '7', code: 'CC-IT', name: 'Information Technology', department: 'IT', budget: 60000, usedBudget: 42000, requisitionCost: 4000, purchaseCost: 28000, expenseCost: 10000, variance: 18000, variancePercent: 30 },
];

const mockMonthlyData: MonthlyData[] = [
  { month: 'Jul', requisitions: 12500, purchases: 45000, expenses: 18000, total: 75500 },
  { month: 'Aug', requisitions: 15000, purchases: 52000, expenses: 22000, total: 89000 },
  { month: 'Sep', requisitions: 11000, purchases: 38000, expenses: 15000, total: 64000 },
  { month: 'Oct', requisitions: 18000, purchases: 65000, expenses: 28000, total: 111000 },
  { month: 'Nov', requisitions: 22000, purchases: 72000, expenses: 32000, total: 126000 },
  { month: 'Dec', requisitions: 14500, purchases: 48000, expenses: 20000, total: 82500 },
];

const mockCategoryBreakdown: CategoryBreakdown[] = [
  { category: 'Raw Materials', amount: 125000, percentage: 35, color: '#3b82f6' },
  { category: 'Office Supplies', amount: 45000, percentage: 12.6, color: '#10b981' },
  { category: 'IT Equipment', amount: 65000, percentage: 18.2, color: '#f59e0b' },
  { category: 'Safety Equipment', amount: 25000, percentage: 7, color: '#ef4444' },
  { category: 'Maintenance', amount: 35000, percentage: 9.8, color: '#8b5cf6' },
  { category: 'Services', amount: 62000, percentage: 17.4, color: '#06b6d4' },
];

const mockRequisitionSummary: RequisitionSummary[] = [
  { id: '1', requisitionNumber: 'REQ-2024-0001', costCenter: 'Engineering', purpose: 'Monthly office supplies', amount: 114.95, date: '2024-12-01', status: 'FULFILLED' },
  { id: '2', requisitionNumber: 'REQ-2024-0002', costCenter: 'Production', purpose: 'Safety equipment for new hires', amount: 400, date: '2024-12-05', status: 'APPROVED' },
  { id: '3', requisitionNumber: 'REQ-2024-0003', costCenter: 'Operations', purpose: 'Emergency raw material request', amount: 3250, date: '2024-12-07', status: 'PENDING' },
  { id: '4', requisitionNumber: 'REQ-2024-0004', costCenter: 'Marketing', purpose: 'New IT equipment', amount: 700, date: '2024-12-03', status: 'REJECTED' },
  { id: '5', requisitionNumber: 'REQ-2024-0005', costCenter: 'Finance', purpose: 'Audit preparation supplies', amount: 170, date: '2024-12-07', status: 'DRAFT' },
  { id: '6', requisitionNumber: 'REQ-2024-0006', costCenter: 'IT', purpose: 'Server maintenance parts', amount: 2500, date: '2024-12-02', status: 'FULFILLED' },
  { id: '7', requisitionNumber: 'REQ-2024-0007', costCenter: 'HR', purpose: 'Training materials', amount: 850, date: '2024-11-28', status: 'FULFILLED' },
];

function CostAccountingReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
    preset: 'this_month',
  });
  const [selectedCostCenter, setSelectedCostCenter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // Cost accounting report presets
  const costAccountingPresets: PresetOption[] = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year (YTD)' },
    { value: 'last_year', label: 'Last Year' },
  ];

  // Calculate totals
  const totalBudget = mockCostCenterSummaries.reduce((sum, cc) => sum + cc.budget, 0);
  const totalUsed = mockCostCenterSummaries.reduce((sum, cc) => sum + cc.usedBudget, 0);
  const totalRequisitions = mockCostCenterSummaries.reduce((sum, cc) => sum + cc.requisitionCost, 0);
  const totalPurchases = mockCostCenterSummaries.reduce((sum, cc) => sum + cc.purchaseCost, 0);
  const totalExpenses = mockCostCenterSummaries.reduce((sum, cc) => sum + cc.expenseCost, 0);
  const overBudgetTotal = mockCostCenterSummaries
    .filter((cc) => cc.variance < 0)
    .reduce((sum, cc) => sum + Math.abs(cc.variance), 0);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Filter data by cost center
  const filteredSummaries = selectedCostCenter && selectedCostCenter !== 'all'
    ? mockCostCenterSummaries.filter((cc) => cc.id === selectedCostCenter)
    : mockCostCenterSummaries;

  // Export handler
  const handleExport = useCallback(async (format: ExportFormat) => {
    setIsExporting(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Export Cost Center Summary
      const costCenterColumns: ExportColumn<CostCenterSummary>[] = [
        { header: 'Code', accessor: 'code' },
        { header: 'Name', accessor: 'name' },
        { header: 'Department', accessor: 'department' },
        { header: 'Budget ($)', accessor: 'budget', format: formatCurrencyForExport },
        { header: 'Requisition Cost ($)', accessor: 'requisitionCost', format: formatCurrencyForExport },
        { header: 'Purchase Cost ($)', accessor: 'purchaseCost', format: formatCurrencyForExport },
        { header: 'Expense Cost ($)', accessor: 'expenseCost', format: formatCurrencyForExport },
        { header: 'Total Used ($)', accessor: 'usedBudget', format: formatCurrencyForExport },
        { header: 'Variance ($)', accessor: 'variance', format: formatCurrencyForExport },
        { header: 'Variance (%)', accessor: 'variancePercent', format: formatPercentageForExport },
      ];

      exportData({
        filename: `cost-accounting-summary-${getExportTimestamp()}`,
        data: filteredSummaries,
        columns: costCenterColumns,
        format,
        sheetName: 'Cost Center Summary',
      });

      // Export Monthly Trend
      const monthlyColumns: ExportColumn<MonthlyData>[] = [
        { header: 'Month', accessor: 'month' },
        { header: 'Requisitions ($)', accessor: 'requisitions', format: formatCurrencyForExport },
        { header: 'Purchases ($)', accessor: 'purchases', format: formatCurrencyForExport },
        { header: 'Expenses ($)', accessor: 'expenses', format: formatCurrencyForExport },
        { header: 'Total ($)', accessor: 'total', format: formatCurrencyForExport },
      ];

      exportData({
        filename: `cost-accounting-monthly-trend-${getExportTimestamp()}`,
        data: mockMonthlyData,
        columns: monthlyColumns,
        format,
        sheetName: 'Monthly Trend',
      });

      // Export Category Breakdown
      const categoryColumns: ExportColumn<CategoryBreakdown>[] = [
        { header: 'Category', accessor: 'category' },
        { header: 'Amount ($)', accessor: 'amount', format: formatCurrencyForExport },
        { header: 'Percentage', accessor: 'percentage', format: formatPercentageForExport },
      ];

      exportData({
        filename: `cost-accounting-categories-${getExportTimestamp()}`,
        data: mockCategoryBreakdown,
        columns: categoryColumns,
        format,
        sheetName: 'Category Breakdown',
      });

      // Export Requisitions
      const requisitionColumns: ExportColumn<RequisitionSummary>[] = [
        { header: 'Requisition #', accessor: 'requisitionNumber' },
        { header: 'Cost Center', accessor: 'costCenter' },
        { header: 'Purpose', accessor: 'purpose' },
        { header: 'Amount ($)', accessor: 'amount', format: formatCurrencyForExport },
        { header: 'Date', accessor: 'date', format: formatDateForExport },
        { header: 'Status', accessor: 'status' },
      ];

      exportData({
        filename: `cost-accounting-requisitions-${getExportTimestamp()}`,
        data: mockRequisitionSummary,
        columns: requisitionColumns,
        format,
        sheetName: 'Requisitions',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredSummaries]);

  return (
    <PageContainer>
      <PageHeader
        title="Cost Accounting Report"
        description="Analyze cost allocations, budget utilization, and departmental expenses"
        actions={
          <ExportDropdown
            onExport={handleExport}
            isExporting={isExporting}
            label="Export Report"
          />
        }
      />

      {/* Filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <DateRangeSelector
              value={dateRange}
              onChange={setDateRange}
              presets={costAccountingPresets}
            />
            <FilterSelect
              value={selectedCostCenter}
              onChange={setSelectedCostCenter}
              options={[
                { value: 'all', label: 'All Cost Centers' },
                ...mockCostCenterSummaries.map((cc) => ({
                  value: cc.id,
                  label: `${cc.code} - ${cc.name}`,
                })),
              ]}
              className="w-auto"
            />
          </div>
        </div>
      </DashboardCard>

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
          title="Total Allocated"
          value={formatCurrency(totalUsed)}
          change={`${((totalUsed / totalBudget) * 100).toFixed(1)}% utilized`}
          changeType="neutral"
          icon={TrendingUp}
        />
        <StatsCard
          title="Requisition Costs"
          value={formatCurrency(totalRequisitions)}
          change={`${((totalRequisitions / totalUsed) * 100).toFixed(1)}% of total`}
          changeType="neutral"
          icon={FileText}
        />
        <StatsCard
          title="Over Budget"
          value={formatCurrency(overBudgetTotal)}
          change={overBudgetTotal > 0 ? 'Needs review' : 'On track'}
          changeType={overBudgetTotal > 0 ? 'negative' : 'positive'}
          icon={TrendingDown}
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend Chart */}
        <DashboardCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Monthly Cost Trend</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Requisitions</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Purchases</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Expenses</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis
                className="text-xs"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="requisitions" fill="#3b82f6" name="Requisitions" />
              <Bar dataKey="purchases" fill="#10b981" name="Purchases" />
              <Bar dataKey="expenses" fill="#f59e0b" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>

        {/* Category Breakdown Pie Chart */}
        <DashboardCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Cost by Category</h3>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={mockCategoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="amount"
                >
                  {mockCategoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {mockCategoryBreakdown.map((cat, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.category}</span>
                  </div>
                  <span className="font-medium">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Cost Center Summary Table */}
      <DashboardCard className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Cost Center Summary</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {filteredSummaries.length} cost centers
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background border-b">
              <tr className="text-left text-muted-foreground">
                <th className="pb-3 font-medium">Cost Center</th>
                <th className="pb-3 font-medium text-right">Budget</th>
                <th className="pb-3 font-medium text-right">Requisitions</th>
                <th className="pb-3 font-medium text-right">Purchases</th>
                <th className="pb-3 font-medium text-right">Expenses</th>
                <th className="pb-3 font-medium text-right">Total Used</th>
                <th className="pb-3 font-medium text-right">Variance</th>
                <th className="pb-3 font-medium text-right">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSummaries.map((cc) => {
                const utilization = (cc.usedBudget / cc.budget) * 100;
                const isOverBudget = cc.variance < 0;

                return (
                  <tr key={cc.id} className="hover:bg-muted/50">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{cc.name}</p>
                        <p className="text-xs text-muted-foreground">{cc.code}</p>
                      </div>
                    </td>
                    <td className="py-3 text-right">{formatCurrency(cc.budget)}</td>
                    <td className="py-3 text-right">{formatCurrency(cc.requisitionCost)}</td>
                    <td className="py-3 text-right">{formatCurrency(cc.purchaseCost)}</td>
                    <td className="py-3 text-right">{formatCurrency(cc.expenseCost)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(cc.usedBudget)}</td>
                    <td className={cn(
                      'py-3 text-right font-medium',
                      isOverBudget ? 'text-red-600' : 'text-green-600'
                    )}>
                      <div className="flex items-center justify-end gap-1">
                        {isOverBudget ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {formatCurrency(Math.abs(cc.variance))}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              utilization >= 100 ? 'bg-red-500' :
                                utilization >= 80 ? 'bg-amber-500' :
                                  'bg-green-500'
                            )}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right">{utilization.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t bg-muted/30 font-medium">
              <tr>
                <td className="py-3">Total</td>
                <td className="py-3 text-right">{formatCurrency(totalBudget)}</td>
                <td className="py-3 text-right">{formatCurrency(totalRequisitions)}</td>
                <td className="py-3 text-right">{formatCurrency(totalPurchases)}</td>
                <td className="py-3 text-right">{formatCurrency(totalExpenses)}</td>
                <td className="py-3 text-right">{formatCurrency(totalUsed)}</td>
                <td className={cn(
                  'py-3 text-right',
                  totalBudget - totalUsed < 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {formatCurrency(totalBudget - totalUsed)}
                </td>
                <td className="py-3 text-right">{((totalUsed / totalBudget) * 100).toFixed(0)}%</td>
              </tr>
            </tfoot>
          </table>
        </ScrollArea>
      </DashboardCard>

      {/* Recent Requisitions */}
      <DashboardCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Requisitions</h3>
          <Button variant="ghost" size="sm" asChild>
            <a href="/requisitions">View All</a>
          </Button>
        </div>
        <ScrollArea className="h-[250px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background border-b">
              <tr className="text-left text-muted-foreground">
                <th className="pb-3 font-medium">Requisition #</th>
                <th className="pb-3 font-medium">Cost Center</th>
                <th className="pb-3 font-medium">Purpose</th>
                <th className="pb-3 font-medium text-right">Amount</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockRequisitionSummary.map((req) => {
                const statusColors: Record<string, string> = {
                  FULFILLED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                };

                return (
                  <tr key={req.id} className="hover:bg-muted/50">
                    <td className="py-3 font-medium">{req.requisitionNumber}</td>
                    <td className="py-3">{req.costCenter}</td>
                    <td className="py-3 max-w-[200px] truncate">{req.purpose}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(req.amount)}</td>
                    <td className="py-3">{new Date(req.date).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', statusColors[req.status])}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      </DashboardCard>
    </PageContainer>
  );
}

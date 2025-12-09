import { createFileRoute } from '@tanstack/react-router';
import {
  Calendar,
  CreditCard,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
  exportData,
  formatCurrencyForExport,
  formatPercentageForExport,
  getExportTimestamp,
  type ExportColumn,
  type ExportFormat,
} from '@/lib/export';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/reports/financial')({
  component: FinancialReportPage,
});

// Mock data
const monthlyPL = [
  { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
  { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000 },
  { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
  { month: 'Apr', revenue: 61000, expenses: 38000, profit: 23000 },
  { month: 'May', revenue: 55000, expenses: 36000, profit: 19000 },
  { month: 'Jun', revenue: 67000, expenses: 42000, profit: 25000 },
  { month: 'Jul', revenue: 72000, expenses: 45000, profit: 27000 },
  { month: 'Aug', revenue: 69000, expenses: 43000, profit: 26000 },
  { month: 'Sep', revenue: 78000, expenses: 48000, profit: 30000 },
  { month: 'Oct', revenue: 85000, expenses: 52000, profit: 33000 },
  { month: 'Nov', revenue: 92000, expenses: 55000, profit: 37000 },
  { month: 'Dec', revenue: 105000, expenses: 62000, profit: 43000 },
];

const expenseBreakdown = [
  { category: 'Cost of Goods', amount: 280000, percentage: 45 },
  { category: 'Salaries', amount: 155000, percentage: 25 },
  { category: 'Marketing', amount: 62000, percentage: 10 },
  { category: 'Rent & Utilities', amount: 49600, percentage: 8 },
  { category: 'Technology', amount: 37200, percentage: 6 },
  { category: 'Other', amount: 37200, percentage: 6 },
];

const accountsReceivable = [
  { customer: 'Acme Corporation', amount: 12500, daysOverdue: 0, status: 'current' },
  { customer: 'TechStart Inc.', amount: 8900, daysOverdue: 15, status: 'overdue' },
  { customer: 'Global Systems', amount: 23400, daysOverdue: 45, status: 'overdue' },
  { customer: 'Smart Solutions', amount: 5600, daysOverdue: 0, status: 'current' },
  { customer: 'City Government', amount: 18200, daysOverdue: 30, status: 'overdue' },
];

const cashFlowData = [
  { month: 'Jul', inflow: 72000, outflow: 58000 },
  { month: 'Aug', inflow: 69000, outflow: 62000 },
  { month: 'Sep', inflow: 85000, outflow: 68000 },
  { month: 'Oct', inflow: 92000, outflow: 75000 },
  { month: 'Nov', inflow: 98000, outflow: 78000 },
  { month: 'Dec', inflow: 115000, outflow: 85000 },
];

// Types for export
interface MonthlyPL {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface ExpenseBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

interface AccountReceivable {
  customer: string;
  amount: number;
  daysOverdue: number;
  status: string;
}

interface CashFlowItem {
  month: string;
  inflow: number;
  outflow: number;
}

function FinancialReportPage() {
  const [dateRange, setDateRange] = useState('year');
  const [isExporting, setIsExporting] = useState(false);

  // Calculate totals
  const totalRevenue = monthlyPL.reduce((sum, m) => sum + m.revenue, 0);
  const totalExpenses = monthlyPL.reduce((sum, m) => sum + m.expenses, 0);
  const totalProfit = monthlyPL.reduce((sum, m) => sum + m.profit, 0);
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  const totalReceivable = accountsReceivable.reduce((sum, a) => sum + a.amount, 0);
  const overdueReceivable = accountsReceivable
    .filter((a) => a.status === 'overdue')
    .reduce((sum, a) => sum + a.amount, 0);

  // Export handler
  const handleExport = useCallback(async (format: ExportFormat) => {
    setIsExporting(true);
    
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Export Profit & Loss
      const plColumns: ExportColumn<MonthlyPL>[] = [
        { header: 'Month', accessor: 'month' },
        { header: 'Revenue ($)', accessor: 'revenue', format: formatCurrencyForExport },
        { header: 'Expenses ($)', accessor: 'expenses', format: formatCurrencyForExport },
        { header: 'Profit ($)', accessor: 'profit', format: formatCurrencyForExport },
        { header: 'Profit Margin (%)', accessor: (row) => ((row.profit / row.revenue) * 100).toFixed(1) },
      ];

      exportData({
        filename: `financial-report-profit-loss-${getExportTimestamp()}`,
        data: monthlyPL as MonthlyPL[],
        columns: plColumns,
        format,
        sheetName: 'Profit & Loss',
      });

      // Export Expense Breakdown
      const expenseColumns: ExportColumn<ExpenseBreakdownItem>[] = [
        { header: 'Category', accessor: 'category' },
        { header: 'Amount ($)', accessor: 'amount', format: formatCurrencyForExport },
        { header: 'Percentage', accessor: 'percentage', format: formatPercentageForExport },
      ];

      exportData({
        filename: `financial-report-expenses-${getExportTimestamp()}`,
        data: expenseBreakdown as ExpenseBreakdownItem[],
        columns: expenseColumns,
        format,
        sheetName: 'Expense Breakdown',
      });

      // Export Accounts Receivable
      const arColumns: ExportColumn<AccountReceivable>[] = [
        { header: 'Customer', accessor: 'customer' },
        { header: 'Amount ($)', accessor: 'amount', format: formatCurrencyForExport },
        { header: 'Days Overdue', accessor: 'daysOverdue' },
        { header: 'Status', accessor: 'status' },
      ];

      exportData({
        filename: `financial-report-accounts-receivable-${getExportTimestamp()}`,
        data: accountsReceivable as AccountReceivable[],
        columns: arColumns,
        format,
        sheetName: 'Accounts Receivable',
      });

      // Export Cash Flow
      const cfColumns: ExportColumn<CashFlowItem>[] = [
        { header: 'Month', accessor: 'month' },
        { header: 'Cash Inflow ($)', accessor: 'inflow', format: formatCurrencyForExport },
        { header: 'Cash Outflow ($)', accessor: 'outflow', format: formatCurrencyForExport },
        { header: 'Net Cash Flow ($)', accessor: (row) => (row.inflow - row.outflow).toFixed(2) },
      ];

      exportData({
        filename: `financial-report-cash-flow-${getExportTimestamp()}`,
        data: cashFlowData as CashFlowItem[],
        columns: cfColumns,
        format,
        sheetName: 'Cash Flow',
      });
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Financial Report"
        description="Revenue, expenses, and profitability analysis"
        actions={
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Custom Date
            </Button>
            <ExportDropdown onExport={handleExport} isExporting={isExporting} />
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`$${(totalRevenue / 1000).toFixed(0)}K`}
          change="+18.2% vs last year"
          changeType="positive"
          icon={DollarSign}
        />
        <StatsCard
          title="Total Expenses"
          value={`$${(totalExpenses / 1000).toFixed(0)}K`}
          change="+12.5% vs last year"
          changeType="negative"
          icon={TrendingDown}
        />
        <StatsCard
          title="Net Profit"
          value={`$${(totalProfit / 1000).toFixed(0)}K`}
          change="+24.8% vs last year"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatsCard
          title="Profit Margin"
          value={`${profitMargin}%`}
          change="+2.3% improvement"
          changeType="positive"
          icon={CreditCard}
        />
      </div>

      {/* Profit & Loss Chart */}
      <DashboardCard title="Profit & Loss" description="Monthly revenue, expenses, and profit" className="mb-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyPL}>
              <XAxis
                dataKey="month"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stackId="1"
                stroke="hsl(142, 76%, 36%)"
                fill="hsl(142, 76%, 36%)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stackId="2"
                stroke="hsl(0, 84%, 60%)"
                fill="hsl(0, 84%, 60%)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Expenses</span>
          </div>
        </div>
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Expense Breakdown */}
        <DashboardCard title="Expense Breakdown" description="Where your money goes">
          <div className="space-y-4">
            {expenseBreakdown.map((expense) => (
              <div key={expense.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{expense.category}</span>
                  <span className="text-sm text-muted-foreground">
                    ${(expense.amount / 1000).toFixed(0)}K ({expense.percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${expense.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Cash Flow */}
        <DashboardCard title="Cash Flow" description="Money in vs money out">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <XAxis
                  dataKey="month"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Bar dataKey="inflow" name="Cash In" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name="Cash Out" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Cash In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Cash Out</span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Accounts Receivable */}
      <DashboardCard
        title="Accounts Receivable"
        description="Outstanding customer balances"
        actions={
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
            <p className="text-lg font-bold">${totalReceivable.toLocaleString()}</p>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium text-right">Amount</th>
                <th className="pb-3 font-medium text-right">Days Overdue</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {accountsReceivable.map((account) => (
                <tr key={account.customer} className="border-b last:border-0">
                  <td className="py-3 font-medium">{account.customer}</td>
                  <td className="py-3 text-right">${account.amount.toLocaleString()}</td>
                  <td className="py-3 text-right">
                    {account.daysOverdue > 0 ? (
                      <span className="text-destructive">{account.daysOverdue} days</span>
                    ) : (
                      <span className="text-muted-foreground">Current</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      account.status === 'current'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}>
                      {account.status === 'current' ? 'Current' : 'Overdue'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Receivable Summary */}
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Current</p>
            <p className="text-lg font-semibold text-success">
              ${(totalReceivable - overdueReceivable).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-lg font-semibold text-destructive">
              ${overdueReceivable.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Collection Rate</p>
            <p className="text-lg font-semibold">
              {(((totalReceivable - overdueReceivable) / totalReceivable) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </DashboardCard>
    </PageContainer>
  );
}

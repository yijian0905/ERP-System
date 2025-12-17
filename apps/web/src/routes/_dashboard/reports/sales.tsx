import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowUpRight,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
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
import {
  DateRangeSelector,
  type DateRange,
  type PresetOption,
} from '@/components/ui/date-range-selector';
import {
  exportData,
  formatCurrencyForExport,
  getExportTimestamp,
  type ExportColumn,
  type ExportFormat,
} from '@/lib/export';

export const Route = createFileRoute('/_dashboard/reports/sales')({
  component: SalesReportPage,
});

// Mock data
const monthlySalesData = [
  { month: 'Jan', sales: 12500, orders: 45 },
  { month: 'Feb', sales: 15200, orders: 52 },
  { month: 'Mar', sales: 18900, orders: 68 },
  { month: 'Apr', sales: 16400, orders: 58 },
  { month: 'May', sales: 21300, orders: 75 },
  { month: 'Jun', sales: 19800, orders: 70 },
  { month: 'Jul', sales: 23400, orders: 82 },
  { month: 'Aug', sales: 25100, orders: 88 },
  { month: 'Sep', sales: 22700, orders: 79 },
  { month: 'Oct', sales: 28500, orders: 98 },
  { month: 'Nov', sales: 32100, orders: 112 },
  { month: 'Dec', sales: 45231, orders: 156 },
];

const topProducts = [
  { name: 'Wireless Mouse', sku: 'ELEC-001', sold: 245, revenue: 7350 },
  { name: 'Mechanical Keyboard', sku: 'ELEC-002', sold: 128, revenue: 19200 },
  { name: 'USB-C Hub', sku: 'ELEC-003', sold: 186, revenue: 9300 },
  { name: 'A4 Copy Paper', sku: 'OFFC-001', sold: 890, revenue: 8010 },
  { name: 'Ergonomic Office Chair', sku: 'FURN-001', sold: 42, revenue: 12600 },
];

const topCustomers = [
  { name: 'Acme Corporation', orders: 28, revenue: 45600 },
  { name: 'TechStart Inc.', orders: 22, revenue: 32400 },
  { name: 'Global Systems', orders: 18, revenue: 28900 },
  { name: 'Smart Solutions', orders: 15, revenue: 21500 },
  { name: 'City Government', orders: 8, revenue: 18200 },
];

const dailyTrend = [
  { day: 'Mon', sales: 5200 },
  { day: 'Tue', sales: 6800 },
  { day: 'Wed', sales: 5900 },
  { day: 'Thu', sales: 7400 },
  { day: 'Fri', sales: 8200 },
  { day: 'Sat', sales: 6100 },
  { day: 'Sun', sales: 4800 },
];

// Types for export
interface MonthlySale {
  month: string;
  sales: number;
  orders: number;
}

interface TopProduct {
  name: string;
  sku: string;
  sold: number;
  revenue: number;
}

interface TopCustomer {
  name: string;
  orders: number;
  revenue: number;
}

function SalesReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
    preset: 'this_month',
  });
  const [isExporting, setIsExporting] = useState(false);

  // Sales report presets
  const salesPresets: PresetOption[] = [
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
  ];

  // Calculate current month stats
  const currentMonth = monthlySalesData[monthlySalesData.length - 1];
  const previousMonth = monthlySalesData[monthlySalesData.length - 2];
  const salesGrowth = ((currentMonth.sales - previousMonth.sales) / previousMonth.sales * 100).toFixed(1);
  const ordersGrowth = ((currentMonth.orders - previousMonth.orders) / previousMonth.orders * 100).toFixed(1);

  // Export handlers
  const handleExport = useCallback(async (format: ExportFormat) => {
    setIsExporting(true);

    // Simulate processing time for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Export monthly sales data
      const monthlySalesColumns: ExportColumn<MonthlySale>[] = [
        { header: 'Month', accessor: 'month' },
        { header: 'Sales Revenue ($)', accessor: 'sales', format: formatCurrencyForExport },
        { header: 'Number of Orders', accessor: 'orders' },
        { header: 'Average Order Value ($)', accessor: (row) => (row.sales / row.orders).toFixed(2) },
      ];

      exportData({
        filename: `sales-report-monthly-${getExportTimestamp()}`,
        data: monthlySalesData as MonthlySale[],
        columns: monthlySalesColumns,
        format,
        sheetName: 'Monthly Sales',
      });

      // Export top products
      const topProductColumns: ExportColumn<TopProduct>[] = [
        { header: 'Product Name', accessor: 'name' },
        { header: 'SKU', accessor: 'sku' },
        { header: 'Units Sold', accessor: 'sold' },
        { header: 'Revenue ($)', accessor: 'revenue', format: formatCurrencyForExport },
      ];

      exportData({
        filename: `sales-report-top-products-${getExportTimestamp()}`,
        data: topProducts as TopProduct[],
        columns: topProductColumns,
        format,
        sheetName: 'Top Products',
      });

      // Export top customers
      const topCustomerColumns: ExportColumn<TopCustomer>[] = [
        { header: 'Customer Name', accessor: 'name' },
        { header: 'Number of Orders', accessor: 'orders' },
        { header: 'Total Revenue ($)', accessor: 'revenue', format: formatCurrencyForExport },
      ];

      exportData({
        filename: `sales-report-top-customers-${getExportTimestamp()}`,
        data: topCustomers as TopCustomer[],
        columns: topCustomerColumns,
        format,
        sheetName: 'Top Customers',
      });
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Sales Report"
        description="Analyze your sales performance"
        actions={
          <div className="flex gap-2">
            <DateRangeSelector
              value={dateRange}
              onChange={setDateRange}
              presets={salesPresets}
            />
            <ExportDropdown onExport={handleExport} isExporting={isExporting} />
          </div>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`$${currentMonth.sales.toLocaleString()}`}
          change={`${Number(salesGrowth) >= 0 ? '+' : ''}${salesGrowth}% vs last month`}
          changeType={Number(salesGrowth) >= 0 ? 'positive' : 'negative'}
          icon={DollarSign}
        />
        <StatsCard
          title="Total Orders"
          value={currentMonth.orders.toString()}
          change={`${Number(ordersGrowth) >= 0 ? '+' : ''}${ordersGrowth}% vs last month`}
          changeType={Number(ordersGrowth) >= 0 ? 'positive' : 'negative'}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Avg. Order Value"
          value={`$${(currentMonth.sales / currentMonth.orders).toFixed(2)}`}
          change="Per order"
          changeType="neutral"
          icon={TrendingUp}
        />
        <StatsCard
          title="Active Customers"
          value="89"
          change="+12 this month"
          changeType="positive"
          icon={Users}
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Monthly Sales Chart */}
        <DashboardCard title="Monthly Sales" description="Revenue over the past 12 months">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySalesData}>
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar
                  dataKey="sales"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        {/* Daily Trend */}
        <DashboardCard title="Daily Trend" description="Sales trend this week">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrend}>
                <XAxis
                  dataKey="day"
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <DashboardCard title="Top Selling Products" description="Best performers this period">
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={product.sku}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${product.revenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{product.sold} sold</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Top Customers */}
        <DashboardCard title="Top Customers" description="Highest revenue customers">
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${customer.revenue.toLocaleString()}</p>
                  <div className="flex items-center justify-end gap-1 text-sm text-success">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>+12%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </PageContainer>
  );
}

import { createFileRoute } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Package,
  TrendingDown,
  Warehouse,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
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
import {
  exportData,
  formatCurrencyForExport,
  formatPercentageForExport,
  getExportTimestamp,
  type ExportColumn,
  type ExportFormat,
} from '@/lib/export';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/reports/inventory')({
  component: InventoryReportPage,
});

// Mock data
const stockByCategory = [
  { name: 'Electronics', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Office Supplies', value: 120, color: 'hsl(220, 70%, 50%)' },
  { name: 'Furniture', value: 35, color: 'hsl(280, 70%, 50%)' },
  { name: 'Accessories', value: 85, color: 'hsl(45, 70%, 50%)' },
];

const stockMovement = [
  { month: 'Jul', stockIn: 450, stockOut: 380 },
  { month: 'Aug', stockIn: 520, stockOut: 420 },
  { month: 'Sep', stockIn: 380, stockOut: 450 },
  { month: 'Oct', stockIn: 620, stockOut: 510 },
  { month: 'Nov', stockIn: 580, stockOut: 620 },
  { month: 'Dec', stockIn: 720, stockOut: 680 },
];

const lowStockItems = [
  { name: 'Mechanical Keyboard', sku: 'ELEC-002', current: 8, reorder: 15, warehouse: 'Main' },
  { name: 'Printer Ink Black', sku: 'OFFC-002', current: 12, reorder: 25, warehouse: 'Main' },
  { name: 'Wireless Mouse', sku: 'ELEC-001', current: 45, reorder: 50, warehouse: 'Secondary' },
  { name: 'USB-C Cable', sku: 'ELEC-004', current: 18, reorder: 30, warehouse: 'Main' },
];

const warehouseStats = [
  { name: 'Main Warehouse', items: 185, value: 125000, capacity: 75 },
  { name: 'Secondary Warehouse', items: 65, value: 45000, capacity: 45 },
  { name: 'Retail Store', items: 35, value: 18500, capacity: 60 },
];

const topMovingProducts = [
  { name: 'A4 Copy Paper', sku: 'OFFC-001', movement: 890, trend: 'up' },
  { name: 'Wireless Mouse', sku: 'ELEC-001', movement: 520, trend: 'up' },
  { name: 'Printer Ink Black', sku: 'OFFC-002', movement: 340, trend: 'down' },
  { name: 'USB-C Hub', sku: 'ELEC-003', movement: 280, trend: 'up' },
  { name: 'Mechanical Keyboard', sku: 'ELEC-002', movement: 195, trend: 'stable' },
];

// Types for export
interface StockCategory {
  name: string;
  value: number;
  color: string;
}

interface StockMovement {
  month: string;
  stockIn: number;
  stockOut: number;
}

interface LowStockItem {
  name: string;
  sku: string;
  current: number;
  reorder: number;
  warehouse: string;
}

interface WarehouseStat {
  name: string;
  items: number;
  value: number;
  capacity: number;
}

interface TopMovingProduct {
  name: string;
  sku: string;
  movement: number;
  trend: string;
}

function InventoryReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
    preset: 'this_month',
  });
  const [isExporting, setIsExporting] = useState(false);

  // Inventory report presets
  const inventoryPresets: PresetOption[] = [
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
  ];

  const totalStock = 285;
  const totalValue = 188500;
  const previousValue = 179182; // Previous month value for comparison
  const totalValueChange = ((totalValue - previousValue) / previousValue) * 100;
  const lowStockCount = 4;
  const turnoverRate = 4.2;

  // Export handler
  const handleExport = useCallback(async (format: ExportFormat) => {
    setIsExporting(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Export Stock by Category
      const categoryColumns: ExportColumn<StockCategory>[] = [
        { header: 'Category', accessor: 'name' },
        { header: 'Stock Count', accessor: 'value' },
      ];

      exportData({
        filename: `inventory-report-by-category-${getExportTimestamp()}`,
        data: stockByCategory as StockCategory[],
        columns: categoryColumns,
        format,
        sheetName: 'Stock by Category',
      });

      // Export Stock Movement
      const movementColumns: ExportColumn<StockMovement>[] = [
        { header: 'Month', accessor: 'month' },
        { header: 'Stock In', accessor: 'stockIn' },
        { header: 'Stock Out', accessor: 'stockOut' },
        { header: 'Net Change', accessor: (row) => (row.stockIn - row.stockOut).toString() },
      ];

      exportData({
        filename: `inventory-report-movement-${getExportTimestamp()}`,
        data: stockMovement as StockMovement[],
        columns: movementColumns,
        format,
        sheetName: 'Stock Movement',
      });

      // Export Low Stock Items
      const lowStockColumns: ExportColumn<LowStockItem>[] = [
        { header: 'Product Name', accessor: 'name' },
        { header: 'SKU', accessor: 'sku' },
        { header: 'Current Stock', accessor: 'current' },
        { header: 'Reorder Point', accessor: 'reorder' },
        { header: 'Warehouse', accessor: 'warehouse' },
        { header: 'Shortage', accessor: (row) => (row.reorder - row.current).toString() },
      ];

      exportData({
        filename: `inventory-report-low-stock-${getExportTimestamp()}`,
        data: lowStockItems as LowStockItem[],
        columns: lowStockColumns,
        format,
        sheetName: 'Low Stock Alert',
      });

      // Export Warehouse Summary
      const warehouseColumns: ExportColumn<WarehouseStat>[] = [
        { header: 'Warehouse', accessor: 'name' },
        { header: 'Items', accessor: 'items' },
        { header: 'Value ($)', accessor: 'value', format: formatCurrencyForExport },
        { header: 'Capacity (%)', accessor: 'capacity', format: formatPercentageForExport },
      ];

      exportData({
        filename: `inventory-report-warehouses-${getExportTimestamp()}`,
        data: warehouseStats as WarehouseStat[],
        columns: warehouseColumns,
        format,
        sheetName: 'Warehouse Summary',
      });

      // Export Top Moving Products
      const topMovingColumns: ExportColumn<TopMovingProduct>[] = [
        { header: 'Product Name', accessor: 'name' },
        { header: 'SKU', accessor: 'sku' },
        { header: 'Movement', accessor: 'movement' },
        { header: 'Trend', accessor: 'trend' },
      ];

      exportData({
        filename: `inventory-report-top-moving-${getExportTimestamp()}`,
        data: topMovingProducts as TopMovingProduct[],
        columns: topMovingColumns,
        format,
        sheetName: 'Top Moving Products',
      });
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Inventory Report"
        description="Stock levels, movements, and valuations"
        actions={
          <div className="flex gap-2">
            <DateRangeSelector
              value={dateRange}
              onChange={setDateRange}
              presets={inventoryPresets}
            />
            <ExportDropdown onExport={handleExport} isExporting={isExporting} />
          </div>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Stock Items"
          value={totalStock.toString()}
          change="Across all warehouses"
          changeType="neutral"
          icon={Package}
        />
        <StatsCard
          title="Total Value"
          value={`$${totalValue.toLocaleString()}`}
          change={`${totalValueChange >= 0 ? '+' : ''}${totalValueChange.toFixed(1)}% from last month`}
          changeType={totalValueChange >= 0 ? 'positive' : 'negative'}
          icon={Warehouse}
        />
        <StatsCard
          title="Low Stock Items"
          value={lowStockCount.toString()}
          change="Needs attention"
          changeType={lowStockCount > 0 ? 'negative' : 'positive'}
          icon={AlertTriangle}
        />
        <StatsCard
          title="Turnover Rate"
          value={`${turnoverRate}x`}
          change="Per year"
          changeType="positive"
          icon={TrendingDown}
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Stock by Category */}
        <DashboardCard title="Stock by Category" description="Distribution across categories">
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stockByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  formatter={(value: number) => [`${value} items`, 'Stock']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {stockByCategory.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2 text-sm">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-muted-foreground">{cat.name}</span>
                <span className="ml-auto font-medium">{cat.value}</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Stock Movement */}
        <DashboardCard title="Stock Movement" description="In vs Out over time">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockMovement}>
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
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Bar dataKey="stockIn" name="Stock In" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stockOut" name="Stock Out" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Stock In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Stock Out</span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        <DashboardCard title="Low Stock Alert" description="Items below reorder point">
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div
                key={item.sku}
                className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.sku} • {item.warehouse}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-destructive">{item.current} left</p>
                  <p className="text-sm text-muted-foreground">
                    Reorder at {item.reorder}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="mt-4 w-full">
            Create Purchase Order
          </Button>
        </DashboardCard>

        {/* Warehouse Summary */}
        <DashboardCard title="Warehouse Summary" description="Stock distribution by location">
          <div className="space-y-4">
            {warehouseStats.map((warehouse) => (
              <div
                key={warehouse.name}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Warehouse className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{warehouse.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {warehouse.items} items • ${warehouse.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm font-medium',
                    warehouse.capacity >= 80 ? 'text-destructive' :
                      warehouse.capacity >= 60 ? 'text-warning' :
                        'text-success'
                  )}>
                    {warehouse.capacity}% full
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      warehouse.capacity >= 80 ? 'bg-destructive' :
                        warehouse.capacity >= 60 ? 'bg-warning' :
                          'bg-success'
                    )}
                    style={{ width: `${warehouse.capacity}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* Top Moving Products */}
      <div className="mt-6">
        <DashboardCard title="Top Moving Products" description="Highest movement this period">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">SKU</th>
                  <th className="pb-3 font-medium text-right">Movement</th>
                  <th className="pb-3 font-medium text-right">Trend</th>
                </tr>
              </thead>
              <tbody>
                {topMovingProducts.map((product) => (
                  <tr key={product.sku} className="border-b last:border-0">
                    <td className="py-3 font-medium">{product.name}</td>
                    <td className="py-3 text-muted-foreground">{product.sku}</td>
                    <td className="py-3 text-right">{product.movement} units</td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        {product.trend === 'up' && (
                          <ArrowUp className="h-4 w-4 text-success" />
                        )}
                        {product.trend === 'down' && (
                          <ArrowDown className="h-4 w-4 text-destructive" />
                        )}
                        {product.trend === 'stable' && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </div>
    </PageContainer>
  );
}

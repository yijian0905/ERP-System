import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  Box,
  CreditCard,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
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

import { Button } from '@/components/ui/button';
import {
  DashboardCard,
  PageContainer,
  PageHeader,
  StatsCard,
} from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/_dashboard/dashboard')({
  component: DashboardPage,
});

// Mock data for charts
const salesData = [
  { name: 'Jan', sales: 4000, orders: 24 },
  { name: 'Feb', sales: 3000, orders: 18 },
  { name: 'Mar', sales: 5000, orders: 32 },
  { name: 'Apr', sales: 4500, orders: 28 },
  { name: 'May', sales: 6000, orders: 38 },
  { name: 'Jun', sales: 5500, orders: 35 },
];

const revenueData = [
  { name: 'Mon', revenue: 1200 },
  { name: 'Tue', revenue: 1800 },
  { name: 'Wed', revenue: 1400 },
  { name: 'Thu', revenue: 2200 },
  { name: 'Fri', revenue: 1900 },
  { name: 'Sat', revenue: 2400 },
  { name: 'Sun', revenue: 1600 },
];

const recentOrders = [
  { id: 'SO-2312-00015', customer: 'Acme Corp', amount: '$1,250.00', status: 'Processing' },
  { id: 'SO-2312-00014', customer: 'TechStart Inc', amount: '$890.00', status: 'Shipped' },
  { id: 'SO-2312-00013', customer: 'Global Systems', amount: '$2,340.00', status: 'Delivered' },
  { id: 'SO-2312-00012', customer: 'Local Store', amount: '$456.00', status: 'Processing' },
  { id: 'SO-2312-00011', customer: 'Smart Solutions', amount: '$1,780.00', status: 'Pending' },
];

const lowStockProducts = [
  { sku: 'ELEC-001', name: 'Wireless Mouse', stock: 5, reorder: 20 },
  { sku: 'ELEC-002', name: 'Mechanical Keyboard', stock: 8, reorder: 15 },
  { sku: 'OFFC-005', name: 'Printer Paper A4', stock: 12, reorder: 50 },
];

function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'}`}
        description="Here's what's happening with your business today."
      />

      {/* Stats Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value="$45,231.89"
          change="+20.1% from last month"
          changeType="positive"
          icon={DollarSign}
        />
        <StatsCard
          title="Orders"
          value="156"
          change="+12% from last month"
          changeType="positive"
          icon={ShoppingCart}
        />
        <StatsCard
          title="Products"
          value="2,350"
          change="+180 this month"
          changeType="neutral"
          icon={Package}
        />
        <StatsCard
          title="Customers"
          value="573"
          change="+15 this week"
          changeType="positive"
          icon={Users}
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <DashboardCard title="Sales Overview" description="Monthly sales and orders">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <XAxis
                  dataKey="name"
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
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
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

        {/* Revenue Trend */}
        <DashboardCard title="Revenue Trend" description="Daily revenue this week">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <XAxis
                  dataKey="name"
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
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <DashboardCard
          title="Recent Orders"
          description="Latest customer orders"
          actions={
            <Button variant="outline" size="sm">
              View All
            </Button>
          }
        >
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Box className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.customer}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{order.amount}</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      order.status === 'Delivered'
                        ? 'bg-success/10 text-success'
                        : order.status === 'Shipped'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : order.status === 'Processing'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Low Stock Alert */}
        <DashboardCard
          title="Low Stock Alert"
          description="Products that need restocking"
          actions={
            <Button variant="outline" size="sm">
              View Inventory
            </Button>
          }
        >
          <div className="space-y-4">
            {lowStockProducts.map((product) => (
              <div
                key={product.sku}
                className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                    <Package className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-destructive">{product.stock} left</p>
                  <p className="text-sm text-muted-foreground">
                    Reorder at {product.reorder}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payments Received</p>
            <p className="text-xl font-bold">$12,450</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <ArrowDownRight className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-xl font-bold">$3,240</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg. Order Value</p>
            <p className="text-xl font-bold">$289.50</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Inventory Value</p>
            <p className="text-xl font-bold">$148,320</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}


import { createFileRoute, Link } from '@tanstack/react-router';
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
import { useEffect, useState } from 'react';
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
import { get } from '@/lib/api-client';

export const Route = createFileRoute('/_dashboard/dashboard')({
  component: DashboardPage,
});

// Types for dashboard data
interface DashboardStats {
  totalRevenue: number;
  orderCount: number;
  productCount: number;
  customerCount: number;
}

interface SalesData {
  name: string;
  sales: number;
  orders: number;
}

interface RevenueData {
  name: string;
  revenue: number;
}

interface RecentOrder {
  id: string;
  customer: string;
  amount: string;
  status: string;
}

interface LowStockProduct {
  sku: string;
  name: string;
  stock: number;
  reorder: number;
}

function DashboardPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({ totalRevenue: 0, orderCount: 0, productCount: 0, customerCount: 0 });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);

  // Fetch dashboard data from API
  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        const [statsRes, salesRes, revenueRes, ordersRes, lowStockRes] = await Promise.all([
          get<DashboardStats>('/v1/dashboard/stats'),
          get<SalesData[]>('/v1/dashboard/sales-chart'),
          get<RevenueData[]>('/v1/dashboard/revenue-trend'),
          get<RecentOrder[]>('/v1/dashboard/recent-orders'),
          get<LowStockProduct[]>('/v1/dashboard/low-stock'),
        ]);

        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (salesRes.success && salesRes.data) setSalesData(salesRes.data);
        if (revenueRes.success && revenueRes.data) setRevenueData(revenueRes.data);
        if (ordersRes.success && ordersRes.data) setRecentOrders(ordersRes.data);
        if (lowStockRes.success && lowStockRes.data) setLowStockProducts(lowStockRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

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
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change="+20.1% from last month"
          changeType="positive"
          icon={DollarSign}
        />
        <StatsCard
          title="Orders"
          value={stats.orderCount.toString()}
          change="+12% from last month"
          changeType="positive"
          icon={ShoppingCart}
        />
        <StatsCard
          title="Products"
          value={stats.productCount.toLocaleString()}
          change="+180 this month"
          changeType="neutral"
          icon={Package}
        />
        <StatsCard
          title="Customers"
          value={stats.customerCount.toString()}
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
            <Link to="/orders">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
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
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${order.status === 'Delivered'
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
            <Link to="/inventory">
              <Button variant="outline" size="sm">
                View Inventory
              </Button>
            </Link>
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


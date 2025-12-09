import { createFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ClipboardList,
  Eye,
  FileText,
  MoreHorizontal,
  Printer,
  Search,
  ShoppingCart,
  TrendingUp,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/orders/')({
  component: OrderManagementPage,
});

// Types
type OrderType = 'SALES' | 'PURCHASE';
type OrderStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'APPROVED' | 'ORDERED' | 'PARTIAL' | 'RECEIVED';

interface UnifiedOrder {
  id: string;
  orderNumber: string;
  type: OrderType;
  party: string; // Customer or Supplier
  itemCount: number;
  total: number;
  status: OrderStatus;
  orderDate: string;
  expectedDate: string | null;
  hasInvoice: boolean;
}

// Mock data - Combined sales and purchase orders
const mockOrders: UnifiedOrder[] = [
  // Sales Orders
  { id: 's1', orderNumber: 'SO-2312-00045', type: 'SALES', party: 'Acme Corporation', itemCount: 2, total: 817.34, status: 'PROCESSING', orderDate: '2024-12-07', expectedDate: '2024-12-14', hasInvoice: true },
  { id: 's2', orderNumber: 'SO-2312-00044', type: 'SALES', party: 'TechStart Inc.', itemCount: 1, total: 1089.78, status: 'SHIPPED', orderDate: '2024-12-06', expectedDate: '2024-12-12', hasInvoice: true },
  { id: 's3', orderNumber: 'SO-2312-00043', type: 'SALES', party: 'Global Systems', itemCount: 1, total: 3269.89, status: 'DELIVERED', orderDate: '2024-12-03', expectedDate: '2024-12-10', hasInvoice: true },
  { id: 's4', orderNumber: 'SO-2312-00042', type: 'SALES', party: 'Local Store', itemCount: 1, total: 489.96, status: 'PENDING', orderDate: '2024-12-05', expectedDate: null, hasInvoice: false },
  { id: 's5', orderNumber: 'SO-2312-00041', type: 'SALES', party: 'Smart Solutions', itemCount: 2, total: 1634.56, status: 'COMPLETED', orderDate: '2024-12-01', expectedDate: '2024-12-08', hasInvoice: true },
  { id: 's6', orderNumber: 'SO-2312-00040', type: 'SALES', party: 'City Government', itemCount: 2, total: 3297.50, status: 'DRAFT', orderDate: '2024-12-07', expectedDate: null, hasInvoice: false },
  // Purchase Orders
  { id: 'p1', orderNumber: 'PO-2312-00023', type: 'PURCHASE', party: 'Tech Supplies Inc', itemCount: 2, total: 4162.50, status: 'RECEIVED', orderDate: '2024-12-05', expectedDate: '2024-12-10', hasInvoice: false },
  { id: 'p2', orderNumber: 'PO-2312-00022', type: 'PURCHASE', party: 'Office Depot', itemCount: 1, total: 2502.50, status: 'PENDING', orderDate: '2024-12-06', expectedDate: '2024-12-15', hasInvoice: false },
  { id: 'p3', orderNumber: 'PO-2312-00021', type: 'PURCHASE', party: 'Electronics Wholesale', itemCount: 1, total: 5550.00, status: 'ORDERED', orderDate: '2024-12-04', expectedDate: '2024-12-12', hasInvoice: false },
  { id: 'p4', orderNumber: 'PO-2312-00020', type: 'PURCHASE', party: 'Furniture World', itemCount: 1, total: 3470.00, status: 'PARTIAL', orderDate: '2024-12-01', expectedDate: '2024-12-08', hasInvoice: false },
  { id: 'p5', orderNumber: 'PO-2312-00019', type: 'PURCHASE', party: 'Tech Supplies Inc', itemCount: 3, total: 9687.50, status: 'COMPLETED', orderDate: '2024-11-25', expectedDate: '2024-12-02', hasInvoice: false },
  { id: 'p6', orderNumber: 'PO-2312-00024', type: 'PURCHASE', party: 'Global Parts Ltd', itemCount: 1, total: 2512.50, status: 'DRAFT', orderDate: '2024-12-07', expectedDate: null, hasInvoice: false },
];

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PROCESSING: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ORDERED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SHIPPED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  PARTIAL: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  RECEIVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function OrderManagementPage() {
  const [orders] = useState<UnifiedOrder[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('all');

  // Filter orders
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.party.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !typeFilter || order.type === typeFilter;
      const matchesStatus = !statusFilter || order.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

  // Calculate stats
  const salesOrders = orders.filter((o) => o.type === 'SALES');
  const purchaseOrders = orders.filter((o) => o.type === 'PURCHASE');
  const totalSalesValue = salesOrders.reduce((sum, o) => sum + o.total, 0);
  const totalPurchaseValue = purchaseOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => ['DRAFT', 'PENDING', 'CONFIRMED', 'APPROVED'].includes(o.status)).length;

  return (
    <PageContainer>
      <PageHeader
        title="Order Management"
        description="Centralized view of all sales and purchase orders"
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Orders"
          value={orders.length.toString()}
          change={`${salesOrders.length} sales, ${purchaseOrders.length} purchase`}
          changeType="neutral"
          icon={ClipboardList}
        />
        <StatsCard
          title="Sales Revenue"
          value={`$${totalSalesValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          change={`${salesOrders.length} orders`}
          changeType="positive"
          icon={ArrowUpRight}
        />
        <StatsCard
          title="Purchase Cost"
          value={`$${totalPurchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          change={`${purchaseOrders.length} orders`}
          changeType="neutral"
          icon={ArrowDownRight}
        />
        <StatsCard
          title="Pending Action"
          value={pendingOrders.toString()}
          change="Needs attention"
          changeType={pendingOrders > 0 ? 'negative' : 'positive'}
          icon={TrendingUp}
        />
      </div>

      {/* Quick Links */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/orders/sales" className="block">
          <DashboardCard className="hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Sales Orders</h3>
                <p className="text-sm text-muted-foreground">{salesOrders.length} orders</p>
              </div>
            </div>
          </DashboardCard>
        </Link>
        <Link to="/orders/purchase" className="block">
          <DashboardCard className="hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <ClipboardList className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Purchase Orders</h3>
                <p className="text-sm text-muted-foreground">{purchaseOrders.length} orders</p>
              </div>
            </div>
          </DashboardCard>
        </Link>
        <Link to="/invoices" className="block">
          <DashboardCard className="hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">Invoices</h3>
                <p className="text-sm text-muted-foreground">View all invoices</p>
              </div>
            </div>
          </DashboardCard>
        </Link>
        <Link to="/recurring" className="block">
          <DashboardCard className="hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold">Recurring Revenue</h3>
                <p className="text-sm text-muted-foreground">Subscriptions</p>
              </div>
            </div>
          </DashboardCard>
        </Link>
      </div>

      {/* Search and filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by order # or customer/supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Types</option>
              <option value="SALES">Sales Orders</option>
              <option value="PURCHASE">Purchase Orders</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {/* Orders table */}
      <DashboardCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Order</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Customer/Supplier</th>
                <th className="pb-3 font-medium text-center">Items</th>
                <th className="pb-3 font-medium text-right">Total</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 table-row-hover">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        order.type === 'SALES' 
                          ? 'bg-blue-100 dark:bg-blue-900/30' 
                          : 'bg-purple-100 dark:bg-purple-900/30'
                      )}>
                        {order.type === 'SALES' ? (
                          <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <ClipboardList className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium">{order.orderNumber}</span>
                        {order.hasInvoice && (
                          <span className="ml-2 text-xs text-success">● Invoiced</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      order.type === 'SALES'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    )}>
                      {order.type === 'SALES' ? 'Sales' : 'Purchase'}
                    </span>
                  </td>
                  <td className="py-4">{order.party}</td>
                  <td className="py-4 text-center">{order.itemCount}</td>
                  <td className="py-4 text-right font-medium">
                    ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      statusStyles[order.status]
                    )}>
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="py-4 text-muted-foreground">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {order.type === 'SALES' && (
                          <DropdownMenuItem>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Invoice
                          </DropdownMenuItem>
                        )}
                        {order.type === 'PURCHASE' && (
                          <DropdownMenuItem>
                            <Printer className="mr-2 h-4 w-4" />
                            Print PO
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Edit Order</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Cancel Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredOrders.length} orders
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
    </PageContainer>
  );
}

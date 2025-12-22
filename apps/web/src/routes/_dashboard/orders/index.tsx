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
import { useState, useEffect } from 'react';

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
import { FilterSelect } from '@/components/ui/filter-select';
import { cn } from '@/lib/utils';
import { ordersApi } from '@/lib/api';

export const Route = createFileRoute('/_dashboard/orders/')({
  component: OrderManagementPage,
});

// Types
type OrderType = 'SALES' | 'PURCHASE';
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'ORDERED' | 'RECEIVED';

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

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PROCESSING: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ORDERED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SHIPPED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  RECEIVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};



function OrderManagementPage() {
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('all');

  // Fetch orders from API
  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true);
      try {
        const response = await ordersApi.list();
        if (response.success && response.data) {
          setOrders(response.data.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            type: (o.type === 'SALES' ? 'SALES' : 'PURCHASE') as OrderType,
            party: o.type === 'SALES' ? o.customerName || '' : o.supplierName || '',
            itemCount: o.items?.length || 0,
            total: o.total,
            status: o.status as OrderStatus,
            orderDate: o.orderDate,
            expectedDate: o.expectedDate || null,
            hasInvoice: false,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

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
  const pendingOrders = orders.filter((o) => ['PENDING', 'CONFIRMED'].includes(o.status)).length;

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
            <FilterSelect
              value={typeFilter || 'all'}
              onChange={(val) => setTypeFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'SALES', label: 'Sales Orders' },
                { value: 'PURCHASE', label: 'Purchase Orders' },
              ]}
              placeholder="All Types"
              className="w-auto"
            />
            <FilterSelect
              value={statusFilter || 'all'}
              onChange={(val) => setStatusFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'PROCESSING', label: 'Processing' },
                { value: 'SHIPPED', label: 'Shipped' },
                { value: 'DELIVERED', label: 'Delivered' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              placeholder="All Status"
              className="w-auto"
            />
            <FilterSelect
              value={dateRange}
              onChange={setDateRange}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
              ]}
              className="w-auto"
            />
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

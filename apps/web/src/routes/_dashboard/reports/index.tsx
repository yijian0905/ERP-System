import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, BarChart3, DollarSign, FileText, Package, TrendingUp, Users } from 'lucide-react';

import { DashboardCard, PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_dashboard/reports/')({
  component: ReportsIndexPage,
});

const reportCategories = [
  {
    id: 'sales',
    title: 'Sales Reports',
    description: 'Analyze sales performance, trends, and customer behavior',
    icon: DollarSign,
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    reports: [
      { name: 'Sales Summary', href: '/reports/sales' },
      { name: 'Sales by Customer', href: '/reports/sales?view=customer' },
      { name: 'Sales by Product', href: '/reports/sales?view=product' },
      { name: 'Sales Trends', href: '/reports/sales?view=trends' },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory Reports',
    description: 'Track stock levels, movements, and valuations',
    icon: Package,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    reports: [
      { name: 'Stock Summary', href: '/reports/inventory' },
      { name: 'Low Stock Report', href: '/reports/inventory?view=low-stock' },
      { name: 'Stock Movement', href: '/reports/inventory?view=movements' },
      { name: 'Inventory Valuation', href: '/reports/inventory?view=valuation' },
    ],
  },
  {
    id: 'financial',
    title: 'Financial Reports',
    description: 'Revenue, expenses, and profitability analysis',
    icon: TrendingUp,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    reports: [
      { name: 'Profit & Loss', href: '/reports/financial' },
      { name: 'Accounts Receivable', href: '/reports/financial?view=receivable' },
      { name: 'Payment History', href: '/reports/financial?view=payments' },
    ],
  },
  {
    id: 'customers',
    title: 'Customer Reports',
    description: 'Customer insights and purchase patterns',
    icon: Users,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    reports: [
      { name: 'Customer List', href: '/reports/customers' },
      { name: 'Top Customers', href: '/reports/customers?view=top' },
      { name: 'Customer Balance', href: '/reports/customers?view=balance' },
    ],
  },
];

function ReportsIndexPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        description="Business analytics and reporting"
        actions={
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Custom Report
          </Button>
        }
      />

      {/* Quick Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month Revenue</p>
              <p className="text-xl font-bold">$45,231</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-xl font-bold">156</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Products Sold</p>
              <p className="text-xl font-bold">1,234</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
              <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Customers</p>
              <p className="text-xl font-bold">89</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid gap-6 md:grid-cols-2">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <DashboardCard key={category.id}>
              <div className="flex items-start gap-4">
                <div className={`rounded-full p-3 ${category.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{category.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                  <div className="mt-4 space-y-2">
                    {category.reports.map((report) => (
                      <Link
                        key={report.name}
                        to={report.href}
                        className="flex items-center justify-between rounded-lg border p-2 text-sm transition-colors hover:bg-muted"
                      >
                        <span>{report.name}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          📊 Advanced Analytics
        </h3>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
          Unlock predictive analytics, demand forecasting, and advanced financial reports
          by upgrading to L2 Professional or L3 Enterprise tier.
        </p>
      </div>
    </PageContainer>
  );
}

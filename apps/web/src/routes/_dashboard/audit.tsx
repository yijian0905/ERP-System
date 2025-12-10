import { createFileRoute } from '@tanstack/react-router';
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Globe,
  Loader2,
  LogIn,
  LogOut,
  Monitor,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import { DashboardCard, PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/audit')({
  component: AuditLogsPage,
});

// Types
type ActionType = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export' | 'print' | 'approve' | 'reject';
type EntityType = 'product' | 'customer' | 'supplier' | 'order' | 'invoice' | 'payment' | 'inventory' | 'user' | 'settings' | 'warehouse' | 'asset';

interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: ActionType;
  entityType: EntityType;
  entityId: string | null;
  entityName: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedFields: string[] | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  duration: number | null;
  createdAt: string;
}

// Mock data
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Admin User',
    userEmail: 'admin@demo-company.com',
    action: 'update',
    entityType: 'product',
    entityId: 'prod-001',
    entityName: 'Wireless Mouse',
    oldValues: { price: 29.99, stock: 100 },
    newValues: { price: 34.99, stock: 150 },
    changedFields: ['price', 'stock'],
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    requestId: 'req-abc123',
    duration: 45,
    createdAt: '2024-12-08T10:30:00Z',
  },
  {
    id: '2',
    userId: '2',
    userName: 'Manager User',
    userEmail: 'manager@demo-company.com',
    action: 'create',
    entityType: 'order',
    entityId: 'SO-2312-00045',
    entityName: 'Sales Order #SO-2312-00045',
    oldValues: null,
    newValues: { customerId: 'cust-001', total: 1250.00, items: 5 },
    changedFields: null,
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    requestId: 'req-def456',
    duration: 120,
    createdAt: '2024-12-08T09:45:00Z',
  },
  {
    id: '3',
    userId: '1',
    userName: 'Admin User',
    userEmail: 'admin@demo-company.com',
    action: 'login',
    entityType: 'user',
    entityId: '1',
    entityName: 'Admin User',
    oldValues: null,
    newValues: { method: 'password' },
    changedFields: null,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    requestId: 'req-ghi789',
    duration: 15,
    createdAt: '2024-12-08T08:00:00Z',
  },
  {
    id: '4',
    userId: '3',
    userName: 'Sales Rep',
    userEmail: 'sales@demo-company.com',
    action: 'print',
    entityType: 'invoice',
    entityId: 'INV-2312-00089',
    entityName: 'Invoice #INV-2312-00089',
    oldValues: null,
    newValues: { printedAt: '2024-12-07T16:30:00Z' },
    changedFields: null,
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    requestId: 'req-jkl012',
    duration: 250,
    createdAt: '2024-12-07T16:30:00Z',
  },
  {
    id: '5',
    userId: '2',
    userName: 'Manager User',
    userEmail: 'manager@demo-company.com',
    action: 'delete',
    entityType: 'customer',
    entityId: 'cust-005',
    entityName: 'Inactive Customer Inc.',
    oldValues: { name: 'Inactive Customer Inc.', email: 'contact@inactive.com', status: 'inactive' },
    newValues: null,
    changedFields: null,
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    requestId: 'req-mno345',
    duration: 35,
    createdAt: '2024-12-07T14:20:00Z',
  },
  {
    id: '6',
    userId: '4',
    userName: 'Warehouse Staff',
    userEmail: 'warehouse@demo-company.com',
    action: 'update',
    entityType: 'inventory',
    entityId: 'inv-item-001',
    entityName: 'Stock Adjustment - Wireless Mouse',
    oldValues: { quantity: 150 },
    newValues: { quantity: 145, reason: 'Damaged goods' },
    changedFields: ['quantity'],
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    requestId: 'req-pqr678',
    duration: 28,
    createdAt: '2024-12-07T11:15:00Z',
  },
  {
    id: '7',
    userId: '1',
    userName: 'Admin User',
    userEmail: 'admin@demo-company.com',
    action: 'approve',
    entityType: 'order',
    entityId: 'PO-2312-00012',
    entityName: 'Purchase Order #PO-2312-00012',
    oldValues: { status: 'pending' },
    newValues: { status: 'approved', approvedBy: 'Admin User' },
    changedFields: ['status', 'approvedBy'],
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    requestId: 'req-stu901',
    duration: 18,
    createdAt: '2024-12-07T10:00:00Z',
  },
  {
    id: '8',
    userId: null,
    userName: 'System',
    userEmail: null,
    action: 'export',
    entityType: 'settings',
    entityId: null,
    entityName: 'System Backup',
    oldValues: null,
    newValues: { exportType: 'full', format: 'json' },
    changedFields: null,
    ipAddress: null,
    userAgent: null,
    requestId: 'req-vwx234',
    duration: 5200,
    createdAt: '2024-12-07T02:00:00Z',
  },
  {
    id: '9',
    userId: '2',
    userName: 'Manager User',
    userEmail: 'manager@demo-company.com',
    action: 'logout',
    entityType: 'user',
    entityId: '2',
    entityName: 'Manager User',
    oldValues: null,
    newValues: null,
    changedFields: null,
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    requestId: 'req-yza567',
    duration: 8,
    createdAt: '2024-12-06T18:30:00Z',
  },
  {
    id: '10',
    userId: '1',
    userName: 'Admin User',
    userEmail: 'admin@demo-company.com',
    action: 'create',
    entityType: 'warehouse',
    entityId: 'wh-003',
    entityName: 'Secondary Warehouse',
    oldValues: null,
    newValues: { code: 'WH-003', name: 'Secondary Warehouse', location: 'Building B' },
    changedFields: null,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    requestId: 'req-bcd890',
    duration: 65,
    createdAt: '2024-12-06T15:45:00Z',
  },
];

// Action configuration
const actionConfig: Record<ActionType, { label: string; color: string; icon: typeof Edit }> = {
  create: { label: 'Created', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Plus },
  update: { label: 'Updated', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Edit },
  delete: { label: 'Deleted', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Trash2 },
  login: { label: 'Logged In', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: LogIn },
  logout: { label: 'Logged Out', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: LogOut },
  view: { label: 'Viewed', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: Eye },
  export: { label: 'Exported', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Download },
  print: { label: 'Printed', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: FileText },
  approve: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Shield },
  reject: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: AlertCircle },
};

// Entity type labels
const entityTypeLabels: Record<EntityType, string> = {
  product: 'Product',
  customer: 'Customer',
  supplier: 'Supplier',
  order: 'Order',
  invoice: 'Invoice',
  payment: 'Payment',
  inventory: 'Inventory',
  user: 'User',
  settings: 'Settings',
  warehouse: 'Warehouse',
  asset: 'Asset',
};

function AuditLogsPage() {
  const [logs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('7');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesEntity = !entityFilter || log.entityType === entityFilter;
    
    // Date filter
    if (dateRange !== 'all') {
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      const logDate = new Date(log.createdAt);
      if (logDate < cutoffDate) return false;
    }
    
    return matchesSearch && matchesAction && matchesEntity;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format duration
  const formatDuration = (ms: number | null) => {
    if (ms === null) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Open detail modal
  const openDetailModal = useCallback((log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  }, []);

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Create CSV content
    const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity', 'IP Address'];
    const rows = filteredLogs.map((log) => [
      log.createdAt,
      log.userName || 'System',
      log.action,
      log.entityType,
      log.entityName || '-',
      log.ipAddress || '-',
    ]);
    
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setIsExporting(false);
  }, [filteredLogs]);

  // Get change summary
  const getChangeSummary = (log: AuditLog) => {
    if (log.changedFields && log.changedFields.length > 0) {
      return `Changed: ${log.changedFields.join(', ')}`;
    }
    if (log.action === 'create') return 'New record created';
    if (log.action === 'delete') return 'Record deleted';
    return '-';
  };

  // Stats
  const todayLogs = logs.filter((l) => {
    const today = new Date();
    const logDate = new Date(l.createdAt);
    return logDate.toDateString() === today.toDateString();
  }).length;
  
  const uniqueUsers = new Set(logs.filter((l) => l.userId).map((l) => l.userId)).size;
  const criticalActions = logs.filter((l) => ['delete', 'approve', 'reject'].includes(l.action)).length;

  return (
    <PageContainer>
      <PageHeader
        title="Audit Logs"
        description="Track all system activities and changes"
        actions={
          <Button onClick={handleExport} disabled={isExporting} variant="outline">
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <DashboardCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayLogs}</p>
              <p className="text-sm text-muted-foreground">{"Today's Logs"}</p>
            </div>
          </div>
        </DashboardCard>
        <DashboardCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uniqueUsers}</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </div>
        </DashboardCard>
        <DashboardCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{criticalActions}</p>
              <p className="text-sm text-muted-foreground">Critical Actions</p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Audit Logs Card */}
      <DashboardCard>
        {/* Search & Filters */}
        <div className="p-4 border-b flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Actions</option>
              {Object.entries(actionConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Entities</option>
              {Object.entries(entityTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            {(actionFilter || entityFilter || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActionFilter('');
                  setEntityFilter('');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Timestamp
                </th>
                <th className="p-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  User
                </th>
                <th className="p-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Action
                </th>
                <th className="p-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Entity
                </th>
                <th className="p-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Changes
                </th>
                <th className="p-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  IP Address
                </th>
                <th className="p-3 text-center text-xs font-medium uppercase text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedLogs.map((log) => {
                const config = actionConfig[log.action];
                const Icon = config.icon;
                return (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(log.createdAt)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{log.userName || 'System'}</p>
                          <p className="text-xs text-muted-foreground">{log.userEmail || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                          config.color
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <div>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                          {entityTypeLabels[log.entityType]}
                        </span>
                        <p className="mt-1 text-sm">{log.entityName || '-'}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {getChangeSummary(log)}
                      </p>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span>{log.ipAddress || '-'}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailModal(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="mt-4 font-semibold">No logs found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || actionFilter || entityFilter
                ? 'Try adjusting your filters'
                : 'No audit logs recorded yet'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * logsPerPage) + 1} to{' '}
              {Math.min(currentPage * logsPerPage, filteredLogs.length)} of{' '}
              {filteredLogs.length} logs
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8"
                    >
                      {page}
                    </Button>
                  );
                })}
                {totalPages > 5 && <span className="px-2 text-muted-foreground">...</span>}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Log Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this audit log entry
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Timestamp</label>
                    <p className="text-sm mt-1">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Duration</label>
                    <p className="text-sm mt-1">{formatDuration(selectedLog.duration)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">User</label>
                    <p className="text-sm mt-1">{selectedLog.userName || 'System'}</p>
                    <p className="text-xs text-muted-foreground">{selectedLog.userEmail || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Action</label>
                    <p className="mt-1">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                          actionConfig[selectedLog.action].color
                        )}
                      >
                        {actionConfig[selectedLog.action].label}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Entity Info */}
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-3">Entity Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Type</label>
                      <p className="mt-1">{entityTypeLabels[selectedLog.entityType]}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">ID</label>
                      <p className="mt-1 font-mono text-xs">{selectedLog.entityId || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">Name</label>
                      <p className="mt-1">{selectedLog.entityName || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Changes */}
                {(selectedLog.oldValues || selectedLog.newValues) && (
                  <div className="rounded-lg border p-4">
                    <h4 className="font-medium mb-3">Changes</h4>
                    {selectedLog.changedFields && selectedLog.changedFields.length > 0 && (
                      <div className="mb-3">
                        <label className="text-xs font-medium text-muted-foreground">Changed Fields</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedLog.changedFields.map((field) => (
                            <span
                              key={field}
                              className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Old Values</label>
                        <pre className="mt-1 p-2 rounded bg-muted text-xs overflow-auto max-h-40">
                          {selectedLog.oldValues
                            ? JSON.stringify(selectedLog.oldValues, null, 2)
                            : '-'}
                        </pre>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">New Values</label>
                        <pre className="mt-1 p-2 rounded bg-muted text-xs overflow-auto max-h-40">
                          {selectedLog.newValues
                            ? JSON.stringify(selectedLog.newValues, null, 2)
                            : '-'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Technical Info */}
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-3">Technical Details</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">IP Address:</span>
                      <span className="font-mono text-xs">{selectedLog.ipAddress || '-'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">User Agent:</span>
                      <span className="text-xs break-all">{selectedLog.userAgent || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Request ID:</span>
                      <span className="font-mono text-xs">{selectedLog.requestId || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{formatDuration(selectedLog.duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}


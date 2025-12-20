import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, FileText, MoreHorizontal, Search, Send, Settings } from 'lucide-react';
import { useCallback, useState } from 'react';

import { EInvoiceStatusBadge, type EInvoiceStatus } from '@/components/einvoice';
import { DashboardCard, PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { post } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/invoices')({
  component: InvoicesPage,
});

import { FilterSelect } from '@/components/ui/filter-select';

// Mock invoice data with e-Invoice status
const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2312-00045',
    customer: 'Acme Corporation',
    amount: 1250.0,
    status: 'paid',
    issueDate: '2024-12-01',
    dueDate: '2024-12-31',
    eInvoiceId: 'ei-001',
    eInvoiceStatus: 'VALID' as EInvoiceStatus,
    lhdnUuid: 'ABC123XYZ456',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2312-00044',
    customer: 'TechStart Inc.',
    amount: 890.0,
    status: 'pending',
    issueDate: '2024-12-03',
    dueDate: '2025-01-02',
    eInvoiceId: 'ei-002',
    eInvoiceStatus: 'SUBMITTED' as EInvoiceStatus,
    lhdnUuid: 'DEF789GHI012',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2312-00043',
    customer: 'Global Systems',
    amount: 2340.0,
    status: 'overdue',
    issueDate: '2024-11-15',
    dueDate: '2024-12-15',
    eInvoiceId: 'ei-003',
    eInvoiceStatus: 'ERROR' as EInvoiceStatus,
  },
  {
    id: '4',
    invoiceNumber: 'INV-2312-00042',
    customer: 'Local Store',
    amount: 456.0,
    status: 'paid',
    issueDate: '2024-11-20',
    dueDate: '2024-12-20',
    eInvoiceId: undefined,
    eInvoiceStatus: undefined,
  },
  {
    id: '5',
    invoiceNumber: 'INV-2312-00041',
    customer: 'Smart Solutions',
    amount: 1780.0,
    status: 'draft',
    issueDate: '2024-12-05',
    dueDate: '2025-01-04',
    eInvoiceId: 'ei-005',
    eInvoiceStatus: 'DRAFT' as EInvoiceStatus,
  },
];

const statusStyles = {
  paid: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  overdue: 'bg-destructive/10 text-destructive',
  draft: 'bg-muted text-muted-foreground',
};

function InvoicesPage() {
  const [filter, setFilter] = useState<string>('');



  // E-Invoice handlers
  const handleSubmitEInvoice = useCallback(async (invoiceId: string) => {
    console.log('📤 Creating and submitting e-Invoice for:', invoiceId);
    try {
      // Create e-Invoice from invoice
      const createResponse = await post<{ id: string }>('/v1/einvoices', { invoiceId });
      if (createResponse.success && createResponse.data) {
        // Submit to LHDN
        await post(`/v1/einvoices/${createResponse.data.id}/submit`, {});
        console.log('✅ E-Invoice submitted successfully!');
      }
    } catch (error) {
      console.error('Failed to submit e-Invoice:', error);
      alert('Failed to submit e-Invoice. Please try again.');
    }
  }, []);

  const handleSyncEInvoice = useCallback(async (eInvoiceId: string) => {
    console.log('🔄 Syncing e-Invoice status:', eInvoiceId);
    try {
      await post(`/v1/einvoices/${eInvoiceId}/sync`, {});
      console.log('✅ E-Invoice status synced!');
    } catch (error) {
      console.error('Failed to sync e-Invoice:', error);
    }
  }, []);

  const handleCancelEInvoice = useCallback(async (eInvoiceId: string, reason: string) => {
    console.log('❌ Cancelling e-Invoice:', eInvoiceId, 'Reason:', reason);
    try {
      await post(`/v1/einvoices/${eInvoiceId}/cancel`, { reason });
      console.log('✅ E-Invoice cancelled!');
    } catch (error) {
      console.error('Failed to cancel e-Invoice:', error);
      alert('Failed to cancel e-Invoice. Please try again.');
    }
  }, []);

  const handleRetryEInvoice = useCallback(async (eInvoiceId: string) => {
    console.log('🔁 Retrying e-Invoice submission:', eInvoiceId);
    try {
      await post(`/v1/einvoices/${eInvoiceId}/retry`, {});
      console.log('✅ E-Invoice retry submitted!');
    } catch (error) {
      console.error('Failed to retry e-Invoice:', error);
      alert('Failed to retry e-Invoice submission. Please try again.');
    }
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Invoices"
        description="Manage and track your invoices"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return
            </Button>
            <Link to="/einvoice">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                E-Invoice Settings
              </Button>
            </Link>
          </div>
        }
      />

      {/* Search and filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search invoices..."
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <FilterSelect
              value={filter || 'all'}
              onChange={(val) => setFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'draft', label: 'Draft' },
                { value: 'pending', label: 'Pending' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' },
              ]}
              placeholder="All Status"
              className="w-auto"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Invoices table */}
      <DashboardCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Invoice</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Issue Date</th>
                <th className="pb-3 font-medium">Due Date</th>
                <th className="pb-3 font-medium text-right">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">E-Invoice</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b last:border-0 table-row-hover"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="py-4">{invoice.customer}</td>
                  <td className="py-4 text-muted-foreground">
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 text-muted-foreground">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 text-right font-medium">
                    ${invoice.amount.toFixed(2)}
                  </td>
                  <td className="py-4">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                        statusStyles[invoice.status as keyof typeof statusStyles]
                      )}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <TooltipProvider>
                      <div className="flex items-center gap-2">
                        {invoice.eInvoiceStatus ? (
                          <>
                            <EInvoiceStatusBadge
                              status={invoice.eInvoiceStatus}
                              size="sm"
                            />
                            {invoice.lhdnUuid && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground cursor-help">
                                    {invoice.lhdnUuid.slice(0, 8)}...
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>LHDN UUID: {invoice.lhdnUuid}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => handleSubmitEInvoice(invoice.id)}
                          >
                            <Send className="h-3 w-3" />
                            Submit
                          </Button>
                        )}
                      </div>
                    </TooltipProvider>
                  </td>
                  <td className="py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Download PDF</DropdownMenuItem>
                        <DropdownMenuItem>Send Email</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Record Payment</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* E-Invoice Actions */}
                        {invoice.eInvoiceStatus === 'SUBMITTED' && (
                          <DropdownMenuItem onClick={() => handleSyncEInvoice(invoice.eInvoiceId!)}>
                            Sync E-Invoice Status
                          </DropdownMenuItem>
                        )}
                        {(invoice.eInvoiceStatus === 'ERROR' || invoice.eInvoiceStatus === 'INVALID') && (
                          <DropdownMenuItem onClick={() => handleRetryEInvoice(invoice.eInvoiceId!)}>
                            Retry E-Invoice
                          </DropdownMenuItem>
                        )}
                        {invoice.eInvoiceStatus === 'VALID' && (
                          <DropdownMenuItem
                            onClick={() => handleCancelEInvoice(invoice.eInvoiceId!, 'User requested cancellation')}
                            className="text-destructive"
                          >
                            Cancel E-Invoice
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Showing 1 to 5 of 5 invoices
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
      </DashboardCard>




    </PageContainer>
  );
}


import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  MoreHorizontal,
  Plus,
  Search,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FilterSelect } from '@/components/ui/filter-select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/payments')({
  component: PaymentsPage,
});

// Types
type PaymentType = 'RECEIVED' | 'REFUND' | 'CREDIT' | 'ADVANCE';
type PaymentMethod = 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'DIGITAL_WALLET';
type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

interface Payment {
  id: string;
  paymentNumber: string;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  customer: string;
  invoiceNumber: string | null;
  amount: number;
  reference: string | null;
  paymentDate: string;
  notes: string | null;
}

// Mock data
const mockPayments: Payment[] = [
  {
    id: '1',
    paymentNumber: 'PAY-2312-00125',
    type: 'RECEIVED',
    method: 'BANK_TRANSFER',
    status: 'COMPLETED',
    customer: 'Acme Corporation',
    invoiceNumber: 'INV-2312-00045',
    amount: 1250.00,
    reference: 'TRF-78452369',
    paymentDate: '2024-12-07',
    notes: null,
  },
  {
    id: '2',
    paymentNumber: 'PAY-2312-00124',
    type: 'RECEIVED',
    method: 'CREDIT_CARD',
    status: 'COMPLETED',
    customer: 'TechStart Inc.',
    invoiceNumber: 'INV-2312-00044',
    amount: 890.00,
    reference: 'CC-****4521',
    paymentDate: '2024-12-07',
    notes: null,
  },
  {
    id: '3',
    paymentNumber: 'PAY-2312-00123',
    type: 'RECEIVED',
    method: 'CHECK',
    status: 'PENDING',
    customer: 'Global Systems',
    invoiceNumber: 'INV-2312-00043',
    amount: 2340.00,
    reference: 'CHK-10045',
    paymentDate: '2024-12-06',
    notes: 'Check clearing in progress',
  },
  {
    id: '4',
    paymentNumber: 'PAY-2312-00122',
    type: 'REFUND',
    method: 'BANK_TRANSFER',
    status: 'COMPLETED',
    customer: 'Local Store',
    invoiceNumber: 'INV-2312-00040',
    amount: 150.00,
    reference: 'REF-789456',
    paymentDate: '2024-12-05',
    notes: 'Partial refund for damaged goods',
  },
  {
    id: '5',
    paymentNumber: 'PAY-2312-00121',
    type: 'RECEIVED',
    method: 'CASH',
    status: 'COMPLETED',
    customer: 'John Smith',
    invoiceNumber: 'INV-2312-00039',
    amount: 456.00,
    reference: null,
    paymentDate: '2024-12-05',
    notes: null,
  },
  {
    id: '6',
    paymentNumber: 'PAY-2312-00120',
    type: 'ADVANCE',
    method: 'BANK_TRANSFER',
    status: 'COMPLETED',
    customer: 'Smart Solutions',
    invoiceNumber: null,
    amount: 5000.00,
    reference: 'ADV-2024-001',
    paymentDate: '2024-12-04',
    notes: 'Advance payment for bulk order',
  },
];

const typeStyles: Record<PaymentType, { color: string; icon: typeof ArrowDownRight }> = {
  RECEIVED: { color: 'text-success bg-success/10', icon: ArrowDownRight },
  REFUND: { color: 'text-destructive bg-destructive/10', icon: ArrowUpRight },
  CREDIT: { color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', icon: ArrowDownRight },
  ADVANCE: { color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', icon: ArrowDownRight },
};

const statusStyles: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  REFUNDED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const methodLabels: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CHECK: 'Check',
  BANK_TRANSFER: 'Bank Transfer',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  DIGITAL_WALLET: 'Digital Wallet',
};

function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    customer: '',
    invoiceNumber: '',
    amount: '',
    method: 'BANK_TRANSFER' as PaymentMethod,
    reference: '',
    notes: '',
  });

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || payment.type === typeFilter;
    const matchesStatus = !statusFilter || payment.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate stats
  const totalReceived = payments
    .filter((p) => p.type === 'RECEIVED' && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = payments
    .filter((p) => p.type === 'REFUND' && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter((p) => p.status === 'PENDING');
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleRecordPayment = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate new payment number
    const paymentCount = payments.length + 1;
    const today = new Date();
    const yymm = `${String(today.getFullYear()).slice(2)}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const paymentNumber = `PAY-${yymm}-${String(paymentCount).padStart(5, '0')}`;

    const newPayment: Payment = {
      id: String(paymentCount),
      paymentNumber,
      type: 'RECEIVED',
      method: formData.method,
      status: 'COMPLETED',
      customer: formData.customer,
      invoiceNumber: formData.invoiceNumber || null,
      amount: parseFloat(formData.amount) || 0,
      reference: formData.reference || null,
      paymentDate: today.toISOString().split('T')[0],
      notes: formData.notes || null,
    };

    setPayments((prev) => [newPayment, ...prev]);

    setIsSaving(false);
    setIsModalOpen(false);
    setFormData({
      customer: '',
      invoiceNumber: '',
      amount: '',
      method: 'BANK_TRANSFER',
      reference: '',
      notes: '',
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Payments"
        description="Track and manage payment transactions"
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Received"
          value={`$${totalReceived.toLocaleString()}`}
          change="This month"
          changeType="positive"
          icon={ArrowDownRight}
        />
        <StatsCard
          title="Total Refunded"
          value={`$${totalRefunded.toLocaleString()}`}
          change="This month"
          changeType="negative"
          icon={ArrowUpRight}
        />
        <StatsCard
          title="Pending"
          value={`$${pendingAmount.toLocaleString()}`}
          change={`${pendingPayments.length} payments`}
          changeType="neutral"
          icon={DollarSign}
        />
        <StatsCard
          title="Net Received"
          value={`$${(totalReceived - totalRefunded).toLocaleString()}`}
          change="After refunds"
          changeType="positive"
          icon={CreditCard}
        />
      </div>

      {/* Search and filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <FilterSelect
              value={typeFilter || 'all'}
              onChange={(val) => setTypeFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'RECEIVED', label: 'Received' },
                { value: 'REFUND', label: 'Refund' },
                { value: 'CREDIT', label: 'Credit' },
                { value: 'ADVANCE', label: 'Advance' },
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
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              placeholder="All Status"
              className="w-auto"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Payments table */}
      <DashboardCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Payment #</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Invoice</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium text-right">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => {
                const typeConfig = typeStyles[payment.type];
                const Icon = typeConfig.icon;
                return (
                  <tr key={payment.id} className="border-b last:border-0 table-row-hover">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('rounded-full p-2', typeConfig.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-medium">{payment.paymentNumber}</span>
                          <p className="text-xs text-muted-foreground capitalize">
                            {payment.type.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">{payment.customer}</td>
                    <td className="py-4 text-muted-foreground">
                      {payment.invoiceNumber || '-'}
                    </td>
                    <td className="py-4">
                      {methodLabels[payment.method]}
                    </td>
                    <td className="py-4 text-right">
                      <span className={cn(
                        'font-semibold',
                        payment.type === 'REFUND' ? 'text-destructive' : 'text-success'
                      )}>
                        {payment.type === 'REFUND' ? '-' : '+'}${payment.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        statusStyles[payment.status]
                      )}>
                        {payment.status.charAt(0) + payment.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Print Receipt</DropdownMenuItem>
                          <DropdownMenuItem>View Invoice</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Void Payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredPayments.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredPayments.length} payments
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

      {/* Record Payment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a new payment received from a customer
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer *</Label>
              <Input
                id="customer"
                value={formData.customer}
                onChange={(e) => setFormData((f) => ({ ...f, customer: e.target.value }))}
                placeholder="Select or enter customer name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData((f) => ({ ...f, invoiceNumber: e.target.value }))}
                  placeholder="INV-XXXX-XXXXX"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="method">Payment Method</Label>
                <FilterSelect
                  value={formData.method}
                  onChange={(val) => setFormData((f) => ({ ...f, method: val as PaymentMethod }))}
                  options={[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'CHECK', label: 'Check' },
                    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                    { value: 'CREDIT_CARD', label: 'Credit Card' },
                    { value: 'ONLINE', label: 'Online Payment' },
                    { value: 'OTHER', label: 'Other' },
                  ]}
                  placeholder="Select payment method"
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData((f) => ({ ...f, reference: e.target.value }))}
                  placeholder="Check #, Trans. ID, etc."
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={isSaving || !formData.customer || !formData.amount}
            >
              {isSaving ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

import { createFileRoute } from '@tanstack/react-router';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle,
  DollarSign,
  Download,
  Edit,
  Loader2,
  Minus,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings2,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import {
  DashboardCard,
  PageContainer,
  PageHeader,
  StatsCard,
} from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/recurring')({
  component: RecurringRevenuePage,
});

import { FilterSelect } from '@/components/ui/filter-select';

// Types
type BillingCycle = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';

interface RecurringItem {
  id: string;
  name: string;
  customer: string;
  customerId: string;
  description: string;
  amount: number;
  billingCycle: BillingCycle;
  startDate: string;
  nextBillingDate: string;
  status: SubscriptionStatus;
  lastInvoice: string | null;
  totalRevenue: number;
  invoiceCount: number;
}

// Mock data
const mockRecurringItems: RecurringItem[] = [
  {
    id: '1',
    name: 'Premium Support Plan',
    customer: 'Acme Corporation',
    customerId: 'c1',
    description: '24/7 priority support with dedicated account manager',
    amount: 999,
    billingCycle: 'MONTHLY',
    startDate: '2024-01-15',
    nextBillingDate: '2024-12-15',
    status: 'ACTIVE',
    lastInvoice: 'INV-2411-00123',
    totalRevenue: 10989,
    invoiceCount: 11,
  },
  {
    id: '2',
    name: 'Software License Subscription',
    customer: 'TechStart Inc.',
    customerId: 'c2',
    description: 'Enterprise software license - 50 seats',
    amount: 2500,
    billingCycle: 'MONTHLY',
    startDate: '2024-03-01',
    nextBillingDate: '2024-12-01',
    status: 'ACTIVE',
    lastInvoice: 'INV-2411-00145',
    totalRevenue: 22500,
    invoiceCount: 9,
  },
  {
    id: '3',
    name: 'Equipment Lease',
    customer: 'Global Systems',
    customerId: 'c3',
    description: 'Monthly lease for office equipment',
    amount: 750,
    billingCycle: 'MONTHLY',
    startDate: '2024-06-01',
    nextBillingDate: '2024-12-01',
    status: 'ACTIVE',
    lastInvoice: 'INV-2411-00156',
    totalRevenue: 4500,
    invoiceCount: 6,
  },
  {
    id: '4',
    name: 'Maintenance Contract',
    customer: 'City Government',
    customerId: 'c4',
    description: 'Annual maintenance for IT infrastructure',
    amount: 15000,
    billingCycle: 'YEARLY',
    startDate: '2024-01-01',
    nextBillingDate: '2025-01-01',
    status: 'ACTIVE',
    lastInvoice: 'INV-2401-00012',
    totalRevenue: 15000,
    invoiceCount: 1,
  },
  {
    id: '5',
    name: 'Consulting Retainer',
    customer: 'Smart Solutions',
    customerId: 'c5',
    description: '20 hours of consulting per month',
    amount: 3200,
    billingCycle: 'MONTHLY',
    startDate: '2024-04-01',
    nextBillingDate: '2024-12-01',
    status: 'PAUSED',
    lastInvoice: 'INV-2410-00089',
    totalRevenue: 22400,
    invoiceCount: 7,
  },
  {
    id: '6',
    name: 'Quarterly Service Package',
    customer: 'Local Store',
    customerId: 'c6',
    description: 'Quarterly on-site service and inspection',
    amount: 1200,
    billingCycle: 'QUARTERLY',
    startDate: '2024-02-01',
    nextBillingDate: '2025-02-01',
    status: 'ACTIVE',
    lastInvoice: 'INV-2411-00098',
    totalRevenue: 4800,
    invoiceCount: 4,
  },
];

const billingCycleLabels: Record<BillingCycle, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

const statusStyles: Record<SubscriptionStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  PAUSED: { label: 'Paused', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

// Mock customers for form with extended data
const mockCustomers = [
  { id: 'c1', name: 'Acme Corporation', email: 'orders@acme.com', address: '123 Business Ave, NY 10001' },
  { id: 'c2', name: 'TechStart Inc.', email: 'purchase@techstart.com', address: '456 Tech Blvd, SF 94102' },
  { id: 'c3', name: 'Global Systems', email: 'procurement@global.com', address: '789 Global Way, LA 90001' },
  { id: 'c4', name: 'City Government', email: 'procurement@city.gov', address: '100 City Hall, DC 20001' },
  { id: 'c5', name: 'Smart Solutions', email: 'orders@smart.com', address: '555 Smart Ave, Boston 02101' },
  { id: 'c6', name: 'Local Store', email: 'buying@localstore.com', address: '321 Main St, Chicago 60601' },
];

// Company info for invoice
const companyInfo = {
  name: 'Demo Company Ltd.',
  address: '123 Business Street, San Francisco, CA 94105',
  phone: '+1 (555) 123-4567',
  email: 'billing@demo-company.com',
  taxId: 'US123456789',
};

function RecurringRevenuePage() {
  const [items, setItems] = useState<RecurringItem[]>(mockRecurringItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    customerId: '',
    description: '',
    amount: 0,
    billingCycle: 'MONTHLY' as BillingCycle,
    startDate: new Date().toISOString().split('T')[0],
  });

  // Invoice print modal states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecurringItem | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Print ref
  const invoicePrintRef = useRef<HTMLDivElement>(null);

  // Print Settings State
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);
  const [printSettings, setPrintSettings] = useState({
    printer: 'default',
    colorMode: 'color' as 'color' | 'bw',
    paperSize: 'A4' as 'A4' | 'Letter' | 'Legal',
    copies: 1,
  });

  // Mock printers list
  const availablePrinters = [
    { id: 'default', name: 'System Default Printer' },
    { id: 'hp-office', name: 'HP OfficeJet Pro 9015' },
    { id: 'canon-lbp', name: 'Canon LBP6230' },
    { id: 'epson-wf', name: 'Epson WorkForce WF-2860' },
    { id: 'pdf', name: 'Save as PDF' },
  ];

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCycle = !cycleFilter || item.billingCycle === cycleFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesCycle && matchesStatus;
  });

  // Calculate stats
  const activeItems = items.filter((i) => i.status === 'ACTIVE');
  const monthlyRecurring = activeItems.reduce((sum, item) => {
    switch (item.billingCycle) {
      case 'WEEKLY': return sum + item.amount * 4.33;
      case 'MONTHLY': return sum + item.amount;
      case 'QUARTERLY': return sum + item.amount / 3;
      case 'YEARLY': return sum + item.amount / 12;
      default: return sum;
    }
  }, 0);
  const annualRecurring = monthlyRecurring * 12;
  const totalLifetimeRevenue = items.reduce((sum, i) => sum + i.totalRevenue, 0);

  const handleOpenModal = (item?: RecurringItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        customerId: item.customerId,
        description: item.description,
        amount: item.amount,
        billingCycle: item.billingCycle,
        startDate: item.startDate,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        customerId: '',
        description: '',
        amount: 0,
        billingCycle: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const customer = mockCustomers.find((c) => c.id === formData.customerId);

    if (editingItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
              ...item,
              ...formData,
              customer: customer?.name || item.customer,
            }
            : item
        )
      );
    } else {
      const newItem: RecurringItem = {
        id: String(items.length + 1),
        name: formData.name,
        customer: customer?.name || '',
        customerId: formData.customerId,
        description: formData.description,
        amount: formData.amount,
        billingCycle: formData.billingCycle,
        startDate: formData.startDate,
        nextBillingDate: formData.startDate,
        status: 'ACTIVE',
        lastInvoice: null,
        totalRevenue: 0,
        invoiceCount: 0,
      };
      setItems((prev) => [...prev, newItem]);
    }

    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
          : item
      )
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this recurring item?')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleGenerateInvoice = (item: RecurringItem) => {
    // Open invoice modal directly instead of navigating to invoices page
    setSelectedItem(item);
    setIsInvoiceModalOpen(true);
  };

  // Print invoice - called after print completes
  const handleAfterPrint = useCallback(async () => {
    setIsPrinting(false);
    if (selectedItem) {
      console.log('📦 Invoice printed for:', selectedItem.name);

      // Update the item's invoice count and total revenue
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? {
              ...i,
              invoiceCount: i.invoiceCount + 1,
              totalRevenue: i.totalRevenue + i.amount,
              lastInvoice: `INV-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`
            }
            : i
        )
      );

      setTimeout(() => {
        setIsInvoiceModalOpen(false);
      }, 1500);
    }
  }, [selectedItem]);

  // Handle Print - uses Electron silent print or iframe for browser
  const handleSilentPrint = useCallback(async () => {
    if (!selectedItem || !invoicePrintRef.current) return;

    setIsPrinting(true);
    try {
      const printContent = invoicePrintRef.current;
      const invoiceNumber = `INV-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;

      // Build complete HTML document with inline styles
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Invoice - ${invoiceNumber}</title>
            <style>
              @page { size: A4; margin: 15mm; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px; line-height: 1.5; color: #000; background: #fff;
                -webkit-print-color-adjust: exact; print-color-adjust: exact;
              }
              .invoice-container { padding: 20px; background: white; }
              .flex { display: flex; } .items-start { align-items: flex-start; }
              .items-center { align-items: center; } .justify-between { justify-content: space-between; }
              .justify-end { justify-content: flex-end; } .gap-2 { gap: 8px; } .gap-6 { gap: 24px; }
              .mb-2 { margin-bottom: 8px; } .mb-4 { margin-bottom: 16px; } .mb-8 { margin-bottom: 32px; }
              .mt-4 { margin-top: 16px; } .mt-12 { margin-top: 48px; }
              .my-2 { margin: 8px 0; } .my-6 { margin: 24px 0; }
              .p-4 { padding: 16px; } .p-8 { padding: 32px; } .pt-6 { padding-top: 24px; }
              .py-3 { padding: 12px 0; } .space-y-1 > * + * { margin-top: 4px; }
              .space-y-2 > * + * { margin-top: 8px; } .space-y-4 > * + * { margin-top: 16px; }
              .grid { display: grid; } .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
              .w-full { width: 100%; } .w-72 { width: 288px; } .w-20 { width: 80px; } .w-28 { width: 112px; }
              .text-left { text-align: left; } .text-center { text-align: center; } .text-right { text-align: right; }
              .text-sm { font-size: 12px; } .text-lg { font-size: 18px; } .text-xl { font-size: 20px; } .text-3xl { font-size: 30px; }
              .font-medium { font-weight: 500; } .font-semibold { font-weight: 600; } .font-bold { font-weight: 700; }
              .uppercase { text-transform: uppercase; } .tracking-wider { letter-spacing: 0.05em; }
              .whitespace-pre-line { white-space: pre-line; }
              .text-gray-500 { color: #6b7280; } .text-gray-600 { color: #4b5563; }
              .text-gray-700 { color: #374151; } .text-gray-900 { color: #111827; }
              .text-blue-600 { color: #2563eb; } .bg-white { background-color: #fff; }
              .bg-gray-50 { background-color: #f9fafb; } .rounded-lg { border-radius: 8px; }
              .border { border: 1px solid #e5e7eb; } .border-t { border-top: 1px solid #e5e7eb; }
              .border-b { border-bottom: 1px solid #e5e7eb; } .border-b-2 { border-bottom: 2px solid #e5e7eb; }
              .border-gray-100 { border-color: #f3f4f6; } .border-gray-200 { border-color: #e5e7eb; }
              table { border-collapse: collapse; width: 100%; } th, td { padding: 12px 8px; }
              .h-10 { height: 40px; } .w-10 { width: 40px; } .h-6 { height: 24px; } .w-6 { width: 24px; }
              .logo-box { height: 40px; width: 40px; background-color: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
              .logo-box svg { height: 24px; width: 24px; color: white; }
            </style>
          </head>
          <body>
            <div class="invoice-container">${printContent.innerHTML}</div>
          </body>
        </html>
      `;

      // Check if running in Electron with printHtmlContent support
      const electronAPI = (window as unknown as {
        electronAPI?: {
          printHtmlContent: (
            htmlContent: string,
            options: {
              deviceName?: string;
              pageSize?: 'A4' | 'Letter' | 'Legal';
              color?: boolean;
              copies?: number;
              silent?: boolean;
            }
          ) => Promise<{ success: boolean; error?: string }>;
        }
      }).electronAPI;

      if (electronAPI?.printHtmlContent) {
        // Electron: Use silent print with HTML content
        const printerName = printSettings.printer === 'default' ? undefined :
          availablePrinters.find(p => p.id === printSettings.printer)?.name;

        const result = await electronAPI.printHtmlContent(htmlContent, {
          deviceName: printerName,
          pageSize: printSettings.paperSize,
          color: printSettings.colorMode === 'color',
          copies: printSettings.copies,
          silent: true,
        });

        if (result.success) {
          console.log('✅ Silent print successful');
          await handleAfterPrint();
        } else {
          console.error('Silent print failed:', result.error);
          setIsPrinting(false);
        }
      } else {
        // Browser: Use iframe printing (will show print dialog)
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.top = '-10000px';
        iframe.style.left = '-10000px';
        iframe.style.width = '210mm';
        iframe.style.height = '297mm';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) {
          console.error('Could not access iframe document');
          setIsPrinting(false);
          return;
        }

        doc.open();
        doc.write(htmlContent);
        doc.close();

        // Wait for content to load, then print
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 250);

        await handleAfterPrint();
      }
    } catch (error) {
      console.error('Print error:', error);
      setIsPrinting(false);
    }
  }, [selectedItem, printSettings, availablePrinters, handleAfterPrint]);

  // Handle Save PDF - direct download without print dialog
  const handleSavePdf = useCallback(async () => {
    if (!invoicePrintRef.current || !selectedItem) return;

    setIsPrinting(true);
    try {
      const element = invoicePrintRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      const invoiceNumber = `INV-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Invoice-${invoiceNumber}.pdf`);

      // Call after print handler to update order status
      await handleAfterPrint();
    } catch (error) {
      console.error('Failed to save PDF:', error);
      setIsPrinting(false);
    }
  }, [selectedItem, handleAfterPrint]);

  return (
    <PageContainer>
      <PageHeader
        title="Recurring Revenue"
        description="Manage subscriptions and recurring billing items"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Recurring Item
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Monthly Recurring Revenue"
          value={`$${monthlyRecurring.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change="MRR"
          changeType="positive"
          icon={DollarSign}
        />
        <StatsCard
          title="Annual Recurring Revenue"
          value={`$${annualRecurring.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change="ARR"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatsCard
          title="Active Subscriptions"
          value={activeItems.length.toString()}
          change={`${items.length} total`}
          changeType="neutral"
          icon={RefreshCw}
        />
        <StatsCard
          title="Lifetime Revenue"
          value={`$${totalLifetimeRevenue.toLocaleString()}`}
          change="All time"
          changeType="neutral"
          icon={CheckCircle}
        />
      </div>

      {/* Search and filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by name or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <FilterSelect
              value={cycleFilter || 'all'}
              onChange={(val) => setCycleFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Cycles' },
                { value: 'WEEKLY', label: 'Weekly' },
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'QUARTERLY', label: 'Quarterly' },
                { value: 'YEARLY', label: 'Yearly' },
              ]}
              placeholder="All Cycles"
              className="w-auto"
            />
            <FilterSelect
              value={statusFilter || 'all'}
              onChange={(val) => setStatusFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'PAUSED', label: 'Paused' },
                { value: 'CANCELLED', label: 'Cancelled' },
                { value: 'EXPIRED', label: 'Expired' },
              ]}
              placeholder="All Status"
              className="w-auto"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Items table */}
      <DashboardCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Item / Customer</th>
                <th className="pb-3 font-medium text-right">Amount</th>
                <th className="pb-3 font-medium">Cycle</th>
                <th className="pb-3 font-medium">Next Billing</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Total Revenue</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const statusConfig = statusStyles[item.status];
                return (
                  <tr key={item.id} className="border-b last:border-0 table-row-hover">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <CalendarClock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.customer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-semibold">${item.amount.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">/{billingCycleLabels[item.billingCycle].toLowerCase().slice(0, -2)}</span>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <RefreshCw className="h-3 w-3" />
                        {billingCycleLabels[item.billingCycle]}
                      </span>
                    </td>
                    <td className="py-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(item.nextBillingDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        statusConfig.color
                      )}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <p className="font-medium">${item.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{item.invoiceCount} invoices</p>
                    </td>
                    <td className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenModal(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateInvoice(item)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Generate Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(item.id)}>
                            {item.status === 'ACTIVE' ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Resume
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarClock className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No recurring items found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm || cycleFilter || statusFilter
                ? 'Try adjusting your filters'
                : 'Add your first recurring revenue item'}
            </p>
            {!searchTerm && !cycleFilter && !statusFilter && (
              <Button className="mt-4" onClick={() => handleOpenModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Recurring Item
              </Button>
            )}
          </div>
        )}
      </DashboardCard>



      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Recurring Item' : 'Add Recurring Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update the recurring billing details'
                : 'Set up a new recurring revenue item'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Premium Support Plan"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer *</Label>
              <FilterSelect
                value={formData.customerId}
                onChange={(val) => setFormData((f) => ({ ...f, customerId: val }))}
                options={mockCustomers.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select customer"
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the service or item"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="billingCycle">Billing Cycle *</Label>
                <FilterSelect
                  value={formData.billingCycle}
                  onChange={(val) => setFormData((f) => ({ ...f, billingCycle: val as BillingCycle }))}
                  options={[
                    { value: 'WEEKLY', label: 'Weekly' },
                    { value: 'MONTHLY', label: 'Monthly' },
                    { value: 'QUARTERLY', label: 'Quarterly' },
                    { value: 'YEARLY', label: 'Yearly' },
                  ]}
                  placeholder="Select cycle"
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <DateInput
                value={formData.startDate}
                onChange={(value) => setFormData((f) => ({ ...f, startDate: value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.name || !formData.customerId || !formData.amount}
            >
              {isSaving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Print Modal */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 [&>button]:hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Print Invoice</DialogTitle>
                <DialogDescription>
                  {selectedItem?.name} - {selectedItem?.customer}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPrintSettingsOpen(true)}
                title="Print Settings"
              >
                <Settings2 className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 bg-gray-100">
            <div className="p-6 flex justify-center bg-gray-100">
              {/* Printable Invoice - A4 Paper Size Preview */}
              <div
                ref={invoicePrintRef}
                className="printable-invoice bg-white text-black p-8 shadow-lg border border-gray-200"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  boxSizing: 'border-box',
                }}
              >
                {/* Print-specific styles */}
                <style>
                  {`
                    @media print {
                      @page {
                        size: A4;
                        margin: 15mm;
                      }
                      
                      /* Hide everything by default */
                      body * {
                        visibility: hidden;
                      }
                      
                      /* Show only the printable invoice */
                      .printable-invoice,
                      .printable-invoice * {
                        visibility: visible;
                      }
                      
                      /* Position the invoice at the top left */
                      .printable-invoice {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0;
                        margin: 0;
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                      
                      /* Remove shadows and borders for print */
                      .printable-invoice {
                        box-shadow: none !important;
                        border: none !important;
                      }
                    }
                  `}
                </style>

                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  {/* Company Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {companyInfo.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{companyInfo.address}</p>
                    <p className="text-sm text-gray-600">{companyInfo.phone}</p>
                    <p className="text-sm text-gray-600">{companyInfo.email}</p>
                    <p className="text-sm text-gray-600">Tax ID: {companyInfo.taxId}</p>
                  </div>

                  {/* Invoice Title & Number */}
                  <div className="text-right">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                    <p className="text-lg font-semibold text-blue-600">
                      {`INV-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`}
                    </p>
                    <div className="mt-4 space-y-1 text-sm">
                      <p>
                        <span className="text-gray-500">Invoice Date:</span>{' '}
                        <span className="font-medium">
                          {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Due Date:</span>{' '}
                        <span className="font-medium">
                          {new Date(
                            Date.now() + 30 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-gray-200 my-6" />

                {/* Bill To */}
                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Bill To
                  </h2>
                  {selectedItem ? (
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedItem.customer}
                      </p>
                      <p className="text-sm text-gray-600">
                        {mockCustomers.find(c => c.id === selectedItem.customerId)?.email}
                      </p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {mockCustomers.find(c => c.id === selectedItem.customerId)?.address}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No customer selected</p>
                  )}
                </div>

                {/* Line Items Table */}
                <div className="mb-8">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="py-3 text-left text-sm font-semibold text-gray-700">
                          Description
                        </th>
                        <th className="py-3 text-center text-sm font-semibold text-gray-700 w-20">
                          Qty
                        </th>
                        <th className="py-3 text-right text-sm font-semibold text-gray-700 w-28">
                          Unit Price
                        </th>
                        <th className="py-3 text-right text-sm font-semibold text-gray-700 w-28">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem ? (
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <td className="py-3">
                            <p className="font-medium text-gray-900">{selectedItem.name}</p>
                            <p className="text-sm text-gray-500">{selectedItem.description}</p>
                          </td>
                          <td className="py-3 text-center text-gray-700">
                            1
                          </td>
                          <td className="py-3 text-right text-gray-700">
                            ${selectedItem.amount.toFixed(2)}
                          </td>
                          <td className="py-3 text-right font-medium text-gray-900">
                            ${selectedItem.amount.toFixed(2)}
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                            No items in this invoice
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-72 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900">${selectedItem?.amount.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-blue-600">${selectedItem?.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Billing Cycle Info */}
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Billing Information
                    </h3>
                    <p className="text-sm text-gray-600">
                      Billing Cycle: {selectedItem && billingCycleLabels[selectedItem.billingCycle]}
                    </p>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="border-t border-gray-200 pt-6 space-y-4 mt-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Terms & Conditions
                    </h3>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      Default terms and conditions apply.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-500">
                    Thank you for your business!
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => printSettings.printer === 'pdf' ? handleSavePdf() : handleSilentPrint()} disabled={isPrinting}>
              {isPrinting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : printSettings.printer === 'pdf' ? (
                <Download className="mr-2 h-4 w-4" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              {isPrinting ? 'Processing...' : printSettings.printer === 'pdf' ? 'Save PDF' : 'Print Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Settings Modal */}
      <Dialog open={isPrintSettingsOpen} onOpenChange={setIsPrintSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Print Settings</DialogTitle>
            <DialogDescription>
              Configure printer, color mode, paper size, and copies
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Printer Selection */}
            <div className="space-y-2">
              <Label>Printer</Label>
              <Select
                value={printSettings.printer}
                onValueChange={(value) => setPrintSettings({ ...printSettings, printer: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select printer" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrinters.map((printer) => (
                    <SelectItem key={printer.id} value={printer.id}>
                      {printer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Mode */}
            <div className="space-y-2">
              <Label>Color Mode</Label>
              <Select
                value={printSettings.colorMode}
                onValueChange={(value: 'color' | 'bw') => setPrintSettings({ ...printSettings, colorMode: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select color mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="color">Color</SelectItem>
                  <SelectItem value="bw">Black & White</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Paper Size */}
            <div className="space-y-2">
              <Label>Paper Size</Label>
              <Select
                value={printSettings.paperSize}
                onValueChange={(value: 'A4' | 'Letter' | 'Legal') => setPrintSettings({ ...printSettings, paperSize: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select paper size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                  <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                  <SelectItem value="Legal">Legal (8.5 × 14 in)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Copies */}
            <div className="space-y-2">
              <Label>Copies</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPrintSettings({
                    ...printSettings,
                    copies: Math.max(1, printSettings.copies - 1)
                  })}
                  disabled={printSettings.copies <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  max="999"
                  value={printSettings.copies}
                  onChange={(e) => {
                    const value = Math.max(1, Math.min(999, parseInt(e.target.value) || 1));
                    setPrintSettings({ ...printSettings, copies: value });
                  }}
                  className="w-14 h-7 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPrintSettings({
                    ...printSettings,
                    copies: Math.min(999, printSettings.copies + 1)
                  })}
                  disabled={printSettings.copies >= 999}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsPrintSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsPrintSettingsOpen(false)}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

/**
 * Recurring Revenue Page - Refactored
 * 
 * This page has been refactored from a 1252-line monolithic component
 * into a modular structure located in @/lib/features/recurring/:
 * 
 * - types.ts: Type definitions and constants
 * - utils.ts: Helper functions
 * - useRecurring.ts: Data fetching and CRUD operations hook
 * - RecurringTable.tsx: Recurring items list component
 * - RecurringForm.tsx: Form dialog component
 * 
 * Note: Invoice printing functionality is kept in this file as it's page-specific.
 */

import { createFileRoute } from '@tanstack/react-router';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Download,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings2,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
  DashboardCard,
  PageContainer,
  PageHeader,
  StatsCard,
} from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { FilterSelect } from '@/components/ui/filter-select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Import from feature module
import {
  type RecurringItem,
  type RecurringFormData,
  type PrintSettings,
  initialRecurringFormData,
  initialPrintSettings,
  defaultPrinters,
  companyInfo,
  useRecurring,
  RecurringTable,
  RecurringForm,
  generateInvoiceNumber,
} from '@/lib/features/recurring';

export const Route = createFileRoute('/_dashboard/recurring')({
  component: RecurringRevenuePage,
});

function RecurringRevenuePage() {
  const {
    items,
    customers,
    isLoading,
    isLoadingCustomers,
    createItem,
    updateItem,
    deleteItem,
    toggleStatus,
    updateInvoiceStats,
    stats,
  } = useRecurring();

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<RecurringFormData>(initialRecurringFormData);

  // Invoice modal state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecurringItem | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const invoicePrintRef = useRef<HTMLDivElement>(null);

  // Print settings state
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(initialPrintSettings);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCycle = !cycleFilter || item.billingCycle === cycleFilter;
      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesSearch && matchesCycle && matchesStatus;
    });
  }, [items, searchTerm, cycleFilter, statusFilter]);

  // Form handlers
  const handleOpenModal = useCallback((item?: RecurringItem) => {
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
      setFormData(initialRecurringFormData);
    }
    setIsModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (editingItem) {
        await updateItem(editingItem.id, formData);
      } else {
        await createItem(formData);
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  }, [editingItem, formData, createItem, updateItem]);

  // Invoice handlers
  const handleGenerateInvoice = useCallback((item: RecurringItem) => {
    setSelectedItem(item);
    setIsInvoiceModalOpen(true);
  }, []);

  const handleAfterPrint = useCallback(async () => {
    setIsPrinting(false);
    if (selectedItem) {
      updateInvoiceStats(selectedItem.id);
      setTimeout(() => setIsInvoiceModalOpen(false), 1500);
    }
  }, [selectedItem, updateInvoiceStats]);

  // Handle PDF download
  const handleSavePdf = useCallback(async () => {
    if (!invoicePrintRef.current || !selectedItem) return;
    setIsPrinting(true);
    try {
      const canvas = await html2canvas(invoicePrintRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * ratio, canvas.height * ratio);
      pdf.save(`Invoice-${generateInvoiceNumber()}.pdf`);
      await handleAfterPrint();
    } catch (error) {
      console.error('Failed to save PDF:', error);
      setIsPrinting(false);
    }
  }, [selectedItem, handleAfterPrint]);

  const hasFilters = !!(searchTerm || cycleFilter || statusFilter);

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
          value={`$${stats.monthlyRecurring.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change="MRR"
          changeType="positive"
          icon={DollarSign}
        />
        <StatsCard
          title="Annual Recurring Revenue"
          value={`$${stats.annualRecurring.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change="ARR"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatsCard
          title="Active Subscriptions"
          value={stats.activeCount.toString()}
          change={`${stats.totalCount} total`}
          changeType="neutral"
          icon={RefreshCw}
        />
        <StatsCard
          title="Lifetime Revenue"
          value={`$${stats.totalLifetimeRevenue.toLocaleString()}`}
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
        <RecurringTable
          items={filteredItems}
          isLoading={isLoading}
          onEdit={handleOpenModal}
          onDelete={deleteItem}
          onToggleStatus={toggleStatus}
          onGenerateInvoice={handleGenerateInvoice}
          onAddNew={() => handleOpenModal()}
          hasFilters={hasFilters}
        />
      </DashboardCard>

      {/* Add/Edit Modal */}
      <RecurringForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        isSaving={isSaving}
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        customers={customers}
        isLoadingCustomers={isLoadingCustomers}
      />

      {/* Invoice Preview Modal - Simplified */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div ref={invoicePrintRef} className="p-6 bg-white">
              {selectedItem && (
                <div className="space-y-4">
                  <div className="text-center border-b pb-4">
                    <h2 className="text-xl font-bold">{companyInfo.name}</h2>
                    <p className="text-sm text-muted-foreground">{companyInfo.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Bill To:</p>
                      <p>{selectedItem.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Invoice #:</p>
                      <p>{generateInvoiceNumber()}</p>
                    </div>
                  </div>
                  <table className="w-full mt-4">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">{selectedItem.name}</td>
                        <td className="text-right py-2">${selectedItem.amount.toLocaleString()}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="font-bold">
                        <td className="py-2">Total</td>
                        <td className="text-right py-2">${selectedItem.amount.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPrintSettingsOpen(true)}>
              <Settings2 className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" onClick={handleSavePdf} disabled={isPrinting}>
              <Download className="mr-2 h-4 w-4" />
              Save PDF
            </Button>
            <Button onClick={handleSavePdf} disabled={isPrinting}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Settings Modal */}
      <Dialog open={isPrintSettingsOpen} onOpenChange={setIsPrintSettingsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Print Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Printer</Label>
              <Select
                value={printSettings.printer}
                onValueChange={(val) => setPrintSettings(s => ({ ...s, printer: val }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {defaultPrinters.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Paper Size</Label>
              <Select
                value={printSettings.paperSize}
                onValueChange={(val: 'A4' | 'Letter' | 'Legal') => setPrintSettings(s => ({ ...s, paperSize: val }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPrintSettingsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

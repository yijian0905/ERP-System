import { createFileRoute } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Download,
  Loader2,
  Minus,
  Package,
  Plus,
  Printer,
  Search,
  Settings,
  Settings2,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useDocumentPrint } from '@/lib/hooks/useDocumentPrint';
import { InvoiceHtmlLayout, salesOrderToInvoice, type CompanyInfo } from '@/components/invoice/invoice-html-layout';

import { DashboardCard, PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterSelect } from '@/components/ui/filter-select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useCanSkipApproval } from '@/stores/auth';
import { ordersApi, customersApi, productsApi } from '@/lib/api';

export const Route = createFileRoute('/_dashboard/orders/sales')({
  component: SalesOrdersPage,
});

// Types
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  customer: string;
  customerId: string;
  customerEmail: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  orderDate: string;
  expectedDate: string | null;
  shippedDate: string | null;
  notes: string;
  terms: string;
  taxRate: number;
  dueDateDays: number;
}


// Company info for invoice - matches CompanyInfo interface
const companyInfo: CompanyInfo = {
  name: 'Demo Company Sdn Bhd',
  nameSecondary: '演示公司有限公司',
  registrationNo: '123456-A',
  address: 'No. 123, Jalan Example,\nTaman Business Park,\n50000 Kuala Lumpur, Malaysia',
  phone: '+60 3-1234 5678',
  email: 'sales@demo-company.com',
  website: 'www.demo-company.com',
  sstNo: 'W10-1234-56789012',
};

function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [mockInventoryItems, setMockInventoryItems] = useState<typeof import('@/lib/api/products').Product[]>([]);
  const [mockCustomers, setMockCustomers] = useState<typeof import('@/lib/api/customers').Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inventorySearch, setInventorySearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Current draft order
  const [draftItems, setDraftItems] = useState<OrderItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  // Invoice Settings
  const [invoiceSettings, setInvoiceSettings] = useState({
    notes: '',
    terms: 'Goods sold are not returnable.\nInterest at 1.5% per month on overdue accounts.',
    taxRate: 0,
    dueDateDays: 30,
    bankName: '',
    accountName: '',
    accountNo: '',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Print Settings State
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);

  // Use unified print hook
  const {
    printRef: invoicePrintRef,
    isPrinting,
    printSettings,
    availablePrinters,
    setPrintSettings,
    executeCurrentAction: executePrint,
  } = useDocumentPrint({
    onPrintComplete: () => {
      if (selectedOrder) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id ? { ...o, status: o.status } : o
          )
        );
        setTimeout(() => setIsInvoiceModalOpen(false), 1500);
      }
    },
  });

  // Non-sellable categories should not appear in sales orders
  const nonSellableCategories = ['Operating Consumables'];

  // Filter inventory - exclude non-sellable categories
  const filteredInventory = mockInventoryItems.filter((item) => {
    const isNonSellable = nonSellableCategories.includes(item.category);
    const matchesSearch =
      item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory && !isNonSellable;
  });

  // Get unique categories - exclude non-sellable categories
  const categories = [...new Set(mockInventoryItems.map((i) => i.category))].filter(
    (c) => !nonSellableCategories.includes(c)
  );

  // Calculate draft totals
  const draftSubtotal = draftItems.reduce((sum, item) => sum + item.total, 0);
  const draftTax = draftSubtotal * (invoiceSettings.taxRate / 100);
  const draftTotal = draftSubtotal + draftTax;

  // Add item to draft from inventory
  const handleAddToDraft = (product: typeof mockInventoryItems[0]) => {
    const existingIndex = draftItems.findIndex((i) => i.productId === product.id);

    if (existingIndex >= 0) {
      // Increase quantity
      const currentQty = draftItems[existingIndex].quantity;
      if (currentQty < product.stock) {
        handleUpdateQuantity(existingIndex, currentQty + 1);
      }
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: `draft-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
      };
      setDraftItems((prev) => [...prev, newItem]);
    }
  };

  // Update item quantity
  const handleUpdateQuantity = (index: number, quantity: number) => {
    const item = draftItems[index];
    const product = mockInventoryItems.find((p) => p.id === item.productId);
    const maxQty = product ? product.stock : 9999;
    const qty = Math.max(1, Math.min(quantity, maxQty));

    setDraftItems((prev) => {
      const items = [...prev];
      items[index] = {
        ...items[index],
        quantity: qty,
        total: qty * items[index].unitPrice,
      };
      return items;
    });
  };

  // Remove item from draft
  const handleRemoveFromDraft = (index: number) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear draft
  const handleClearDraft = () => {
    setDraftItems([]);
    setSelectedCustomerId('');
    setExpectedDate('');
    // Convert current invoice settings to defaults or keep them? Keeping them for now.
  };

  // Generate order number
  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    return `SO-${year}${month}-${random}`;
  };

  // Check if user can skip approval workflow
  const canSkipApproval = useCanSkipApproval();

  // Create order from draft
  const handleCreateOrder = async () => {
    if (!selectedCustomerId || draftItems.length === 0) return;

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const customer = mockCustomers.find((c) => c.id === selectedCustomerId);

    const newOrder: SalesOrder = {
      id: String(orders.length + 1),
      orderNumber: generateOrderNumber(),
      customer: customer?.name || '',
      customerId: selectedCustomerId,
      customerEmail: customer?.email || '',
      customerAddress: customer?.address || '',
      items: draftItems,
      subtotal: draftSubtotal,
      tax: draftTax,
      total: draftTotal,
      status: canSkipApproval ? 'CONFIRMED' : 'PENDING',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: expectedDate || null,
      shippedDate: null,

      notes: invoiceSettings.notes,
      terms: invoiceSettings.terms,
      taxRate: invoiceSettings.taxRate,
      dueDateDays: invoiceSettings.dueDateDays
    };

    setOrders((prev) => [newOrder, ...prev]);
    handleClearDraft();
    setIsSaving(false);

    // Open invoice modal for the new order
    setSelectedOrder(newOrder);
    setIsInvoiceModalOpen(true);
  };

  // Handle print action using unified hook
  const handlePrint = () => {
    if (!selectedOrder) return;
    executePrint({
      title: `Invoice - ${selectedOrder.orderNumber}`,
      number: selectedOrder.orderNumber,
      type: 'invoice',
    });
  };


  return (
    <PageContainer className="h-[calc(100vh-8rem)] flex flex-col">
      <PageHeader
        title="Sales Orders"
        description="Select inventory items to create sales orders"
        actions={
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return
          </Button>
        }
      />

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2 flex-1 min-h-0">
        {/* Left Column - Inventory Items */}
        <div className="h-full flex flex-col min-h-0">
          <DashboardCard className="h-full flex flex-col overflow-hidden [&>div:last-child]:flex-1 [&>div:last-child]:flex [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Inventory Items
              </h3>
              <span className="text-sm text-muted-foreground">
                {filteredInventory.length} items
              </span>
            </div>

            {/* Search and filter */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
                />
              </div>
              <FilterSelect
                value={categoryFilter || 'all'}
                onChange={(val) => setCategoryFilter(val === 'all' ? '' : val)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
                placeholder="All Categories"
                className="w-auto"
              />
            </div>

            {/* Inventory list */}
            <ScrollArea className="flex-1 -mr-3 pr-3">
              <div className="space-y-2">
                {filteredInventory.map((item) => {
                  const inDraft = draftItems.find((d) => d.productId === item.id);
                  const isLowStock = item.stock <= 10;
                  const isOutOfStock = item.stock === 0;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center justify-between rounded-lg border p-3 transition-colors',
                        inDraft && 'border-primary bg-primary/5',
                        isOutOfStock && 'opacity-50'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{item.name}</p>
                          {isLowStock && !isOutOfStock && (
                            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{item.sku}</span>
                          <span>•</span>
                          <span className={isLowStock ? 'text-amber-500' : ''}>
                            Stock: {item.stock}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">${item.price.toFixed(2)}</span>
                        {inDraft ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => {
                                const idx = draftItems.findIndex((d) => d.productId === item.id);
                                if (inDraft.quantity > 1) {
                                  handleUpdateQuantity(idx, inDraft.quantity - 1);
                                } else {
                                  handleRemoveFromDraft(idx);
                                }
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              max={item.stock}
                              value={inDraft.quantity}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const idx = draftItems.findIndex((d) => d.productId === item.id);
                                handleUpdateQuantity(idx, parseInt(e.target.value) || 1);
                              }}
                              className="h-7 w-14 text-center text-sm"
                            />
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => {
                                const idx = draftItems.findIndex((d) => d.productId === item.id);
                                handleUpdateQuantity(idx, inDraft.quantity + 1);
                              }}
                              disabled={inDraft.quantity >= item.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAddToDraft(item)}
                            disabled={isOutOfStock}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </DashboardCard>
        </div>

        {/* Right Column - Current Order & Order List */}
        <div className="h-full flex flex-col min-h-0">
          {/* Current Draft Order */}
          <DashboardCard className="h-full flex flex-col overflow-hidden [&>div:last-child]:flex-1 [&>div:last-child]:flex [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                Current Order
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearDraft}
                className={cn(draftItems.length === 0 && "invisible pointer-events-none")}
              >
                Clear All
              </Button>
            </div>

            {/* Customer Selection */}
            <div className="mb-4">
              <Label className="text-sm mb-2 block">Customer</Label>
              <div className="flex gap-2">
                <FilterSelect
                  value={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  options={[
                    ...mockCustomers.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  placeholder="Select customer..."
                  className="h-9 flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setIsSettingsOpen(true)}
                  title="Invoice Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

            </div>

            {/* Draft Items */}
            {/* Draft Items Area - Always rendered with flex-1 */}
            <div className="flex-1 min-h-0 mb-4 flex flex-col">
              {draftItems.length === 0 ? (
                <div className="flex-1 rounded-lg border border-dashed p-8 text-center flex flex-col justify-center items-center">
                  <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click <Plus className="inline h-4 w-4" /> on items to add them
                  </p>
                </div>
              ) : (
                <ScrollArea className="flex-1 -mr-3 pr-3">
                  <div className="space-y-2">
                    {draftItems.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            ${item.unitPrice.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">${item.total.toFixed(2)}</span>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleRemoveFromDraft(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Order Summary - Always visible */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({draftItems.length} items)</span>
                <span>${draftSubtotal.toFixed(2)}</span>
              </div>
              {invoiceSettings.taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax ({invoiceSettings.taxRate}%)</span>
                  <span>${draftTax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total</span>
                <span className="text-lg">${draftTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions - Always visible */}
            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                onClick={handleCreateOrder}
                disabled={!selectedCustomerId || draftItems.length === 0 || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {isSaving ? 'Creating...' : 'Create Order'}
              </Button>
            </div>
          </DashboardCard>
        </div>
      </div >

      {/* Invoice Settings Modal */}
      < Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} >
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Invoice Settings</DialogTitle>
            <DialogDescription>
              Configure default settings for this invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={invoiceSettings.taxRate}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, taxRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date (Days)</Label>
                <Input
                  type="number"
                  min="0"
                  value={invoiceSettings.dueDateDays}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, dueDateDays: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Enter invoice notes..."
                value={invoiceSettings.notes}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, notes: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea
                placeholder="Enter terms and conditions..."
                value={invoiceSettings.terms}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, terms: e.target.value })}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog >

      {/* Invoice Print Modal - Split View: Form Left, Preview Right */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 [&>button]:hidden">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Print Invoice</DialogTitle>
                <DialogDescription>
                  {selectedOrder?.orderNumber} - {selectedOrder?.customer}
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

          {/* Split View Container */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - Invoice Settings Form */}
            <div className="w-[380px] shrink-0 border-r bg-muted/30 flex flex-col">
              <div className="p-4 border-b bg-background">
                <h3 className="font-semibold text-sm">Invoice Settings / 發票設定</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-5">
                  {/* Tax & Due Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Tax Rate (%) / 稅率</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={invoiceSettings.taxRate}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, taxRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Due Days / 付款天數</Label>
                      <Input
                        type="number"
                        min="0"
                        value={invoiceSettings.dueDateDays}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, dueDateDays: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* Payment Info Section */}
                  <div className="space-y-3 pt-2 border-t">
                    <h4 className="font-medium text-sm">Payment Info / 付款資訊</h4>
                    <div className="space-y-2">
                      <Label className="text-xs">Bank Name / 銀行名稱</Label>
                      <Input
                        placeholder="e.g. Maybank"
                        value={invoiceSettings.bankName || ''}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, bankName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Account Name / 帳戶名稱</Label>
                      <Input
                        placeholder="e.g. Company Name Sdn Bhd"
                        value={invoiceSettings.accountName || ''}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, accountName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Account No / 帳號</Label>
                      <Input
                        placeholder="e.g. 5123 4567 8901"
                        value={invoiceSettings.accountNo || ''}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, accountNo: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs">Notes / 備註</Label>
                    <Textarea
                      placeholder="Enter invoice notes..."
                      className="min-h-[80px] text-sm"
                      value={invoiceSettings.notes}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, notes: e.target.value })}
                    />
                  </div>

                  {/* Terms */}
                  <div className="space-y-2">
                    <Label className="text-xs">Terms & Conditions / 條款</Label>
                    <Textarea
                      placeholder="Enter terms and conditions..."
                      className="min-h-[80px] text-sm"
                      value={invoiceSettings.terms}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, terms: e.target.value })}
                    />
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel - Live Invoice Preview */}
            <div className="flex-1 bg-gray-100 flex flex-col overflow-hidden">
              <div className="p-4 border-b bg-background shrink-0">
                <h3 className="font-semibold text-sm">Preview / 預覽</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6 flex justify-center">
                  <div
                    ref={invoicePrintRef}
                    className="shadow-lg border border-gray-200 transform scale-[0.75] origin-top"
                  >
                    <style>
                      {`
                        @media print {
                          @page { size: A4; margin: 15mm; }
                          body * { visibility: hidden; }
                          .printable-invoice, .printable-invoice * { visibility: visible; }
                          .printable-invoice {
                            position: absolute;
                            left: 0; top: 0; width: 100%;
                            padding: 0; margin: 0;
                            background: white !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                            box-shadow: none !important;
                            border: none !important;
                            transform: none !important;
                          }
                        }
                      `}
                    </style>
                    {selectedOrder && (
                      <InvoiceHtmlLayout
                        className="printable-invoice"
                        invoice={{
                          ...salesOrderToInvoice(selectedOrder, companyInfo),
                          payment: invoiceSettings.bankName ? {
                            bankName: invoiceSettings.bankName,
                            accountName: invoiceSettings.accountName || '',
                            accountNo: invoiceSettings.accountNo || '',
                          } : undefined,
                          notes: invoiceSettings.notes || undefined,
                          terms: invoiceSettings.terms ? [invoiceSettings.terms] : undefined,
                        }}
                      />
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint} disabled={isPrinting}>
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
      < Dialog open={isPrintSettingsOpen} onOpenChange={setIsPrintSettingsOpen} >
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
      </Dialog >
    </PageContainer >
  );
}

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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useCallback, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';

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

// Mock inventory items - these represent available stock for sales
const mockInventoryItems = [
  { id: 'p1', sku: 'ELEC-001', name: 'Wireless Mouse', price: 29.99, stock: 140, reserved: 10, category: 'Electronics' },
  { id: 'p2', sku: 'ELEC-002', name: 'Mechanical Keyboard', price: 89.99, stock: 5, reserved: 3, category: 'Electronics' },
  { id: 'p3', sku: 'ELEC-003', name: 'USB-C Hub', price: 49.99, stock: 185, reserved: 15, category: 'Electronics' },
  { id: 'p4', sku: 'OFFC-001', name: 'A4 Copy Paper (Ream)', price: 8.99, stock: 450, reserved: 50, category: 'Office Supplies' },
  { id: 'p5', sku: 'FURN-001', name: 'Ergonomic Chair', price: 299.99, stock: 20, reserved: 5, category: 'Furniture' },
  { id: 'p6', sku: 'OFFC-002', name: 'Printer Ink Black', price: 45.99, stock: 12, reserved: 0, category: 'Office Supplies' },
];

const mockCustomers = [
  { id: 'c1', name: 'Acme Corporation', email: 'orders@acme.com', address: '123 Business Ave, NY 10001' },
  { id: 'c2', name: 'TechStart Inc.', email: 'purchase@techstart.com', address: '456 Tech Blvd, SF 94102' },
  { id: 'c3', name: 'Global Systems', email: 'procurement@global.com', address: '789 Global Way, LA 90001' },
  { id: 'c4', name: 'Local Store', email: 'buying@localstore.com', address: '321 Main St, Chicago 60601' },
  { id: 'c5', name: 'Smart Solutions', email: 'orders@smart.com', address: '555 Smart Ave, Boston 02101' },
  { id: 'c6', name: 'City Government', email: 'procurement@city.gov', address: '100 City Hall, DC 20001' },
];

const mockOrders: SalesOrder[] = [
  {
    id: '1',
    orderNumber: 'SO-2312-00045',
    customer: 'Acme Corporation',
    customerId: 'c1',
    customerEmail: 'orders@acme.com',
    customerAddress: '123 Business Ave, NY 10001',
    items: [
      { id: 'i1', productId: 'p1', productName: 'Wireless Mouse', sku: 'ELEC-001', quantity: 10, unitPrice: 29.99, total: 299.90 },
      { id: 'i2', productId: 'p2', productName: 'Mechanical Keyboard', sku: 'ELEC-002', quantity: 5, unitPrice: 89.99, total: 449.95 },
    ],
    subtotal: 749.85,
    tax: 67.49,
    total: 817.34,
    status: 'PROCESSING',
    orderDate: '2024-12-07',
    expectedDate: '2024-12-14',
    shippedDate: null,
    notes: 'Rush delivery requested',
    terms: 'Net 30',
    taxRate: 9,
    dueDateDays: 30
  },
  {
    id: '2',
    orderNumber: 'SO-2312-00044',
    customer: 'TechStart Inc.',
    customerId: 'c2',
    customerEmail: 'purchase@techstart.com',
    customerAddress: '456 Tech Blvd, SF 94102',
    items: [
      { id: 'i3', productId: 'p3', productName: 'USB-C Hub', sku: 'ELEC-003', quantity: 20, unitPrice: 49.99, total: 999.80 },
    ],
    subtotal: 999.80,
    tax: 89.98,
    total: 1089.78,
    status: 'SHIPPED',
    orderDate: '2024-12-06',
    expectedDate: '2024-12-12',
    shippedDate: '2024-12-07',
    notes: '',
    terms: 'Net 30',
    taxRate: 9,
    dueDateDays: 30
  },
  {
    id: '3',
    orderNumber: 'SO-2312-00043',
    customer: 'Global Systems',
    customerId: 'c3',
    customerEmail: 'procurement@global.com',
    customerAddress: '789 Global Way, LA 90001',
    items: [
      { id: 'i4', productId: 'p5', productName: 'Ergonomic Chair', sku: 'FURN-001', quantity: 10, unitPrice: 299.99, total: 2999.90 },
    ],
    subtotal: 2999.90,
    tax: 269.99,
    total: 3269.89,
    status: 'DELIVERED',
    orderDate: '2024-12-03',
    expectedDate: '2024-12-10',
    shippedDate: '2024-12-05',
    notes: 'Deliver to loading dock',
    terms: 'Net 30',
    taxRate: 9,
    dueDateDays: 30
  },
  {
    id: '4',
    orderNumber: 'SO-2312-00042',
    customer: 'Local Store',
    customerId: 'c4',
    customerEmail: 'buying@localstore.com',
    customerAddress: '321 Main St, Chicago 60601',
    items: [
      { id: 'i5', productId: 'p4', productName: 'A4 Copy Paper (Ream)', sku: 'OFFC-001', quantity: 50, unitPrice: 8.99, total: 449.50 },
    ],
    subtotal: 449.50,
    tax: 40.46,
    total: 489.96,
    status: 'PENDING',
    orderDate: '2024-12-05',
    expectedDate: null,
    shippedDate: null,
    notes: '',
    terms: 'Net 30',
    taxRate: 9,
    dueDateDays: 30
  },
];

// Company info for invoice
const companyInfo = {
  name: 'Demo Company Ltd.',
  address: '123 Business Street, San Francisco, CA 94105',
  phone: '+1 (555) 123-4567',
  email: 'billing@demo-company.com',
  taxId: 'US123456789',
};

function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>(mockOrders);
  const [inventorySearch, setInventorySearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Current draft order
  const [draftItems, setDraftItems] = useState<OrderItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  // Invoice Settings
  const [invoiceSettings, setInvoiceSettings] = useState({
    notes: '',
    terms: 'Default terms and conditions apply.',
    taxRate: 0,
    dueDateDays: 30
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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

  // Mock printers list (in real app, this would come from system/electron)
  const availablePrinters = [
    { id: 'default', name: 'System Default Printer' },
    { id: 'hp-office', name: 'HP OfficeJet Pro 9015' },
    { id: 'canon-lbp', name: 'Canon LBP6230' },
    { id: 'epson-wf', name: 'Epson WorkForce WF-2860' },
    { id: 'pdf', name: 'Save as PDF' },
  ];

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
      status: 'PENDING',
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

  // Print invoice
  const handleAfterPrint = useCallback(async () => {
    setIsPrinting(false);
    if (selectedOrder) {
      console.log('📦 Deducting inventory for order:', selectedOrder.orderNumber);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, status: o.status }
            : o
        )
      );

      setTimeout(() => {
        setIsInvoiceModalOpen(false);
      }, 1500);
    }
  }, [selectedOrder]);

  const handlePrint = useReactToPrint({
    content: () => invoicePrintRef.current,
    documentTitle: selectedOrder ? `Invoice-${selectedOrder.orderNumber}` : 'Invoice',
    onBeforePrint: async () => setIsPrinting(true),
    onAfterPrint: handleAfterPrint,
    onPrintError: () => setIsPrinting(false),
  });

  // Handle Print - uses Electron silent print or iframe for browser
  const handleSilentPrint = useCallback(async () => {
    if (!selectedOrder || !invoicePrintRef.current) return;

    setIsPrinting(true);
    try {
      const printContent = invoicePrintRef.current;

      // Build complete HTML document with inline styles
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Invoice - ${selectedOrder.orderNumber}</title>
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
  }, [selectedOrder, printSettings, availablePrinters, handleAfterPrint]);

  // Handle Save PDF - direct download without print dialog
  const handleSavePdf = useCallback(async () => {
    if (!invoicePrintRef.current || !selectedOrder) return;

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

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Invoice-${selectedOrder.orderNumber}.pdf`);

      // Call after print handler to update order status
      await handleAfterPrint();
    } catch (error) {
      console.error('Failed to save PDF:', error);
      setIsPrinting(false);
    }
  }, [selectedOrder, handleAfterPrint]);



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
        <DialogContent>
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

      {/* Invoice Print Modal */}
      < Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen} >
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 [&>button]:hidden">
          <DialogHeader className="px-6 py-4 border-b">
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
                    <p className="text-lg font-semibold text-blue-600">{selectedOrder?.orderNumber}</p>
                    <div className="mt-4 space-y-1 text-sm">
                      <p>
                        <span className="text-gray-500">Invoice Date:</span>{' '}
                        <span className="font-medium">
                          {selectedOrder?.orderDate
                            ? new Date(selectedOrder.orderDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                            : '-'}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Due Date:</span>{' '}
                        <span className="font-medium">
                          {selectedOrder?.orderDate
                            ? new Date(
                              new Date(selectedOrder.orderDate).getTime() + 30 * 24 * 60 * 60 * 1000
                            ).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                            : '-'}
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
                  {selectedOrder?.customer ? (
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedOrder.customer}
                      </p>
                      <p className="text-sm text-gray-600">{selectedOrder.customerEmail}</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {selectedOrder.customerAddress}
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
                        {selectedOrder?.taxRate !== 0 && (
                          <th className="py-3 text-right text-sm font-semibold text-gray-700 w-20">
                            Tax
                          </th>
                        )}
                        <th className="py-3 text-right text-sm font-semibold text-gray-700 w-28">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder?.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, index) => (
                          <tr
                            key={item.id}
                            className={cn(
                              'border-b border-gray-100',
                              index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                            )}
                          >
                            <td className="py-3">
                              <p className="font-medium text-gray-900">{item.productName}</p>
                              <p className="text-sm text-gray-500">{item.sku}</p>
                            </td>
                            <td className="py-3 text-center text-gray-700">
                              {item.quantity}
                            </td>
                            <td className="py-3 text-right text-gray-700">
                              ${item.unitPrice.toFixed(2)}
                            </td>
                            {selectedOrder?.taxRate !== 0 && (
                              <td className="py-3 text-right text-gray-500 text-sm">
                                ${(item.total * ((selectedOrder?.taxRate || 0) / 100)).toFixed(2)}
                              </td>
                            )}
                            <td className="py-3 text-right font-medium text-gray-900">
                              ${item.total.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400 italic">
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
                      <span className="text-gray-900">${selectedOrder?.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedOrder && selectedOrder.taxRate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tax ({selectedOrder.taxRate}%)</span>
                        <span className="text-gray-900">${selectedOrder?.tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-blue-600">${selectedOrder?.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder?.notes && (
                  <div className="border-t border-gray-200 pt-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Notes
                      </h3>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Terms & Conditions */}
                <div className={cn(
                  "border-t border-gray-200 pt-6 space-y-4",
                  !selectedOrder?.notes && "mt-0"
                )}>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Terms & Conditions
                    </h3>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {selectedOrder?.terms || 'Default terms and conditions apply.'}
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
      </Dialog >

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

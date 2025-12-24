import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Download,
  Loader2,
  Minus,
  Package,
  Plus,
  Printer,
  Search,
  Settings2,
  Trash2,
  Warehouse,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import { cn } from '@/lib/utils';
import { useCanSkipApproval } from '@/stores/auth';
import { ordersApi, suppliersApi, warehousesApi } from '@/lib/api';
import type { Supplier, SupplierProduct } from '@/lib/api/suppliers';
import type { Warehouse as WarehouseType } from '@/lib/api/warehouses';

// Search params type
type PurchaseOrderSearch = {
  warehouse?: string;
  warehouseAddress?: string;
  productSku?: string;
};

export const Route = createFileRoute('/_dashboard/orders/purchase')({
  component: PurchaseOrdersPage,
  validateSearch: (search: Record<string, unknown>): PurchaseOrderSearch => {
    return {
      warehouse: search.warehouse as string | undefined,
      warehouseAddress: search.warehouseAddress as string | undefined,
      productSku: search.productSku as string | undefined,
    };
  },
});

// Types
type POStatus = 'PENDING' | 'ORDERED' | 'RECEIVED' | 'COMPLETED';

interface POItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  supplierId: string;
  supplierEmail: string;
  supplierAddress: string;
  destinationWarehouse: string;
  destinationAddress: string;
  items: POItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: POStatus;
  orderDate: string;
  expectedDate: string | null;
  receivedDate: string | null;
  notes: string;
}

// Helper function to format supplier address
const formatSupplierAddress = (supplier: Supplier | undefined): string => {
  if (!supplier?.address) return '';
  const { street, city, state, postalCode, country } = supplier.address;
  const parts = [street, city, state, postalCode, country].filter(Boolean);
  return parts.join(', ');
};

// Company info (this is tenant-specific, could also come from API)
const companyInfo = {
  name: 'Demo Company Ltd.',
  address: '123 Business Street, San Francisco, CA 94105',
  phone: '+1 (555) 123-4567',
  email: 'purchasing@demo-company.com',
  taxId: 'US123456789',
};

function PurchaseOrdersPage() {
  const searchParams = Route.useSearch();

  // Data states - fetched from API
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  // Loading states
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Filter states
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('');

  // Current draft PO
  const [draftItems, setDraftItems] = useState<POItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedWarehouseAddress, setSelectedWarehouseAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  // Modal states
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Print ref
  const poPrintRef = useRef<HTMLDivElement>(null);

  // Print settings state
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);
  const [printSettings, setPrintSettings] = useState({
    printer: 'default',
    colorMode: 'color' as 'color' | 'bw',
    paperSize: 'A4' as 'A4' | 'Letter' | 'Legal',
    copies: 1,
  });

  // Mock printers list (in real app, this would come from system/electron)
  const availablePrinters = useMemo(() => [
    { id: 'default', name: 'System Default Printer' },
    { id: 'hp-office', name: 'HP OfficeJet Pro 9015' },
    { id: 'canon-lbp', name: 'Canon LBP6230' },
    { id: 'epson-wf', name: 'Epson WorkForce WF-2860' },
    { id: 'pdf', name: 'Save as PDF' },
  ], []);

  // Fetch suppliers on mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setIsLoadingSuppliers(true);
        const response = await suppliersApi.list({ isActive: true });
        if (response.success && response.data) {
          setSuppliers(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch suppliers:', error);
      } finally {
        setIsLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch warehouses on mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setIsLoadingWarehouses(true);
        const response = await warehousesApi.list({ isActive: true });
        if (response.success && response.data) {
          setWarehouses(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch warehouses:', error);
      } finally {
        setIsLoadingWarehouses(false);
      }
    };
    fetchWarehouses();
  }, []);

  // Fetch products when supplier changes
  useEffect(() => {
    if (!selectedSupplierId) {
      setSupplierProducts([]);
      return;
    }

    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const response = await suppliersApi.getProducts(selectedSupplierId);
        if (response.success && response.data) {
          setSupplierProducts(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch supplier products:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [selectedSupplierId]);

  // Initialize from URL params (e.g., from inventory low stock alert)
  useEffect(() => {
    if (searchParams.warehouse && warehouses.length > 0) {
      setSelectedWarehouse(searchParams.warehouse);
      const wh = warehouses.find(w => w.name === searchParams.warehouse);
      if (wh) {
        setSelectedWarehouseAddress(wh.address || '');
      } else if (searchParams.warehouseAddress) {
        setSelectedWarehouseAddress(searchParams.warehouseAddress);
      }
    }

    // If a specific product SKU is requested, auto-add it to draft
    if (searchParams.productSku && supplierProducts.length > 0) {
      const product = supplierProducts.find(p => p.sku === searchParams.productSku);
      if (product) {
        // Auto-select supplier
        setSelectedSupplierId(product.supplierId);
        // Auto-add product to draft
        const suggestedQty = Math.max(50, product.reorderPoint * 2 - product.currentStock);
        const newItem: POItem = {
          id: `draft-${Date.now()}`,
          productId: product.productId,
          productName: product.name,
          sku: product.sku,
          quantity: suggestedQty,
          unitCost: product.cost,
          total: suggestedQty * product.cost,
        };
        setDraftItems([newItem]);
      }
      setProductSearch(searchParams.productSku);
    }
  }, [searchParams, warehouses, supplierProducts]);

  // Handle warehouse selection
  const handleWarehouseChange = (warehouseName: string) => {
    setSelectedWarehouse(warehouseName);
    const wh = warehouses.find(w => w.name === warehouseName);
    setSelectedWarehouseAddress(wh?.address || '');
  };

  // Filter products - only show products from selected supplier
  const filteredProducts = supplierProducts.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const needsReorder = item.currentStock <= item.reorderPoint;
    const matchesStock = !stockFilter ||
      (stockFilter === 'low' && needsReorder) ||
      (stockFilter === 'normal' && !needsReorder);
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Sort products - low stock first
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aLow = a.currentStock <= a.reorderPoint;
    const bLow = b.currentStock <= b.reorderPoint;
    if (aLow && !bLow) return -1;
    if (!aLow && bLow) return 1;
    return 0;
  });

  // Get unique categories from supplier's products
  const categories = [...new Set(supplierProducts.map((i) => i.category))];

  // Calculate draft totals
  const draftSubtotal = draftItems.reduce((sum, item) => sum + item.total, 0);
  const draftTotal = draftSubtotal;

  // Add item to draft
  const handleAddToDraft = (product: SupplierProduct) => {
    const existingIndex = draftItems.findIndex((i) => i.productId === product.productId);

    if (existingIndex >= 0) {
      // Increase quantity
      const currentQty = draftItems[existingIndex].quantity;
      handleUpdateQuantity(existingIndex, currentQty + 10);
    } else {
      // Add new item with suggested quantity
      const suggestedQty = Math.max(50, product.reorderPoint * 2 - product.currentStock);
      const newItem: POItem = {
        id: `draft-${Date.now()}`,
        productId: product.productId,
        productName: product.name,
        sku: product.sku,
        quantity: suggestedQty,
        unitCost: product.cost,
        total: suggestedQty * product.cost,
      };
      setDraftItems((prev) => [...prev, newItem]);
    }
  };

  // Update item quantity
  const handleUpdateQuantity = (index: number, quantity: number) => {
    const qty = Math.max(1, quantity);

    setDraftItems((prev) => {
      const items = [...prev];
      items[index] = {
        ...items[index],
        quantity: qty,
        total: qty * items[index].unitCost,
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
    setSelectedSupplierId('');
    setSelectedWarehouse('');
    setSelectedWarehouseAddress('');
    setOrderNotes('');
    setExpectedDate('');
  };

  // Generate PO number
  const generatePONumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    return `PO-${year}${month}-${random}`;
  };

  // Check if user can skip approval workflow
  const canSkipApproval = useCanSkipApproval();

  // Create PO from draft
  const handleCreatePO = async () => {
    if (!selectedSupplierId || !selectedWarehouse || draftItems.length === 0) return;

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);

    const newOrder: PurchaseOrder = {
      id: String(orders.length + 1),
      orderNumber: generatePONumber(),
      supplier: supplier?.name || '',
      supplierId: selectedSupplierId,
      supplierEmail: supplier?.email || '',
      supplierAddress: formatSupplierAddress(supplier),
      destinationWarehouse: selectedWarehouse,
      destinationAddress: selectedWarehouseAddress,
      items: draftItems,
      subtotal: draftSubtotal,
      tax: 0,
      shipping: 0,
      total: draftTotal,
      status: canSkipApproval ? 'ORDERED' : 'PENDING',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: expectedDate || null,
      receivedDate: null,
      notes: orderNotes,
    };

    setOrders((prev) => [newOrder, ...prev]);
    handleClearDraft();
    setIsSaving(false);

    // Open PO print modal for the new order
    setSelectedOrder(newOrder);
    setIsPOModalOpen(true);
  };

  // Print PO
  const handleAfterPrint = useCallback(async () => {
    setIsPrinting(false);
    if (selectedOrder) {
      console.log('📄 PO printed:', selectedOrder.orderNumber);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, status: o.status }
            : o
        )
      );

      setTimeout(() => {
        setIsPOModalOpen(false);
      }, 1500);
    }
  }, [selectedOrder]);

  // Handle Print - uses Electron silent print or iframe for browser
  const handleSilentPrint = useCallback(async () => {
    if (!selectedOrder || !poPrintRef.current) return;

    setIsPrinting(true);
    try {
      const printContent = poPrintRef.current;

      // Build complete HTML document with inline styles
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Purchase Order - ${selectedOrder.orderNumber}</title>
            <style>
              @page { size: A4; margin: 15mm; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px; line-height: 1.5; color: #000; background: #fff;
                -webkit-print-color-adjust: exact; print-color-adjust: exact;
              }
              .po-container { padding: 20px; background: white; }
              .flex { display: flex; } .items-start { align-items: flex-start; }
              .items-center { align-items: center; } .justify-between { justify-content: space-between; }
              .justify-end { justify-content: flex-end; } .gap-2 { gap: 8px; } .gap-6 { gap: 24px; }
              .mb-1 { margin-bottom: 4px; } .mb-2 { margin-bottom: 8px; } .mb-4 { margin-bottom: 16px; }
              .mb-8 { margin-bottom: 32px; } .mt-4 { margin-top: 16px; } .mt-12 { margin-top: 48px; }
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
              .bg-gray-50 { background-color: #f9fafb; } .bg-blue-50 { background-color: #eff6ff; }
              .rounded-lg { border-radius: 8px; }
              .border { border: 1px solid #e5e7eb; } .border-t { border-top: 1px solid #e5e7eb; }
              .border-b { border-bottom: 1px solid #e5e7eb; } .border-b-2 { border-bottom: 2px solid #e5e7eb; }
              .border-gray-100 { border-color: #f3f4f6; } .border-gray-200 { border-color: #e5e7eb; }
              .border-blue-200 { border-color: #bfdbfe; }
              table { border-collapse: collapse; width: 100%; } th, td { padding: 12px 8px; }
              .h-10 { height: 40px; } .w-10 { width: 40px; } .h-6 { height: 24px; } .w-6 { width: 24px; }
              .logo-box { height: 40px; width: 40px; background-color: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
              .logo-box svg { height: 24px; width: 24px; color: white; }
            </style>
          </head>
          <body>
            <div class="po-container">${printContent.innerHTML}</div>
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
    if (!poPrintRef.current || !selectedOrder) return;

    setIsPrinting(true);
    try {
      const element = poPrintRef.current;
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
      pdf.save(`PurchaseOrder-${selectedOrder.orderNumber}.pdf`);

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
        title="Purchase Orders"
        description="Select products to create purchase orders"
        actions={
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return
          </Button>
        }
      />

      {/* URL Param Notification */}
      {searchParams.warehouse && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
          <div className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900 dark:text-blue-100">
              Creating PO for: {searchParams.warehouse}
            </span>
            {searchParams.productSku && (
              <span className="text-sm text-blue-700 dark:text-blue-300">
                - Product: {searchParams.productSku}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Low Stock Alert */}


      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2 flex-1 min-h-0">
        {/* Left Column - Supplier Selection & Products */}
        <div className="h-full flex flex-col min-h-0">
          <DashboardCard className="h-full flex flex-col overflow-hidden [&>div:last-child]:flex-1 [&>div:last-child]:flex [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden">
            {/* Supplier Selection */}
            <div className="mb-4 flex-shrink-0">
              <Label className="text-sm mb-2 block font-semibold flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-blue-600" />
                Select Supplier
                {isLoadingSuppliers && <Loader2 className="h-3 w-3 animate-spin" />}
              </Label>
              <FilterSelect
                value={selectedSupplierId}
                onChange={(val) => {
                  setSelectedSupplierId(val);
                  // Clear filters when supplier changes
                  setCategoryFilter('');
                  setProductSearch('');
                }}
                options={[
                  ...suppliers.map((s) => ({ value: s.id, label: s.name })),
                ]}
                placeholder={isLoadingSuppliers ? "Loading suppliers..." : "Select supplier..."}
                className="w-full"
                disabled={isLoadingSuppliers}
              />
            </div>

            {/* Products Header - only show when supplier is selected */}
            {selectedSupplierId && (
              <>
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    Available Products
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {filteredProducts.length} products
                  </span>
                </div>

                {/* Search and filter */}
                <div className="flex gap-2 mb-4 flex-wrap flex-shrink-0">
                  <div className="relative flex-1 min-w-[150px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="search"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
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
                  <FilterSelect
                    value={stockFilter || 'all'}
                    onChange={(val) => setStockFilter(val === 'all' ? '' : val)}
                    options={[
                      { value: 'all', label: 'All Stock' },
                      { value: 'low', label: 'Low Stock' },
                      { value: 'normal', label: 'Normal' },
                    ]}
                    placeholder="All Stock"
                    className="w-auto"
                  />
                </div>
              </>
            )}

            {/* Product list - show only when supplier is selected */}
            <ScrollArea className="flex-1 -mr-3 pr-3">
              {!selectedSupplierId ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Warehouse className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Select a supplier to view available products
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Products will be displayed based on your supplier selection
                  </p>
                </div>
              ) : isLoadingProducts ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="h-12 w-12 text-muted-foreground/40 mb-4 animate-spin" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Loading products...
                  </p>
                </div>
              ) : sortedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <p className="text-sm text-muted-foreground font-medium">
                    No products found
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedProducts.map((item) => {
                    const inDraft = draftItems.find((d) => d.productId === item.productId);
                    const needsReorder = item.currentStock <= item.reorderPoint;

                    return (
                      <div
                        key={item.productId}
                        className={cn(
                          'flex items-center justify-between rounded-lg border p-3 transition-colors',
                          inDraft && 'border-primary bg-primary/5',
                          needsReorder && !inDraft && 'border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{item.name}</p>
                            {needsReorder && (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                                ⚠️ Low
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{item.sku}</span>
                            <span>•</span>
                            <span className={needsReorder ? 'text-amber-600' : ''}>
                              Stock: {item.currentStock} / Reorder: {item.reorderPoint}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">${item.cost.toFixed(2)}</span>
                          {inDraft ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon-sm"
                                variant="outline"
                                onClick={() => {
                                  const idx = draftItems.findIndex((d) => d.productId === item.productId);
                                  if (inDraft.quantity > 10) {
                                    handleUpdateQuantity(idx, inDraft.quantity - 10);
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
                                value={inDraft.quantity}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const idx = draftItems.findIndex((d) => d.productId === item.productId);
                                  handleUpdateQuantity(idx, parseInt(e.target.value) || 1);
                                }}
                                className="h-7 w-16 text-center text-sm"
                              />
                              <Button
                                size="icon-sm"
                                variant="outline"
                                onClick={() => {
                                  const idx = draftItems.findIndex((d) => d.productId === item.productId);
                                  handleUpdateQuantity(idx, inDraft.quantity + 10);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant={needsReorder ? 'default' : 'outline'}
                              onClick={() => handleAddToDraft(item)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Order
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </DashboardCard>
        </div>

        {/* Right Column - Current PO & PO List */}
        <div className="h-full flex flex-col min-h-0">
          {/* Current Draft PO */}
          <DashboardCard className="h-full flex flex-col overflow-hidden [&>div:last-child]:flex-1 [&>div:last-child]:flex [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="font-semibold flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-green-600" />
                Current Purchase Order
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

            {/* Destination Warehouse Selection */}
            <div className="mb-4 flex-shrink-0">
              <Label className="text-sm mb-2 block flex items-center gap-2">
                Destination Warehouse
                {isLoadingWarehouses && <Loader2 className="h-3 w-3 animate-spin" />}
              </Label>
              <FilterSelect
                value={selectedWarehouse}
                onChange={handleWarehouseChange}
                options={warehouses.map((w) => ({ value: w.name, label: w.name }))}
                placeholder={isLoadingWarehouses ? "Loading warehouses..." : "Select warehouse..."}
                className="w-full"
                disabled={isLoadingWarehouses}
              />

            </div>

            {/* Draft Items */}
            {/* Draft Items Area - Always rendered with flex-1 */}
            <div className="flex-1 min-h-0 mb-4 flex flex-col">
              {draftItems.length === 0 ? (
                <div className="flex-1 rounded-lg border border-dashed p-8 text-center flex flex-col justify-center items-center">
                  <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click <strong>Order</strong> on products to add them
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Low stock items are highlighted in amber
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
                            ${item.unitCost.toFixed(2)} × {item.quantity}
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

            <div className="flex-shrink-0 space-y-4">
              {/* Shipping */}


              {/* Order Summary */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({draftItems.length} items)</span>
                  <span>${draftSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-lg">${draftTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleCreatePO}
                  disabled={!selectedSupplierId || !selectedWarehouse || draftItems.length === 0 || isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  {isSaving ? 'Creating...' : 'Create PO'}
                </Button>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Print PO Modal */}
      <Dialog open={isPOModalOpen} onOpenChange={setIsPOModalOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 [&>button]:hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Print Purchase Order</DialogTitle>
                <DialogDescription>
                  {selectedOrder?.orderNumber} - {selectedOrder?.supplier}
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
              {/* Printable PO - A4 Paper Size Preview */}
              <div
                ref={poPrintRef}
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

                  {/* PO Title & Number */}
                  <div className="text-right">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">PURCHASE ORDER</h1>
                    <p className="text-lg font-semibold text-blue-600">{selectedOrder?.orderNumber}</p>
                    <div className="mt-4 space-y-1 text-sm">
                      <p>
                        <span className="text-gray-500">Order Date:</span>{' '}
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
                      {selectedOrder?.expectedDate && (
                        <p>
                          <span className="text-gray-500">Expected Date:</span>{' '}
                          <span className="font-medium">
                            {new Date(selectedOrder.expectedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-gray-200 my-6" />

                {/* Two Column: Vendor & Ship To */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {/* Vendor Info */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Vendor
                    </h2>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-gray-900">{selectedOrder?.supplier}</p>
                      <p className="text-sm text-gray-600">{selectedOrder?.supplierEmail}</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {selectedOrder?.supplierAddress}
                      </p>
                    </div>
                  </div>

                  {/* Ship To (Destination Warehouse) */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Ship To
                    </h2>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-gray-900">{selectedOrder?.destinationWarehouse}</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {selectedOrder?.destinationAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="mb-8">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="py-3 text-left text-sm font-semibold text-gray-700">
                          Description
                        </th>
                        <th className="py-3 text-left text-sm font-semibold text-gray-700 w-28">
                          SKU
                        </th>
                        <th className="py-3 text-center text-sm font-semibold text-gray-700 w-20">
                          Qty
                        </th>
                        <th className="py-3 text-right text-sm font-semibold text-gray-700 w-28">
                          Unit Cost
                        </th>
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
                            </td>
                            <td className="py-3 text-sm text-gray-500">{item.sku}</td>
                            <td className="py-3 text-center text-gray-700">
                              {item.quantity}
                            </td>
                            <td className="py-3 text-right text-gray-700">
                              ${item.unitCost.toFixed(2)}
                            </td>
                            <td className="py-3 text-right font-medium text-gray-900">
                              ${item.total.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                            No items in this order
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

                {/* Delivery Instructions */}
                <div className={cn(
                  "border-t border-gray-200 pt-6 space-y-4",
                  !selectedOrder?.notes && "mt-0"
                )}>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Delivery Instructions
                    </h3>
                    <p className="text-sm text-gray-600">
                      Please deliver all items to: <strong>{selectedOrder?.destinationWarehouse}</strong>
                    </p>
                    <p className="text-sm text-gray-600">{selectedOrder?.destinationAddress}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Contact: {companyInfo.phone} | {companyInfo.email}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-500">
                    Thank you for your partnership!
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsPOModalOpen(false)}>
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
              {isPrinting ? 'Processing...' : printSettings.printer === 'pdf' ? 'Save PDF' : 'Print PO'}
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
      </Dialog >
    </PageContainer >
  );
}

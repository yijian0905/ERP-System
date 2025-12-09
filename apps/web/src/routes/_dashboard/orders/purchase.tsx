import { createFileRoute, Link } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
  ClipboardList,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  Printer,
  Search,
  Trash2,
  Warehouse,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { cn } from '@/lib/utils';

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
type POStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED';

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

// Mock product types - these are created via "Add Product" in inventory
const mockProductTypes = [
  { id: 'p1', sku: 'ELEC-001', name: 'Wireless Mouse', cost: 15.00, category: 'Electronics', currentStock: 140, reorderPoint: 50 },
  { id: 'p2', sku: 'ELEC-002', name: 'Mechanical Keyboard', cost: 45.00, category: 'Electronics', currentStock: 5, reorderPoint: 15 },
  { id: 'p3', sku: 'ELEC-003', name: 'USB-C Hub', cost: 25.00, category: 'Electronics', currentStock: 185, reorderPoint: 50 },
  { id: 'p4', sku: 'OFFC-001', name: 'A4 Copy Paper (Ream)', cost: 4.50, category: 'Office Supplies', currentStock: 450, reorderPoint: 200 },
  { id: 'p5', sku: 'FURN-001', name: 'Ergonomic Chair', cost: 150.00, category: 'Furniture', currentStock: 20, reorderPoint: 10 },
  { id: 'p6', sku: 'OFFC-002', name: 'Printer Ink Black', cost: 35.00, category: 'Office Supplies', currentStock: 12, reorderPoint: 25 },
];

const mockSuppliers = [
  { id: 's1', name: 'Tech Supplies Inc', email: 'orders@techsupplies.com', address: '100 Tech Drive, San Jose, CA 95101' },
  { id: 's2', name: 'Office Depot', email: 'b2b@officedepot.com', address: '200 Office Blvd, Miami, FL 33101' },
  { id: 's3', name: 'Electronics Wholesale', email: 'sales@elecwholesale.com', address: '300 Circuit Ave, Austin, TX 78701' },
  { id: 's4', name: 'Furniture World', email: 'orders@furnitureworld.com', address: '400 Furniture Lane, Portland, OR 97201' },
  { id: 's5', name: 'Global Parts Ltd', email: 'procurement@globalparts.com', address: '500 Global Way, Seattle, WA 98101' },
];

const warehouseData = [
  { name: 'Main Warehouse', address: '123 Industrial Ave, New York, NY 10001' },
  { name: 'Secondary Warehouse', address: '456 Storage Blvd, Brooklyn, NY 11201' },
  { name: 'Downtown Retail Store', address: '789 Main Street, Manhattan, NY 10013' },
];

const mockOrders: PurchaseOrder[] = [
  {
    id: '1',
    orderNumber: 'PO-2312-00023',
    supplier: 'Tech Supplies Inc',
    supplierId: 's1',
    supplierEmail: 'orders@techsupplies.com',
    supplierAddress: '100 Tech Drive, San Jose, CA 95101',
    destinationWarehouse: 'Main Warehouse',
    destinationAddress: '123 Industrial Ave, New York, NY 10001',
    items: [
      { id: 'i1', productId: 'p1', productName: 'Wireless Mouse', sku: 'ELEC-001', quantity: 100, unitCost: 15.00, total: 1500.00 },
      { id: 'i2', productId: 'p2', productName: 'Mechanical Keyboard', sku: 'ELEC-002', quantity: 50, unitCost: 45.00, total: 2250.00 },
    ],
    subtotal: 3750.00,
    tax: 337.50,
    shipping: 75.00,
    total: 4162.50,
    status: 'RECEIVED',
    orderDate: '2024-12-05',
    expectedDate: '2024-12-10',
    receivedDate: '2024-12-07',
    notes: '',
  },
  {
    id: '2',
    orderNumber: 'PO-2312-00022',
    supplier: 'Office Depot',
    supplierId: 's2',
    supplierEmail: 'b2b@officedepot.com',
    supplierAddress: '200 Office Blvd, Miami, FL 33101',
    destinationWarehouse: 'Secondary Warehouse',
    destinationAddress: '456 Storage Blvd, Brooklyn, NY 11201',
    items: [
      { id: 'i3', productId: 'p4', productName: 'A4 Copy Paper (Ream)', sku: 'OFFC-001', quantity: 500, unitCost: 4.50, total: 2250.00 },
    ],
    subtotal: 2250.00,
    tax: 202.50,
    shipping: 50.00,
    total: 2502.50,
    status: 'PENDING',
    orderDate: '2024-12-06',
    expectedDate: '2024-12-15',
    receivedDate: null,
    notes: 'Bulk order for Q1',
  },
  {
    id: '3',
    orderNumber: 'PO-2312-00021',
    supplier: 'Electronics Wholesale',
    supplierId: 's3',
    supplierEmail: 'sales@elecwholesale.com',
    supplierAddress: '300 Circuit Ave, Austin, TX 78701',
    destinationWarehouse: 'Main Warehouse',
    destinationAddress: '123 Industrial Ave, New York, NY 10001',
    items: [
      { id: 'i4', productId: 'p3', productName: 'USB-C Hub', sku: 'ELEC-003', quantity: 200, unitCost: 25.00, total: 5000.00 },
    ],
    subtotal: 5000.00,
    tax: 450.00,
    shipping: 100.00,
    total: 5550.00,
    status: 'ORDERED',
    orderDate: '2024-12-04',
    expectedDate: '2024-12-12',
    receivedDate: null,
    notes: '',
  },
  {
    id: '4',
    orderNumber: 'PO-2312-00020',
    supplier: 'Furniture World',
    supplierId: 's4',
    supplierEmail: 'orders@furnitureworld.com',
    supplierAddress: '400 Furniture Lane, Portland, OR 97201',
    destinationWarehouse: 'Downtown Retail Store',
    destinationAddress: '789 Main Street, Manhattan, NY 10013',
    items: [
      { id: 'i5', productId: 'p5', productName: 'Ergonomic Chair', sku: 'FURN-001', quantity: 20, unitCost: 150.00, total: 3000.00 },
    ],
    subtotal: 3000.00,
    tax: 270.00,
    shipping: 200.00,
    total: 3470.00,
    status: 'PARTIAL',
    orderDate: '2024-12-01',
    expectedDate: '2024-12-08',
    receivedDate: null,
    notes: '10 chairs received, 10 pending',
  },
];

// Company info
const companyInfo = {
  name: 'Demo Company Ltd.',
  address: '123 Business Street, San Francisco, CA 94105',
  phone: '+1 (555) 123-4567',
  email: 'purchasing@demo-company.com',
  taxId: 'US123456789',
};

function PurchaseOrdersPage() {
  const searchParams = Route.useSearch();
  const [orders, setOrders] = useState<PurchaseOrder[]>(mockOrders);
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
  const [shippingCost, setShippingCost] = useState(0);
  
  // Modal states
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Print ref
  const poPrintRef = useRef<HTMLDivElement>(null);

  // Initialize from URL params (e.g., from inventory low stock alert)
  useEffect(() => {
    if (searchParams.warehouse) {
      setSelectedWarehouse(searchParams.warehouse);
      const wh = warehouseData.find(w => w.name === searchParams.warehouse);
      if (wh) {
        setSelectedWarehouseAddress(wh.address);
      } else if (searchParams.warehouseAddress) {
        setSelectedWarehouseAddress(searchParams.warehouseAddress);
      }
    }
    
    // If a specific product SKU is requested, highlight or filter it
    if (searchParams.productSku) {
      setProductSearch(searchParams.productSku);
      setStockFilter('low');
    }
  }, [searchParams]);

  // Handle warehouse selection
  const handleWarehouseChange = (warehouseName: string) => {
    setSelectedWarehouse(warehouseName);
    const wh = warehouseData.find(w => w.name === warehouseName);
    setSelectedWarehouseAddress(wh?.address || '');
  };

  // Filter products
  const filteredProducts = mockProductTypes.filter((item) => {
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

  // Get unique categories
  const categories = [...new Set(mockProductTypes.map((i) => i.category))];

  // Calculate draft totals
  const draftSubtotal = draftItems.reduce((sum, item) => sum + item.total, 0);
  const draftTax = draftSubtotal * 0.09;
  const draftTotal = draftSubtotal + draftTax + shippingCost;

  // Add item to draft
  const handleAddToDraft = (product: typeof mockProductTypes[0]) => {
    const existingIndex = draftItems.findIndex((i) => i.productId === product.id);
    
    if (existingIndex >= 0) {
      // Increase quantity
      const currentQty = draftItems[existingIndex].quantity;
      handleUpdateQuantity(existingIndex, currentQty + 10);
    } else {
      // Add new item with suggested quantity
      const suggestedQty = Math.max(50, product.reorderPoint * 2 - product.currentStock);
      const newItem: POItem = {
        id: `draft-${Date.now()}`,
        productId: product.id,
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
    setShippingCost(0);
  };

  // Generate PO number
  const generatePONumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    return `PO-${year}${month}-${random}`;
  };

  // Create PO from draft
  const handleCreatePO = async () => {
    if (!selectedSupplierId || !selectedWarehouse || draftItems.length === 0) return;
    
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const supplier = mockSuppliers.find((s) => s.id === selectedSupplierId);

    const newOrder: PurchaseOrder = {
      id: String(orders.length + 1),
      orderNumber: generatePONumber(),
      supplier: supplier?.name || '',
      supplierId: selectedSupplierId,
      supplierEmail: supplier?.email || '',
      supplierAddress: supplier?.address || '',
      destinationWarehouse: selectedWarehouse,
      destinationAddress: selectedWarehouseAddress,
      items: draftItems,
      subtotal: draftSubtotal,
      tax: draftTax,
      shipping: shippingCost,
      total: draftTotal,
      status: 'DRAFT',
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
            ? { ...o, status: o.status === 'DRAFT' ? 'PENDING' : o.status }
            : o
        )
      );
      
      setTimeout(() => {
        setIsPOModalOpen(false);
      }, 1500);
    }
  }, [selectedOrder]);

  const handlePrint = useReactToPrint({
    content: () => poPrintRef.current,
    documentTitle: selectedOrder ? `PurchaseOrder-${selectedOrder.orderNumber}` : 'PurchaseOrder',
    onBeforePrint: async () => setIsPrinting(true),
    onAfterPrint: handleAfterPrint,
    onPrintError: () => setIsPrinting(false),
  });

  const selectedSupplier = mockSuppliers.find((s) => s.id === selectedSupplierId);
  const lowStockCount = mockProductTypes.filter((p) => p.currentStock <= p.reorderPoint).length;

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Orders"
        description="Select products to create purchase orders"
        actions={
          <Link to="/orders">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
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
      {lowStockCount > 0 && !searchParams.warehouse && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-amber-900 dark:text-amber-100">
              {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} below reorder point
            </span>
            <span className="text-sm text-amber-700 dark:text-amber-300">
              - These are highlighted in the list below
            </span>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Product Types */}
        <div className="space-y-4">
          <DashboardCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                Product Types
              </h3>
              <span className="text-sm text-muted-foreground">
                {filteredProducts.length} products
              </span>
            </div>
            
            {/* Search and filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
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
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All Stock</option>
                <option value="low">Low Stock</option>
                <option value="normal">Normal</option>
              </select>
            </div>

            {/* Product list */}
            <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
              <div className="space-y-2">
                {sortedProducts.map((item) => {
                  const inDraft = draftItems.find((d) => d.productId === item.id);
                  const needsReorder = item.currentStock <= item.reorderPoint;
                  
                  return (
                    <div
                      key={item.id}
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
                                const idx = draftItems.findIndex((d) => d.productId === item.id);
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
                                const idx = draftItems.findIndex((d) => d.productId === item.id);
                                handleUpdateQuantity(idx, parseInt(e.target.value) || 1);
                              }}
                              className="h-7 w-16 text-center text-sm"
                            />
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => {
                                const idx = draftItems.findIndex((d) => d.productId === item.id);
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
            </ScrollArea>
          </DashboardCard>
        </div>

        {/* Right Column - Current PO & PO List */}
        <div className="space-y-4">
          {/* Current Draft PO */}
          <DashboardCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-green-600" />
                Current Purchase Order
              </h3>
              {draftItems.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearDraft}>
                  Clear All
                </Button>
              )}
            </div>

            {/* Supplier Selection */}
            <div className="mb-4">
              <Label className="text-sm mb-2 block">Supplier</Label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select supplier...</option>
                {mockSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {selectedSupplier && (
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {selectedSupplier.email}
                </p>
              )}
            </div>

            {/* Destination Warehouse Selection */}
            <div className="mb-4">
              <Label className="text-sm mb-2 block">Destination Warehouse</Label>
              <select
                value={selectedWarehouse}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select warehouse...</option>
                {warehouseData.map((w) => (
                  <option key={w.name} value={w.name}>{w.name}</option>
                ))}
              </select>
              {selectedWarehouse && selectedWarehouseAddress && (
                <div className="mt-2 rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{selectedWarehouseAddress}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Draft Items */}
            {draftItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click <strong>Order</strong> on products to add them
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Low stock items are highlighted in amber
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[calc(100vh-720px)] min-h-[120px] mb-4">
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

                {/* Shipping */}
                <div className="flex items-center gap-2 mb-4">
                  <Label className="text-sm flex-shrink-0">Shipping:</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingCost || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    className="h-8 w-24"
                    placeholder="0.00"
                  />
                </div>

                {/* Order Summary */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({draftItems.length} items)</span>
                    <span>${draftSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (9%)</span>
                    <span>${draftTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-lg">${draftTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleCreatePO}
                    disabled={!selectedSupplierId || !selectedWarehouse || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    {isSaving ? 'Creating...' : 'Create PO'}
                  </Button>
                </div>
              </>
            )}
          </DashboardCard>
        </div>
      </div>

      {/* Print PO Modal */}
      <Dialog open={isPOModalOpen} onOpenChange={setIsPOModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Print Purchase Order</DialogTitle>
                <DialogDescription>
                  {selectedOrder?.orderNumber} - {selectedOrder?.supplier}
                </DialogDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsPOModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* Printable PO */}
              <div ref={poPrintRef} className="bg-white p-8 rounded-lg shadow-lg">
                {/* PO Header */}
                <div className="flex justify-between mb-8">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{companyInfo.name}</h1>
                    <p className="text-gray-600">{companyInfo.address}</p>
                    <p className="text-gray-600">{companyInfo.phone}</p>
                    <p className="text-gray-600">{companyInfo.email}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-bold text-gray-900">PURCHASE ORDER</h2>
                    <p className="text-gray-600 mt-2">PO #: {selectedOrder?.orderNumber}</p>
                    <p className="text-gray-600">Date: {selectedOrder?.orderDate}</p>
                    {selectedOrder?.expectedDate && (
                      <p className="text-gray-600">Expected: {selectedOrder.expectedDate}</p>
                    )}
                  </div>
                </div>

                {/* Two Column: Vendor & Ship To */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {/* Vendor Info */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Vendor:</h3>
                    <p className="font-medium">{selectedOrder?.supplier}</p>
                    <p className="text-gray-600">{selectedOrder?.supplierAddress}</p>
                    <p className="text-gray-600">{selectedOrder?.supplierEmail}</p>
                  </div>

                  {/* Ship To (Destination Warehouse) */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Ship To:</h3>
                    <p className="font-medium">{selectedOrder?.destinationWarehouse}</p>
                    <p className="text-gray-600">{selectedOrder?.destinationAddress}</p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2 text-gray-900">Item</th>
                      <th className="text-left py-2 text-gray-900">SKU</th>
                      <th className="text-right py-2 text-gray-900">Qty</th>
                      <th className="text-right py-2 text-gray-900">Unit Cost</th>
                      <th className="text-right py-2 text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder?.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-3 text-gray-900">{item.productName}</td>
                        <td className="py-3 text-gray-600">{item.sku}</td>
                        <td className="py-3 text-right text-gray-900">{item.quantity}</td>
                        <td className="py-3 text-right text-gray-900">${item.unitCost.toFixed(2)}</td>
                        <td className="py-3 text-right text-gray-900">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900">${selectedOrder?.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-gray-900">${selectedOrder?.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="text-gray-900">${selectedOrder?.shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t-2 border-gray-300 font-bold">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">${selectedOrder?.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder?.notes && (
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
                    <p className="text-gray-600">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-4 border-t text-center text-gray-500 text-sm">
                  <p>Please deliver items to: <strong>{selectedOrder?.destinationWarehouse}</strong></p>
                  <p>{selectedOrder?.destinationAddress}</p>
                  <p className="mt-2">Contact: {companyInfo.phone} | {companyInfo.email}</p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsPOModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handlePrint()} disabled={isPrinting}>
              {isPrinting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              {isPrinting ? 'Printing...' : 'Print PO'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

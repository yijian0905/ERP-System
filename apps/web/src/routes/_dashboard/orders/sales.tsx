import { createFileRoute, Link } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Loader2,
  Minus,
  Package,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
  User,
  X,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/orders/sales')({
  component: SalesOrdersPage,
});

// Types
type OrderStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

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
  const [orderNotes, setOrderNotes] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  
  // Modal states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Print ref
  const invoicePrintRef = useRef<HTMLDivElement>(null);

  // Filter inventory
  const filteredInventory = mockInventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(mockInventoryItems.map((i) => i.category))];

  // Calculate draft totals
  const draftSubtotal = draftItems.reduce((sum, item) => sum + item.total, 0);
  const draftTax = draftSubtotal * 0.09;
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
    setOrderNotes('');
    setExpectedDate('');
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
      status: 'DRAFT',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: expectedDate || null,
      shippedDate: null,
      notes: orderNotes,
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
            ? { ...o, status: o.status === 'DRAFT' ? 'PENDING' : o.status }
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

  const selectedCustomer = mockCustomers.find((c) => c.id === selectedCustomerId);

  return (
    <PageContainer>
      <PageHeader
        title="Sales Orders"
        description="Select inventory items to create sales orders"
        actions={
          <Link to="/orders">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
        }
      />

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Inventory Items */}
        <div className="space-y-4">
          <DashboardCard>
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
            </div>

            {/* Inventory list */}
            <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px]">
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
        <div className="space-y-4">
          {/* Current Draft Order */}
          <DashboardCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                Current Order
              </h3>
              {draftItems.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearDraft}>
                  Clear All
                </Button>
              )}
            </div>

            {/* Customer Selection */}
            <div className="mb-4">
              <Label className="text-sm mb-2 block">Customer</Label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select customer...</option>
                {mockCustomers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {selectedCustomer && (
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {selectedCustomer.email}
                </p>
              )}
            </div>

            {/* Draft Items */}
            {draftItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click <Plus className="inline h-4 w-4" /> on items to add them
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[calc(100vh-580px)] min-h-[200px] mb-4">
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
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-lg">${draftTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleCreateOrder}
                    disabled={!selectedCustomerId || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    {isSaving ? 'Creating...' : 'Create Order'}
                  </Button>
                </div>
              </>
            )}
          </DashboardCard>
        </div>
      </div>

      {/* Invoice Print Modal */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Print Invoice</DialogTitle>
                <DialogDescription>
                  {selectedOrder?.orderNumber} - {selectedOrder?.customer}
                </DialogDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsInvoiceModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* Printable Invoice */}
              <div ref={invoicePrintRef} className="bg-white p-8 rounded-lg shadow-lg">
                {/* Invoice Header */}
                <div className="flex justify-between mb-8">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{companyInfo.name}</h1>
                    <p className="text-gray-600">{companyInfo.address}</p>
                    <p className="text-gray-600">{companyInfo.phone}</p>
                    <p className="text-gray-600">{companyInfo.email}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
                    <p className="text-gray-600 mt-2">Invoice #: {selectedOrder?.orderNumber}</p>
                    <p className="text-gray-600">Date: {selectedOrder?.orderDate}</p>
                    <p className="text-gray-600">Tax ID: {companyInfo.taxId}</p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                  <p className="font-medium">{selectedOrder?.customer}</p>
                  <p className="text-gray-600">{selectedOrder?.customerAddress}</p>
                  <p className="text-gray-600">{selectedOrder?.customerEmail}</p>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2 text-gray-900">Item</th>
                      <th className="text-left py-2 text-gray-900">SKU</th>
                      <th className="text-right py-2 text-gray-900">Qty</th>
                      <th className="text-right py-2 text-gray-900">Price</th>
                      <th className="text-right py-2 text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder?.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-3 text-gray-900">{item.productName}</td>
                        <td className="py-3 text-gray-600">{item.sku}</td>
                        <td className="py-3 text-right text-gray-900">{item.quantity}</td>
                        <td className="py-3 text-right text-gray-900">${item.unitPrice.toFixed(2)}</td>
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
                  <p>Thank you for your business!</p>
                  <p>Payment is due within 30 days of invoice date.</p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handlePrint()} disabled={isPrinting}>
              {isPrinting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              {isPrinting ? 'Printing...' : 'Print Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

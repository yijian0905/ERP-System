import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ClipboardList,
  Loader2,
  Package,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  Warehouse,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/inventory/')({
  component: InventoryPage,
});

// Types
type AdjustmentType = 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER';

// Stock In Reasons
type StockInReason = 'PURCHASE_ORDER' | 'CUSTOMER_RETURN' | 'LOST_RECOVERY';
const stockInReasons: { value: StockInReason; label: string; description: string; icon: typeof PackageCheck }[] = [
  { value: 'PURCHASE_ORDER', label: 'Purchase Order Received', description: 'Receive items from a purchase order', icon: PackageCheck },
  { value: 'CUSTOMER_RETURN', label: 'Customer Return', description: 'Items returned by customer', icon: RotateCcw },
  { value: 'LOST_RECOVERY', label: 'Lost Recovery', description: 'Previously lost items found', icon: Search },
];


// Stock Out Reasons
type StockOutReason = 'SALES_ORDER' | 'DAMAGE' | 'EXPIRED' | 'LOST' | 'SAMPLE';
const stockOutReasons: { value: StockOutReason; label: string; description: string; icon: typeof Trash2 }[] = [
  { value: 'SALES_ORDER', label: 'Sales Order Fulfilled', description: 'Ship items for a sales order', icon: ShoppingCart },
  { value: 'DAMAGE', label: 'Damaged/Defective', description: 'Items damaged or defective', icon: Trash2 },
  { value: 'EXPIRED', label: 'Expired', description: 'Items past expiration date', icon: AlertTriangle },
  { value: 'LOST', label: 'Lost/Missing', description: 'Items not found in inventory', icon: Search },
  { value: 'SAMPLE', label: 'Sample/Demo', description: 'Items used for samples or demos', icon: Package },
];



// Modal step type
type ModalStep = 'reason' | 'template' | 'confirm';

// Purchase Order types for Stock In integration
type POStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED';

interface POItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  destinationWarehouse: string;
  items: POItem[];
  status: POStatus;
  orderDate: string;
  expectedDate: string | null;
}

// Sales Order types for Stock Out integration
type SOStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

interface SOItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  shippedQuantity: number;
  unitPrice: number;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  customer: string;
  sourceWarehouse: string;
  items: SOItem[];
  status: SOStatus;
  orderDate: string;
  expectedDate: string | null;
}

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  warehouse: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  unitCost: number;
  lastUpdated: string;
}

interface WarehouseLowStockAlert {
  warehouse: string;
  warehouseAddress: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  totalStockAcrossWarehouses: number;
  canTransferFrom: { warehouse: string; available: number }[];
}

// Mock data
const mockInventory: InventoryItem[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Wireless Mouse',
    sku: 'ELEC-001',
    category: 'Electronics',
    warehouse: 'Main Warehouse',
    quantity: 150,
    reservedQty: 10,
    availableQty: 140,
    minStock: 20,
    maxStock: 500,
    reorderPoint: 50,
    unitCost: 15.00,
    lastUpdated: '2024-12-07T10:30:00Z',
  },
  {
    id: '2',
    productId: '2',
    productName: 'Mechanical Keyboard',
    sku: 'ELEC-002',
    category: 'Electronics',
    warehouse: 'Main Warehouse',
    quantity: 8,
    reservedQty: 3,
    availableQty: 5,
    minStock: 10,
    maxStock: 200,
    reorderPoint: 15,
    unitCost: 45.00,
    lastUpdated: '2024-12-07T09:15:00Z',
  },
  {
    id: '3',
    productId: '3',
    productName: 'A4 Copy Paper',
    sku: 'OFFC-001',
    category: 'Office Supplies',
    warehouse: 'Main Warehouse',
    quantity: 500,
    reservedQty: 50,
    availableQty: 450,
    minStock: 100,
    maxStock: 2000,
    reorderPoint: 200,
    unitCost: 4.50,
    lastUpdated: '2024-12-06T16:20:00Z',
  },
  {
    id: '4',
    productId: '4',
    productName: 'Ergonomic Office Chair',
    sku: 'FURN-001',
    category: 'Furniture',
    warehouse: 'Secondary Warehouse',
    quantity: 25,
    reservedQty: 5,
    availableQty: 20,
    minStock: 5,
    maxStock: 100,
    reorderPoint: 10,
    unitCost: 150.00,
    lastUpdated: '2024-12-05T14:00:00Z',
  },
  {
    id: '5',
    productId: '5',
    productName: 'USB-C Hub',
    sku: 'ELEC-003',
    category: 'Electronics',
    warehouse: 'Main Warehouse',
    quantity: 200,
    reservedQty: 15,
    availableQty: 185,
    minStock: 25,
    maxStock: 400,
    reorderPoint: 50,
    unitCost: 25.00,
    lastUpdated: '2024-12-05T11:30:00Z',
  },
  {
    id: '6',
    productId: '6',
    productName: 'Printer Ink Black',
    sku: 'OFFC-002',
    category: 'Office Supplies',
    warehouse: 'Main Warehouse',
    quantity: 12,
    reservedQty: 0,
    availableQty: 12,
    minStock: 20,
    maxStock: 100,
    reorderPoint: 25,
    unitCost: 35.00,
    lastUpdated: '2024-12-04T10:00:00Z',
  },
  {
    id: '7',
    productId: '4',
    productName: 'Ergonomic Office Chair',
    sku: 'FURN-001',
    category: 'Furniture',
    warehouse: 'Main Warehouse',
    quantity: 3,
    reservedQty: 1,
    availableQty: 2,
    minStock: 5,
    maxStock: 50,
    reorderPoint: 8,
    unitCost: 150.00,
    lastUpdated: '2024-12-05T14:00:00Z',
  },
  {
    id: '8',
    productId: '5',
    productName: 'USB-C Hub',
    sku: 'ELEC-003',
    category: 'Electronics',
    warehouse: 'Secondary Warehouse',
    quantity: 5,
    reservedQty: 0,
    availableQty: 5,
    minStock: 10,
    maxStock: 100,
    reorderPoint: 15,
    unitCost: 25.00,
    lastUpdated: '2024-12-05T11:30:00Z',
  },
];

const warehouseData = [
  { name: 'Main Warehouse', address: '123 Industrial Ave, New York, NY 10001' },
  { name: 'Secondary Warehouse', address: '456 Storage Blvd, Brooklyn, NY 11201' },
  { name: 'Downtown Retail Store', address: '789 Main Street, Manhattan, NY 10013' },
];

// Mock Purchase Orders (pending/ordered for Stock In)
const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    orderNumber: 'PO-2312-00021',
    supplier: 'Electronics Wholesale',
    destinationWarehouse: 'Main Warehouse',
    items: [
      { id: 'i1', productId: '5', productName: 'USB-C Hub', sku: 'ELEC-003', quantity: 200, receivedQuantity: 0, unitCost: 25.00 },
    ],
    status: 'ORDERED',
    orderDate: '2024-12-04',
    expectedDate: '2024-12-12',
  },
  {
    id: '2',
    orderNumber: 'PO-2312-00022',
    supplier: 'Office Depot',
    destinationWarehouse: 'Secondary Warehouse',
    items: [
      { id: 'i2', productId: '3', productName: 'A4 Copy Paper', sku: 'OFFC-001', quantity: 500, receivedQuantity: 0, unitCost: 4.50 },
    ],
    status: 'ORDERED',
    orderDate: '2024-12-06',
    expectedDate: '2024-12-15',
  },
  {
    id: '3',
    orderNumber: 'PO-2312-00020',
    supplier: 'Furniture World',
    destinationWarehouse: 'Downtown Retail Store',
    items: [
      { id: 'i3', productId: '4', productName: 'Ergonomic Office Chair', sku: 'FURN-001', quantity: 20, receivedQuantity: 10, unitCost: 150.00 },
    ],
    status: 'PARTIAL',
    orderDate: '2024-12-01',
    expectedDate: '2024-12-08',
  },
];

// Mock Sales Orders (processing status for Stock Out)
const mockSalesOrders: SalesOrder[] = [
  {
    id: '1',
    orderNumber: 'SO-2312-00045',
    customer: 'Acme Corporation',
    sourceWarehouse: 'Main Warehouse',
    items: [
      { id: 's1', productId: '1', productName: 'Wireless Mouse', sku: 'ELEC-001', quantity: 10, shippedQuantity: 0, unitPrice: 29.99 },
      { id: 's2', productId: '2', productName: 'Mechanical Keyboard', sku: 'ELEC-002', quantity: 5, shippedQuantity: 0, unitPrice: 89.99 },
    ],
    status: 'PROCESSING',
    orderDate: '2024-12-07',
    expectedDate: '2024-12-14',
  },
  {
    id: '2',
    orderNumber: 'SO-2312-00046',
    customer: 'TechStart Inc.',
    sourceWarehouse: 'Main Warehouse',
    items: [
      { id: 's3', productId: '5', productName: 'USB-C Hub', sku: 'ELEC-003', quantity: 20, shippedQuantity: 0, unitPrice: 49.99 },
    ],
    status: 'PROCESSING',
    orderDate: '2024-12-08',
    expectedDate: '2024-12-15',
  },
  {
    id: '3',
    orderNumber: 'SO-2312-00044',
    customer: 'Global Systems',
    sourceWarehouse: 'Secondary Warehouse',
    items: [
      { id: 's4', productId: '4', productName: 'Ergonomic Office Chair', sku: 'FURN-001', quantity: 5, shippedQuantity: 2, unitPrice: 299.99 },
    ],
    status: 'PROCESSING',
    orderDate: '2024-12-06',
    expectedDate: '2024-12-12',
  },
];

const warehouses = warehouseData.map(w => w.name);



const adjustmentTypeConfig: Record<AdjustmentType, { label: string; icon: typeof ArrowDown; color: string }> = {
  STOCK_IN: { label: 'Stock In', icon: ArrowDown, color: 'text-green-600' },
  STOCK_OUT: { label: 'Stock Out', icon: ArrowUp, color: 'text-red-600' },
  TRANSFER: { label: 'Transfer', icon: ArrowLeftRight, color: 'text-blue-600' },
};

function InventoryPage() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Adjustment Modal
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('STOCK_IN');
  const [isSaving, setIsSaving] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: '',
    sourceWarehouse: '',
    targetWarehouse: '',
    quantity: 0,
    reason: '',
    reference: '',
  });

  // New: Multi-step modal state for Stock In/Out redesign
  const [modalStep, setModalStep] = useState<ModalStep>('reason');
  const [selectedStockInReason, setSelectedStockInReason] = useState<StockInReason | ''>('');
  const [selectedStockOutReason, setSelectedStockOutReason] = useState<StockOutReason | ''>('');

  // PO Selection state for "Purchase Order Received" reason
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receivingItems, setReceivingItems] = useState<{ itemId: string; quantity: number }[]>([]);

  // SO Selection state for "Sales Order Fulfilled" reason
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(mockSalesOrders);
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
  const [shippingItems, setShippingItems] = useState<{ itemId: string; quantity: number }[]>([]);


  // Low Stock Alert Modal
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<WarehouseLowStockAlert | null>(null);


  // Calculate stats
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const lowStockCount = inventory.filter((item) => item.quantity <= item.reorderPoint).length;
  const outOfStockCount = inventory.filter((item) => item.availableQty === 0).length;

  // Calculate warehouse-specific low stock alerts
  const getWarehouseLowStockAlerts = (): WarehouseLowStockAlert[] => {
    const alerts: WarehouseLowStockAlert[] = [];

    // Group inventory by product
    const productGroups = inventory.reduce((acc, item) => {
      if (!acc[item.productId]) {
        acc[item.productId] = [];
      }
      acc[item.productId].push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>);

    // Check each product in each warehouse
    Object.entries(productGroups).forEach(([_, items]) => {
      const totalStock = items.reduce((sum, i) => sum + i.quantity, 0);

      items.forEach(item => {
        // If this warehouse is low but total stock is sufficient
        if (item.quantity < item.minStock && totalStock >= item.minStock) {
          const otherWarehouses = items
            .filter(i => i.warehouse !== item.warehouse && i.availableQty > 0)
            .map(i => ({ warehouse: i.warehouse, available: i.availableQty }));

          const warehouseInfo = warehouseData.find(w => w.name === item.warehouse);

          alerts.push({
            warehouse: item.warehouse,
            warehouseAddress: warehouseInfo?.address || '',
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            currentStock: item.quantity,
            minStock: item.minStock,
            totalStockAcrossWarehouses: totalStock,
            canTransferFrom: otherWarehouses,
          });
        }
      });
    });

    return alerts;
  };

  const warehouseLowStockAlerts = getWarehouseLowStockAlerts();

  // Filter inventory
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = !warehouseFilter || item.warehouse === warehouseFilter;
    const matchesCategory = !categoryFilter || item.category === categoryFilter;

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = item.quantity <= item.reorderPoint && item.quantity > 0;
    } else if (stockFilter === 'out') {
      matchesStock = item.availableQty === 0;
    } else if (stockFilter === 'overstock') {
      matchesStock = item.quantity > item.maxStock * 0.9;
    }

    return matchesSearch && matchesWarehouse && matchesStock && matchesCategory;
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.availableQty === 0) {
      return { label: 'Out of Stock', color: 'text-destructive bg-destructive/10' };
    }
    if (item.quantity <= item.reorderPoint) {
      return { label: 'Low Stock', color: 'text-warning bg-warning/10' };
    }
    if (item.quantity > item.maxStock * 0.9) {
      return { label: 'Overstock', color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' };
    }
    return { label: 'In Stock', color: 'text-success bg-success/10' };
  };

  const uniqueWarehouses = [...new Set(inventory.map((i) => i.warehouse))];
  const uniqueCategories = [...new Set(inventory.map((i) => i.category))];

  // Get unique products for selection
  const uniqueProducts = inventory.reduce((acc, item) => {
    if (!acc.find(p => p.productId === item.productId)) {
      acc.push({ productId: item.productId, productName: item.productName, sku: item.sku });
    }
    return acc;
  }, [] as { productId: string; productName: string; sku: string }[]);

  // Get available source warehouses for selected product
  const getSourceWarehouses = () => {
    if (!adjustmentForm.productId) return [];
    return inventory
      .filter(i => i.productId === adjustmentForm.productId && i.quantity > 0)
      .map(i => ({ warehouse: i.warehouse, quantity: i.quantity }));
  };

  // Get available target warehouses (different from source)
  const getTargetWarehouses = () => {
    return warehouses.filter(w => w !== adjustmentForm.sourceWarehouse);
  };

  // Open adjustment modal
  const openAdjustmentModal = (type: AdjustmentType, preselectedProduct?: string, preselectedSource?: string, preselectedTarget?: string) => {
    setAdjustmentType(type);
    setAdjustmentForm({
      productId: preselectedProduct || '',
      sourceWarehouse: preselectedSource || '',
      targetWarehouse: preselectedTarget || '',
      quantity: 0,
      reason: type === 'TRANSFER' ? 'RESTOCK' : '',
      reference: '',
    });
    // Reset multi-step modal state
    // For Transfer, skip reason selection and go directly to template
    setModalStep(type === 'TRANSFER' ? 'template' : 'reason');
    setSelectedStockInReason('');
    setSelectedStockOutReason('');
    setSelectedPO(null);
    setReceivingItems([]);
    setSelectedSO(null);
    setShippingItems([]);
    setIsAdjustmentOpen(true);
  };


  // Handle reason selection for Stock In/Out
  const handleReasonSelect = (reason: StockInReason | StockOutReason) => {
    if (adjustmentType === 'STOCK_IN') {
      setSelectedStockInReason(reason as StockInReason);
      if (reason === 'PURCHASE_ORDER') {
        // Go to PO selection step
        setModalStep('template');
      } else {
        // Go to manual entry with reason set
        setAdjustmentForm(f => ({ ...f, reason }));
        setModalStep('template');
      }
    } else if (adjustmentType === 'STOCK_OUT') {
      setSelectedStockOutReason(reason as StockOutReason);
      if (reason === 'SALES_ORDER') {
        // Go to SO selection step
        setModalStep('template');
      } else {
        // Go to manual entry with reason set
        setAdjustmentForm(f => ({ ...f, reason }));
        setModalStep('template');
      }
    }
  };


  // Handle PO selection
  const handlePOSelect = (po: PurchaseOrder) => {
    setSelectedPO(po);
    // Initialize receiving items with remaining quantities
    const items = po.items.map(item => ({
      itemId: item.id,
      quantity: item.quantity - item.receivedQuantity,
    }));
    setReceivingItems(items);
    setAdjustmentForm(f => ({ ...f, targetWarehouse: po.destinationWarehouse }));
  };

  // Update receiving item quantity with validation
  const updateReceivingQuantity = (itemId: string, quantity: number) => {
    if (!selectedPO) return;

    // Find the PO item to get the max allowed quantity
    const poItem = selectedPO.items.find(i => i.id === itemId);
    if (!poItem) return;

    const remaining = poItem.quantity - poItem.receivedQuantity;
    // Clamp quantity between 0 and remaining
    const validQuantity = Math.min(Math.max(0, quantity), remaining);

    setReceivingItems(prev =>
      prev.map(item => item.itemId === itemId ? { ...item, quantity: validQuantity } : item)
    );
  };


  // Get pending purchase orders for Stock In
  const getPendingPOs = () => {
    return purchaseOrders.filter(po => po.status === 'ORDERED' || po.status === 'PARTIAL');
  };

  // Handle SO selection
  const handleSOSelect = (so: SalesOrder) => {
    setSelectedSO(so);
    // Initialize shipping items with remaining quantities
    const items = so.items.map(item => ({
      itemId: item.id,
      quantity: item.quantity - item.shippedQuantity,
    }));
    setShippingItems(items);
    setAdjustmentForm(f => ({ ...f, sourceWarehouse: so.sourceWarehouse }));
  };

  // Update shipping item quantity with validation
  const updateShippingQuantity = (itemId: string, quantity: number) => {
    if (!selectedSO) return;

    // Find the SO item to get the max allowed quantity
    const soItem = selectedSO.items.find(i => i.id === itemId);
    if (!soItem) return;

    const remaining = soItem.quantity - soItem.shippedQuantity;
    // Clamp quantity between 0 and remaining
    const validQuantity = Math.min(Math.max(0, quantity), remaining);

    setShippingItems(prev =>
      prev.map(item => item.itemId === itemId ? { ...item, quantity: validQuantity } : item)
    );
  };

  // Get processing sales orders for Stock Out
  const getProcessingSOs = () => {
    return salesOrders.filter(so => so.status === 'PROCESSING');
  };


  // Handle alert action
  const handleAlertAction = (alert: WarehouseLowStockAlert, action: 'transfer' | 'purchase') => {
    setIsAlertModalOpen(false);

    if (action === 'transfer' && alert.canTransferFrom.length > 0) {
      // Open transfer modal with pre-filled data
      openAdjustmentModal(
        'TRANSFER',
        alert.productId,
        alert.canTransferFrom[0].warehouse,
        alert.warehouse
      );
    } else if (action === 'purchase') {
      // Navigate to purchase order page with warehouse pre-selected
      const warehouseInfo = warehouseData.find(w => w.name === alert.warehouse);
      navigate({
        to: '/orders/purchase',
        search: {
          warehouse: alert.warehouse,
          warehouseAddress: warehouseInfo?.address || '',
          productSku: alert.sku,
        },
      });
    }
  };

  // Handle adjustment
  const handleAdjustment = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // PO-based Stock In
    if (adjustmentType === 'STOCK_IN' && selectedStockInReason === 'PURCHASE_ORDER' && selectedPO) {
      // Process each receiving item
      for (const receiving of receivingItems) {
        if (receiving.quantity <= 0) continue;

        const poItem = selectedPO.items.find(i => i.id === receiving.itemId);
        if (!poItem) continue;

        // Find or create inventory entry
        const existingItem = inventory.find(
          i => i.productId === poItem.productId && i.warehouse === selectedPO.destinationWarehouse
        );

        if (existingItem) {
          setInventory(prev => prev.map(item =>
            item.id === existingItem.id
              ? {
                ...item,
                quantity: item.quantity + receiving.quantity,
                availableQty: item.availableQty + receiving.quantity,
                lastUpdated: new Date().toISOString(),
              }
              : item
          ));
        } else {
          // Create new inventory entry
          const newItem: InventoryItem = {
            id: `inv-${Date.now()}-${poItem.productId}`,
            productId: poItem.productId,
            productName: poItem.productName,
            sku: poItem.sku,
            category: 'General', // Default category
            warehouse: selectedPO.destinationWarehouse,
            quantity: receiving.quantity,
            reservedQty: 0,
            availableQty: receiving.quantity,
            minStock: 10,
            maxStock: 500,
            reorderPoint: 20,
            unitCost: poItem.unitCost,
            lastUpdated: new Date().toISOString(),
          };
          setInventory(prev => [...prev, newItem]);
        }
      }

      // Update PO received quantities and status
      setPurchaseOrders(prev => prev.map(po => {
        if (po.id !== selectedPO.id) return po;

        const updatedItems = po.items.map(item => {
          const receiving = receivingItems.find(r => r.itemId === item.id);
          if (!receiving) return item;
          return {
            ...item,
            receivedQuantity: item.receivedQuantity + receiving.quantity,
          };
        });

        // Check if all items are fully received
        const allReceived = updatedItems.every(item => item.receivedQuantity >= item.quantity);
        const anyReceived = updatedItems.some(item => item.receivedQuantity > 0);

        return {
          ...po,
          items: updatedItems,
          status: allReceived ? 'RECEIVED' : (anyReceived ? 'PARTIAL' : po.status),
        };
      }));

      setIsSaving(false);
      setIsAdjustmentOpen(false);
      return;
    }

    // SO-based Stock Out
    if (adjustmentType === 'STOCK_OUT' && selectedStockOutReason === 'SALES_ORDER' && selectedSO) {
      // Process each shipping item
      for (const shipping of shippingItems) {
        if (shipping.quantity <= 0) continue;

        const soItem = selectedSO.items.find(i => i.id === shipping.itemId);
        if (!soItem) continue;

        // Find and update inventory entry
        const existingItem = inventory.find(
          i => i.productId === soItem.productId && i.warehouse === selectedSO.sourceWarehouse
        );

        if (existingItem) {
          setInventory(prev => prev.map(item =>
            item.id === existingItem.id
              ? {
                ...item,
                quantity: Math.max(0, item.quantity - shipping.quantity),
                availableQty: Math.max(0, item.availableQty - shipping.quantity),
                lastUpdated: new Date().toISOString(),
              }
              : item
          ));
        }
      }

      // Update SO shipped quantities and status
      setSalesOrders(prev => prev.map(so => {
        if (so.id !== selectedSO.id) return so;

        const updatedItems = so.items.map(item => {
          const shipping = shippingItems.find(s => s.itemId === item.id);
          if (!shipping) return item;
          return {
            ...item,
            shippedQuantity: item.shippedQuantity + shipping.quantity,
          };
        });

        // Check if all items are fully shipped
        const allShipped = updatedItems.every(item => item.shippedQuantity >= item.quantity);

        return {
          ...so,
          items: updatedItems,
          status: allShipped ? 'SHIPPED' : so.status,
        };
      }));

      setIsSaving(false);
      setIsAdjustmentOpen(false);
      return;
    }

    // Manual Stock In (non-PO) or Stock Out (non-SO)
    const product = uniqueProducts.find(p => p.productId === adjustmentForm.productId);
    if (!product && adjustmentType !== 'STOCK_OUT') {
      setIsSaving(false);
      return;
    }


    if (adjustmentType === 'STOCK_IN') {
      // Stock In - add to target warehouse
      const existingItem = inventory.find(
        i => i.productId === adjustmentForm.productId && i.warehouse === adjustmentForm.targetWarehouse
      );

      if (existingItem) {
        setInventory(prev => prev.map(item =>
          item.id === existingItem.id
            ? {
              ...item,
              quantity: item.quantity + adjustmentForm.quantity,
              availableQty: item.availableQty + adjustmentForm.quantity,
              lastUpdated: new Date().toISOString(),
            }
            : item
        ));
      } else {
        // Create new inventory entry for this warehouse
        const sourceItem = inventory.find(i => i.productId === adjustmentForm.productId);
        if (sourceItem && product) {
          const newItem: InventoryItem = {
            id: String(inventory.length + 1),
            productId: adjustmentForm.productId,
            productName: product.productName,
            sku: product.sku,
            category: sourceItem.category,
            warehouse: adjustmentForm.targetWarehouse,
            quantity: adjustmentForm.quantity,
            reservedQty: 0,
            availableQty: adjustmentForm.quantity,
            minStock: sourceItem.minStock,
            maxStock: sourceItem.maxStock,
            reorderPoint: sourceItem.reorderPoint,
            unitCost: sourceItem.unitCost,
            lastUpdated: new Date().toISOString(),
          };
          setInventory(prev => [...prev, newItem]);
        }
      }
    } else if (adjustmentType === 'STOCK_OUT') {
      // Stock Out - remove from source warehouse
      setInventory(prev => prev.map(item =>
        item.productId === adjustmentForm.productId && item.warehouse === adjustmentForm.sourceWarehouse
          ? {
            ...item,
            quantity: Math.max(0, item.quantity - adjustmentForm.quantity),
            availableQty: Math.max(0, item.availableQty - adjustmentForm.quantity),
            lastUpdated: new Date().toISOString(),
          }
          : item
      ));
    } else if (adjustmentType === 'TRANSFER') {
      // Transfer - move from source to target
      // Decrease source
      setInventory(prev => {
        const updated = prev.map(item =>
          item.productId === adjustmentForm.productId && item.warehouse === adjustmentForm.sourceWarehouse
            ? {
              ...item,
              quantity: Math.max(0, item.quantity - adjustmentForm.quantity),
              availableQty: Math.max(0, item.availableQty - adjustmentForm.quantity),
              lastUpdated: new Date().toISOString(),
            }
            : item
        );

        // Check if target warehouse already has this product
        const targetItem = updated.find(
          i => i.productId === adjustmentForm.productId && i.warehouse === adjustmentForm.targetWarehouse
        );

        if (targetItem) {
          return updated.map(item =>
            item.id === targetItem.id
              ? {
                ...item,
                quantity: item.quantity + adjustmentForm.quantity,
                availableQty: item.availableQty + adjustmentForm.quantity,
                lastUpdated: new Date().toISOString(),
              }
              : item
          );
        } else {
          // Create new entry in target warehouse
          const sourceItem = prev.find(i => i.productId === adjustmentForm.productId);
          if (sourceItem && product) {
            const newItem: InventoryItem = {
              id: String(prev.length + 1),
              productId: adjustmentForm.productId,
              productName: product.productName,
              sku: product.sku,
              category: sourceItem.category,
              warehouse: adjustmentForm.targetWarehouse,
              quantity: adjustmentForm.quantity,
              reservedQty: 0,
              availableQty: adjustmentForm.quantity,
              minStock: sourceItem.minStock,
              maxStock: sourceItem.maxStock,
              reorderPoint: sourceItem.reorderPoint,
              unitCost: sourceItem.unitCost,
              lastUpdated: new Date().toISOString(),
            };
            return [...updated, newItem];
          }
        }
        return updated;
      });
    }

    setIsSaving(false);
    setIsAdjustmentOpen(false);
  };


  // Get max quantity for stock out/transfer
  const getMaxQuantity = () => {
    if (!adjustmentForm.productId || !adjustmentForm.sourceWarehouse) return 0;
    const item = inventory.find(
      i => i.productId === adjustmentForm.productId && i.warehouse === adjustmentForm.sourceWarehouse
    );
    return item?.availableQty || 0;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Inventory Overview"
        description="Monitor and manage your stock levels"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openAdjustmentModal('STOCK_IN')}>
              <ArrowDown className="mr-2 h-4 w-4" />
              Stock In
            </Button>
            <Button variant="outline" onClick={() => openAdjustmentModal('STOCK_OUT')}>
              <ArrowUp className="mr-2 h-4 w-4" />
              Stock Out
            </Button>
            <Button onClick={() => openAdjustmentModal('TRANSFER')}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Transfer
            </Button>
          </div>
        }
      />

      {/* Warehouse-Specific Low Stock Alerts */}
      {warehouseLowStockAlerts.length > 0 && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <div className="flex items-center gap-2 mb-3">
            <Warehouse className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Warehouse Stock Alerts
            </h3>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {warehouseLowStockAlerts.length} alert{warehouseLowStockAlerts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            The following warehouses have low stock, but overall inventory is sufficient. Consider transferring stock or creating a purchase order.
          </p>
          <ScrollArea className={warehouseLowStockAlerts.length > 3 ? 'h-[180px]' : ''}>
            <div className="space-y-2">
              {warehouseLowStockAlerts.map((alert, index) => (
                <div
                  key={`${alert.warehouse}-${alert.productId}-${index}`}
                  className="flex items-center justify-between rounded-lg bg-white/80 dark:bg-gray-800/50 p-3 border border-blue-100 dark:border-blue-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{alert.productName}</span>
                      <span className="text-xs text-muted-foreground">({alert.sku})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Warehouse className="h-3 w-3" />
                      <span>{alert.warehouse}</span>
                      <span>•</span>
                      <span className="text-amber-600">
                        {alert.currentStock} / {alert.minStock} min
                      </span>
                      <span>•</span>
                      <span className="text-green-600">
                        Total: {alert.totalStockAcrossWarehouses}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.canTransferFrom.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setIsAlertModalOpen(true);
                        }}
                        className="text-xs"
                      >
                        <ArrowLeftRight className="h-3 w-3 mr-1" />
                        Transfer
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAlertAction(alert, 'purchase')}
                      className="text-xs"
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Order
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Stats Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Stock Items"
          value={totalItems.toLocaleString()}
          change="Across all warehouses"
          changeType="neutral"
          icon={Package}
        />
        <StatsCard
          title="Inventory Value"
          value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          change="+5.2% from last month"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatsCard
          title="Low Stock Items"
          value={lowStockCount}
          change="Need attention"
          changeType={lowStockCount > 0 ? 'negative' : 'neutral'}
          icon={TrendingDown}
        />
        <StatsCard
          title="Out of Stock"
          value={outOfStockCount}
          change={outOfStockCount > 0 ? 'Action required' : 'All items available'}
          changeType={outOfStockCount > 0 ? 'negative' : 'positive'}
          icon={AlertTriangle}
        />
      </div>

      {/* Search and filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by product or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Warehouses</option>
              {uniqueWarehouses.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Stock Levels</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {/* Inventory table */}
      <DashboardCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">SKU</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Warehouse</th>
                <th className="pb-3 font-medium text-right">On Hand</th>
                <th className="pb-3 font-medium text-right">Available</th>
                <th className="pb-3 font-medium text-right">Unit Cost</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const status = getStockStatus(item);
                const stockPercentage = (item.quantity / item.maxStock) * 100;

                return (
                  <tr key={item.id} className="border-b last:border-0 table-row-hover">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{item.productName}</span>
                      </div>
                    </td>
                    <td className="py-4 text-muted-foreground">{item.sku}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        <Warehouse className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.warehouse}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right font-medium">{item.quantity}</td>
                    <td className="py-4 text-right">
                      <span className={cn(
                        'font-medium',
                        item.availableQty === 0 && 'text-destructive',
                        item.availableQty <= item.reorderPoint && item.availableQty > 0 && 'text-warning'
                      )}>
                        {item.availableQty}
                      </span>
                    </td>
                    <td className="py-4 text-right text-muted-foreground">
                      ${item.unitCost.toFixed(2)}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          status.color
                        )}>
                          {status.label}
                        </span>
                        {/* Stock level bar */}
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              stockPercentage <= 25 ? 'bg-destructive' :
                                stockPercentage <= 50 ? 'bg-warning' :
                                  'bg-success'
                            )}
                            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No inventory items found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
            <Link to="/products">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </Link>
          </div>
        )}

        {/* Pagination */}
        {filteredInventory.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredInventory.length} of {inventory.length} items
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

      {/* Low Stock Alert Card */}
      {lowStockCount > 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">
            ⚠️ Low Stock Alert
          </h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} below reorder point.
            Consider placing purchase orders to replenish stock.
          </p>
          <Link to="/orders/purchase">
            <Button variant="outline" size="sm" className="mt-3">
              Create Purchase Order
            </Button>
          </Link>
        </div>
      )}

      {/* Alert Action Modal */}
      <Dialog open={isAlertModalOpen} onOpenChange={setIsAlertModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Resolve Stock Alert
            </DialogTitle>
            <DialogDescription>
              Choose how to replenish stock at {selectedAlert?.warehouse}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="py-4 space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedAlert.productName}</p>
                    <p className="text-sm text-muted-foreground">{selectedAlert.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-600 font-medium">{selectedAlert.currentStock} units</p>
                    <p className="text-xs text-muted-foreground">Min: {selectedAlert.minStock}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Transfer Option */}
                {selectedAlert.canTransferFrom.length > 0 && (
                  <div
                    className="rounded-lg border p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                    onClick={() => handleAlertAction(selectedAlert, 'transfer')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Transfer from Another Warehouse</p>
                        <p className="text-sm text-muted-foreground">
                          Available from: {selectedAlert.canTransferFrom.map(w => `${w.warehouse} (${w.available})`).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Purchase Order Option */}
                <div
                  className="rounded-lg border p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => handleAlertAction(selectedAlert, 'purchase')}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <ClipboardList className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Create Purchase Order</p>
                      <p className="text-sm text-muted-foreground">
                        Order new stock to be delivered to {selectedAlert.warehouse}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAlertModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjustment Modal - Multi-step for Stock In/Out, direct for Transfer */}
      <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalStep !== 'reason' && adjustmentType !== 'TRANSFER' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mr-1"
                  onClick={() => {
                    if (modalStep === 'template' && selectedStockInReason === 'PURCHASE_ORDER' && selectedPO) {
                      setSelectedPO(null);
                    } else if (modalStep === 'template' && selectedStockOutReason === 'SALES_ORDER' && selectedSO) {
                      setSelectedSO(null);
                    } else {
                      setModalStep('reason');
                      setSelectedStockInReason('');
                      setSelectedStockOutReason('');
                      setSelectedPO(null);
                      setSelectedSO(null);
                    }
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {adjustmentType === 'STOCK_IN' && <ArrowDown className="h-5 w-5 text-green-600" />}
              {adjustmentType === 'STOCK_OUT' && <ArrowUp className="h-5 w-5 text-red-600" />}
              {adjustmentType === 'TRANSFER' && <ArrowLeftRight className="h-5 w-5 text-blue-600" />}
              {adjustmentTypeConfig[adjustmentType].label}
            </DialogTitle>
            <DialogDescription>
              {adjustmentType === 'TRANSFER' && 'Transfer inventory between warehouses'}
              {adjustmentType === 'STOCK_IN' && modalStep === 'reason' && 'Select the reason for adding inventory'}
              {adjustmentType === 'STOCK_IN' && modalStep === 'template' && selectedStockInReason === 'PURCHASE_ORDER' && !selectedPO && 'Select a purchase order to receive'}
              {adjustmentType === 'STOCK_IN' && modalStep === 'template' && selectedStockInReason === 'PURCHASE_ORDER' && selectedPO && `Receiving ${selectedPO.orderNumber}`}
              {adjustmentType === 'STOCK_IN' && modalStep === 'template' && selectedStockInReason !== 'PURCHASE_ORDER' && 'Enter inventory details'}
              {adjustmentType === 'STOCK_OUT' && modalStep === 'reason' && 'Select the reason for removing inventory'}
              {adjustmentType === 'STOCK_OUT' && modalStep === 'template' && selectedStockOutReason === 'SALES_ORDER' && !selectedSO && 'Select a sales order to fulfill'}
              {adjustmentType === 'STOCK_OUT' && modalStep === 'template' && selectedStockOutReason === 'SALES_ORDER' && selectedSO && `Fulfilling ${selectedSO.orderNumber}`}
              {adjustmentType === 'STOCK_OUT' && modalStep === 'template' && selectedStockOutReason !== 'SALES_ORDER' && 'Enter inventory details'}
            </DialogDescription>
          </DialogHeader>


          {/* Step 1: Reason Selection (for Stock In/Out only) */}
          {(adjustmentType === 'STOCK_IN' || adjustmentType === 'STOCK_OUT') && modalStep === 'reason' && (
            <div className="py-4">
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-2">
                  {(adjustmentType === 'STOCK_IN' ? stockInReasons : stockOutReasons).map((reason) => {
                    const Icon = reason.icon;
                    return (
                      <div
                        key={reason.value}
                        className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                        onClick={() => handleReasonSelect(reason.value)}
                      >
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full",
                          adjustmentType === 'STOCK_IN' ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
                        )}>
                          <Icon className={cn("h-5 w-5", adjustmentType === 'STOCK_IN' ? "text-green-600" : "text-red-600")} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{reason.label}</p>
                          <p className="text-sm text-muted-foreground">{reason.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Step 2: PO Selection (for Stock In - Purchase Order Received) */}
          {adjustmentType === 'STOCK_IN' && modalStep === 'template' && selectedStockInReason === 'PURCHASE_ORDER' && !selectedPO && (
            <div className="py-4">
              <ScrollArea className="max-h-[400px]">
                {getPendingPOs().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <p className="font-medium">No pending purchase orders</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      All purchase orders have been received
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getPendingPOs().map((po) => (
                      <div
                        key={po.id}
                        className="rounded-lg border p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                        onClick={() => handlePOSelect(po)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{po.orderNumber}</span>
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            po.status === 'ORDERED' && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                            po.status === 'PARTIAL' && "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                          )}>
                            {po.status === 'PARTIAL' ? 'Partial' : 'Ordered'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Supplier: {po.supplier}</p>
                          <p>Warehouse: {po.destinationWarehouse}</p>
                          <p>Items: {po.items.length} • Expected: {po.expectedDate || 'Not set'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Step 2b: PO Items to Receive */}
          {adjustmentType === 'STOCK_IN' && modalStep === 'template' && selectedStockInReason === 'PURCHASE_ORDER' && selectedPO && (
            <div className="py-4 space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedPO.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{selectedPO.supplier}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>To: {selectedPO.destinationWarehouse}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Items to Receive</Label>
                {selectedPO.items.map((item) => {
                  const receiving = receivingItems.find(r => r.itemId === item.id);
                  const remaining = item.quantity - item.receivedQuantity;
                  return (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">
                            Ordered: {item.quantity} | Received: {item.receivedQuantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm whitespace-nowrap">Receive:</Label>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={!receiving || receiving.quantity <= 0}
                            onClick={() => updateReceivingQuantity(item.id, (receiving?.quantity || 0) - 1)}
                          >
                            <span className="text-lg">−</span>
                          </Button>
                          <Input
                            type="number"
                            min={0}
                            max={remaining}
                            value={receiving?.quantity ?? 0}
                            onChange={(e) => updateReceivingQuantity(item.id, parseInt(e.target.value) || 0)}
                            onBlur={(e) => {
                              // Re-validate on blur to ensure value is within bounds
                              const val = parseInt(e.target.value) || 0;
                              if (val < 0 || val > remaining) {
                                updateReceivingQuantity(item.id, Math.min(Math.max(0, val), remaining));
                              }
                            }}
                            className="h-8 w-20 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={!receiving || receiving.quantity >= remaining}
                            onClick={() => updateReceivingQuantity(item.id, (receiving?.quantity || 0) + 1)}
                          >
                            <span className="text-lg">+</span>
                          </Button>
                        </div>
                        <span className="text-sm text-muted-foreground">/ {remaining}</span>
                        {remaining === 0 && (
                          <span className="text-xs text-green-600 ml-1">✓ Fully received</span>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: SO Selection (for Stock Out - Sales Order Fulfilled) */}
          {adjustmentType === 'STOCK_OUT' && modalStep === 'template' && selectedStockOutReason === 'SALES_ORDER' && !selectedSO && (
            <div className="py-4">
              <ScrollArea className="max-h-[500px]">

                {getProcessingSOs().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <p className="font-medium">No processing sales orders</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      All sales orders have been fulfilled
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getProcessingSOs().map((so) => (
                      <div
                        key={so.id}
                        className="rounded-lg border p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                        onClick={() => handleSOSelect(so)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{so.orderNumber}</span>
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            Processing
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Customer: {so.customer}</p>
                          <p>From: {so.sourceWarehouse}</p>
                          <p>Items: {so.items.length} • Expected: {so.expectedDate || 'Not set'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Step 2b: SO Items to Ship */}
          {adjustmentType === 'STOCK_OUT' && modalStep === 'template' && selectedStockOutReason === 'SALES_ORDER' && selectedSO && (
            <div className="py-4 space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedSO.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{selectedSO.customer}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>From: {selectedSO.sourceWarehouse}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Items to Ship</Label>
                {selectedSO.items.map((item) => {
                  const shipping = shippingItems.find(s => s.itemId === item.id);
                  const remaining = item.quantity - item.shippedQuantity;
                  return (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">
                            Ordered: {item.quantity} | Shipped: {item.shippedQuantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm whitespace-nowrap">Ship:</Label>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={!shipping || shipping.quantity <= 0}
                            onClick={() => updateShippingQuantity(item.id, (shipping?.quantity || 0) - 1)}
                          >
                            <span className="text-lg">−</span>
                          </Button>
                          <Input
                            type="number"
                            min={0}
                            max={remaining}
                            value={shipping?.quantity ?? 0}
                            onChange={(e) => updateShippingQuantity(item.id, parseInt(e.target.value) || 0)}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              if (val < 0 || val > remaining) {
                                updateShippingQuantity(item.id, Math.min(Math.max(0, val), remaining));
                              }
                            }}
                            className="h-8 w-20 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={!shipping || shipping.quantity >= remaining}
                            onClick={() => updateShippingQuantity(item.id, (shipping?.quantity || 0) + 1)}
                          >
                            <span className="text-lg">+</span>
                          </Button>
                        </div>
                        <span className="text-sm text-muted-foreground">/ {remaining}</span>
                        {remaining === 0 && (
                          <span className="text-xs text-green-600 ml-1">✓ Fully shipped</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2c: Manual Entry Form (for non-PO Stock In and non-SO Stock Out) */}
          {((adjustmentType === 'STOCK_IN' && modalStep === 'template' && selectedStockInReason !== 'PURCHASE_ORDER') ||
            (adjustmentType === 'STOCK_OUT' && modalStep === 'template' && selectedStockOutReason !== 'SALES_ORDER')) && (
              <div className="grid gap-4 py-4">
                {/* Product Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="product">Product *</Label>
                  <select
                    id="product"
                    value={adjustmentForm.productId}
                    onChange={(e) => setAdjustmentForm(f => ({
                      ...f,
                      productId: e.target.value,
                      sourceWarehouse: '',
                      targetWarehouse: '',
                    }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select product</option>
                    {uniqueProducts.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        {p.sku} - {p.productName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Warehouse */}
                <div className="grid gap-2">
                  <Label htmlFor="warehouse">Warehouse *</Label>
                  <select
                    id="warehouse"
                    value={adjustmentType === 'STOCK_IN' ? adjustmentForm.targetWarehouse : adjustmentForm.sourceWarehouse}
                    onChange={(e) => setAdjustmentForm(f => ({
                      ...f,
                      [adjustmentType === 'STOCK_IN' ? 'targetWarehouse' : 'sourceWarehouse']: e.target.value
                    }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    disabled={adjustmentType === 'STOCK_OUT' && !adjustmentForm.productId}
                  >
                    <option value="">Select warehouse</option>
                    {adjustmentType === 'STOCK_IN'
                      ? warehouses.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))
                      : getSourceWarehouses().map((w) => (
                        <option key={w.warehouse} value={w.warehouse}>
                          {w.warehouse} ({w.quantity} available)
                        </option>
                      ))
                    }
                  </select>
                </div>

                {/* Quantity */}
                <div className="grid gap-2">
                  <Label htmlFor="quantity">
                    Quantity *
                    {adjustmentType === 'STOCK_OUT' && adjustmentForm.sourceWarehouse && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Max: {getMaxQuantity()})
                      </span>
                    )}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={adjustmentType === 'STOCK_OUT' ? getMaxQuantity() : undefined}
                    value={adjustmentForm.quantity || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setAdjustmentForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="Enter quantity"
                  />
                </div>

                {/* Reference */}
                <div className="grid gap-2">
                  <Label htmlFor="reference">Reference (Optional)</Label>
                  <Input
                    id="reference"
                    value={adjustmentForm.reference}
                    onChange={(e) => setAdjustmentForm(f => ({ ...f, reference: e.target.value }))}
                    placeholder="e.g., RMA-123, INV-001"
                  />
                </div>
              </div>
            )}

          {/* Transfer Mode - Keep existing behavior */}
          {adjustmentType === 'TRANSFER' && (
            <div className="grid gap-4 py-4">
              {/* Product Selection */}
              <div className="grid gap-2">
                <Label htmlFor="product">Product *</Label>
                <select
                  id="product"
                  value={adjustmentForm.productId}
                  onChange={(e) => setAdjustmentForm(f => ({
                    ...f,
                    productId: e.target.value,
                    sourceWarehouse: '',
                    targetWarehouse: '',
                  }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select product</option>
                  {uniqueProducts.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.sku} - {p.productName}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Warehouse */}
              <div className="grid gap-2">
                <Label htmlFor="sourceWarehouse">From Warehouse *</Label>
                <select
                  id="sourceWarehouse"
                  value={adjustmentForm.sourceWarehouse}
                  onChange={(e) => setAdjustmentForm(f => ({ ...f, sourceWarehouse: e.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  disabled={!adjustmentForm.productId}
                >
                  <option value="">Select warehouse</option>
                  {getSourceWarehouses().map((w) => (
                    <option key={w.warehouse} value={w.warehouse}>
                      {w.warehouse} ({w.quantity} available)
                    </option>
                  ))}
                </select>
              </div>

              {/* To Warehouse */}
              <div className="grid gap-2">
                <Label htmlFor="targetWarehouse">To Warehouse *</Label>
                <select
                  id="targetWarehouse"
                  value={adjustmentForm.targetWarehouse}
                  onChange={(e) => setAdjustmentForm(f => ({ ...f, targetWarehouse: e.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  disabled={!adjustmentForm.sourceWarehouse}
                >
                  <option value="">Select warehouse</option>
                  {getTargetWarehouses().map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="grid gap-2">
                <Label htmlFor="quantity">
                  Quantity *
                  {adjustmentForm.sourceWarehouse && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Max: {getMaxQuantity()})
                    </span>
                  )}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={getMaxQuantity()}
                  value={adjustmentForm.quantity || ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setAdjustmentForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
                  placeholder="Enter quantity"
                />
              </div>

              {/* Reason */}
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason</Label>
                <select
                  id="reason"
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm(f => ({ ...f, reason: e.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="RESTOCK">Restocking</option>
                  <option value="REBALANCE">Warehouse Rebalancing</option>
                  <option value="DEMAND">Demand-based Transfer</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Footer */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustmentOpen(false)}>
              Cancel
            </Button>
            {/* Show Confirm button except on reason selection step */}
            {(adjustmentType === 'TRANSFER' || modalStep === 'template') && (
              <Button
                onClick={handleAdjustment}
                disabled={
                  isSaving ||
                  (adjustmentType === 'STOCK_IN' && selectedStockInReason === 'PURCHASE_ORDER' && !selectedPO) ||
                  (adjustmentType === 'STOCK_IN' && selectedStockInReason === 'PURCHASE_ORDER' && selectedPO && receivingItems.every(i => i.quantity === 0)) ||
                  (adjustmentType === 'STOCK_IN' && selectedStockInReason !== 'PURCHASE_ORDER' && (!adjustmentForm.productId || !adjustmentForm.quantity || !adjustmentForm.targetWarehouse)) ||
                  (adjustmentType === 'STOCK_OUT' && selectedStockOutReason === 'SALES_ORDER' && !selectedSO) ||
                  (adjustmentType === 'STOCK_OUT' && selectedStockOutReason === 'SALES_ORDER' && selectedSO && shippingItems.every(i => i.quantity === 0)) ||
                  (adjustmentType === 'STOCK_OUT' && selectedStockOutReason !== 'SALES_ORDER' && (!adjustmentForm.productId || !adjustmentForm.quantity || !adjustmentForm.sourceWarehouse || adjustmentForm.quantity > getMaxQuantity())) ||
                  (adjustmentType === 'TRANSFER' && (!adjustmentForm.productId || !adjustmentForm.quantity || !adjustmentForm.sourceWarehouse || !adjustmentForm.targetWarehouse || adjustmentForm.quantity > getMaxQuantity()))
                }
              >

                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {isSaving ? 'Processing...' : 'Confirm'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </PageContainer>
  );
}

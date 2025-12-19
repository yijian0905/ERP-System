import { createFileRoute } from '@tanstack/react-router';
import {
  Building2,
  Edit,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  Package,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Warehouse,
} from 'lucide-react';
import { useState } from 'react';

import { DashboardCard, PageContainer, PageHeader, StatsCard } from '@/components/layout/dashboard-layout';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/warehouses')({
  component: WarehousesPage,
});

// Types
type WarehouseType = 'WAREHOUSE' | 'STORE' | 'VIRTUAL';

interface WarehouseInventoryItem {
  id: string;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  unitCost: number;
  totalValue: number;
  reorderPoint: number;
}

interface WarehouseData {
  id: string;
  code: string;
  name: string;
  type: WarehouseType;
  address: string | null;
  phone: string | null;
  email: string | null;
  manager: string | null;
  isDefault: boolean;
  isActive: boolean;
  itemCount: number;
  totalValue: number;
  capacityUsed: number;
  inventory: WarehouseInventoryItem[];
}

// Mock inventory data
const mockWarehouseInventory: Record<string, WarehouseInventoryItem[]> = {
  '1': [
    { id: '1', productName: 'Wireless Mouse', sku: 'ELEC-001', category: 'Electronics', quantity: 150, reservedQty: 10, availableQty: 140, unitCost: 15.00, totalValue: 2250, reorderPoint: 50 },
    { id: '2', productName: 'Mechanical Keyboard', sku: 'ELEC-002', category: 'Electronics', quantity: 8, reservedQty: 3, availableQty: 5, unitCost: 75.00, totalValue: 600, reorderPoint: 15 },
    { id: '3', productName: 'A4 Copy Paper', sku: 'OFFC-001', category: 'Office Supplies', quantity: 500, reservedQty: 50, availableQty: 450, unitCost: 4.50, totalValue: 2250, reorderPoint: 200 },
    { id: '5', productName: 'USB-C Hub', sku: 'ELEC-003', category: 'Electronics', quantity: 200, reservedQty: 15, availableQty: 185, unitCost: 25.00, totalValue: 5000, reorderPoint: 50 },
    { id: '6', productName: 'Printer Ink Black', sku: 'OFFC-002', category: 'Office Supplies', quantity: 12, reservedQty: 0, availableQty: 12, unitCost: 12.00, totalValue: 144, reorderPoint: 25 },
    { id: '7', productName: 'Ergonomic Office Chair', sku: 'FURN-001', category: 'Furniture', quantity: 10, reservedQty: 2, availableQty: 8, unitCost: 150.00, totalValue: 1500, reorderPoint: 8 },
  ],
  '2': [
    { id: '4', productName: 'Ergonomic Office Chair', sku: 'FURN-001', category: 'Furniture', quantity: 25, reservedQty: 5, availableQty: 20, unitCost: 150.00, totalValue: 3750, reorderPoint: 10 },
    { id: '8', productName: 'Standing Desk', sku: 'FURN-002', category: 'Furniture', quantity: 15, reservedQty: 2, availableQty: 13, unitCost: 350.00, totalValue: 5250, reorderPoint: 5 },
  ],
  '3': [
    { id: '9', productName: 'Wireless Mouse', sku: 'ELEC-001', category: 'Electronics', quantity: 35, reservedQty: 5, availableQty: 30, unitCost: 15.00, totalValue: 525, reorderPoint: 15 },
    { id: '10', productName: 'USB-C Hub', sku: 'ELEC-003', category: 'Electronics', quantity: 20, reservedQty: 3, availableQty: 17, unitCost: 25.00, totalValue: 500, reorderPoint: 10 },
  ],
  '4': [],
};

// Mock data
const mockWarehouses: WarehouseData[] = [
  {
    id: '1',
    code: 'WH-001',
    name: 'Main Warehouse',
    type: 'WAREHOUSE',
    address: '123 Industrial Ave, New York, NY 10001',
    phone: '+1 (555) 123-4567',
    email: 'main@warehouse.com',
    manager: 'John Smith',
    isDefault: true,
    isActive: true,
    itemCount: 880,
    totalValue: 11744,
    capacityUsed: 75,
    inventory: mockWarehouseInventory['1'],
  },
  {
    id: '2',
    code: 'WH-002',
    name: 'Secondary Warehouse',
    type: 'WAREHOUSE',
    address: '456 Storage Blvd, Brooklyn, NY 11201',
    phone: '+1 (555) 234-5678',
    email: 'secondary@warehouse.com',
    manager: 'Sarah Johnson',
    isDefault: false,
    isActive: true,
    itemCount: 40,
    totalValue: 9000,
    capacityUsed: 45,
    inventory: mockWarehouseInventory['2'],
  },
  {
    id: '3',
    code: 'ST-001',
    name: 'Downtown Retail Store',
    type: 'STORE',
    address: '789 Main Street, Manhattan, NY 10013',
    phone: '+1 (555) 345-6789',
    email: 'downtown@store.com',
    manager: 'Mike Chen',
    isDefault: false,
    isActive: true,
    itemCount: 55,
    totalValue: 1025,
    capacityUsed: 60,
    inventory: mockWarehouseInventory['3'],
  },
  {
    id: '4',
    code: 'VW-001',
    name: 'Drop Ship Virtual',
    type: 'VIRTUAL',
    address: null,
    phone: null,
    email: 'dropship@company.com',
    manager: null,
    isDefault: false,
    isActive: true,
    itemCount: 0,
    totalValue: 0,
    capacityUsed: 0,
    inventory: mockWarehouseInventory['4'],
  },
];

const typeStyles: Record<WarehouseType, { label: string; color: string }> = {
  WAREHOUSE: { label: 'Warehouse', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  STORE: { label: 'Store', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  VIRTUAL: { label: 'Virtual', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>(mockWarehouses);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseData | null>(null);
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'WAREHOUSE' as WarehouseType,
    address: '',
    phone: '',
    email: '',
    manager: '',
  });

  // Filter warehouses
  const filteredWarehouses = warehouses.filter((wh) => {
    const matchesSearch =
      wh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wh.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || wh.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate stats
  const totalItems = warehouses.reduce((sum, wh) => sum + wh.itemCount, 0);
  const totalValue = warehouses.reduce((sum, wh) => sum + wh.totalValue, 0);
  const activeWarehouses = warehouses.filter((wh) => wh.isActive).length;

  const handleOpenModal = (warehouse?: WarehouseData) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        code: warehouse.code,
        type: warehouse.type,
        address: warehouse.address || '',
        phone: warehouse.phone || '',
        email: warehouse.email || '',
        manager: warehouse.manager || '',
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: '',
        code: '',
        type: 'WAREHOUSE',
        address: '',
        phone: '',
        email: '',
        manager: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleViewInventory = (warehouse: WarehouseData) => {
    setSelectedWarehouse(warehouse);
    setInventorySearchTerm('');
    setIsInventoryModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (editingWarehouse) {
      setWarehouses((prev) =>
        prev.map((wh) =>
          wh.id === editingWarehouse.id
            ? {
              ...wh,
              ...formData,
              address: formData.address || null,
              phone: formData.phone || null,
              email: formData.email || null,
              manager: formData.manager || null,
            }
            : wh
        )
      );
    } else {
      const newWarehouse: WarehouseData = {
        id: String(warehouses.length + 1),
        code: formData.code || `WH-${String(warehouses.length + 1).padStart(3, '0')}`,
        name: formData.name,
        type: formData.type,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        manager: formData.manager || null,
        isDefault: false,
        isActive: true,
        itemCount: 0,
        totalValue: 0,
        capacityUsed: 0,
        inventory: [],
      };
      setWarehouses((prev) => [...prev, newWarehouse]);
    }

    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const warehouse = warehouses.find((wh) => wh.id === id);
    if (warehouse?.isDefault) {
      alert('Cannot delete the default warehouse');
      return;
    }
    if (confirm('Are you sure you want to delete this warehouse?')) {
      setWarehouses((prev) => prev.filter((wh) => wh.id !== id));
    }
  };

  const handleSetDefault = (id: string) => {
    setWarehouses((prev) =>
      prev.map((wh) => ({
        ...wh,
        isDefault: wh.id === id,
      }))
    );
  };

  // Filter inventory items for selected warehouse
  const filteredInventory = selectedWarehouse?.inventory.filter((item) =>
    item.productName.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(inventorySearchTerm.toLowerCase())
  ) || [];

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Warehouses"
        description="Manage your warehouse locations and view inventory by location"
        actions={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Locations"
          value={warehouses.length.toString()}
          change={`${activeWarehouses} active`}
          changeType="neutral"
          icon={Building2}
        />
        <StatsCard
          title="Total Items"
          value={totalItems.toLocaleString()}
          change="Across all locations"
          changeType="neutral"
          icon={Warehouse}
        />
        <StatsCard
          title="Total Value"
          value={formatCurrency(totalValue)}
          change="Inventory value"
          changeType="neutral"
          icon={Warehouse}
        />
        <StatsCard
          title="Avg Capacity"
          value={`${Math.round(warehouses.filter(w => w.type !== 'VIRTUAL').reduce((sum, wh) => sum + wh.capacityUsed, 0) / warehouses.filter(w => w.type !== 'VIRTUAL').length || 0)}%`}
          change="Utilization"
          changeType="neutral"
          icon={Warehouse}
        />
      </div>

      {/* Search and filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Types</option>
              <option value="WAREHOUSE">Warehouse</option>
              <option value="STORE">Store</option>
              <option value="VIRTUAL">Virtual</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {/* Warehouses grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWarehouses.map((warehouse) => {
          const typeConfig = typeStyles[warehouse.type];
          return (
            <DashboardCard key={warehouse.id} className="relative">
              {warehouse.isDefault && (
                <div className="absolute -top-2 left-4 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Default
                </div>
              )}
              <div className="absolute right-4 top-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewInventory(warehouse)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Inventory
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenModal(warehouse)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {!warehouse.isDefault && (
                      <DropdownMenuItem onClick={() => handleSetDefault(warehouse.id)}>
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(warehouse.id)}
                      disabled={warehouse.isDefault}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Warehouse className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{warehouse.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">{warehouse.code}</span>
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      typeConfig.color
                    )}>
                      {typeConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {warehouse.address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{warehouse.address}</span>
                  </div>
                )}
                {warehouse.manager && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{warehouse.manager}</span>
                  </div>
                )}
                {warehouse.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{warehouse.phone}</span>
                  </div>
                )}
                {warehouse.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{warehouse.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{warehouse.itemCount} items</span>
                  <span className="font-medium">{formatCurrency(warehouse.totalValue)}</span>
                </div>
                {warehouse.type !== 'VIRTUAL' && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className={cn(
                        'font-medium',
                        warehouse.capacityUsed >= 80 ? 'text-destructive' :
                          warehouse.capacityUsed >= 60 ? 'text-warning' :
                            'text-success'
                      )}>
                        {warehouse.capacityUsed}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          warehouse.capacityUsed >= 80 ? 'bg-destructive' :
                            warehouse.capacityUsed >= 60 ? 'bg-warning' :
                              'bg-success'
                        )}
                        style={{ width: `${warehouse.capacityUsed}%` }}
                      />
                    </div>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => handleViewInventory(warehouse)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Inventory
                </Button>
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {filteredWarehouses.length === 0 && (
        <DashboardCard>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Warehouse className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No warehouses found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm || typeFilter
                ? 'Try adjusting your search or filter'
                : 'Get started by adding your first warehouse'}
            </p>
            {!searchTerm && !typeFilter && (
              <Button className="mt-4" onClick={() => handleOpenModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Warehouse
              </Button>
            )}
          </div>
        </DashboardCard>
      )}

      {/* Add/Edit Warehouse Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}
            </DialogTitle>
            <DialogDescription>
              {editingWarehouse
                ? 'Update warehouse information'
                : 'Enter the details for the new warehouse'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Warehouse name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value }))}
                  placeholder="WH-001"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData((f) => ({ ...f, type: e.target.value as WarehouseType }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="WAREHOUSE">Warehouse</option>
                <option value="STORE">Store</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
                className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Full address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  placeholder="warehouse@example.com"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manager">Manager</Label>
              <Input
                id="manager"
                value={formData.manager}
                onChange={(e) => setFormData((f) => ({ ...f, manager: e.target.value }))}
                placeholder="Manager name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name}>
              {isSaving ? 'Saving...' : editingWarehouse ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warehouse Inventory Modal */}
      <Dialog open={isInventoryModalOpen} onOpenChange={setIsInventoryModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              {selectedWarehouse?.name} - Inventory
            </DialogTitle>
            <DialogDescription>
              {selectedWarehouse?.code} • {selectedWarehouse?.inventory.length} product types • {formatCurrency(selectedWarehouse?.totalValue || 0)} total value
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search products..."
              value={inventorySearchTerm}
              onChange={(e) => setInventorySearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>

          {/* Inventory Table */}
          <ScrollArea className="flex-1 min-h-0">
            {filteredInventory.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">SKU</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium text-right">On Hand</th>
                    <th className="pb-3 font-medium text-right">Available</th>
                    <th className="pb-3 font-medium text-right">Unit Cost</th>
                    <th className="pb-3 font-medium text-right">Total Value</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredInventory.map((item) => {
                    const isLowStock = item.quantity <= item.reorderPoint && item.quantity > 0;
                    const isOutOfStock = item.availableQty === 0;

                    return (
                      <tr key={item.id} className="hover:bg-muted/50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{item.productName}</span>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground font-mono text-xs">{item.sku}</td>
                        <td className="py-3">
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium">{item.quantity}</td>
                        <td className="py-3 text-right">
                          <span className={cn(
                            'font-medium',
                            isOutOfStock && 'text-destructive',
                            isLowStock && 'text-warning'
                          )}>
                            {item.availableQty}
                          </span>
                        </td>
                        <td className="py-3 text-right text-muted-foreground">{formatCurrency(item.unitCost)}</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(item.totalValue)}</td>
                        <td className="py-3">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                              In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No inventory items</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {inventorySearchTerm
                    ? 'No items match your search'
                    : 'This warehouse has no inventory yet'}
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Summary Footer */}
          {filteredInventory.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {filteredInventory.length} product{filteredInventory.length !== 1 ? 's' : ''} •
                  {' '}{filteredInventory.reduce((sum, i) => sum + i.quantity, 0)} total units
                </span>
                <span className="font-semibold">
                  Total: {formatCurrency(filteredInventory.reduce((sum, i) => sum + i.totalValue, 0))}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInventoryModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

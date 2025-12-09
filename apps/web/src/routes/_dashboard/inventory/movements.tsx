import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Search,
  Truck,
} from 'lucide-react';
import { useState } from 'react';

import { DashboardCard, PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/inventory/movements')({
  component: InventoryMovementsPage,
});

// Types
type MovementType = 'PURCHASE' | 'SALE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'RETURN_IN' | 'RETURN_OUT';

interface Movement {
  id: string;
  type: MovementType;
  productName: string;
  sku: string;
  quantity: number;
  fromWarehouse: string | null;
  toWarehouse: string | null;
  reference: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

// Mock data
const mockMovements: Movement[] = [
  {
    id: '1',
    type: 'PURCHASE',
    productName: 'Wireless Mouse',
    sku: 'ELEC-001',
    quantity: 100,
    fromWarehouse: null,
    toWarehouse: 'Main Warehouse',
    reference: 'PO-2312-00012',
    notes: 'Bulk order from supplier',
    createdBy: 'Admin User',
    createdAt: '2024-12-07T10:30:00Z',
  },
  {
    id: '2',
    type: 'SALE',
    productName: 'Mechanical Keyboard',
    sku: 'ELEC-002',
    quantity: 5,
    fromWarehouse: 'Main Warehouse',
    toWarehouse: null,
    reference: 'SO-2312-00045',
    notes: null,
    createdBy: 'Manager User',
    createdAt: '2024-12-07T09:15:00Z',
  },
  {
    id: '3',
    type: 'TRANSFER_OUT',
    productName: 'A4 Copy Paper',
    sku: 'OFFC-001',
    quantity: 200,
    fromWarehouse: 'Main Warehouse',
    toWarehouse: 'Secondary Warehouse',
    reference: 'TR-2312-00003',
    notes: 'Stock redistribution',
    createdBy: 'Admin User',
    createdAt: '2024-12-06T16:20:00Z',
  },
  {
    id: '4',
    type: 'ADJUSTMENT',
    productName: 'USB-C Hub',
    sku: 'ELEC-003',
    quantity: -3,
    fromWarehouse: 'Main Warehouse',
    toWarehouse: null,
    reference: 'ADJ-2312-00008',
    notes: 'Inventory count correction',
    createdBy: 'Admin User',
    createdAt: '2024-12-06T14:00:00Z',
  },
  {
    id: '5',
    type: 'RETURN_IN',
    productName: 'Ergonomic Office Chair',
    sku: 'FURN-001',
    quantity: 2,
    fromWarehouse: null,
    toWarehouse: 'Main Warehouse',
    reference: 'RET-2312-00002',
    notes: 'Customer return - defective',
    createdBy: 'Manager User',
    createdAt: '2024-12-05T11:30:00Z',
  },
];

const typeConfig: Record<MovementType, { label: string; color: string; icon: typeof ArrowUpRight }> = {
  PURCHASE: { label: 'Purchase', color: 'text-green-600 bg-green-100 dark:bg-green-900/30', icon: ArrowDownRight },
  SALE: { label: 'Sale', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', icon: ArrowUpRight },
  TRANSFER_IN: { label: 'Transfer In', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', icon: ArrowDownRight },
  TRANSFER_OUT: { label: 'Transfer Out', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30', icon: ArrowUpRight },
  ADJUSTMENT: { label: 'Adjustment', color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30', icon: ArrowRight },
  RETURN_IN: { label: 'Return In', color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30', icon: ArrowDownRight },
  RETURN_OUT: { label: 'Return Out', color: 'text-red-600 bg-red-100 dark:bg-red-900/30', icon: ArrowUpRight },
};

function InventoryMovementsPage() {
  const [movements] = useState<Movement[]>(mockMovements);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('7');

  // Filter movements
  const filteredMovements = movements.filter((movement) => {
    const matchesSearch =
      movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || movement.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Inventory Movements"
        description="Track all stock movements across warehouses"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        }
      />

      {/* Search and filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by product, SKU, or reference..."
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
              <option value="PURCHASE">Purchase</option>
              <option value="SALE">Sale</option>
              <option value="TRANSFER_IN">Transfer In</option>
              <option value="TRANSFER_OUT">Transfer Out</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="RETURN_IN">Return In</option>
              <option value="RETURN_OUT">Return Out</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {/* Movements list */}
      <DashboardCard>
        <div className="space-y-4">
          {filteredMovements.map((movement) => {
            const config = typeConfig[movement.type];
            const Icon = config.icon;
            const isPositive = movement.quantity > 0;

            return (
              <div
                key={movement.id}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                {/* Icon */}
                <div className={cn('rounded-full p-2', config.color)}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{movement.productName}</h4>
                        <span className="text-sm text-muted-foreground">({movement.sku})</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium', config.color)}>
                          {config.label}
                        </span>
                        {movement.reference && (
                          <>
                            <span>•</span>
                            <span>Ref: {movement.reference}</span>
                          </>
                        )}
                      </div>
                      {/* Warehouse info */}
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        {movement.fromWarehouse && (
                          <span className="text-muted-foreground">{movement.fromWarehouse}</span>
                        )}
                        {movement.fromWarehouse && movement.toWarehouse && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        {movement.toWarehouse && (
                          <span className="text-muted-foreground">{movement.toWarehouse}</span>
                        )}
                      </div>
                      {movement.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">{movement.notes}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="text-right">
                      <span className={cn(
                        'text-lg font-semibold',
                        isPositive ? 'text-success' : 'text-destructive'
                      )}>
                        {isPositive ? '+' : ''}{movement.quantity}
                      </span>
                      <p className="text-xs text-muted-foreground">units</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span>By {movement.createdBy}</span>
                    <span>{formatDate(movement.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMovements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Truck className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No movements found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredMovements.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredMovements.length} movements
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
    </PageContainer>
  );
}

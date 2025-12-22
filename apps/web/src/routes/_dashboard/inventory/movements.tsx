import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Search,
  Truck,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { DashboardCard, PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { FilterSelect } from '@/components/ui/filter-select';
import { cn } from '@/lib/utils';
import { inventoryApi } from '@/lib/api';

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
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('7');

  // Fetch movements from API
  useEffect(() => {
    async function fetchMovements() {
      setIsLoading(true);
      try {
        const response = await inventoryApi.getMovements();
        if (response.success && response.data) {
          setMovements(response.data as unknown as Movement[]);
        }
      } catch (error) {
        console.error('Failed to fetch movements:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMovements();
  }, []);

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
            <FilterSelect
              value={typeFilter || 'all'}
              onChange={(val) => setTypeFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'PURCHASE', label: 'Purchase' },
                { value: 'SALE', label: 'Sale' },
                { value: 'TRANSFER_IN', label: 'Transfer In' },
                { value: 'TRANSFER_OUT', label: 'Transfer Out' },
                { value: 'ADJUSTMENT', label: 'Adjustment' },
                { value: 'RETURN_IN', label: 'Return In' },
                { value: 'RETURN_OUT', label: 'Return Out' },
              ]}
              placeholder="All Types"
              className="w-auto"
            />
            <FilterSelect
              value={dateRange}
              onChange={setDateRange}
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
                { value: 'all', label: 'All time' },
              ]}
              className="w-auto"
            />
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

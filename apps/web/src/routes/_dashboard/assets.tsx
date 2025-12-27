/**
 * Assets Page - Refactored
 * 
 * This page has been refactored from a 1014-line monolithic component
 * into a modular structure located in @/lib/features/assets/:
 * 
 * - types.ts: Type definitions and constants  
 * - utils.ts: Helper functions including depreciation calculation
 * - useAssets.ts: Data fetching and CRUD operations hook
 * 
 * Note: Asset card grid and form modals kept here as they're page-specific.
 */

import { createFileRoute } from '@tanstack/react-router';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  DollarSign,
  Edit,
  MapPin,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  User,
  Wrench,
} from 'lucide-react';
import { useState, useMemo } from 'react';

import { AssigneeSelector } from '@/components/assignee-selector';
import { CreatableSelect } from '@/components/creatable-select';
import { FilterSelect } from '@/components/ui/filter-select';
import {
  DashboardCard,
  PageContainer,
  PageHeader,
  StatsCard,
} from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// Import from feature module
import {
  type Asset,
  type AssetFormData,
  type AssetType,
  type AssetCategory,
  type DepreciationMethod,
  assetTypeConfig,
  categoryConfig,
  statusConfig,
  defaultEmployees,
  initialAssetFormData,
  useAssets,
  formatCurrency,
  isWarrantyExpired,
  calculateDepreciationPercent,
} from '@/lib/features/assets';

export const Route = createFileRoute('/_dashboard/assets')({
  component: AssetsPage,
});

function AssetsPage() {
  const {
    assets,
    locations,
    isLoading,
    createAsset,
    updateAsset,
    deleteAsset,
    disposeAsset,
    addLocation,
    stats,
  } = useAssets();

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<AssetFormData>(initialAssetFormData);

  // Get unique locations from assets
  const usedLocations = useMemo(() => [...new Set(assets.map((a) => a.location))], [assets]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAssetType = !assetTypeFilter || asset.assetType === assetTypeFilter;
      const matchesCategory = !categoryFilter || asset.category === categoryFilter;
      const matchesStatus = !statusFilter || asset.status === statusFilter;
      const matchesLocation = !locationFilter || asset.location === locationFilter;
      return matchesSearch && matchesAssetType && matchesCategory && matchesStatus && matchesLocation;
    });
  }, [assets, searchTerm, assetTypeFilter, categoryFilter, statusFilter, locationFilter]);

  // Reset form
  const resetForm = () => {
    setFormData(initialAssetFormData);
  };

  // Handle edit
  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData({
      name: asset.name,
      description: asset.description,
      assetType: asset.assetType,
      category: asset.category,
      status: asset.status,
      location: asset.location,
      assignedTo: asset.assignedTo || '',
      purchaseDate: asset.purchaseDate,
      purchaseCost: asset.purchaseCost,
      depreciationMethod: asset.depreciationMethod,
      usefulLifeYears: asset.usefulLifeYears,
      salvageValue: asset.salvageValue,
      warrantyExpiry: asset.warrantyExpiry || '',
      serialNumber: asset.serialNumber || '',
      manufacturer: asset.manufacturer || '',
      model: asset.model || '',
      notes: asset.notes,
    });
    setIsEditModalOpen(true);
  };

  // Save asset
  const handleSave = async (isNew: boolean) => {
    setIsSaving(true);
    try {
      if (isNew) {
        await createAsset(formData);
        setIsAddModalOpen(false);
      } else if (selectedAsset) {
        await updateAsset(selectedAsset.id, formData);
        setIsEditModalOpen(false);
      }
      resetForm();
      setSelectedAsset(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Asset Management"
        description="Track and manage company assets, equipment, and property"
        actions={
          <Button onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Assets"
          value={stats.totalAssets.toString()}
          change={`${stats.activeAssets} active`}
          changeType="neutral"
          icon={Package}
        />
        <StatsCard
          title="Current Assets"
          value={formatCurrency(stats.currentAssetsValue)}
          change={`${stats.currentAssetsCount} items`}
          changeType="positive"
          icon={DollarSign}
        />
        <StatsCard
          title="Fixed Assets"
          value={formatCurrency(stats.fixedAssetsValue)}
          change={`${stats.fixedAssetsCount} items`}
          changeType="neutral"
          icon={Building2}
        />
        <StatsCard
          title="Total Value"
          value={formatCurrency(stats.totalValue)}
          change={`Cost: ${formatCurrency(stats.totalPurchaseCost)}`}
          changeType="neutral"
          icon={DollarSign}
        />
      </div>

      {/* Additional Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Depreciation"
          value={formatCurrency(stats.totalDepreciation)}
          change={`${stats.totalPurchaseCost > 0 ? ((stats.totalDepreciation / stats.totalPurchaseCost) * 100).toFixed(1) : 0}% of cost`}
          changeType="negative"
          icon={TrendingDown}
        />
        <StatsCard
          title="Under Maintenance"
          value={stats.maintenanceAssets.toString()}
          change={stats.maintenanceAssets > 0 ? 'Needs attention' : 'All operational'}
          changeType={stats.maintenanceAssets > 0 ? 'negative' : 'positive'}
          icon={Wrench}
        />
        <StatsCard
          title="Active Assets"
          value={stats.activeAssets.toString()}
          change={`${stats.totalAssets > 0 ? ((stats.activeAssets / stats.totalAssets) * 100).toFixed(1) : 0}% of total`}
          changeType="positive"
          icon={Check}
        />
      </div>

      {/* Filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by name, tag, serial, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <FilterSelect
              value={assetTypeFilter || 'all'}
              onChange={(val) => setAssetTypeFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Asset Types' },
                ...Object.entries(assetTypeConfig).map(([key, config]) => ({ value: key, label: config.label })),
              ]}
              placeholder="All Asset Types"
              className="w-auto"
            />
            <FilterSelect
              value={categoryFilter || 'all'}
              onChange={(val) => setCategoryFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Categories' },
                ...Object.entries(categoryConfig).map(([key, config]) => ({ value: key, label: config.label })),
              ]}
              placeholder="All Categories"
              className="w-auto"
            />
            <FilterSelect
              value={statusFilter || 'all'}
              onChange={(val) => setStatusFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Status' },
                ...Object.entries(statusConfig).map(([key, config]) => ({ value: key, label: config.label })),
              ]}
              placeholder="All Status"
              className="w-auto"
            />
            <FilterSelect
              value={locationFilter || 'all'}
              onChange={(val) => setLocationFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Locations' },
                ...usedLocations.map((loc) => ({ value: loc, label: loc })),
              ]}
              placeholder="All Locations"
              className="w-auto"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Assets Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAssets.map((asset) => {
          const catConfig = categoryConfig[asset.category];
          const statConfig = statusConfig[asset.status];
          const CategoryIcon = catConfig.icon;
          const warrantyExpired = isWarrantyExpired(asset.warrantyExpiry);
          const depreciationPercent = calculateDepreciationPercent(asset.purchaseCost, asset.currentValue);

          return (
            <DashboardCard key={asset.id} className="relative">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', catConfig.color)}>
                    <CategoryIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold line-clamp-1">{asset.name}</h3>
                    <p className="text-xs text-muted-foreground">{asset.assetTag}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(asset)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {asset.status !== 'DISPOSED' && (
                      <DropdownMenuItem onClick={() => disposeAsset(asset.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Mark as Disposed
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteAsset(asset.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status & Category */}
              <div className="flex gap-2 mb-3 flex-wrap">
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', assetTypeConfig[asset.assetType].color)}>
                  {assetTypeConfig[asset.assetType].label}
                </span>
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', statConfig.color)}>
                  {statConfig.label}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{asset.location}</span>
                </div>
                {asset.assignedTo && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>{asset.assignedTo}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Purchased: {new Date(asset.purchaseDate).toLocaleDateString()}</span>
                </div>
                {asset.warrantyExpiry && (
                  <div className={cn('flex items-center gap-2', warrantyExpired ? 'text-destructive' : 'text-muted-foreground')}>
                    {warrantyExpired && <AlertTriangle className="h-3.5 w-3.5" />}
                    <span>Warranty: {new Date(asset.warrantyExpiry).toLocaleDateString()}{warrantyExpired && ' (Expired)'}</span>
                  </div>
                )}
              </div>

              {/* Value & Depreciation */}
              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Current Value</span>
                  <span className="font-semibold">{formatCurrency(asset.currentValue)}</span>
                </div>
                {asset.assetType === 'FIXED' && asset.depreciationMethod !== 'NONE' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            depreciationPercent >= 80 ? 'bg-destructive' :
                              depreciationPercent >= 50 ? 'bg-amber-500' : 'bg-primary'
                          )}
                          style={{ width: `${100 - depreciationPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {(100 - depreciationPercent).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cost: {formatCurrency(asset.purchaseCost)} • Depreciation: {formatCurrency(asset.purchaseCost - asset.currentValue)}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cost: {formatCurrency(asset.purchaseCost)}
                    {asset.assetType === 'CURRENT' && ' • No depreciation'}
                  </p>
                )}
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAssets.length === 0 && (
        <DashboardCard>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No assets found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
            <Button className="mt-4" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </div>
        </DashboardCard>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedAsset(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditModalOpen ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
            <DialogDescription>
              {isEditModalOpen ? 'Update asset information' : 'Enter the details for the new asset'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="grid gap-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 grid gap-2">
                  <Label>Asset Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g., MacBook Pro 16"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Asset Type *</Label>
                  <FilterSelect
                    value={formData.assetType}
                    onChange={(val) => {
                      const newType = val as AssetType;
                      setFormData((f) => ({
                        ...f,
                        assetType: newType,
                        depreciationMethod: newType === 'CURRENT' ? 'NONE' : f.depreciationMethod,
                      }));
                    }}
                    options={Object.entries(assetTypeConfig).map(([key, config]) => ({
                      value: key,
                      label: config.label
                    }))}
                    placeholder="Select asset type"
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Category *</Label>
                  <FilterSelect
                    value={formData.category}
                    onChange={(val) => setFormData((f) => ({ ...f, category: val as AssetCategory }))}
                    options={Object.entries(categoryConfig).map(([key, config]) => ({
                      value: key,
                      label: config.label
                    }))}
                    placeholder="Select category"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Location & Assignment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Location *</Label>
                  <CreatableSelect
                    value={formData.location}
                    onChange={(val) => { setFormData((f) => ({ ...f, location: val })); addLocation(val); }}
                    options={locations.map((loc) => ({ value: loc, label: loc }))}
                    placeholder="Select or create location"
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Assigned To</Label>
                  <AssigneeSelector
                    value={formData.assignedTo}
                    onChange={(val) => setFormData((f) => ({ ...f, assignedTo: val }))}
                    employees={defaultEmployees}
                    placeholder="Select assignee"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Financial */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Purchase Date *</Label>
                  <DateInput
                    value={formData.purchaseDate}
                    onChange={(val) => setFormData((f) => ({ ...f, purchaseDate: val }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Purchase Cost *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData((f) => ({ ...f, purchaseCost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* Depreciation (only for FIXED assets) */}
              {formData.assetType === 'FIXED' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Depreciation Method</Label>
                    <FilterSelect
                      value={formData.depreciationMethod}
                      onChange={(val) => setFormData((f) => ({ ...f, depreciationMethod: val as DepreciationMethod }))}
                      options={[
                        { value: 'STRAIGHT_LINE', label: 'Straight Line' },
                        { value: 'DECLINING_BALANCE', label: 'Declining Balance' },
                        { value: 'NONE', label: 'None' },
                      ]}
                      placeholder="Select method"
                      className="w-full"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Useful Life (Years)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.usefulLifeYears}
                      onChange={(e) => setFormData((f) => ({ ...f, usefulLifeYears: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Salvage Value</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.salvageValue}
                      onChange={(e) => setFormData((f) => ({ ...f, salvageValue: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
              Cancel
            </Button>
            <Button
              onClick={() => handleSave(isAddModalOpen)}
              disabled={isSaving || !formData.name || !formData.location || !formData.purchaseDate}
            >
              {isEditModalOpen ? 'Update' : 'Add'} Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

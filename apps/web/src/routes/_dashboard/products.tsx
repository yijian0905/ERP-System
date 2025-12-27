/**
 * Products Page - Refactored
 * 
 * This page has been refactored from a 1219-line monolithic component
 * into a modular structure located in @/lib/features/products/:
 * 
 * - types.ts: Type definitions and constants
 * - utils.ts: Helper functions
 * - useProducts.ts: Data fetching and CRUD operations hook
 * - ProductTable.tsx: Product list display component
 * - ProductForm.tsx: Product creation/editing dialog
 * 
 * This file now serves as the thin orchestration layer (~250 lines vs 1219)
 */

import { createFileRoute } from '@tanstack/react-router';
import { Package, Plus, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { FilterSelect } from '@/components/ui/filter-select';
import { DashboardCard, PageContainer, PageHeader, StatsCard } from '@/components/layout/dashboard-layout';

// Import from feature module
import {
  type Product,
  type TabType,
  type ProductFormData,
  initialProductFormData,
  useProducts,
  ProductTable,
  ProductForm,
  generateCategoryId,
} from '@/lib/features/products';

export const Route = createFileRoute('/_dashboard/products')({
  component: ProductsPage,
});

function ProductsPage() {
  const {
    products,
    categories,
    isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    setProductStatus,
    createCategory,
    stats,
    consumableStats,
  } = useProducts();

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialProductFormData);
  const [isConsumableMode, setIsConsumableMode] = useState(false);

  // Filter products based on tab and filters
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productCategory = categories.find(c => c.name === product.category);
      const isConsumable = productCategory?.isNonSellable ?? false;

      // Tab filter
      if (activeTab === 'products' && isConsumable) return false;
      if (activeTab === 'consumables' && !isConsumable) return false;

      // Search filter
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = !categoryFilter || product.category === categoryFilter;

      // Status filter
      const matchesStatus = !statusFilter || product.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, categories, activeTab, searchTerm, categoryFilter, statusFilter]);

  // Get unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const sellableProducts = products.filter(p => {
      const cat = categories.find(c => c.name === p.category);
      return !cat?.isNonSellable;
    });
    return [...new Set(sellableProducts.map(p => p.category))];
  }, [products, categories]);

  // Modal handlers
  const handleOpenModal = (product?: Product, isConsumable = false) => {
    setIsConsumableMode(isConsumable);
    if (product) {
      setEditingProduct(product);
      const categoryId = categories.find(c => c.name === product.category)?.id || '';
      setFormData({
        name: product.name,
        description: product.description,
        category: categoryId,
        price: product.price,
        cost: product.cost,
        minStock: product.minStock,
        maxStock: product.maxStock,
        reorderPoint: product.reorderPoint,
        status: product.status,
      });
    } else {
      setEditingProduct(null);
      const consumableCategory = isConsumable
        ? categories.find(c => c.name === 'Operating Consumables')?.id || ''
        : '';
      setFormData({
        ...initialProductFormData,
        category: consumableCategory,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await createProduct(formData);
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategory = (name: string) => {
    createCategory(name);
    // Auto-select the newly created category
    const newCategoryId = generateCategoryId(name);
    setFormData(f => ({ ...f, category: newCategoryId }));
  };

  const currentStats = activeTab === 'products' ? stats : consumableStats;
  const statValues = activeTab === 'products'
    ? { total: stats.totalProducts, active: stats.activeProducts, low: stats.lowStockProducts, out: stats.outOfStockProducts }
    : { total: consumableStats.totalConsumables, active: consumableStats.activeConsumables, low: consumableStats.lowStockConsumables, out: consumableStats.outOfStockConsumables };

  return (
    <PageContainer>
      <PageHeader
        title="Products"
        description="Manage your product catalog and operating consumables"
        actions={
          <Button onClick={() => handleOpenModal(undefined, activeTab === 'consumables')}>
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === 'products' ? 'Add Product' : 'Add Consumable'}
          </Button>
        }
      />

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex gap-1">
          <TabButton
            active={activeTab === 'products'}
            onClick={() => setActiveTab('products')}
            label="Products"
          />
          <TabButton
            active={activeTab === 'consumables'}
            onClick={() => setActiveTab('consumables')}
            label="Operating Consumables"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={activeTab === 'products' ? 'Total Products' : 'Total Consumables'}
          value={statValues.total.toString()}
          change={`${statValues.active} active`}
          changeType="neutral"
          icon={Package}
        />
        <StatsCard
          title="Active"
          value={statValues.active.toString()}
          change="In catalog"
          changeType="positive"
          icon={Package}
        />
        <StatsCard
          title="Low Stock"
          value={statValues.low.toString()}
          change={statValues.low > 0 ? 'Need reorder' : 'All stocked'}
          changeType={statValues.low > 0 ? 'negative' : 'neutral'}
          icon={Package}
        />
        <StatsCard
          title="Out of Stock"
          value={statValues.out.toString()}
          change={statValues.out > 0 ? 'Action needed' : 'All available'}
          changeType={statValues.out > 0 ? 'negative' : 'positive'}
          icon={Package}
        />
      </div>

      {/* Search and Filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <FilterSelect
              value={categoryFilter || 'all'}
              onChange={(val) => setCategoryFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Categories' },
                ...uniqueCategories.map((c) => ({ value: c, label: c })),
              ]}
              placeholder="All Categories"
              className="w-auto"
            />
            <FilterSelect
              value={statusFilter || 'all'}
              onChange={(val) => setStatusFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'DISCONTINUED', label: 'Discontinued' },
              ]}
              placeholder="All Status"
              className="w-auto"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Products Table */}
      <DashboardCard>
        <ProductTable
          products={filteredProducts}
          onEdit={(product) => handleOpenModal(product, activeTab === 'consumables')}
          onDelete={deleteProduct}
          onSetStatus={setProductStatus}
        />

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredProducts.length} of {products.length} {activeTab}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Info Card */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          📦 {activeTab === 'products' ? 'Product Management' : 'Consumables Management'}
        </h3>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
          {activeTab === 'products'
            ? 'Add products here to create your inventory catalog. Once a product is created, use Stock In from the Inventory page to add initial stock.'
            : 'Operating consumables are for internal use (e.g., office supplies, cleaning materials). They are not available for sale in orders.'}
        </p>
      </div>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        isSaving={isSaving}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        onCreateCategory={handleCreateCategory}
        isConsumable={isConsumableMode}
      />
    </PageContainer>
  );
}

// Tab Button Component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function TabButton({ active, onClick, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
    >
      <Package className="mr-2 h-4 w-4 inline" />
      {label}
    </button>
  );
}

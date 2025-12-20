import { createFileRoute } from '@tanstack/react-router';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Edit,
  FolderTree,
  Loader2,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

import { CreatableSelect } from '@/components/creatable-select';
import { FilterSelect } from '@/components/ui/filter-select';
import { Button } from '@/components/ui/button';
import { DashboardCard, PageContainer, PageHeader, StatsCard } from '@/components/layout/dashboard-layout';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/products')({
  component: ProductsPage,
});

// Types
type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  status: ProductStatus;
  createdAt: string;
}

// Category type - simplified for product form
interface Category {
  id: string;
  name: string;
  prefix: string;
  isNonSellable?: boolean; // Non-sellable items don't appear in sales orders
}

// Category type - full for category management
interface CategoryFull {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  productCount: number;
  isActive: boolean;
  sortOrder: number;
  children?: CategoryFull[];
}

// Initial categories - can be expanded by admin/manager
// Products categories (sellable items)
const initialCategories: Category[] = [
  // Product categories (sellable)
  { id: 'elec', name: 'Electronics', prefix: 'ELEC' },
  { id: 'offc', name: 'Office Supplies', prefix: 'OFFC' },
  { id: 'furn', name: 'Furniture', prefix: 'FURN' },
  { id: 'pack', name: 'Packaging', prefix: 'PACK' },
  { id: 'misc', name: 'Miscellaneous', prefix: 'MISC' },
  // Operating Consumables categories (non-sellable, internal use only)
  { id: 'clen', name: 'Cleaning Supplies', prefix: 'CLEN', isNonSellable: true },
  { id: 'bvrg', name: 'Coffee & Beverages', prefix: 'BVRG', isNonSellable: true },
  { id: 'mant', name: 'Maintenance', prefix: 'MANT', isNonSellable: true },
  { id: 'safe', name: 'Safety Equipment', prefix: 'SAFE', isNonSellable: true },
  { id: 'stat', name: 'Stationery', prefix: 'STAT', isNonSellable: true },
];

const statusConfig: Record<ProductStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  DISCONTINUED: { label: 'Discontinued', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

// Mock data
const mockProducts: Product[] = [
  { id: '1', sku: 'ELEC-001', name: 'Wireless Mouse', description: 'Ergonomic wireless mouse with USB receiver', category: 'Electronics', price: 29.99, cost: 15.00, stock: 150, minStock: 20, maxStock: 500, reorderPoint: 50, status: 'ACTIVE', createdAt: '2024-01-15' },
  { id: '2', sku: 'ELEC-002', name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard with blue switches', category: 'Electronics', price: 149.99, cost: 75.00, stock: 75, minStock: 10, maxStock: 200, reorderPoint: 25, status: 'ACTIVE', createdAt: '2024-02-20' },
  { id: '3', sku: 'OFFC-001', name: 'A4 Copy Paper', description: '500 sheets, 80gsm white paper', category: 'Office Supplies', price: 8.99, cost: 4.50, stock: 500, minStock: 100, maxStock: 2000, reorderPoint: 200, status: 'ACTIVE', createdAt: '2024-03-10' },
  { id: '4', sku: 'FURN-001', name: 'Ergonomic Office Chair', description: 'Adjustable height with lumbar support', category: 'Furniture', price: 299.99, cost: 150.00, stock: 25, minStock: 5, maxStock: 100, reorderPoint: 10, status: 'ACTIVE', createdAt: '2024-04-05' },
  { id: '5', sku: 'ELEC-003', name: 'USB-C Hub', description: '7-in-1 USB-C hub with HDMI and USB 3.0', category: 'Electronics', price: 49.99, cost: 25.00, stock: 200, minStock: 25, maxStock: 400, reorderPoint: 50, status: 'ACTIVE', createdAt: '2024-05-12' },
  { id: '6', sku: 'OFFC-002', name: 'Printer Ink Black', description: 'Compatible with HP/Canon printers', category: 'Office Supplies', price: 24.99, cost: 12.00, stock: 80, minStock: 20, maxStock: 200, reorderPoint: 40, status: 'ACTIVE', createdAt: '2024-06-01' },
  { id: '7', sku: 'ELEC-004', name: 'Webcam HD 1080p', description: 'USB webcam with built-in microphone', category: 'Electronics', price: 79.99, cost: 40.00, stock: 0, minStock: 10, maxStock: 150, reorderPoint: 20, status: 'INACTIVE', createdAt: '2024-07-15' },
];

type TabType = 'products' | 'consumables';

function ProductsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Product modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Category modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryFull | null>(null);
  const [parentCategory, setParentCategory] = useState<CategoryFull | null>(null);
  const [isCategorySaving, setIsCategorySaving] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set(['1', '2', '3']));

  // Category form state
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    cost: 0,
    minStock: 10,
    maxStock: 500,
    reorderPoint: 25,
    status: 'ACTIVE' as ProductStatus,
  });

  // Filter products
  const filteredProducts = products.filter((product) => {
    // Exclude non-sellable categories (consumables) from Products tab
    const productCategory = categories.find(c => c.name === product.category);
    const isConsumable = productCategory?.isNonSellable ?? false;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesStatus = !statusFilter || product.status === statusFilter;
    return !isConsumable && matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate stats (excluding non-sellable categories)
  const sellableProducts = products.filter(p => {
    const cat = categories.find(c => c.name === p.category);
    return !cat?.isNonSellable;
  });
  const totalProducts = sellableProducts.length;
  const activeProducts = sellableProducts.filter(p => p.status === 'ACTIVE').length;
  const lowStockProducts = sellableProducts.filter(p => p.stock <= p.reorderPoint && p.stock > 0).length;
  const outOfStockProducts = sellableProducts.filter(p => p.stock === 0).length;

  // Get unique categories from products (excluding non-sellable categories)
  const uniqueCategories = [...new Set(sellableProducts.map(p => p.category))];

  // Generate SKU
  const generateSKU = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';
    const existingCount = products.filter(p => p.category === category.name).length;
    return `${category.prefix}-${String(existingCount + 1).padStart(3, '0')}`;
  };

  // Generate category ID from name (for new categories)
  const generateCategoryId = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4);
  };

  // Generate category prefix from name (for new categories)
  const generateCategoryPrefix = (name: string): string => {
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length === 1) {
      return words[0].substring(0, 4).toUpperCase();
    }
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
  };

  // Handle creating a new category
  const handleCreateCategory = (categoryName: string) => {
    const newCategory: Category = {
      id: generateCategoryId(categoryName),
      name: categoryName,
      prefix: generateCategoryPrefix(categoryName),
    };
    setCategories((prev) => [...prev, newCategory]);
    // Select the newly created category
    setFormData((f) => ({ ...f, category: newCategory.id }));
  };

  // Open modal
  const handleOpenModal = (product?: Product, isConsumable?: boolean) => {
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
      // If adding a consumable, auto-select the Operating Consumables category
      const consumableCategory = isConsumable ? categories.find(c => c.name === 'Operating Consumables')?.id || '' : '';
      setFormData({
        name: '',
        description: '',
        category: consumableCategory,
        price: 0,
        cost: 0,
        minStock: 10,
        maxStock: 500,
        reorderPoint: 25,
        status: 'ACTIVE',
      });
    }
    setIsModalOpen(true);
  };

  // Save product
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const category = categories.find(c => c.id === formData.category);
    // For non-sellable categories, price should always be 0
    const finalPrice = category?.isNonSellable ? 0 : formData.price;

    if (editingProduct) {
      // Update existing product
      setProducts(prev => prev.map(p =>
        p.id === editingProduct.id
          ? {
            ...p,
            name: formData.name,
            description: formData.description,
            category: category?.name || p.category,
            price: finalPrice,
            cost: formData.cost,
            minStock: formData.minStock,
            maxStock: formData.maxStock,
            reorderPoint: formData.reorderPoint,
            status: formData.status,
          }
          : p
      ));
    } else {
      // Create new product
      const newProduct: Product = {
        id: String(products.length + 1),
        sku: generateSKU(formData.category),
        name: formData.name,
        description: formData.description,
        category: category?.name || '',
        price: finalPrice,
        cost: formData.cost,
        stock: 0, // New products start with 0 stock
        minStock: formData.minStock,
        maxStock: formData.maxStock,
        reorderPoint: formData.reorderPoint,
        status: formData.status,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setProducts(prev => [newProduct, ...prev]);
    }

    setIsSaving(false);
    setIsModalOpen(false);
  };

  // Delete product
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // Set product status
  const handleSetStatus = (id: string, newStatus: ProductStatus) => {
    setProducts(prev => prev.map(p =>
      p.id === id
        ? { ...p, status: newStatus }
        : p
    ));
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Category management functions
  const toggleCategoryExpand = (id: string) => {
    setExpandedCategoryIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleOpenCategoryModal = (category?: CategoryFull, parent?: CategoryFull) => {
    if (category) {
      setEditingCategory(category);
      setParentCategory(null);
      setCategoryFormData({
        name: category.name,
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      setParentCategory(parent || null);
      setCategoryFormData({
        name: '',
        description: '',
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    setIsCategorySaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (editingCategory) {
      // Update existing category - handled via local state for now
      // In a real implementation, this would call PUT /v1/categories/:id
      console.log('Category updated:', editingCategory.id, categoryFormData);
    } else {
      // Add new category - add to simple categories list for product dropdown
      const newCategoryId = generateCategoryId(categoryFormData.name);
      const newCategory: Category = {
        id: newCategoryId,
        name: categoryFormData.name,
        prefix: generateCategoryPrefix(categoryFormData.name),
      };
      setCategories((prev) => [...prev, newCategory]);
      // Note: Full category tree update would require API POST /v1/categories
      console.log('New category added:', newCategory);
    }

    setIsCategorySaving(false);
    setIsCategoryModalOpen(false);
  };

  const _renderCategory = (category: CategoryFull, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategoryIds.has(category.id);

    return (
      <div key={category.id}>
        <div
          className={cn(
            'flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50',
            level > 0 && 'ml-6 border-l-2 border-l-primary/20'
          )}
          style={{ marginLeft: level > 0 ? level * 24 : 0 }}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button
                onClick={() => toggleCategoryExpand(category.id)}
                className="rounded p-1 hover:bg-muted"
              >
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />
              </button>
            ) : (
              <div className="w-6" />
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
              <FolderTree className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{category.name}</span>
                {!category.isActive && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    Inactive
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-muted-foreground">{category.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {category.productCount} products
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleOpenCategoryModal(undefined, category)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subcategory
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenCategoryModal(category)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {category.children!.map((child) => _renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Products"
        description="Manage your product catalog and operating consumables"
        actions={
          activeTab === 'products' ? (
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          ) : (
            <Button onClick={() => handleOpenModal(undefined, true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Consumable
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('products')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'products'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Package className="mr-2 h-4 w-4 inline" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('consumables')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'consumables'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Package className="mr-2 h-4 w-4 inline" />
            Operating Consumables
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Products"
              value={totalProducts.toString()}
              change={`${activeProducts} active`}
              changeType="neutral"
              icon={Package}
            />
            <StatsCard
              title="Active Products"
              value={activeProducts.toString()}
              change="In catalog"
              changeType="positive"
              icon={Package}
            />
            <StatsCard
              title="Low Stock"
              value={lowStockProducts.toString()}
              change={lowStockProducts > 0 ? 'Need reorder' : 'All stocked'}
              changeType={lowStockProducts > 0 ? 'negative' : 'neutral'}
              icon={Package}
            />
            <StatsCard
              title="Out of Stock"
              value={outOfStockProducts.toString()}
              change={outOfStockProducts > 0 ? 'Action needed' : 'All available'}
              changeType={outOfStockProducts > 0 ? 'negative' : 'positive'}
              icon={Package}
            />
          </div>

          {/* Search and filters */}
          <DashboardCard className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search products..."
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

          {/* Products table */}
          <DashboardCard>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium text-right">Price</th>
                    <th className="pb-3 font-medium text-right">Cost</th>
                    <th className="pb-3 font-medium text-right pr-6">Stock</th>
                    <th className="pb-3 font-medium pl-4 w-[140px]">Status</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const statusStyle = statusConfig[product.status];
                    const isLowStock = product.stock <= product.reorderPoint && product.stock > 0;
                    const isOutOfStock = product.stock === 0;
                    const margin = product.price > 0 ? ((product.price - product.cost) / product.price * 100).toFixed(0) : 0;

                    return (
                      <tr key={product.id} className="border-b last:border-0 table-row-hover">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{product.name}</span>
                                <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                  {product.sku}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                            {product.category}
                          </span>
                        </td>
                        <td className="py-4 text-right font-medium">{formatCurrency(product.price)}</td>
                        <td className="py-4 text-right text-muted-foreground">
                          {formatCurrency(product.cost)}
                          <span className="ml-1 text-xs text-muted-foreground">({margin}%)</span>
                        </td>
                        <td className="py-4 text-right pr-6">
                          <span className={cn(
                            'font-medium',
                            isOutOfStock && 'text-destructive',
                            isLowStock && 'text-warning'
                          )}>
                            {product.stock}
                          </span>
                          {isLowStock && (
                            <span className="ml-1 text-xs text-warning">Low</span>
                          )}
                          {isOutOfStock && (
                            <span className="ml-1 text-xs text-destructive">Out</span>
                          )}
                        </td>
                        <td className="py-4 pl-4 w-[140px]">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity',
                                  statusStyle.color
                                )}
                              >
                                {statusStyle.label}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {product.status !== 'ACTIVE' && (
                                <DropdownMenuItem onClick={() => handleSetStatus(product.id, 'ACTIVE')}>
                                  <Check className="mr-2 h-4 w-4 text-green-600" />
                                  Active
                                </DropdownMenuItem>
                              )}
                              {product.status !== 'INACTIVE' && (
                                <DropdownMenuItem onClick={() => handleSetStatus(product.id, 'INACTIVE')}>
                                  <span className="mr-2 h-4 w-4 inline-flex items-center justify-center text-gray-500">○</span>
                                  Inactive
                                </DropdownMenuItem>
                              )}
                              {product.status !== 'DISCONTINUED' && (
                                <DropdownMenuItem onClick={() => handleSetStatus(product.id, 'DISCONTINUED')}>
                                  <span className="mr-2 h-4 w-4 inline-flex items-center justify-center text-red-500">✕</span>
                                  Discontinued
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenModal(product)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(product.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No products found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm || categoryFilter || statusFilter
                    ? 'Try adjusting your search or filter'
                    : 'Get started by adding your first product'}
                </p>
                {!searchTerm && !categoryFilter && !statusFilter && (
                  <Button className="mt-4" onClick={() => handleOpenModal()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                )}
              </div>
            )}

            {/* Pagination */}
            {filteredProducts.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} of {products.length} products
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

          {/* Info card */}
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              📦 Product Management
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Add products here to create your inventory catalog. Once a product is created,
              use <strong>Stock In</strong> from the Inventory page to add initial stock,
              or place Purchase Orders to receive inventory from suppliers.
            </p>
          </div>
        </>
      )
      }

      {
        activeTab === 'consumables' && (() => {
          // Filter products to show only non-sellable categories (operating consumables)
          const consumableProducts = products.filter(p => {
            const cat = categories.find(c => c.name === p.category);
            return cat?.isNonSellable;
          });
          const activeConsumables = consumableProducts.filter(p => p.status === 'ACTIVE').length;
          const lowStockConsumables = consumableProducts.filter(p => p.stock <= p.reorderPoint && p.stock > 0).length;
          const outOfStockConsumables = consumableProducts.filter(p => p.stock === 0).length;

          return (
            <>
              {/* Stats */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Consumables"
                  value={consumableProducts.length.toString()}
                  change={`${activeConsumables} active`}
                  changeType="neutral"
                  icon={Package}
                />
                <StatsCard
                  title="Low Stock"
                  value={lowStockConsumables.toString()}
                  change="Items need reorder"
                  changeType={lowStockConsumables > 0 ? 'negative' : 'neutral'}
                  icon={AlertTriangle}
                />
                <StatsCard
                  title="Out of Stock"
                  value={outOfStockConsumables.toString()}
                  change="Items unavailable"
                  changeType={outOfStockConsumables > 0 ? 'negative' : 'neutral'}
                  icon={Package}
                />
                <StatsCard
                  title="Total Value"
                  value={formatCurrency(consumableProducts.reduce((sum, p) => sum + p.cost * p.stock, 0))}
                  change="Inventory value"
                  changeType="neutral"
                  icon={TrendingUp}
                />
              </div>

              {/* Consumables table */}
              <DashboardCard>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Item</th>
                        <th className="pb-3 font-medium text-right">Unit Cost</th>
                        <th className="pb-3 font-medium text-right pr-6">Stock</th>
                        <th className="pb-3 font-medium pl-4 w-[140px]">Status</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumableProducts.map((product) => {
                        const statusStyle = statusConfig[product.status];
                        const isLowStock = product.stock <= product.reorderPoint && product.stock > 0;
                        const isOutOfStock = product.stock === 0;

                        return (
                          <tr key={product.id} className="border-b last:border-0 table-row-hover">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{product.name}</span>
                                    <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                      {product.sku}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
                                    {product.description}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-right font-medium">{formatCurrency(product.cost)}</td>
                            <td className="py-4 text-right pr-6">
                              <span className={cn(
                                'font-medium',
                                isOutOfStock && 'text-destructive',
                                isLowStock && 'text-warning'
                              )}>
                                {product.stock}
                              </span>
                              {isLowStock && (
                                <span className="ml-1 text-xs text-warning">Low</span>
                              )}
                              {isOutOfStock && (
                                <span className="ml-1 text-xs text-destructive">Out</span>
                              )}
                            </td>
                            <td className="py-4 pl-4 w-[140px]">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className={cn(
                                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity',
                                      statusStyle.color
                                    )}
                                  >
                                    {statusStyle.label}
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  {product.status !== 'ACTIVE' && (
                                    <DropdownMenuItem onClick={() => handleSetStatus(product.id, 'ACTIVE')}>
                                      <Check className="mr-2 h-4 w-4 text-green-600" />
                                      Active
                                    </DropdownMenuItem>
                                  )}
                                  {product.status !== 'INACTIVE' && (
                                    <DropdownMenuItem onClick={() => handleSetStatus(product.id, 'INACTIVE')}>
                                      <span className="mr-2 h-4 w-4 inline-flex items-center justify-center text-gray-500">○</span>
                                      Inactive
                                    </DropdownMenuItem>
                                  )}
                                  {product.status !== 'DISCONTINUED' && (
                                    <DropdownMenuItem onClick={() => handleSetStatus(product.id, 'DISCONTINUED')}>
                                      <span className="mr-2 h-4 w-4 inline-flex items-center justify-center text-red-500">✕</span>
                                      Discontinued
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                            <td className="py-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleOpenModal(product)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDelete(product.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {consumableProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No consumables yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Get started by adding your first operating consumable
                    </p>
                    <Button className="mt-4" onClick={() => handleOpenModal(undefined, true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Consumable
                    </Button>
                  </div>
                )}
              </DashboardCard>

              {/* Info card */}
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  🏭 Operating Consumables
                </h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  Operating consumables are non-sellable items used for internal operations.
                  These items are available for <strong>Internal Requisitions</strong> but will not
                  appear in sales orders. Use this page to manage supplies like coffee, cleaning products,
                  office maintenance items, and other operational needs.
                </p>
              </div>
            </>
          );
        })()
      }

      {/* Add/Edit Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update product information'
                : 'Create a new product for your catalog. Use Stock In to add inventory after creating.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Wireless Bluetooth Headphones"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief product description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <CreatableSelect
                label="Category *"
                options={
                  // Filter categories based on current tab
                  activeTab === 'consumables'
                    ? categories.filter(c => c.isNonSellable).map(c => c.name)
                    : categories.filter(c => !c.isNonSellable).map(c => c.name)
                }
                value={categories.find((c) => c.id === formData.category)?.name || ''}
                onChange={(categoryName) => {
                  const category = categories.find((c) => c.name === categoryName);
                  if (category) {
                    setFormData((f) => ({ ...f, category: category.id }));
                  }
                }}
                onCreate={handleCreateCategory}
                placeholder="Select category"
              />
              {/* Status dropdown only shown when editing existing product */}
              {editingProduct && (
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <FilterSelect
                    value={formData.status}
                    onChange={(val) => setFormData(f => ({ ...f, status: val as ProductStatus }))}
                    options={[
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'INACTIVE', label: 'Inactive' },
                      { value: 'DISCONTINUED', label: 'Discontinued' },
                    ]}
                    placeholder="Select Status"
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Check if selected category is non-sellable or if we're on consumables tab */}
            {(() => {
              const selectedCategory = categories.find((c) => c.id === formData.category);
              // Hide selling price if: on consumables tab OR selected category is non-sellable
              const isNonSellable = activeTab === 'consumables' || (selectedCategory?.isNonSellable ?? false);

              return (
                <>
                  <div className={isNonSellable ? '' : 'grid grid-cols-2 gap-4'}>
                    {!isNonSellable && (
                      <div className="grid gap-2">
                        <Label htmlFor="price">Selling Price ($) *</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price || ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setFormData(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.00"
                        />
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="cost">Unit Cost ($) *</Label>
                      <Input
                        id="cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.cost || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setFormData(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {!isNonSellable && formData.price > 0 && formData.cost > 0 && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Profit Margin</span>
                        <span className="font-medium">
                          {((formData.price - formData.cost) / formData.price * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minStock">Min Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setFormData(f => ({ ...f, minStock: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reorderPoint">Reorder Point</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  min="0"
                  value={formData.reorderPoint}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setFormData(f => ({ ...f, reorderPoint: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxStock">Max Stock</Label>
                <Input
                  id="maxStock"
                  type="number"
                  min="0"
                  value={formData.maxStock}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setFormData(f => ({ ...f, maxStock: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {!editingProduct && formData.category && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm">
                  <span className="text-muted-foreground">SKU will be generated as:</span>{' '}
                  <span className="font-mono font-medium">{generateSKU(formData.category)}</span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.name || !formData.category || !formData.price || !formData.cost}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Category Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update category information'
                : parentCategory
                  ? `Add a subcategory under "${parentCategory.name}"`
                  : 'Create a new root category'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {parentCategory && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">Parent Category</p>
                <p className="font-medium">{parentCategory.name}</p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="Enter category name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="Enter category description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={isCategorySaving || !categoryFormData.name}>
              {isCategorySaving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer >
  );
}
